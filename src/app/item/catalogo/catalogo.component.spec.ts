import {ComponentFixture, fakeAsync, TestBed, tick} from '@angular/core/testing';
import {provideRouter, Router} from '@angular/router';
import {provideNoopAnimations} from '@angular/platform-browser/animations';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {signal} from '@angular/core';
import {of, throwError} from 'rxjs';

import {CatalogoComponent} from './catalogo.component';
import {ItemService} from '../item.service';
import {GrupoService} from '../../grupo/grupo.service';
import {CartService} from '../../framework/services/cart.service';
import {BreakpointService} from '../../framework/services/breakpoint.service';
import {LoggerService} from '../../framework/services/logger.service';
import {Item} from '../item';
import {Grupo} from '../../grupo/grupo';

/**
 * Factory para criar dados de teste do CatalogoComponent.
 */
class CatalogoTestFactory {
  static createGrupo(overrides: Partial<Grupo> = {}): Grupo {
    return {
      id: 1,
      descricao: 'Eletrônicos',
      ...overrides
    };
  }

  static createGrupos(): Grupo[] {
    return [
      this.createGrupo({id: 1, descricao: 'Eletrônicos'}),
      this.createGrupo({id: 2, descricao: 'Ferramentas'}),
      this.createGrupo({id: 3, descricao: 'Materiais'})
    ];
  }

  static createItem(overrides: Partial<Item> = {}): Item {
    const grupo = this.createGrupo();
    return {
      id: 1,
      nome: 'Arduino Uno',
      patrimonio: 12345,
      siorg: 67890,
      valor: 150.0,
      qtdeMinima: 1,
      localizacao: 'Armário A1',
      tipoItem: 'MATERIAL',
      saldo: 10,
      descricao: 'Placa microcontroladora',
      grupo,
      imageItem: [],
      disponivelEmprestimoCalculado: 8,
      quantidadeEmprestada: 2,
      ...overrides
    } as Item;
  }

  static createItems(count = 5): Item[] {
    return Array(count).fill(null).map((_, i) =>
      this.createItem({
        id: i + 1,
        nome: `Item ${i + 1}`,
        grupo: this.createGrupo({id: (i % 3) + 1})
      })
    );
  }

  static createPageResponse(items: Item[], totalElements?: number) {
    return {
      content: items,
      totalElements: totalElements ?? items.length,
      totalPages: Math.ceil((totalElements ?? items.length) / 12),
      size: 12,
      number: 0
    };
  }
}

