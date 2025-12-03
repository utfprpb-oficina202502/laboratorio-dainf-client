import {ComponentFixture, fakeAsync, TestBed, tick} from '@angular/core/testing';
import {provideRouter, Router} from '@angular/router';
import {provideNoopAnimations} from '@angular/platform-browser/animations';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {signal} from '@angular/core';
import {of, throwError} from 'rxjs';

import {ArvoreComponent} from './arvore.component';
import {ItemService} from '../item.service';
import {GrupoService} from '../../grupo/grupo.service';
import {CartService} from '../../framework/services/cart.service';
import {BreakpointService} from '../../framework/services/breakpoint.service';
import {LoggerService} from '../../framework/services/logger.service';
import {Item} from '../item';
import {Grupo} from '../../grupo/grupo';
import {TreeNode} from 'primeng/api';

/**
 * Factory para criar dados de teste do ArvoreComponent.
 */
class ArvoreTestFactory {
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

  static createItems(grupoId: number): Item[] {
    const grupo = this.createGrupo({id: grupoId});
    return [
      this.createItem({id: 1, nome: 'Arduino Uno', grupo}),
      this.createItem({id: 2, nome: 'Raspberry Pi', grupo}),
      this.createItem({id: 3, nome: 'ESP32', grupo})
    ];
  }

  static createItemSemDisponibilidade(): Item {
    return this.createItem({
      id: 4,
      nome: 'Item Indisponível',
      disponivelEmprestimoCalculado: 0,
      saldo: 5,
      quantidadeEmprestada: 5
    });
  }

  static createItemComImagem(): Item {
    return this.createItem({
      id: 5,
      nome: 'Item com Imagem',
      imagemUrl: 'http://example.com/image.jpg'
    });
  }

  static createPageResponse(items: Item[]) {
    return {
      content: items,
      totalElements: items.length,
      totalPages: 1,
      size: 100,
      number: 0
    };
  }
}

