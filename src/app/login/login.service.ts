import {computed, inject, Injectable, signal} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree,} from "@angular/router";
import {Observable, of, throwError} from 'rxjs';
import {Usuario} from "../usuario/usuario";
import {environment} from "../../environments/environment";
import {catchError, finalize, map, shareReplay, tap} from "rxjs/operators";
import {UsuarioService} from "../usuario/usuario.service";
import {Permissao} from "../usuario/permissao";
import {StorageService} from "../framework/service/storage.service";
import {JwtUtil} from "../framework/utils/jwt.util";

@Injectable()
export class LoginService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly usuarioService = inject(UsuarioService);
  private readonly storageService = inject(StorageService);

  url: string;

  // Signals para estado reativo - substituem BehaviorSubjects
  private readonly _isAuthenticated = signal<boolean>(this.hasStoredAuth());
  // Public readonly signals para consumo externo
  readonly isAuthenticated = this._isAuthenticated.asReadonly();
  private readonly _currentUser = signal<Usuario | undefined>(this.loadUserFromStorage());
  readonly currentUser = this._currentUser.asReadonly();

  // Computed signals para valores derivados
  readonly userRole = computed(() => {
    const user = this._currentUser();
    const roles = user?.authorities || user?.permissoes || [];
    return roles.length > 0 ? roles[0].nome : 'GUEST';
  });

  readonly isAlunoOrProfessor = computed(() => {
    const user = this._currentUser();
    const userRoles = user?.authorities || user?.permissoes || [];
    const roles = Array.isArray(userRoles) ? userRoles.map((p: Permissao) => p.nome) : [];
    return !roles.some((role) => role === 'ROLE_ADMINISTRADOR' || role === 'ROLE_LABORATORISTA');
  });

  isRunningRequest = false;
  private currentUserRequest$: Observable<Usuario> | null = null;
  private authValidation$: Observable<boolean> | null = null;

  constructor() {
    this.url = environment.api_url + "login";
  }

  /**
   * Unifies authentication logic for canActivate and validateAuthentication
   */
  private performAuthenticationCheck(route?: ActivatedRouteSnapshot): Observable<boolean> {
    // Early check: if token is expired, logout immediately
    if (this.isTokenExpired()) {
      this.logout();
      return of(false);
    }

    const hasCachedUser = !!(this._currentUser() || this.loadUserFromStorage());
    const hasToken = this.hasValidToken();

    // If we have both cached user and valid token, allow access
    if (hasCachedUser && hasToken) {
      if (route) {
        this.redirectIfProfileIncomplete(route);
      }
      return of(true);
    }

    // If there's already a pending validation request, reuse it
    if (this.authValidation$) {
      return this.authValidation$;
    }

    // If we don't have a valid token at this point, we shouldn't attempt to fetch user
    // This can happen if token exists but is invalid, or other edge cases
    if (!hasToken) {
      this.logout();
      return of(false);
    }

    // At this point: we have a valid token but no cached user
    // Attempt to fetch user from backend
    this.isRunningRequest = true;
    const request$ = this.getCurrentUser({ forceRefresh: true }).pipe(
      tap(() => {
        this._isAuthenticated.set(true);
        if (route) {
          this.redirectIfProfileIncomplete(route);
        }
      }),
      map(() => true),
      catchError(() => {
        this.logout();
        return of(false);
      }),
      finalize(() => {
        this.isRunningRequest = false;
        this.authValidation$ = null;
      }),
      shareReplay({bufferSize: 1, refCount: true})
    );
    this.authValidation$ = request$;
    return request$;
  }

  /**
   * Valida se o usuário está autenticado e se o token está válido
   * @param route Rota atual para redirecionamento
   * @returns Observable<boolean>
   */
  validateAuthentication(route?: ActivatedRouteSnapshot): Observable<boolean> {
    return this.performAuthenticationCheck(route);
  }

  getCurrentUser(options: { forceRefresh?: boolean } = {}): Observable<Usuario> {
    const forceRefresh = options.forceRefresh ?? false;
    const cached = this._currentUser();

    if (!forceRefresh && cached) {
      return of(cached);
    }

    if (!forceRefresh && this.currentUserRequest$) {
      return this.currentUserRequest$;
    }

    const username = this.storageService.getItem("username");
    if (!username) {
      return throwError(() => new Error('Usuário não autenticado.'));
    }

    const request$ = this.usuarioService.findByUsername(username).pipe(
      tap((user) => {
        this.persistUser(user);
        this._currentUser.set(user);
      }),
      finalize(() => {
        this.currentUserRequest$ = null;
      }),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    this.currentUserRequest$ = request$;
    return request$;
  }

  logout() {
    this.storageService.removeItem("token");
    this.storageService.removeItem("username");
    this.persistUser(null);
    this._currentUser.set(undefined);
    this.currentUserRequest$ = null;
    this.authValidation$ = null;
    this._isAuthenticated.set(false);
    this.router.navigate(["/login"]);
  }

  private loadUserFromStorage(): Usuario | undefined {
    const stored = this.storageService.getItem("userLogged");
    if (!stored) {
      return undefined;
    }
    try {
      return JSON.parse(stored);
    } catch {
      return undefined;
    }
  }

  /**
   * Verifica se o token JWT está expirado
   * @returns true se o token está expirado ou inválido
   */
  private isTokenExpired(): boolean {
    const token = this.storageService.getItem("token");
    return JwtUtil.isTokenExpired(token);
  }

  refreshCurrentUser(): Observable<Usuario> {
    return this.getCurrentUser({ forceRefresh: true });
  }

  hasAnyRole(componentRoles: string[]): boolean {
    const loggedUser = this._currentUser() || this.loadUserFromStorage();
    if (loggedUser !== null && loggedUser !== undefined) {
      const userRoles = loggedUser.authorities || loggedUser.permissoes || [];
      if (Array.isArray(userRoles)) {
        return userRoles.some((p: Permissao) => componentRoles.includes(p.nome));
      }
    }
    this.logout();
    return false;
  }

  /**
   * Valida se o token existe e não está expirado
   * @returns true se o token é válido
   */
  private hasValidToken(): boolean {
    const token = this.storageService.getItem("token");
    return !!token && !JwtUtil.isTokenExpired(token);
  }

  private persistUser(user: Usuario | null) {
    if (user) {
      this.storageService.setItem("userLogged", JSON.stringify(user));
    } else {
      this.storageService.removeItem("userLogged");
    }
  }

  getPermissoesUser(options: { forceRefresh?: boolean } = {}): Observable<Permissao[]> {
    return this.getCurrentUser(options).pipe(
      map((value) => value.permissoes || value.authorities || [])
    );
  }

  async userLoggedIsAlunoOrProfessor(): Promise<boolean> {
    // Usa computed signal para melhor performance
    return this.isAlunoOrProfessor();
  }

  /**
   * Atualiza o estado de autenticação e armazena o usuário autenticado.
   * @param usuario Usuário autenticado (opcional). Se não informado, carrega do storage.
   * @example
   *   service.setAuthenticated(usuario)
   *   service.setAuthenticated() // carrega do storage
   */
  setAuthenticated(usuario?: Usuario) {
    let user = usuario;
    user ??= this.loadUserFromStorage();
    if (user) {
      this._currentUser.set(user);
      this.persistUser(user);
    }
    this._isAuthenticated.set(true);
  }

  private hasStoredAuth(): boolean {
    const hasToken = this.hasValidToken();
    const hasUser = !!this.loadUserFromStorage();
    return hasToken && hasUser;
  }

  login(usuario: Usuario): Observable<string> {
    return this.http.post<string>(this.url, usuario, { responseType: "text" as "json" });
  }

  private redirectIfProfileIncomplete(route: ActivatedRouteSnapshot) {
    const user = this._currentUser() || this.loadUserFromStorage();
    if (!user) {
      return;
    }
    const firstSegment = route?.url?.length ? route.url[0].path || '' : '';
    if (user.documento === '' && firstSegment && !firstSegment.includes('usuario')) {
      this.router.navigate([`/usuario/edit/${user.id}`]);
    }
  }

  /**
   * Verifica se o usuário atual possui pelo menos um dos papéis permitidos
   */
  private hasRequiredRole(roles: string[]): boolean {
    const user = this._currentUser() || this.loadUserFromStorage();
    const userRoles = user?.authorities || user?.permissoes || [];
    return Array.isArray(userRoles) && userRoles.some((p: Permissao) => roles.includes(p.nome));
  }

  canActivate(
    route: ActivatedRouteSnapshot,
    _state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> {
    // First, check authentication
    return this.performAuthenticationCheck(route).pipe(
      map(authenticated => {
        if (!authenticated) {
          return false;
        }
        // Detect nested nada-consta routes
        const isNadaConstaRoute = (route.pathFromRoot ?? []).some(r => r.routeConfig?.path?.includes('nada-consta'));
        if (isNadaConstaRoute) {
          if (!this.hasRequiredRole(['ROLE_LABORATORISTA', 'ROLE_ADMINISTRADOR'])) {
            return this.router.parseUrl('/notAuthorized');
          }
        }
        return true;
      })
    );
  }
}
