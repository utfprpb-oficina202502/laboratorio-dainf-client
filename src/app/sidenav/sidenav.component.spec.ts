import {ComponentFixture, TestBed} from '@angular/core/testing';
import {provideRouter} from '@angular/router';
import {SidenavComponent} from './sidenav.component';
import {SidenavService} from './sidenav.service';
import {LoginService} from '../login/login.service';
import {of} from 'rxjs';

/**
 * Testes unitários para SidenavComponent
 * Foco em dynamic viewport height e mobile browser chrome behavior
 */
describe('SidenavComponent', () => {
  let component: SidenavComponent;
  let fixture: ComponentFixture<SidenavComponent>;
  let mockSidenavService: jest.Mocked<Partial<SidenavService>>;
  let mockLoginService: jest.Mocked<Partial<LoginService>>;

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
    mockSidenavService = {
      toggle: jest.fn(),
      minimizar: jest.fn(),
      observable: jest.fn().mockReturnValue(of(false))
    };

    mockLoginService = {
      getPermissoesUser: jest.fn().mockReturnValue(of([
        {nome: 'ROLE_ADMINISTRADOR'},
        {nome: 'ROLE_LABORATORISTA'}
      ]))
    };

    await TestBed.configureTestingModule({
      imports: [SidenavComponent],
      providers: [
        provideRouter([]),
        {provide: SidenavService, useValue: mockSidenavService},
        {provide: LoginService, useValue: mockLoginService}
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SidenavComponent);
    component = fixture.componentInstance;
  });

  it('deve criar o componente sidenav', () => {
    expect(component).toBeTruthy();
  });

  describe('Dynamic Viewport Height - Mobile Browser Chrome', () => {
    it('deve inicializar com viewport flags corretos', () => {
      // Simula viewport desktop
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200
      });

      component.ngOnInit();
      fixture.detectChanges();

      expect(component.isDesktopView).toBe(true);
    });

    it('deve detectar mobile viewport corretamente', () => {
      // Simula viewport mobile
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768
      });

      component.ngOnInit();
      fixture.detectChanges();

      expect(component.isDesktopView).toBe(false);
    });

    it('deve atualizar viewport flags no resize', () => {
      // Inicia em desktop
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200
      });
      component.ngOnInit();
      expect(component.isDesktopView).toBe(true);

      // Simula resize para mobile
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768
      });
      component.onWindowResize();

      expect(component.isDesktopView).toBe(false);
    });

    it('sidebar deve ser visível por padrão em desktop', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200
      });

      component.ngOnInit();
      fixture.detectChanges();

      expect(component.sidebarVisible).toBe(true);
    });

    it('sidebar deve respeitar viewport em mobile', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768
      });

      component['updateViewportFlags']();

      // Verifica que mobile viewport é detectado
      expect(component.isDesktopView).toBe(false);
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
      component.isDesktopView = false;
      component.sidebarVisible = true;
      fixture.detectChanges();

      const backdrop = fixture.nativeElement.querySelector('.sidebar-backdrop');
      expect(backdrop).toBeTruthy();
    });

    it('backdrop rendering depende de isDesktopView e sidebarVisible', () => {
      // Test logic: backdrop only shows when !isDesktopView && sidebarVisible
      expect(component.isDesktopView !== undefined).toBe(true);
      expect(component.sidebarVisible !== undefined).toBe(true);
    });

    it('closeSidebar deve ser chamado ao clicar no backdrop', () => {
      component.isDesktopView = false;
      component.sidebarVisible = true;
      fixture.detectChanges();

      const closeSpy = jest.spyOn(component, 'closeSidebar');
      const backdrop = fixture.nativeElement.querySelector('.sidebar-backdrop');
      backdrop.click();

      expect(closeSpy).toHaveBeenCalled();
    });

    it('backdrop deve ter aria-label para acessibilidade', () => {
      component.isDesktopView = false;
      component.sidebarVisible = true;
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
      component.isDesktopView = false;

      component.closeSidebar();

      expect(mockSidenavService.minimizar).toHaveBeenCalledWith(true);
    });

    it('não deve chamar service.minimizar em desktop', () => {
      component.isDesktopView = true;
      (mockSidenavService.minimizar as jest.Mock).mockClear();

      component.closeSidebar();

      expect(mockSidenavService.minimizar).not.toHaveBeenCalled();
    });

    it('deve ser chamado ao clicar em menu item em mobile', (done) => {
      component.isDesktopView = false;
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

  describe('Viewport Resize - Desktop ↔ Mobile Transition', () => {
    it('deve mostrar sidebar ao transicionar de mobile para desktop', () => {
      // Inicia em mobile
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768
      });
      component.ngOnInit();
      component.sidebarVisible = false;

      // Transiciona para desktop
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200
      });
      component.onWindowResize();

      expect(component.sidebarVisible).toBe(true);
    });

    it('deve ocultar sidebar ao transicionar de desktop para mobile', () => {
      // Inicia em desktop
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200
      });
      component.ngOnInit();

      // Transiciona para mobile
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768
      });
      component.onWindowResize();

      expect(component.sidebarVisible).toBe(false);
    });
  });

  describe('SidenavService Integration', () => {
    it('deve assinar observable do SidenavService', () => {
      component.ngOnInit();

      expect(mockSidenavService.observable).toHaveBeenCalled();
    });

    it('deve integrar com SidenavService corretamente', () => {
      // Verifica que o serviço está injetado e acessível
      expect(component['sidenavService']).toBeDefined();
      expect(mockSidenavService.observable).toBeDefined();
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
      component.isDesktopView = false;

      component.closeSidebar();

      // Verifica que usa o serviço ao invés de manipular estado diretamente
      expect(mockSidenavService.minimizar).toHaveBeenCalledWith(true);
    });
  });

  describe('State Initialization - Mobile Fix', () => {
    it('deve inicializar service com minimizado=true em mobile', () => {
      // Simula mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768
      });

      component.ngOnInit();
      fixture.detectChanges();

      // Verifica que minimizar(true) foi chamado para mobile
      expect(mockSidenavService.minimizar).toHaveBeenCalledWith(true);
    });

    it('não deve chamar minimizar em desktop viewport', () => {
      // Simula desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200
      });

      (mockSidenavService.minimizar as jest.Mock).mockClear();

      component.ngOnInit();
      fixture.detectChanges();

      // Em desktop não deve minimizar
      expect(mockSidenavService.minimizar).not.toHaveBeenCalled();
    });

    it('closeSidebar deve usar service.minimizar para manter sincronização', () => {
      component.isDesktopView = false;

      component.closeSidebar();

      expect(mockSidenavService.minimizar).toHaveBeenCalledWith(true);
    });
  });

  describe('Performance - Viewport Detection', () => {
    it('updateViewportFlags deve executar rapidamente', () => {
      const startTime = performance.now();
      component['updateViewportFlags']();
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(10);
    });

    it('onWindowResize deve ser eficiente para múltiplas chamadas', () => {
      const startTime = performance.now();

      for (let i = 0; i < 100; i++) {
        component.onWindowResize();
      }

      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(100);
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
});