describe('CatalogoComponent', () => {
  let component: CatalogoComponent;
  let fixture: ComponentFixture<CatalogoComponent>;
  let itemServiceMock: jest.Mocked<ItemService>;
  let grupoServiceMock: jest.Mocked<GrupoService>;
  let cartServiceMock: jest.Mocked<CartService>;
  let breakpointServiceMock: jest.Mocked<BreakpointService>;
  let loggerServiceMock: jest.Mocked<LoggerService>;
  let router: Router;

  beforeEach(async () => {
    itemServiceMock = {
      findAllPaged: jest.fn()
    } as unknown as jest.Mocked<ItemService>;

    grupoServiceMock = {
      findAll: jest.fn()
    } as unknown as jest.Mocked<GrupoService>;

    cartServiceMock = {
      items: signal([]),
      totalItems: signal(0),
      totalUnits: signal(0),
      isEmpty: signal(true),
      hasItems: signal(false),
      addItem: jest.fn().mockReturnValue(true),
      removeItem: jest.fn(),
      updateQuantity: jest.fn().mockReturnValue(true),
      clear: jest.fn(),
      getItemQuantity: jest.fn().mockReturnValue(0),
      isInCart: jest.fn().mockReturnValue(false)
    } as unknown as jest.Mocked<CartService>;

    breakpointServiceMock = {
      isMobile: signal(false),
      isTablet: signal(false),
      isDesktop: signal(true)
    } as unknown as jest.Mocked<BreakpointService>;

    loggerServiceMock = {
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      debug: jest.fn()
    } as unknown as jest.Mocked<LoggerService>;

    await TestBed.configureTestingModule({
      imports: [CatalogoComponent, HttpClientTestingModule],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        {provide: CartService, useValue: cartServiceMock},
        {provide: BreakpointService, useValue: breakpointServiceMock},
        {provide: LoggerService, useValue: loggerServiceMock}
      ]
    })
    // Override os providers do componente
    .overrideComponent(CatalogoComponent, {
      set: {
        providers: [
          {provide: ItemService, useValue: itemServiceMock},
          {provide: GrupoService, useValue: grupoServiceMock}
        ]
      }
    })
    .compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(CatalogoComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Inicialização', () => {
    it('deve criar o componente', () => {
      grupoServiceMock.findAll.mockReturnValue(of([]));
      itemServiceMock.findAllPaged.mockReturnValue(of(CatalogoTestFactory.createPageResponse([])));
      fixture.detectChanges();

      expect(component).toBeTruthy();
    });

    it('deve carregar grupos e itens no ngOnInit', fakeAsync(() => {
      const grupos = CatalogoTestFactory.createGrupos();
      const items = CatalogoTestFactory.createItems();
      grupoServiceMock.findAll.mockReturnValue(of(grupos));
      itemServiceMock.findAllPaged.mockReturnValue(of(CatalogoTestFactory.createPageResponse(items)));

      fixture.detectChanges();
      tick();

      expect(grupoServiceMock.findAll).toHaveBeenCalled();
      expect(itemServiceMock.findAllPaged).toHaveBeenCalled();
      expect(component['grupos']().length).toBe(3);
      expect(component['items']().length).toBe(5);
      expect(component['loading']()).toBe(false);
    }));

    it('deve exibir erro quando falha ao carregar itens', fakeAsync(() => {
      grupoServiceMock.findAll.mockReturnValue(of([]));
      itemServiceMock.findAllPaged.mockReturnValue(throwError(() => new Error('Network error')));

      fixture.detectChanges();
      tick();

      expect(component['error']()).toBe('Erro ao carregar itens. Tente novamente.');
      expect(component['loading']()).toBe(false);
    }));

    it('deve iniciar com loading true', () => {
      grupoServiceMock.findAll.mockReturnValue(of([]));
      itemServiceMock.findAllPaged.mockReturnValue(of(CatalogoTestFactory.createPageResponse([])));

      expect(component['loading']()).toBe(true);
    });
  });

  describe('Navegação para Detalhes do Item', () => {
    beforeEach(fakeAsync(() => {
      grupoServiceMock.findAll.mockReturnValue(of([]));
      itemServiceMock.findAllPaged.mockReturnValue(of(CatalogoTestFactory.createPageResponse([])));
      fixture.detectChanges();
      tick();
    }));

    it('deve navegar para /item/form/:id ao chamar onViewDetails', () => {
      const navigateSpy = jest.spyOn(router, 'navigate');
      const item = CatalogoTestFactory.createItem({id: 42});

      component.onViewDetails(item);

      expect(navigateSpy).toHaveBeenCalledWith(['/item/form', 42]);
    });

    it('deve navegar para reserva com itens do carrinho', () => {
      const navigateSpy = jest.spyOn(router, 'navigate');
      const cartItems = [CatalogoTestFactory.createItem()];
      (cartServiceMock.items as any) = signal(cartItems);

      component.goToReserva();

      expect(navigateSpy).toHaveBeenCalledWith(['/reserva/new'], {
        state: {cartItems}
      });
    });
  });

  describe('Paginação', () => {
    beforeEach(fakeAsync(() => {
      grupoServiceMock.findAll.mockReturnValue(of([]));
      itemServiceMock.findAllPaged.mockReturnValue(of(CatalogoTestFactory.createPageResponse([], 100)));
      fixture.detectChanges();
      tick();
    }));

    it('deve atualizar página ao mudar paginação', fakeAsync(() => {
      itemServiceMock.findAllPaged.mockReturnValue(of(CatalogoTestFactory.createPageResponse([])));

      component.onPageChange({page: 2, rows: 24, first: 48});
      tick();

      expect(component['currentPage']()).toBe(2);
      expect(component['pageSize']()).toBe(24);
      expect(itemServiceMock.findAllPaged).toHaveBeenCalledWith(2, 24, '');
    }));

    it('deve usar valores padrão quando evento de paginação incompleto', fakeAsync(() => {
      itemServiceMock.findAllPaged.mockReturnValue(of(CatalogoTestFactory.createPageResponse([])));

      component.onPageChange({});
      tick();

      expect(component['currentPage']()).toBe(0);
      expect(component['pageSize']()).toBe(12);
    }));
  });

  describe('Filtros', () => {
    beforeEach(fakeAsync(() => {
      grupoServiceMock.findAll.mockReturnValue(of(CatalogoTestFactory.createGrupos()));
      itemServiceMock.findAllPaged.mockReturnValue(of(CatalogoTestFactory.createPageResponse(CatalogoTestFactory.createItems())));
      fixture.detectChanges();
      tick();
    }));

    it('deve resetar página ao buscar', fakeAsync(() => {
      component['currentPage'].set(5);
      component['searchTerm'].set('arduino');
      itemServiceMock.findAllPaged.mockReturnValue(of(CatalogoTestFactory.createPageResponse([])));

      component.onSearch();
      tick();

      expect(component['currentPage']()).toBe(0);
      expect(itemServiceMock.findAllPaged).toHaveBeenCalledWith(0, 12, 'arduino');
    }));

    it('deve resetar página ao mudar grupo', fakeAsync(() => {
      component['currentPage'].set(3);
      itemServiceMock.findAllPaged.mockReturnValue(of(CatalogoTestFactory.createPageResponse([])));

      component.onGrupoChange();
      tick();

      expect(component['currentPage']()).toBe(0);
    }));

    it('deve filtrar itens por grupo no cliente', fakeAsync(() => {
      const items = CatalogoTestFactory.createItems(10);
      // Todos os itens com grupo id 1
      items.forEach(item => item.grupo = CatalogoTestFactory.createGrupo({id: 1}));
      // Um item com grupo id 2
      items[5].grupo = CatalogoTestFactory.createGrupo({id: 2});

      itemServiceMock.findAllPaged.mockReturnValue(of(CatalogoTestFactory.createPageResponse(items)));

      component['selectedGrupo'].set(CatalogoTestFactory.createGrupo({id: 2}));
      component.loadItems();
      tick();

      expect(component['items']().length).toBe(1);
      expect(component['items']()[0].grupo?.id).toBe(2);
    }));

    it('deve limpar filtros corretamente', fakeAsync(() => {
      component['searchTerm'].set('teste');
      component['selectedGrupo'].set(CatalogoTestFactory.createGrupo());
      component['currentPage'].set(5);

      itemServiceMock.findAllPaged.mockReturnValue(of(CatalogoTestFactory.createPageResponse([])));

      component.clearFilters();
      tick();

      expect(component['searchTerm']()).toBe('');
      expect(component['selectedGrupo']()).toBeNull();
      expect(component['currentPage']()).toBe(0);
    }));
  });

  describe('Grupos', () => {
    it('deve incluir opção "Todos os grupos" nas opções', fakeAsync(() => {
      const grupos = CatalogoTestFactory.createGrupos();
      grupoServiceMock.findAll.mockReturnValue(of(grupos));
      itemServiceMock.findAllPaged.mockReturnValue(of(CatalogoTestFactory.createPageResponse([])));

      fixture.detectChanges();
      tick();

      const options = component['grupoOptions']();
      expect(options.length).toBe(4); // 1 "Todos" + 3 grupos
      expect(options[0].descricao).toBe('Todos os grupos');
      expect(options[0].id).toBe(0);
    }));

    it('não deve filtrar quando grupo "Todos" selecionado (id: 0)', fakeAsync(() => {
      const items = CatalogoTestFactory.createItems(5);
      grupoServiceMock.findAll.mockReturnValue(of([]));
      itemServiceMock.findAllPaged.mockReturnValue(of(CatalogoTestFactory.createPageResponse(items)));

      fixture.detectChanges();
      tick();

      // Seleciona "Todos" (id: 0)
      component['selectedGrupo'].set({id: 0, descricao: 'Todos os grupos'});
      component.loadItems();
      tick();

      // Não deve filtrar - todos os 5 itens devem aparecer
      expect(component['items']().length).toBe(5);
    }));
  });

  describe('Skeleton Loading', () => {
    it('deve retornar array do tamanho correto para skeleton', () => {
      grupoServiceMock.findAll.mockReturnValue(of([]));
      itemServiceMock.findAllPaged.mockReturnValue(of(CatalogoTestFactory.createPageResponse([])));

      component['pageSize'].set(24);
      const skeleton = component.getSkeletonArray();

      expect(skeleton.length).toBe(24);
      expect(skeleton[0]).toBe(0);
      expect(skeleton[23]).toBe(23);
    });
  });

  describe('Responsividade', () => {
    it('deve expor isMobile do breakpointService', fakeAsync(() => {
      grupoServiceMock.findAll.mockReturnValue(of([]));
      itemServiceMock.findAllPaged.mockReturnValue(of(CatalogoTestFactory.createPageResponse([])));
      fixture.detectChanges();
      tick();

      // O mock tem isMobile: signal(false)
      expect(component['isMobile']()).toBe(false);
    }));

    it('deve expor cartItemCount do cartService', fakeAsync(() => {
      grupoServiceMock.findAll.mockReturnValue(of([]));
      itemServiceMock.findAllPaged.mockReturnValue(of(CatalogoTestFactory.createPageResponse([])));
      fixture.detectChanges();
      tick();

      // O mock tem totalItems: signal(0)
      expect(component['cartItemCount']()).toBe(0);
    }));
  });

  describe('Tratamento de Erros', () => {
    it('deve logar erro via LoggerService ao falhar ao carregar grupos', fakeAsync(() => {
      grupoServiceMock.findAll.mockReturnValue(throwError(() => new Error('Grupo error')));
      itemServiceMock.findAllPaged.mockReturnValue(of(CatalogoTestFactory.createPageResponse([])));

      fixture.detectChanges();
      tick();

      expect(loggerServiceMock.error).toHaveBeenCalledWith('Erro ao carregar grupos', expect.any(Error));
    }));

    it('deve logar erro via LoggerService ao falhar ao carregar itens', fakeAsync(() => {
      grupoServiceMock.findAll.mockReturnValue(of([]));
      itemServiceMock.findAllPaged.mockReturnValue(throwError(() => new Error('Item error')));

      fixture.detectChanges();
      tick();

      expect(loggerServiceMock.error).toHaveBeenCalledWith('Erro ao carregar itens', expect.any(Error));
    }));

    it('deve definir erro e parar loading ao falhar ao carregar itens', fakeAsync(() => {
      grupoServiceMock.findAll.mockReturnValue(of([]));
      itemServiceMock.findAllPaged.mockReturnValue(throwError(() => new Error('Item error')));

      fixture.detectChanges();
      tick();

      expect(component['error']()).toBe('Erro ao carregar itens. Tente novamente.');
      expect(component['loading']()).toBe(false);
    }));
  });

  describe('Total de Registros', () => {
    it('deve atualizar totalRecords da resposta do backend', fakeAsync(() => {
      grupoServiceMock.findAll.mockReturnValue(of([]));
      itemServiceMock.findAllPaged.mockReturnValue(of(CatalogoTestFactory.createPageResponse([], 150)));

      fixture.detectChanges();
      tick();

      expect(component['totalRecords']()).toBe(150);
    }));
  });
});
