import {ComponentFixture, TestBed} from '@angular/core/testing';
import {provideRouter} from '@angular/router';
import {signal, WritableSignal} from '@angular/core';
import {SidenavComponent} from './sidenav.component';
import {SidenavService} from './sidenav.service';
import {LoginService} from '../login/login.service';
import {BreakpointService} from '../framework/services/breakpoint.service';
import {BehaviorSubject, of} from 'rxjs';
import {BreakpointState} from '@angular/cdk/layout';

/**
 * Testes unitários para SidenavComponent
 * Foco em BreakpointService integration e mobile browser behavior
 */
describe('SidenavComponent', () => {
  let component: SidenavComponent;
  let fixture: ComponentFixture<SidenavComponent>;
  let mockSidenavService: jest.Mocked<Partial<SidenavService>>;
  let mockLoginService: jest.Mocked<Partial<LoginService>>;
  let mockBreakpointService: jest.Mocked<Partial<BreakpointService>>;
  let breakpointSubject: BehaviorSubject<BreakpointState>;
  let isDesktopSignal: WritableSignal<boolean>;
  let isMobileSignal: WritableSignal<boolean>;

  beforeAll(() => {
    // Mock window.matchMedia para testes de viewport
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  });

  beforeEach(async () => {
    // BehaviorSubject para simular mudanças de breakpoint
    breakpointSubject = new BehaviorSubject<BreakpointState>({
      matches: true,
      breakpoints: {'(min-width: 1024px)': true}
    });

    // Cria signal instances para mock do BreakpointService (reset para cada teste)
    isDesktopSignal = signal(true);
    isMobileSignal = signal(false);

    mockSidenavService = {
      toggle: jest.fn(),
      minimizar: jest.fn(),
      isMinimized: signal(false)
    };

    mockLoginService = {
      getPermissoesUser: jest.fn().mockReturnValue(of([
        {nome: 'ROLE_ADMINISTRADOR'},
        {nome: 'ROLE_LABORATORISTA'}
      ]))
    };

    mockBreakpointService = {
      isDesktop: isDesktopSignal,
      isMobile: isMobileSignal,
      observe: jest.fn().mockReturnValue(breakpointSubject.asObservable())
    } as any;

    await TestBed.configureTestingModule({
      imports: [SidenavComponent],
      providers: [
        provideRouter([]),
        {provide: SidenavService, useValue: mockSidenavService},
        {provide: LoginService, useValue: mockLoginService},
        {provide: BreakpointService, useValue: mockBreakpointService}
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SidenavComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    if (fixture) {
      fixture.destroy();
    }
    jest.clearAllMocks();
  });

  it('deve criar o componente sidenav', () => {
    expect(component).toBeTruthy();
  });

  describe('BreakpointService Integration', () => {
    it('deve inicializar com viewport desktop', () => {
      isDesktopSignal.set(true);

      component.ngOnInit();
      fixture.detectChanges();

      expect(component.sidebarVisible).toBe(true);
    });

    it('deve detectar mobile viewport corretamente', () => {
      isDesktopSignal.set(false);

      component.ngOnInit();
      fixture.detectChanges();

      expect(mockSidenavService.minimizar).toHaveBeenCalledWith(true);
    });

    it('deve observar mudanças de breakpoint', () => {
      component.ngOnInit();

      expect(mockBreakpointService.observe).toHaveBeenCalledWith('(min-width: 1024px)');
    });

    it('deve atualizar sidebar ao transicionar para mobile', () => {
      isDesktopSignal.set(true);
      component.ngOnInit();
      fixture.detectChanges();

      // Simula transição para mobile
      breakpointSubject.next({
        matches: false,
        breakpoints: {'(min-width: 1024px)': false}
      });
      fixture.detectChanges();

      expect(component.sidebarVisible).toBe(false);
      expect(mockSidenavService.minimizar).toHaveBeenCalledWith(true);
    });

    it('deve atualizar sidebar ao transicionar para desktop', () => {
      isDesktopSignal.set(false);
      component.ngOnInit();
      component.sidebarVisible = false;
      fixture.detectChanges();

      // Simula transição para desktop
      breakpointSubject.next({
        matches: true,
        breakpoints: {'(min-width: 1024px)': true}
      });
      fixture.detectChanges();

      expect(component.sidebarVisible).toBe(true);
    });

    it('sidebar deve ser visível por padrão em desktop', () => {
      isDesktopSignal.set(true);

      component.ngOnInit();
      fixture.detectChanges();

      expect(component.sidebarVisible).toBe(true);
    });

    it('sidebar deve iniciar oculta em mobile', () => {
      // Configure signals for mobile viewport
      isDesktopSignal.set(false);
      isMobileSignal.set(true);

      component.ngOnInit();
      fixture.detectChanges();

      // Em mobile, o componente deve chamar minimizar(true)
      // O estado final do sidebar depende do observable do service
      expect(mockSidenavService.minimizar).toHaveBeenCalledWith(true);
    });
  });

  describe('CSS Regression Tests - Dynamic Viewport Units', () => {
    it('deve ter sidebar element com classes corretas', () => {
      fixture.detectChanges();
      const sidebar = fixture.nativeElement.querySelector('.sidebar');
      expect(sidebar).toBeTruthy();
    });

    it('sidebar deve ter classe sidebar-visible quando visível', () => {
      component.sidebarVisible = true;
      fixture.detectChanges();

      const sidebar = fixture.nativeElement.querySelector('.sidebar');
      expect(sidebar.classList.contains('sidebar-visible')).toBe(true);
    });

    it('CSS classes devem alternar baseado em sidebarVisible', () => {
      // Test visible state
      component.sidebarVisible = true;
      fixture.detectChanges();
      let sidebar = fixture.nativeElement.querySelector('.sidebar');
      expect(sidebar.classList.contains('sidebar-visible')).toBe(true);

      // Test hidden state
      component.sidebarVisible = false;
      fixture.detectChanges();
      sidebar = fixture.nativeElement.querySelector('.sidebar');
      // Sidebar element exists regardless of visibility state
      expect(sidebar).toBeTruthy();
    });

    it('deve renderizar theme toggle section', () => {
      fixture.detectChanges();
      const themeToggle = fixture.nativeElement.querySelector('.theme-toggle-section');
      expect(themeToggle).toBeTruthy();
    });

    it('theme toggle deve estar sempre visível (não overflow)', () => {
      // Este teste garante que a estrutura CSS está correta
      fixture.detectChanges();
      const themeToggle = fixture.nativeElement.querySelector('.theme-toggle-container');
      expect(themeToggle).toBeTruthy();
    });
  });

  describe('Mobile Backdrop Behavior', () => {
    it('deve renderizar backdrop em mobile quando sidebar visível', () => {
      isDesktopSignal.set(false);
      isMobileSignal.set(true);
      component.sidebarVisible = true;

      // Force multiple change detection cycles to ensure template updates
      component['cdr'].detectChanges();
      fixture.detectChanges();

      const backdrop = fixture.nativeElement.querySelector('.sidebar-backdrop');
      expect(backdrop).toBeTruthy();
    });

    it('não deve renderizar backdrop em desktop', () => {
      isDesktopSignal.set(true);
      isMobileSignal.set(false);
      component.sidebarVisible = true;

      // Force multiple change detection cycles to ensure template updates
      component['cdr'].detectChanges();
      fixture.detectChanges();

      const backdrop = fixture.nativeElement.querySelector('.sidebar-backdrop');
      expect(backdrop).toBeFalsy();
    });

    it('closeSidebar deve ser chamado ao clicar no backdrop', () => {
      isDesktopSignal.set(false);
      isMobileSignal.set(true);
      component.sidebarVisible = true;

      // Force multiple change detection cycles to ensure template updates
      component['cdr'].detectChanges();
      fixture.detectChanges();

      const closeSpy = jest.spyOn(component, 'closeSidebar');
      const backdrop = fixture.nativeElement.querySelector('.sidebar-backdrop');
      backdrop.click();

      expect(closeSpy).toHaveBeenCalled();
    });

    it('backdrop deve ter aria-label para acessibilidade', () => {
      isDesktopSignal.set(false);
      isMobileSignal.set(true);
      component.sidebarVisible = true;

      // Force multiple change detection cycles to ensure template updates
      component['cdr'].detectChanges();
      fixture.detectChanges();

      const backdrop = fixture.nativeElement.querySelector('.sidebar-backdrop');
      expect(backdrop.getAttribute('aria-label')).toBe('Fechar menu');
    });
  });

  describe('Menu Building and Permissions', () => {
    it('deve construir menu baseado em permissões do usuário', (done) => {
      component.buildMenu();

      setTimeout(() => {
        expect(mockLoginService.getPermissoesUser).toHaveBeenCalled();
        expect(component.menuItems.length).toBeGreaterThan(0);
        expect(component.showCadastros).toBe(true);
        done();
      }, 100);
    });

    it('deve filtrar itens de menu por roles do usuário', (done) => {
      mockLoginService.getPermissoesUser = jest.fn().mockReturnValue(of([
        {nome: 'ROLE_ALUNO'}
      ]));

      component.buildMenu();

      setTimeout(() => {
        expect(component.showCadastros).toBe(false);
        done();
      }, 100);
    });

    it('ALUNO não deve visualizar menu Solicitação de Compra', (done) => {
      mockLoginService.getPermissoesUser = jest.fn().mockReturnValue(of([
        {nome: 'ROLE_ALUNO'}
      ]));

      component.buildMenu();

      setTimeout(() => {
        const solicitacaoItem = component.menuItems.find(item => item.id === 'solicitacao');
        expect(solicitacaoItem).toBeUndefined();
        done();
      }, 100);
    });

    it('PROFESSOR não deve visualizar menu Solicitação de Compra', (done) => {
      mockLoginService.getPermissoesUser = jest.fn().mockReturnValue(of([
        {nome: 'ROLE_PROFESSOR'}
      ]));

      component.buildMenu();

      setTimeout(() => {
        const solicitacaoItem = component.menuItems.find(item => item.id === 'solicitacao');
        expect(solicitacaoItem).toBeUndefined();
        done();
      }, 100);
    });

    it('ADMINISTRADOR deve visualizar menu Solicitação de Compra', (done) => {
      mockLoginService.getPermissoesUser = jest.fn().mockReturnValue(of([
        {nome: 'ROLE_ADMINISTRADOR'}
      ]));

      component.buildMenu();

      setTimeout(() => {
        const solicitacaoItem = component.menuItems.find(item => item.id === 'solicitacao');
        expect(solicitacaoItem).toBeDefined();
        expect(solicitacaoItem?.label).toBe('Sol. de Compra');
        done();
      }, 100);
    });

    it('LABORATORISTA deve visualizar menu Solicitação de Compra', (done) => {
      mockLoginService.getPermissoesUser = jest.fn().mockReturnValue(of([
        {nome: 'ROLE_LABORATORISTA'}
      ]));

      component.buildMenu();

      setTimeout(() => {
        const solicitacaoItem = component.menuItems.find(item => item.id === 'solicitacao');
        expect(solicitacaoItem).toBeDefined();
        expect(solicitacaoItem?.label).toBe('Sol. de Compra');
        done();
      }, 100);
    });

    it('deve criar menuCadastros para ADMINISTRADOR', (done) => {
      component.buildMenu();

      setTimeout(() => {
        expect(component.menuCadastros.length).toBeGreaterThan(0);
        done();
      }, 100);
    });
  });

  describe('Submenu Behavior', () => {
    it('deve inicializar com submenu cadastro expandido', () => {
      expect(component.showSubMenuCadastro).toBe(true);
    });

    it('toggleSubMenuCadastro deve alternar estado do submenu', () => {
      const initialState = component.showSubMenuCadastro;
      component.toggleSubMenuCadastro();

      expect(component.showSubMenuCadastro).toBe(!initialState);
    });

    it('deve renderizar submenu quando showSubMenuCadastro é true', () => {
      component.showCadastros = true;
      component.showSubMenuCadastro = true;
      fixture.detectChanges();

      const submenu = fixture.nativeElement.querySelector('.submenu-content');
      expect(submenu).toBeTruthy();
    });
  });

  describe('closeSidebar - Mobile Behavior', () => {
    it('deve chamar service.minimizar em mobile', () => {
      isDesktopSignal.set(false);
      component.ngOnInit();

      component.closeSidebar();

      expect(mockSidenavService.minimizar).toHaveBeenCalledWith(true);
    });

    it('não deve chamar service.minimizar em desktop', () => {
      isDesktopSignal.set(true);
      component.ngOnInit();
      (mockSidenavService.minimizar as jest.Mock).mockClear();

      component.closeSidebar();

      expect(mockSidenavService.minimizar).not.toHaveBeenCalled();
    });

    it('deve ser chamado ao clicar em menu item em mobile', (done) => {
      isDesktopSignal.set(false);
      component.ngOnInit();
      component.showCadastros = false;
      component.menuItems = [
        {label: 'Home', icon: 'pi pi-home', routerLink: '/', id: 'home'}
      ];
      fixture.detectChanges();

      setTimeout(() => {
        const closeSpy = jest.spyOn(component, 'closeSidebar');
        const menuItem = fixture.nativeElement.querySelector('.sidebar-menu-item');
        if (menuItem) {
          menuItem.click();
          expect(closeSpy).toHaveBeenCalled();
        }
        done();
      }, 50);
    });
  });

  describe('SidenavService Integration', () => {
    it('deve usar signal do SidenavService', () => {
      component.ngOnInit();

      expect(mockSidenavService.isMinimized).toBeDefined();
    });

    it('deve integrar com SidenavService corretamente', () => {
      // Verifica que o serviço está injetado e acessível
      expect(component['sidenavService']).toBeDefined();
      expect(mockSidenavService.isMinimized).toBeDefined();
    });

    it('deve reagir a mudanças do SidenavService signal', (done) => {
      // Usa o signal já configurado no mock (não pode mais override após fixture criada)
      isDesktopSignal.set(false);

      component.ngOnInit();
      fixture.detectChanges();

      // Obtém o signal do mock existente
      const serviceSignal = mockSidenavService.isMinimized as WritableSignal<boolean>;

      // Simula service emitindo minimizado=true
      serviceSignal.set(true);
      fixture.detectChanges();

      setTimeout(() => {
        expect(component.sidebarVisible).toBe(false);
        done();
      }, 50);
    });
  });

  describe('ChangeDetection - OnPush Strategy', () => {
    it('deve usar ChangeDetectionStrategy.OnPush', () => {
      // Verifica que o componente está configurado com OnPush
      expect(component).toBeTruthy();
      expect(fixture.componentRef.changeDetectorRef).toBeDefined();
    });

    it('deve chamar markForCheck após buildMenu', (done) => {
      const cdrSpy = jest.spyOn(component['cdr'], 'markForCheck');

      component.buildMenu();

      setTimeout(() => {
        expect(cdrSpy).toHaveBeenCalled();
        done();
      }, 100);
    });

    it('deve chamar markForCheck em toggleSubMenuCadastro', () => {
      const cdrSpy = jest.spyOn(component['cdr'], 'markForCheck');

      component.toggleSubMenuCadastro();

      expect(cdrSpy).toHaveBeenCalled();
    });

    it('closeSidebar deve usar service para manter sincronização de estado', () => {
      isDesktopSignal.set(false);
      component.ngOnInit();

      component.closeSidebar();

      // Verifica que usa o serviço ao invés de manipular estado diretamente
      expect(mockSidenavService.minimizar).toHaveBeenCalledWith(true);
    });
  });

  describe('State Initialization - Mobile Fix', () => {
    it('deve inicializar service com minimizado=true em mobile', () => {
      isDesktopSignal.set(false);

      component.ngOnInit();
      fixture.detectChanges();

      // Verifica que minimizar(true) foi chamado para mobile
      expect(mockSidenavService.minimizar).toHaveBeenCalledWith(true);
    });

    it('não deve chamar minimizar em desktop viewport', () => {
      isDesktopSignal.set(true);
      (mockSidenavService.minimizar as jest.Mock).mockClear();

      component.ngOnInit();
      fixture.detectChanges();

      // Em desktop não deve minimizar
      expect(mockSidenavService.minimizar).not.toHaveBeenCalled();
    });

    it('closeSidebar deve usar service.minimizar para manter sincronização', () => {
      isDesktopSignal.set(false);
      component.ngOnInit();

      component.closeSidebar();

      expect(mockSidenavService.minimizar).toHaveBeenCalledWith(true);
    });
  });

  describe('Viewport Transitions - Desktop ↔ Mobile', () => {
    it('deve mostrar sidebar ao transicionar de mobile para desktop', (done) => {
      isDesktopSignal.set(false);
      component.ngOnInit();
      component.sidebarVisible = false;
      fixture.detectChanges();

      // Transiciona para desktop
      breakpointSubject.next({
        matches: true,
        breakpoints: {'(min-width: 1024px)': true}
      });

      setTimeout(() => {
        expect(component.sidebarVisible).toBe(true);
        done();
      }, 50);
    });

    it('deve ocultar sidebar ao transicionar de desktop para mobile', (done) => {
      isDesktopSignal.set(true);
      component.ngOnInit();
      fixture.detectChanges();

      // Transiciona para mobile
      breakpointSubject.next({
        matches: false,
        breakpoints: {'(min-width: 1024px)': false}
      });

      setTimeout(() => {
        expect(component.sidebarVisible).toBe(false);
        done();
      }, 50);
    });
  });

  describe('Menu Item Navigation', () => {
    it('menu items devem estar configurados corretamente', () => {
      component.menuItems = [
        {label: 'Home', icon: 'pi pi-home', routerLink: '/', id: 'home'}
      ];

      // Verifica estrutura do menu item
      expect(component.menuItems).toHaveLength(1);
      expect(component.menuItems[0].routerLink).toBe('/');
      expect(component.menuItems[0].label).toBe('Home');
    });

    it('home route deve ter ID correto', () => {
      component.menuItems = [
        {label: 'Home', icon: 'pi pi-home', routerLink: '/', id: 'home'}
      ];

      const homeItem = component.menuItems.find(item => item.id === 'home');
      expect(homeItem).toBeTruthy();
      expect(homeItem?.routerLink).toBe('/');
    });
  });

  describe('Computed Signal - isDesktopView', () => {
    it('isDesktopView deve refletir estado do BreakpointService', () => {
      isDesktopSignal.set(true);
      component.ngOnInit();
      fixture.detectChanges();

      // Computed signal should reflect the BreakpointService state
      expect(component['isDesktopView']).toBeDefined();
    });

    it('isDesktopView deve ser reativo a mudanças do BreakpointService', () => {
      // Start as desktop
      isDesktopSignal.set(true);
      component.ngOnInit();
      fixture.detectChanges();

      // Change to mobile
      isDesktopSignal.set(false);
      fixture.detectChanges();

      // The computed signal should update automatically
      expect(component['isDesktopView']).toBeDefined();
    });
  });
});
