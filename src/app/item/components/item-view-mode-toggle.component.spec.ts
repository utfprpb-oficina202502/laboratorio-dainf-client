import {ComponentFixture, TestBed} from '@angular/core/testing';
import {Router} from '@angular/router';
import {ItemViewModeToggleComponent} from './item-view-mode-toggle.component';
import {CartService} from '../../framework/service/cart.service';
import {BreakpointService} from '../../framework/service/breakpoint.service';
import {signal} from '@angular/core';

describe('ItemViewModeToggleComponent', () => {
  let component: ItemViewModeToggleComponent;
  let fixture: ComponentFixture<ItemViewModeToggleComponent>;
  let routerSpy: jest.Mocked<Router>;

  beforeEach(async () => {
    routerSpy = {
      navigate: jest.fn().mockResolvedValue(true)
    } as unknown as jest.Mocked<Router>;

    const cartServiceMock = {
      totalItems: signal(0),
      items: signal([]),
      isInCart: jest.fn().mockReturnValue(false),
      getItemQuantity: jest.fn().mockReturnValue(0),
      addItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn()
    };

    const breakpointServiceMock = {
      isMobile: signal(false),
      isTablet: signal(false),
      isDesktop: signal(true)
    };

    await TestBed.configureTestingModule({
      imports: [ItemViewModeToggleComponent],
      providers: [
        {provide: Router, useValue: routerSpy},
        {provide: CartService, useValue: cartServiceMock},
        {provide: BreakpointService, useValue: breakpointServiceMock}
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ItemViewModeToggleComponent);
    component = fixture.componentInstance;

    // Set required input
    fixture.componentRef.setInput('currentMode', 'table');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================================
  // Component Setup (2 tests)
  // ============================================================================
  describe('Component Setup', () => {
    it('deve criar o componente', () => {
      expect(component).toBeTruthy();
    });

    it('deve ter três opções de visualização', () => {
      expect(component['viewModeOptions']).toHaveLength(3);
      expect(component['viewModeOptions'].map(o => o.value)).toEqual(['table', 'catalog', 'tree']);
    });
  });

  // ============================================================================
  // Navegação com State (4 tests)
  // ============================================================================
  describe('Navegação com State', () => {
    it('deve navegar para /item com fromToggle state ao selecionar tabela', () => {
      component['onModeChange']('table');

      expect(routerSpy.navigate).toHaveBeenCalledWith(
        ['/item'],
        {state: {fromToggle: true}}
      );
    });

    it('deve navegar para /item/catalogo com fromToggle state ao selecionar catálogo', () => {
      component['onModeChange']('catalog');

      expect(routerSpy.navigate).toHaveBeenCalledWith(
        ['/item/catalogo'],
        {state: {fromToggle: true}}
      );
    });

    it('deve navegar para /item/arvore com fromToggle state ao selecionar árvore', () => {
      component['onModeChange']('tree');

      expect(routerSpy.navigate).toHaveBeenCalledWith(
        ['/item/arvore'],
        {state: {fromToggle: true}}
      );
    });

    it('deve emitir evento modeChange ao mudar modo', () => {
      const modeChangeSpy = jest.fn();
      component.modeChange.subscribe(modeChangeSpy);

      component['onModeChange']('catalog');

      expect(modeChangeSpy).toHaveBeenCalledWith('catalog');
    });
  });

  // ============================================================================
  // Navegação para Reserva (2 tests)
  // ============================================================================
  describe('Navegação para Reserva', () => {
    it('deve navegar para /reserva/new ao ir para reserva', () => {
      component['onGoToReserva']();

      expect(routerSpy.navigate).toHaveBeenCalledWith(
        ['/reserva/new'],
        expect.objectContaining({state: expect.any(Object)})
      );
    });

    it('deve emitir evento goToReserva', () => {
      const goToReservaSpy = jest.fn();
      component.goToReserva.subscribe(goToReservaSpy);

      component['onGoToReserva']();

      expect(goToReservaSpy).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // Carrinho (2 tests)
  // ============================================================================
  describe('Carrinho', () => {
    it('deve ter computed signal para quantidade de itens no carrinho', () => {
      expect(component['cartItemCount']).toBeDefined();
      expect(typeof component['cartItemCount']()).toBe('number');
    });

    it('deve ter showCartButton como input com default true', () => {
      // Verifica que o input existe e tem valor padrão
      expect(component.showCartButton()).toBe(true);
    });
  });
});
