import {inject, Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree,} from "@angular/router";
import {BehaviorSubject, firstValueFrom, Observable, of, throwError} from "rxjs";
import {Usuario} from "../usuario/usuario";
import {environment} from "../../environments/environment";
import {catchError, finalize, map, shareReplay, tap} from "rxjs/operators";
import {UsuarioService} from "../usuario/usuario.service";
import {Permissao} from "../usuario/permissao";
import {StorageService} from "../framework/services/storage.service";
import {JwtUtil} from "../framework/utils/jwt.util";

@Injectable()
export class LoginService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly usuarioService = inject(UsuarioService);
  private readonly storageService = inject(StorageService);

  url: string;
  isAuthenticated = new BehaviorSubject<boolean>(this.hasStoredAuth());
  isRunningRequest = false;
  private readonly currentUserSubject = new BehaviorSubject<Usuario | null>(this.loadUserFromStorage());
  private currentUserRequest$: Observable<Usuario> | null = null;
  private authValidation$: Observable<boolean> | null = null;

  constructor() {
    this.url = environment.api_url + "login";
  }

  canActivate(
    route: ActivatedRouteSnapshot,
    _state: RouterStateSnapshot
  ):
    | Observable<boolean | UrlTree>
    | Promise<boolean | UrlTree>
    | boolean
    | UrlTree {
    // Verifica proativamente se o token está expirado
    if (this.isTokenExpired()) {
      this.logout();
      return of(false);
    }

    const hasCachedUser = !!(this.currentUserSubject.value || this.loadUserFromStorage());
    const hasToken = this.hasValidToken();

    if (hasCachedUser && hasToken) {
      this.redirectIfProfileIncomplete(route);
      return of(true);
    }

    if (this.authValidation$) {
      return this.authValidation$;
    }

    const url = `${environment.api_url}usuario/user-info`;
    this.isRunningRequest = true;

    const request$ = this.http.get<Usuario>(url).pipe(
      tap((user) => {
        if (user) {
          this.persistUser(user);
          this.currentUserSubject.next(user);
        }
        this.isAuthenticated.next(true);
        this.redirectIfProfileIncomplete(route);
      }),
      map(() => true),
      catchError(() => {
        this.logout();
        return throwError(() => new Error('O usuario nao esta autenticado!'));
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

  getCurrentUser(options: { forceRefresh?: boolean } = {}): Observable<Usuario> {
    const forceRefresh = options.forceRefresh ?? false;
    const cached = this.currentUserSubject.value;

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
        this.currentUserSubject.next(user);
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
    this.currentUserSubject.next(null);
    this.currentUserRequest$ = null;
    this.authValidation$ = null;
    this.isAuthenticated.next(false);
    this.router.navigate(["/login"]);
  }

  private loadUserFromStorage(): Usuario | null {
    const stored = this.storageService.getItem("userLogged");
    if (!stored) {
      return null;
    }
    try {
      return JSON.parse(stored);
    } catch {
      return null;
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

  private redirectIfProfileIncomplete(route: ActivatedRouteSnapshot) {
    const user = this.currentUserSubject.value || this.loadUserFromStorage();
    if (!user) {
      return;
    }
    const firstSegment = route?.url?.length ? route.url[0].path || '' : '';
    if (user.documento === '' && firstSegment && !firstSegment.includes('usuario')) {
      this.router.navigate([`/usuario/edit/${user.id}`]);
    }
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

  hasAnyRole(componentRoles: string[]): boolean {
    const loggedUser = this.currentUserSubject.value || this.loadUserFromStorage();
    if (loggedUser !== null && loggedUser !== undefined) {
      const userRoles = loggedUser.authorities || loggedUser.permissoes || [];
      if (Array.isArray(userRoles)) {
        return userRoles.some((p: Permissao) => componentRoles.includes(p.nome));
      }
    }
    this.logout();
    return false;
  }

  async userLoggedIsAlunoOrProfessor(): Promise<boolean> {
    const user = await firstValueFrom(this.getCurrentUser());
    const userRoles = user?.authorities || user?.permissoes || [];
    const roles = Array.isArray(userRoles) ? userRoles.map((p: Permissao) => p.nome) : [];
    return !roles.some((role) => role === 'ROLE_ADMINISTRADOR' || role === 'ROLE_LABORATORISTA');
  }

  private hasStoredAuth(): boolean {
    const hasToken = this.hasValidToken();
    const hasUser = !!this.loadUserFromStorage();
    return hasToken && hasUser;
  }

  login(usuario: Usuario): Observable<string> {
    return this.http.post<string>(this.url, usuario, { responseType: "text" as "json" });
  }

  setAuthenticated() {
    this.isAuthenticated.next(true);
  }
}
