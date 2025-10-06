import {TestBed} from '@angular/core/testing';
import {provideRouter} from '@angular/router';
import {AppComponent} from './app.component';
import {LoginService} from './login/login.service';
import {LoaderService} from './framework/loader/loader.service';
import {ThemeService} from './framework/services/theme.service';
import {BFCacheService} from './framework/services/bfcache.service';
import {PwaService} from './framework/services/pwa.service';
import {ConfirmationService, MessageService} from 'primeng/api';
import {BehaviorSubject, of} from 'rxjs';

/**
 * Testes unitários para AppComponent - Componente raiz da aplicação
 * Configurado para Jest + jest-preset-angular 15 + Angular 20
 */
describe('AppComponent', () => {
  let component: AppComponent;
  let mockLoginService: jest.Mocked<Partial<LoginService>>;
  let mockLoaderService: jest.Mocked<Partial<LoaderService>>;
  let mockThemeService: jest.Mocked<Partial<ThemeService>>;
  let mockBFCacheService: jest.Mocked<Partial<BFCacheService>>;
  let mockPwaService: jest.Mocked<Partial<PwaService>>;

  beforeEach(() => {
    // Mock do LoginService com BehaviorSubject para isAuthenticated
    const isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
    mockLoginService = {
      isAuthenticated: isAuthenticatedSubject,
      hasAnyRole: jest.fn().mockReturnValue(false),
      refreshCurrentUser: jest.fn().mockReturnValue(of(null))
    };

    // Mock do LoaderService
    mockLoaderService = {
      show: jest.fn(),
      hide: jest.fn(),
      showWithCancel: jest.fn()
    };

    // Mock do ThemeService
    mockThemeService = {};

    // Mock do BFCacheService com handlers que retornam cleanup functions
    mockBFCacheService = {
      onRestored: jest.fn().mockReturnValue(jest.fn()),
      onPageHide: jest.fn().mockReturnValue(jest.fn())
    };

    // Mock do PwaService
    mockPwaService = {};

    TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        // Provedor do Router para Angular 20 (substitui RouterTestingModule)
        provideRouter([]),
        // Serviços mockados
        {provide: LoginService, useValue: mockLoginService},
        {provide: LoaderService, useValue: mockLoaderService},
        {provide: ThemeService, useValue: mockThemeService},
        {provide: BFCacheService, useValue: mockBFCacheService},
        {provide: PwaService, useValue: mockPwaService},
        // Serviços do PrimeNG necessários
        MessageService,
        ConfirmationService
      ]
    });

    const fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
  });

  it('deve criar o componente app', () => {
    expect(component).toBeTruthy();
  });

  it('deve ter título "tcc-client"', () => {
    expect(component.title).toBe('tcc-client');
  });

  it('deve inicializar com isAuthenticated como false', () => {
    expect(component.isAuthenticated).toBe(false);
  });

  it('deve inicializar com isNavigating como false', () => {
    expect(component.isNavigating).toBe(false);
  });

  it('deve assinar o observable de autenticação no construtor', () => {
    // Verifica se o serviço foi chamado durante a construção do componente
    expect(mockLoginService.isAuthenticated).toBeDefined();
    expect(component.isAuthenticated).toBe(false);
  });

  it('deve atualizar isAuthenticated quando o estado de autenticação mudar', () => {
    // Simula mudança no estado de autenticação
    mockLoginService.isAuthenticated?.next(true);

    expect(component.isAuthenticated).toBe(true);
  });

  it('deve verificar acesso com hasAnyRole', () => {
    mockLoginService.hasAnyRole = jest.fn().mockReturnValue(true);

    const hasAccess = component.verifyAccess('ADMIN');

    expect(hasAccess).toBe(true);
    expect(mockLoginService.hasAnyRole).toHaveBeenCalledWith(['ADMIN']);
  });

  it('deve configurar handlers de BFCache no construtor', () => {
    // Verifica se os handlers foram registrados
    expect(mockBFCacheService.onRestored).toHaveBeenCalled();
    expect(mockBFCacheService.onPageHide).toHaveBeenCalled();
  });

  it('deve limpar subscription no ngOnDestroy', () => {
    const unsubscribeSpy = jest.fn();
    component.subscription = {unsubscribe: unsubscribeSpy} as any;

    component.ngOnDestroy();

    expect(unsubscribeSpy).toHaveBeenCalled();
  });

  it('deve executar cleanup handlers do BFCache no ngOnDestroy', () => {
    const cleanupMock1 = jest.fn();
    const cleanupMock2 = jest.fn();
    // Acessa a propriedade privada readonly usando Object.defineProperty
    Object.defineProperty(component, 'bfCacheCleanupHandlers', {
      value: [cleanupMock1, cleanupMock2],
      writable: true
    });

    component.ngOnDestroy();

    expect(cleanupMock1).toHaveBeenCalled();
    expect(cleanupMock2).toHaveBeenCalled();
  });
});