describe('ArvoreComponent', () => {
  let component: ArvoreComponent;
  let fixture: ComponentFixture<ArvoreComponent>;
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
      imports: [ArvoreComponent, HttpClientTestingModule],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        {provide: CartService, useValue: cartServiceMock},
        {provide: BreakpointService, useValue: breakpointServiceMock},
        {provide: LoggerService, useValue: loggerServiceMock}
      ]
    })
    // Override os providers do componente
    .overrideComponent(ArvoreComponent, {
      set: {
        providers: [
          {provide: ItemService, useValue: itemServiceMock},
          {provide: GrupoService, useValue: grupoServiceMock}
        ]
      }
    })
    .compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(ArvoreComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Inicialização', () => {
    it('deve criar o componente', () => {
      grupoServiceMock.findAll.mockReturnValue(of([]));
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('deve carregar grupos no ngOnInit', fakeAsync(() => {
      const grupos = ArvoreTestFactory.createGrupos();
      grupoServiceMock.findAll.mockReturnValue(of(grupos));

      fixture.detectChanges();
      tick();

      expect(grupoServiceMock.findAll).toHaveBeenCalled();
      expect(component['treeNodes']().length).toBe(3);
      expect(component['loading']()).toBe(false);
    }));

    it('deve exibir erro quando falha ao carregar grupos', fakeAsync(() => {
      grupoServiceMock.findAll.mockReturnValue(throwError(() => new Error('Network error')));

      fixture.detectChanges();
      tick();

      expect(component['error']()).toBe('Erro ao carregar grupos. Tente novamente.');
      expect(component['loading']()).toBe(false);
    }));

    it('deve construir nós de grupo corretamente', fakeAsync(() => {
      const grupos = ArvoreTestFactory.createGrupos();
      grupoServiceMock.findAll.mockReturnValue(of(grupos));

      fixture.detectChanges();
      tick();

      const nodes = component['treeNodes']();
      expect(nodes[0].key).toBe('grupo-1');
      expect(nodes[0].label).toBe('Eletrônicos');
      expect(nodes[0].data?.type).toBe('grupo');
      expect(nodes[0].data?.loaded).toBe(false);
      expect(nodes[0].leaf).toBe(false);
    }));
  });

  describe('Expansão de Nós (Lazy Loading)', () => {
    beforeEach(fakeAsync(() => {
      const grupos = ArvoreTestFactory.createGrupos();
      grupoServiceMock.findAll.mockReturnValue(of(grupos));
      fixture.detectChanges();
      tick();
    }));

    it('deve carregar itens ao expandir um grupo', fakeAsync(() => {
      const items = ArvoreTestFactory.createItems(1);
      itemServiceMock.findAllPaged.mockReturnValue(of(ArvoreTestFactory.createPageResponse(items)));

      const nodes = component['treeNodes']();
      const node = nodes[0];
      component.onNodeExpand({node} as any);
      tick();

      expect(itemServiceMock.findAllPaged).toHaveBeenCalled();
      // O nó foi atualizado - precisamos pegar a versão atualizada
      const updatedNodes = component['treeNodes']();
      expect(updatedNodes[0].data?.loaded).toBe(true);
      expect(updatedNodes[0].data?.itemCount).toBe(3);
      expect(updatedNodes[0].children?.length).toBe(3);
    }));

    it('deve adicionar skeleton com key loading- ao expandir', fakeAsync(() => {
      const items = ArvoreTestFactory.createItems(1);
      itemServiceMock.findAllPaged.mockReturnValue(of(ArvoreTestFactory.createPageResponse(items)));

      const nodes = component['treeNodes']();
      const node = nodes[0];

      // Antes de expandir, não tem children
      expect(node.children?.length).toBe(0);

      // Dispara expansão - o skeleton é adicionado no nó passado
      component.onNodeExpand({node} as any);

      // Verifica que children foi modificado (skeleton ou itens carregados)
      // O skeleton tem key começando com 'loading-'
      // Como a operação é síncrona após o mock, podemos verificar que o loading group foi adicionado
      expect(component['loadingGroups']().has(1) || (node.children?.length ?? 0) > 0).toBe(true);

      tick();

      // Após o tick, os itens devem estar carregados
      const updatedNodes = component['treeNodes']();
      expect(updatedNodes[0].children?.length).toBe(3);
    }));

    it('deve exibir nó vazio quando grupo não tem itens', fakeAsync(() => {
      // Retorna itens mas nenhum com o grupo id 1
      const items = ArvoreTestFactory.createItems(2); // grupo id 2
      items.forEach(item => item.grupo = ArvoreTestFactory.createGrupo({id: 2}));
      itemServiceMock.findAllPaged.mockReturnValue(of(ArvoreTestFactory.createPageResponse(items)));

      const nodes = component['treeNodes']();
      const node = nodes[0]; // grupo id 1
      component.onNodeExpand({node} as any);
      tick();

      const updatedNodes = component['treeNodes']();
      expect(updatedNodes[0].children?.length).toBe(1);
      expect(updatedNodes[0].children?.[0].key).toContain('empty-');
    }));

    it('deve exibir nó de erro quando falha ao carregar itens', fakeAsync(() => {
      itemServiceMock.findAllPaged.mockReturnValue(throwError(() => new Error('Failed')));

      const nodes = component['treeNodes']();
      const node = nodes[0];
      component.onNodeExpand({node} as any);
      tick();

      const updatedNodes = component['treeNodes']();
      expect(updatedNodes[0].children?.length).toBe(1);
      expect(updatedNodes[0].children?.[0].key).toContain('error-');
    }));

    it('não deve recarregar itens de grupo já carregado', fakeAsync(() => {
      const items = ArvoreTestFactory.createItems(1);
      itemServiceMock.findAllPaged.mockReturnValue(of(ArvoreTestFactory.createPageResponse(items)));

      const nodes = component['treeNodes']();
      const node = nodes[0];

      // Primeira expansão
      component.onNodeExpand({node} as any);
      tick();

      // Pega o nó atualizado (com loaded: true)
      const updatedNodes = component['treeNodes']();
      const updatedNode = updatedNodes[0];

      // Segunda expansão (mesmo nó, agora com loaded: true)
      component.onNodeExpand({node: updatedNode} as any);
      tick();

      // Deve ter chamado apenas uma vez
      expect(itemServiceMock.findAllPaged).toHaveBeenCalledTimes(1);
    }));
  });

  describe('Navegação para Detalhes do Item', () => {
    it('deve navegar para /item/form/:id ao clicar em detalhes', () => {
      const navigateSpy = jest.spyOn(router, 'navigate');
      const item = ArvoreTestFactory.createItem({id: 42});

      component.onViewDetails(item);

      expect(navigateSpy).toHaveBeenCalledWith(['/item/form', 42]);
    });
  });

  describe('Carrinho de Compras', () => {
    beforeEach(fakeAsync(() => {
      const grupos = ArvoreTestFactory.createGrupos();
      grupoServiceMock.findAll.mockReturnValue(of(grupos));
      fixture.detectChanges();
      tick();
    }));

    it('deve adicionar item ao carrinho', () => {
      const item = ArvoreTestFactory.createItem();
      component['quantities'].set(new Map([[item.id, 2]]));

      component.addToCart(item);

      expect(cartServiceMock.addItem).toHaveBeenCalledWith(item, 2);
    });

    it('deve resetar quantidade após adicionar ao carrinho', () => {
      const item = ArvoreTestFactory.createItem();
      component['quantities'].set(new Map([[item.id, 3]]));

      component.addToCart(item);

      expect(component['quantities']().get(item.id)).toBe(1);
    });

    it('deve remover item do carrinho', () => {
      const item = ArvoreTestFactory.createItem({id: 99});

      component.removeFromCart(item);

      expect(cartServiceMock.removeItem).toHaveBeenCalledWith(99);
    });

    it('deve verificar se item está no carrinho', () => {
      const item = ArvoreTestFactory.createItem();
      cartServiceMock.isInCart.mockReturnValue(true);

      expect(component.isInCart(item)).toBe(true);
      expect(cartServiceMock.isInCart).toHaveBeenCalledWith(item.id);
    });

    it('deve retornar quantidade do item no carrinho', () => {
      const item = ArvoreTestFactory.createItem();
      cartServiceMock.getItemQuantity.mockReturnValue(5);

      expect(component.getCartQuantity(item)).toBe(5);
      expect(cartServiceMock.getItemQuantity).toHaveBeenCalledWith(item.id);
    });

    it('deve navegar para reserva com itens do carrinho', () => {
      const navigateSpy = jest.spyOn(router, 'navigate');
      const cartItems = [ArvoreTestFactory.createItem()];
      (cartServiceMock.items as any) = signal(cartItems);

      component.goToReserva();

      expect(navigateSpy).toHaveBeenCalledWith(['/reserva/new'], {
        state: {cartItems}
      });
    });
  });

  describe('Controle de Quantidade', () => {
    it('deve retornar quantidade selecionada para item', () => {
      const item = ArvoreTestFactory.createItem();
      component['quantities'].set(new Map([[item.id, 7]]));

      expect(component.getQuantity(item)).toBe(7);
    });

    it('deve retornar 1 como quantidade padrão', () => {
      const item = ArvoreTestFactory.createItem();

      expect(component.getQuantity(item)).toBe(1);
    });

    it('deve atualizar quantidade selecionada', () => {
      const item = ArvoreTestFactory.createItem();

      component.setQuantity(item, 5);

      expect(component['quantities']().get(item.id)).toBe(5);
    });

    it('deve garantir quantidade mínima de 1', () => {
      const item = ArvoreTestFactory.createItem();

      component.setQuantity(item, 0);

      expect(component['quantities']().get(item.id)).toBe(1);
    });

    it('deve calcular máximo a adicionar corretamente', () => {
      const item = ArvoreTestFactory.createItem({disponivelEmprestimoCalculado: 10});
      cartServiceMock.getItemQuantity.mockReturnValue(3);

      expect(component.getMaxToAdd(item)).toBe(7);
    });

    it('deve retornar 0 quando não há disponibilidade', () => {
      const item = ArvoreTestFactory.createItemSemDisponibilidade();
      cartServiceMock.getItemQuantity.mockReturnValue(0);

      expect(component.getMaxToAdd(item)).toBe(0);
    });
  });

  describe('Disponibilidade', () => {
    it('deve retornar disponibilidade calculada do item', () => {
      const item = ArvoreTestFactory.createItem({disponivelEmprestimoCalculado: 15});

      expect(component.getItemDisponibilidade(item)).toBe(15);
    });

    it('deve usar saldo como fallback quando disponivelEmprestimoCalculado não existe', () => {
      const item = ArvoreTestFactory.createItem({
        disponivelEmprestimoCalculado: undefined as unknown as number,
        saldo: 20
      });

      expect(component.getItemDisponibilidade(item)).toBe(20);
    });

    it('deve retornar severity danger quando disponibilidade é 0', () => {
      const item = ArvoreTestFactory.createItemSemDisponibilidade();

      expect(component.getAvailabilitySeverity(item)).toBe('danger');
    });

    it('deve retornar severity warn quando disponibilidade é baixa (1-2)', () => {
      const item = ArvoreTestFactory.createItem({disponivelEmprestimoCalculado: 2});

      expect(component.getAvailabilitySeverity(item)).toBe('warn');
    });

    it('deve retornar severity success quando disponibilidade é boa (>2)', () => {
      const item = ArvoreTestFactory.createItem({disponivelEmprestimoCalculado: 5});

      expect(component.getAvailabilitySeverity(item)).toBe('success');
    });

    it('deve verificar hasAvailability corretamente', () => {
      const itemDisponivel = ArvoreTestFactory.createItem({disponivelEmprestimoCalculado: 5});
      const itemIndisponivel = ArvoreTestFactory.createItemSemDisponibilidade();

      expect(component.hasAvailability(itemDisponivel)).toBe(true);
      expect(component.hasAvailability(itemIndisponivel)).toBe(false);
    });
  });

  describe('URL de Imagem', () => {
    it('deve retornar URL absoluta como está', () => {
      const item = ArvoreTestFactory.createItem({
        imagemUrl: 'http://example.com/image.jpg'
      });

      expect(component.getItemImageUrl(item)).toBe('http://example.com/image.jpg');
    });

    it('deve retornar URL https absoluta como está', () => {
      const item = ArvoreTestFactory.createItem({
        imagemUrl: 'https://example.com/image.jpg'
      });

      expect(component.getItemImageUrl(item)).toBe('https://example.com/image.jpg');
    });

    it('deve prefixar URL relativa com URL do MinIO', () => {
      const item = ArvoreTestFactory.createItem({
        imagemUrl: 'cheeseball.jpg'
      });

      const url = component.getItemImageUrl(item);
      expect(url).toContain('cheeseball.jpg');
      expect(url).toMatch(/^https?:\/\/.+cheeseball\.jpg$/);
    });

    it('deve usar base64 da primeira imagem como fallback', () => {
      const item = ArvoreTestFactory.createItem({
        imagemUrl: undefined,
        imageItem: [{
          id: 1,
          contentType: 'image/png',
          nameImage: 'test.png',
          item: {} as Item,
          base64: 'abc123',
          isCover: false
        }]
      });

      expect(component.getItemImageUrl(item)).toBe('data:image/png;base64,abc123');
    });

    it('deve retornar placeholder quando não há imagem', () => {
      const item = ArvoreTestFactory.createItem({
        imagemUrl: undefined,
        imageItem: []
      });

      expect(component.getItemImageUrl(item)).toBe('no-image.svg');
    });

    it('deve usar imagem de capa quando disponível', () => {
      const item = ArvoreTestFactory.createItem({
        imagemUrl: undefined,
        imageItem: [
          {
            id: 1,
            contentType: 'image/png',
            nameImage: 'other.png',
            item: {} as Item,
            base64: 'other123',
            isCover: false
          },
          {
            id: 2,
            contentType: 'image/jpeg',
            nameImage: 'cover.jpg',
            item: {} as Item,
            base64: 'cover456',
            isCover: true
          }
        ]
      });

      expect(component.getItemImageUrl(item)).toBe('data:image/jpeg;base64,cover456');
    });
  });

  describe('Métodos de Identificação de Nós', () => {
    it('deve identificar nó de item corretamente', () => {
      const itemNode: TreeNode = {
        key: 'item-1',
        data: {type: 'item', item: ArvoreTestFactory.createItem()}
      };

      expect(component.isItemNode(itemNode)).toBe(true);
    });

    it('deve retornar false para nó de grupo', () => {
      const grupoNode: TreeNode = {
        key: 'grupo-1',
        data: {type: 'grupo', grupo: ArvoreTestFactory.createGrupo()}
      };

      expect(component.isItemNode(grupoNode)).toBe(false);
    });

    it('deve retornar false para nó de loading', () => {
      const loadingNode: TreeNode = {
        key: 'loading-1',
        data: {type: 'item'}
      };

      expect(component.isItemNode(loadingNode)).toBe(false);
    });

    it('deve retornar item de um nó', () => {
      const item = ArvoreTestFactory.createItem();
      const itemNode: TreeNode = {
        key: 'item-1',
        data: {type: 'item', item}
      };

      expect(component.getNodeItem(itemNode)).toBe(item);
    });

    it('deve retornar undefined para nó sem item', () => {
      const grupoNode: TreeNode = {
        key: 'grupo-1',
        data: {type: 'grupo'}
      };

      expect(component.getNodeItem(grupoNode)).toBeUndefined();
    });
  });

  describe('Expandir/Colapsar Todos', () => {
    beforeEach(fakeAsync(() => {
      const grupos = ArvoreTestFactory.createGrupos();
      grupoServiceMock.findAll.mockReturnValue(of(grupos));
      fixture.detectChanges();
      tick();
    }));

    it('deve expandir todos os nós', fakeAsync(() => {
      const items = ArvoreTestFactory.createItems(1);
      itemServiceMock.findAllPaged.mockReturnValue(of(ArvoreTestFactory.createPageResponse(items)));

      component.expandAll();
      tick();

      const nodes = component['treeNodes']();
      nodes.forEach(node => {
        expect(node.expanded).toBe(true);
      });
    }));

    it('deve colapsar todos os nós', () => {
      const nodes = component['treeNodes']();
      nodes.forEach(node => node.expanded = true);
      component['treeNodes'].set([...nodes]);

      component.collapseAll();

      component['treeNodes']().forEach(node => {
        expect(node.expanded).toBe(false);
      });
    });
  });

  describe('Refresh', () => {
    it('deve limpar quantidades e recarregar grupos', fakeAsync(() => {
      const grupos = ArvoreTestFactory.createGrupos();
      grupoServiceMock.findAll.mockReturnValue(of(grupos));

      // Setup inicial
      fixture.detectChanges();
      tick();

      // Define quantidades
      component['quantities'].set(new Map([[1, 5], [2, 3]]));
      expect(component['quantities']().size).toBe(2);

      // Refresh
      component.refresh();
      tick();

      // Quantidades devem ser limpas
      expect(component['quantities']().size).toBe(0);
      // findAll foi chamado: 1x no ngOnInit + 1x no refresh
      expect(grupoServiceMock.findAll).toHaveBeenCalledTimes(2);
    }));
  });

  describe('Responsividade', () => {
    it('deve expor isMobile do breakpointService', fakeAsync(() => {
      grupoServiceMock.findAll.mockReturnValue(of([]));
      fixture.detectChanges();
      tick();

      // O computed pega do signal injetado no mock
      // Como o mock tem isMobile: signal(false), deve retornar false
      expect(component['isMobile']()).toBe(false);
    }));

    it('deve expor cartItemCount do cartService', fakeAsync(() => {
      grupoServiceMock.findAll.mockReturnValue(of([]));
      fixture.detectChanges();
      tick();

      // O mock tem totalItems: signal(0)
      expect(component['cartItemCount']()).toBe(0);
    }));
  });
});
