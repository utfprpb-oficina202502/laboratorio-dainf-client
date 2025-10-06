import {TestBed} from '@angular/core/testing';
import {HttpClientTestingModule, HttpTestingController} from '@angular/common/http/testing';
import {Router} from '@angular/router';
import {LoginService} from './login.service';
import {StorageService} from '../framework/services/storage.service';
import {UsuarioService} from '../usuario/usuario.service';
import {Usuario} from '../usuario/usuario';
import {environment} from '../../environments/environment';

describe('LoginService - Token Validation & Migration', () => {
  let service: LoginService;
  let httpMock: HttpTestingController;
  let storageService: StorageService;
  let router: Router;

  // Token válido (exp: 2099-01-01)
  const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0dXNlciIsImV4cCI6NDA3MDkwODgwMCwiaWF0IjoxNTE2MjM5MDIyfQ.4Adcj0vfLwz_5extraKxKu4sM5xLU7OlZEcmKnVJKnU';

  // Token expirado (exp: 2020-01-01)
  const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0dXNlciIsImV4cCI6MTU3NzcxMDAwMCwiaWF0IjoxNTE2MjM5MDIyfQ.X6vFCHFRNUZBNYmQNJzG8RKzUvZZNfhMdQ0JBHqY5aQ';

  const mockUser: Partial<Usuario> = {
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
    sessionStorage.clear();
    localStorage.clear();
  });

  describe('localStorage Migration', () => {
    // Testes de migração precisam de TestBed próprio para evitar interferência do beforeEach
    beforeEach(() => {
      // Limpa antes de cada teste de migração
      sessionStorage.clear();
      localStorage.clear();
    });

    it('deve migrar token do localStorage para sessionStorage', () => {
      // Simula dados antigos no localStorage ANTES de criar o serviço
      localStorage.setItem('token', validToken);
      localStorage.setItem('username', 'testuser');
      localStorage.setItem('userLogged', JSON.stringify(mockUser));

      // Cria novo TestBed e serviço (trigger migração no constructor)
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [
          LoginService,
          StorageService,
          {provide: UsuarioService, useValue: {findByUsername: jest.fn()}},
          {provide: Router, useValue: {navigate: jest.fn()}}
        ]
      });

      TestBed.inject(LoginService);

      // Verifica que dados foram migrados para sessionStorage
      expect(sessionStorage.getItem('token')).toBe(validToken);
      expect(sessionStorage.getItem('username')).toBe('testuser');
      expect(sessionStorage.getItem('userLogged')).toBe(JSON.stringify(mockUser));

      // Verifica que dados foram removidos do localStorage
      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('username')).toBeNull();
      expect(localStorage.getItem('userLogged')).toBeNull();
    });

    it('deve migrar apenas token se apenas token existir no localStorage', () => {
      localStorage.setItem('token', validToken);

      // Cria novo TestBed
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [
          LoginService,
          StorageService,
          {provide: UsuarioService, useValue: {findByUsername: jest.fn()}},
          {provide: Router, useValue: {navigate: jest.fn()}}
        ]
      });

      TestBed.inject(LoginService);

      expect(sessionStorage.getItem('token')).toBe(validToken);
      expect(localStorage.getItem('token')).toBeNull();
    });

    it('não deve fazer nada se não houver dados no localStorage', () => {
      const consoleSpy = jest.spyOn(console, 'warn');

      // Cria novo TestBed sem dados no localStorage
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [
          LoginService,
          StorageService,
          {provide: UsuarioService, useValue: {findByUsername: jest.fn()}},
          {provide: Router, useValue: {navigate: jest.fn()}}
        ]
      });

      TestBed.inject(LoginService);

      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('deve logar mensagem de migração quando dados são encontrados', () => {
      const consoleSpy = jest.spyOn(console, 'warn');
      localStorage.setItem('token', validToken);

      // Cria novo TestBed
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [
          LoginService,
          StorageService,
          {provide: UsuarioService, useValue: {findByUsername: jest.fn()}},
          {provide: Router, useValue: {navigate: jest.fn()}}
        ]
      });

      TestBed.inject(LoginService);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[Auth Migration] Detectados dados antigos no localStorage, migrando para sessionStorage...'
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        '[Auth Migration] Migração concluída. Dados movidos para sessionStorage e removidos do localStorage.'
      );

      consoleSpy.mockRestore();
    });
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

    it('deve atualizar observable isAuthenticated para false', (done) => {
      service.isAuthenticated.next(true);

      service.logout();

      service.isAuthenticated.subscribe((isAuth) => {
        expect(isAuth).toBe(false);
        done();
      });
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
});
