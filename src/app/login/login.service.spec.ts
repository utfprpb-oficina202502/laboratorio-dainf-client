import {TestBed} from '@angular/core/testing';
import {HttpClientTestingModule, HttpTestingController} from '@angular/common/http/testing';
import {Router} from '@angular/router';
import {LoginService} from './login.service';
import {StorageService} from '../framework/services/storage.service';
import {UsuarioService} from '../usuario/usuario.service';
import {Usuario} from '../usuario/usuario';
import {environment} from '../../environments/environment';
import {of, throwError} from 'rxjs';

describe('LoginService - Token Validation', () => {
  let service: LoginService;
  let httpMock: HttpTestingController;
  let storageService: StorageService;
  let router: Router;

  // Token válido (exp: 2099-01-01)
  const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0dXNlciIsImV4cCI6NDA3MDkwODgwMCwiaWF0IjoxNTE2MjM5MDIyfQ.4Adcj0vfLwz_5extraKxKu4sM5xLU7OlZEcmKnVJKnU';

  // Token expirado (exp: 2020-01-01)
  const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0dXNlciIsImV4cCI6MTU3NzcxMDAwMCwiaWF0IjoxNTE2MjM5MDIyfQ.X6vFCHFRNUZBNYmQNJzG8RKzUvZZNfhMdQ0JBHqY5aQ';

  const mockUser: Usuario = {
    fotoURL: "", password: "", telefone: "",
    id: 1,
    username: 'testuser',
    nome: 'Test User',
    email: 'test@test.com',
    documento: '12345678900',
    authorities: [],
    permissoes: []
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        LoginService,
        StorageService,
        {
          provide: UsuarioService,
          useValue: {
            findByUsername: jest.fn()
          }
        },
        {
          provide: Router,
          useValue: {
            navigate: jest.fn()
          }
        }
      ]
    });

    service = TestBed.inject(LoginService);
    httpMock = TestBed.inject(HttpTestingController);
    storageService = TestBed.inject(StorageService);
    router = TestBed.inject(Router);

    // Limpa storage antes de cada teste
    sessionStorage.clear();
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  describe('Token Expiration Validation', () => {
    it('isTokenExpired deve retornar true para token expirado', () => {
      storageService.setItem('token', expiredToken);

      const isExpired = service['isTokenExpired']();

      expect(isExpired).toBe(true);
    });

    it('isTokenExpired deve retornar false para token válido', () => {
      storageService.setItem('token', validToken);

      const isExpired = service['isTokenExpired']();

      expect(isExpired).toBe(false);
    });

    it('isTokenExpired deve retornar true quando não há token', () => {
      const isExpired = service['isTokenExpired']();

      expect(isExpired).toBe(true);
    });

    it('hasValidToken deve retornar true para token válido', () => {
      storageService.setItem('token', validToken);

      const hasValid = service['hasValidToken']();

      expect(hasValid).toBe(true);
    });

    it('hasValidToken deve retornar false para token expirado', () => {
      storageService.setItem('token', expiredToken);

      const hasValid = service['hasValidToken']();

      expect(hasValid).toBe(false);
    });

    it('hasValidToken deve retornar false quando não há token', () => {
      const hasValid = service['hasValidToken']();

      expect(hasValid).toBe(false);
    });
  });

  describe('canActivate - Proactive Token Validation', () => {
    it('deve fazer logout se token estiver expirado', (done) => {
      storageService.setItem('token', expiredToken);
      storageService.setItem('userLogged', JSON.stringify(mockUser));

      const logoutSpy = jest.spyOn(service, 'logout');

      const route = {} as any;
      const state = {} as any;

      const result = service.canActivate(route, state);
      if (typeof result === 'object' && 'subscribe' in result) {
        result.subscribe({
          next: (value: boolean | import('@angular/router').UrlTree) => {
            expect(value).toBe(false);
            expect(logoutSpy).toHaveBeenCalled();
            done();
          }
        });
      } else {
        expect(result).toBe(false);
        done();
      }
    });

    it('deve permitir navegação com token válido e usuário cacheado', (done) => {
      storageService.setItem('token', validToken);
      storageService.setItem('userLogged', JSON.stringify(mockUser));

      const route = {url: [{path: 'home'}]} as any;
      const state = {} as any;

      const result = service.canActivate(route, state);
      if (typeof result === 'object' && 'subscribe' in result) {
        result.subscribe({
          next: (value: boolean | import('@angular/router').UrlTree) => {
            expect(value).toBe(true);
            done();
          }
        });
      } else {
        expect(result).toBe(true);
        done();
      }
    });

    it('deve validar token proativamente e NÃO fazer requisição se não houver token', (done) => {
      // Sem token, validação proativa deve impedir requisição
      const route = {} as any;
      const state = {} as any;
      const logoutSpy = jest.spyOn(service, 'logout');

      const result = service.canActivate(route, state) as import('rxjs').Observable<boolean>;
      result.subscribe({
        next: (canActivate: boolean) => {
          // Token ausente = logout proativo, sem requisição HTTP
          expect(canActivate).toBe(false);
          expect(logoutSpy).toHaveBeenCalled();

          // Verifica que NENHUMA requisição HTTP foi feita
          httpMock.expectNone(`${environment.api_url}usuario/user-info`);
          done();
        }
      });
    });
  });

  describe('logout', () => {
    it('deve remover todos os dados de autenticação do sessionStorage', () => {
      storageService.setItem('token', validToken);
      storageService.setItem('username', 'testuser');
      storageService.setItem('userLogged', JSON.stringify(mockUser));

      service.logout();

      expect(storageService.getItem('token')).toBeNull();
      expect(storageService.getItem('username')).toBeNull();
      expect(storageService.getItem('userLogged')).toBeNull();
    });

    it('deve navegar para rota de login', () => {
      service.logout();

      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('deve atualizar signal isAuthenticated para false', () => {
      // Simula estado autenticado (necessário chamar setAuthenticated para isso)
      service.setAuthenticated(mockUser as Usuario);
      expect(service.isAuthenticated()).toBe(true);

      // Faz logout
      service.logout();

      // Verifica que signal foi atualizado para false
      expect(service.isAuthenticated()).toBe(false);
    });
  });

  describe('Integration: Token Lifecycle', () => {
    it('deve gerenciar ciclo completo: login → validação → logout', (done) => {
      // 1. Simula login com token válido
      storageService.setItem('token', validToken);
      storageService.setItem('username', 'testuser');
      storageService.setItem('userLogged', JSON.stringify(mockUser));

      // 2. Valida que pode navegar
      const route = {url: [{path: 'home'}]} as any;
      const result = service.canActivate(route, {} as any) as import('rxjs').Observable<boolean>;
      result.subscribe({
        next: (canActivate: boolean) => {
          expect(canActivate).toBe(true);

          // 3. Faz logout
          service.logout();

          // 4. Verifica que não pode mais navegar
          expect(storageService.getItem('token')).toBeNull();
          done();
        }
      });
    });

    it('deve detectar expiração após token expirar', (done) => {
      // 1. Inicia com token válido
      storageService.setItem('token', validToken);
      storageService.setItem('userLogged', JSON.stringify(mockUser));

      const route = {url: [{path: 'home'}]} as any;

      // Pode navegar inicialmente
      const result1 = service.canActivate(route, {} as any) as import('rxjs').Observable<boolean>;
      result1.subscribe({
        next: (canActivate1: boolean) => {
          expect(canActivate1).toBe(true);

          // 2. Simula expiração do token
          storageService.setItem('token', expiredToken);

          // 3. Tenta navegar novamente
          const result2 = service.canActivate(route, {} as any) as import('rxjs').Observable<boolean>;
          result2.subscribe({
            next: (canActivate2: boolean) => {
              expect(canActivate2).toBe(false);
              expect(router.navigate).toHaveBeenCalledWith(['/login']);
              done();
            }
          });
        }
      });
    });
  });

  describe('setAuthenticated', () => {
    it('deve atualizar o estado de autenticação e armazenar usuário', () => {
      const usuario: Usuario = {...mockUser} as Usuario;
      service.setAuthenticated(usuario);
      expect(service.isAuthenticated()).toBe(true);
      expect(service.currentUser()).toEqual(usuario);
      expect(storageService.getItem('userLogged')).toBe(JSON.stringify(usuario));
    });
    it('deve funcionar mesmo sem parâmetro (usuário do storage)', () => {
      storageService.setItem('userLogged', JSON.stringify(mockUser));
      service.setAuthenticated(mockUser);
      expect(service.isAuthenticated()).toBe(true);
      expect(service.currentUser()).toEqual(mockUser);
    });
  });

  describe('currentUser signal', () => {
    it('deve ser undefined após logout', () => {
      service.setAuthenticated(mockUser as Usuario);
      service.logout();
      expect(service.currentUser()).toBeUndefined();
    });
  });

  describe('userRole e isAlunoOrProfessor', () => {
    it('userRole deve refletir a role principal', () => {
      const usuario: Usuario = {...mockUser, authorities: [{nome: 'ROLE_ADMINISTRADOR'}]} as Usuario;
      service.setAuthenticated(usuario);
      expect(service.userRole()).toBe('ROLE_ADMINISTRADOR');
    });
    it('userRole deve ser GUEST se não houver roles', () => {
      service.setAuthenticated({...mockUser, authorities: []} as Usuario);
      expect(service.userRole()).toBe('GUEST');
    });
    it('isAlunoOrProfessor deve ser false para administrador', () => {
      const usuario: Usuario = {...mockUser, authorities: [{nome: 'ROLE_ADMINISTRADOR'}]} as Usuario;
      service.setAuthenticated(usuario);
      expect(service.isAlunoOrProfessor()).toBe(false);
    });
    it('isAlunoOrProfessor deve ser true para aluno', () => {
      const usuario: Usuario = {...mockUser, authorities: [{nome: 'ROLE_ALUNO'}]} as Usuario;
      service.setAuthenticated(usuario);
      expect(service.isAlunoOrProfessor()).toBe(true);
    });
  });

  describe('Falha de requisição HTTP ao buscar usuário', () => {
    it('deve fazer logout se buscar usuário falhar', (done) => {
      storageService.setItem('token', validToken);
      storageService.setItem('username', 'testuser');
      // Remove userLogged para forçar requisição
      storageService.removeItem('userLogged');
      // Mock do UsuarioService para simular erro
      const usuarioService = TestBed.inject(UsuarioService);
      (usuarioService.findByUsername as jest.Mock).mockReturnValueOnce(throwError(() => new Error('Erro de rede')));
      const logoutSpy = jest.spyOn(service, 'logout');
      const route = {} as any;
      const result = service.canActivate(route, {} as any) as import('rxjs').Observable<boolean>;
      result.subscribe({
        next: (canActivate: boolean) => {
          expect(canActivate).toBe(false);
          expect(logoutSpy).toHaveBeenCalled();
          done();
        }
      });
    });
  });

  describe('Reentrância de requests', () => {
    it('deve compartilhar requisição de usuário se chamada múltiplas vezes', (done) => {
      storageService.setItem('token', validToken);
      storageService.setItem('username', 'testuser');
      storageService.removeItem('userLogged');
      const usuarioService = TestBed.inject(UsuarioService);
      let chamadas = 0;
      (usuarioService.findByUsername as jest.Mock).mockImplementation(() => {
        chamadas++;
        return of({...mockUser} as Usuario);
      });
      // Chama canActivate duas vezes rapidamente
      const obs1 = service.canActivate({} as any, {} as any) as import('rxjs').Observable<boolean>;
      const obs2 = service.canActivate({} as any, {} as any) as import('rxjs').Observable<boolean>;
      let count = 0;
      obs1.subscribe({next: (v) => {
        expect(v).toBe(true);
        count++;
        if (count === 2) {
          expect(chamadas).toBe(1); // Só uma chamada ao serviço
          done();
        }
      }});
      obs2.subscribe({next: (v) => {
        expect(v).toBe(true);
        count++;
        if (count === 2) {
          expect(chamadas).toBe(1);
          done();
        }
      }});
    });
  });

  describe('redirectIfProfileIncomplete', () => {
    it('deve redirecionar para edição de perfil se documento estiver vazio e rota não for de usuário', () => {
      const usuario: Usuario = { ...mockUser, documento: '' };
      service.setAuthenticated(usuario);
      const route = { url: [{ path: 'home' }] } as any;
      const routerSpy = jest.spyOn(router, 'navigate');
      // @ts-ignore
      service['redirectIfProfileIncomplete'](route);
      expect(routerSpy).toHaveBeenCalledWith([`/usuario/edit/${usuario.id}`]);
    });
    it('não deve redirecionar se documento não estiver vazio', () => {
      const usuario: Usuario = { ...mockUser, documento: '123' };
      service.setAuthenticated(usuario);
      const route = { url: [{ path: 'home' }] } as any;
      const routerSpy = jest.spyOn(router, 'navigate');
      // @ts-ignore
      service['redirectIfProfileIncomplete'](route);
      expect(routerSpy).not.toHaveBeenCalled();
    });
    it('não deve redirecionar se rota for de usuário', () => {
      const usuario: Usuario = { ...mockUser, documento: '' };
      service.setAuthenticated(usuario);
      const route = { url: [{ path: 'usuario' }] } as any;
      const routerSpy = jest.spyOn(router, 'navigate');
      // @ts-ignore
      service['redirectIfProfileIncomplete'](route);
      expect(routerSpy).not.toHaveBeenCalled();
    });
  });

  describe('canActivate - nada-consta', () => {
    it('deve bloquear acesso e redirecionar se não tiver role necessária', (done) => {
      const usuario: Usuario = { ...mockUser, authorities: [{ id: 1, nome: 'ROLE_ALUNO' }] };
      service.setAuthenticated(usuario);
      const route = { pathFromRoot: [{ routeConfig: { path: 'nada-consta' } }] } as any;
      const state = {} as any;
      const result = service.canActivate(route, state);
      if (typeof result === 'object' && 'subscribe' in result) {
        result.subscribe({
          next: (value: boolean | import('@angular/router').UrlTree) => {
            // Aceita tanto boolean false quanto objeto UrlTree
            expect(value === false || (typeof value === 'object' && value !== null)).toBe(true);
            done();
          }
        });
      } else {
        expect(result === false || (typeof result === 'object' && result !== null)).toBe(true);
        done();
      }
    });
    it('deve permitir acesso se tiver role necessária', async () => {
      const usuario: Usuario = { ...mockUser, authorities: [{ id: 2, nome: 'ROLE_LABORATORISTA' }] };
      service.setAuthenticated(usuario);
      storageService.setItem('userLogged', JSON.stringify(usuario));
      storageService.setItem('token', validToken);
      await Promise.resolve();
      const route = { pathFromRoot: [{ routeConfig: { path: 'nada-consta' } }] } as any;
      const state = {} as any;
      const result = service.canActivate(route, state);
      if (typeof result === 'object' && 'subscribe' in result) {
        await new Promise<void>((resolve, reject) => {
          result.subscribe({
            next: (value: boolean | import('@angular/router').UrlTree) => {
              try {
                expect(value).toBe(true);
                resolve();
              } catch (e) {
                reject(e);
              }
            },
            error: reject
          });
        });
      } else {
        expect(result).toBe(true);
      }
    }, 10000);
  });

  describe('getPermissoesUser', () => {
    it('deve retornar as permissões do usuário', (done) => {
      const usuario: Usuario = { ...mockUser, permissoes: [{ id: 3, nome: 'ROLE_TESTE' }] };
      service.setAuthenticated(usuario);
      service.getPermissoesUser().subscribe(permissoes => {
        expect(permissoes).toEqual([{ id: 3, nome: 'ROLE_TESTE' }]);
        done();
      });
    });
  });

  describe('userLoggedIsAlunoOrProfessor', () => {
    it('deve retornar true para aluno', async () => {
      const usuario: Usuario = { ...mockUser, authorities: [{ id: 4, nome: 'ROLE_ALUNO' }] };
      service.setAuthenticated(usuario);
      const result = await service.userLoggedIsAlunoOrProfessor();
      expect(result).toBe(true);
    });
    it('deve retornar false para administrador', async () => {
      const usuario: Usuario = { ...mockUser, authorities: [{ id: 5, nome: 'ROLE_ADMINISTRADOR' }] };
      service.setAuthenticated(usuario);
      const result = await service.userLoggedIsAlunoOrProfessor();
      expect(result).toBe(false);
    });
  });

  describe('login', () => {
    it('deve fazer requisição HTTP de login', () => {
      const usuario: Usuario = { ...mockUser };
      const http = TestBed.inject(HttpTestingController);
      let response: string | undefined;
      service.login(usuario).subscribe(res => response = res);
      const req = http.expectOne(`${environment.api_url}login`);
      expect(req.request.method).toBe('POST');
      req.flush('token-mock');
      expect(response).toBe('token-mock');
    });
  });
});
