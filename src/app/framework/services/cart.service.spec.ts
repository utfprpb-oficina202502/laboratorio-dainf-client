import {TestBed} from '@angular/core/testing';
import {CartItem, CartService} from './cart.service';
import {Item} from '../../item/item';

/**
 * Factory para criar itens de teste.
 */
function createTestItem(overrides: Partial<Item> = {}): Item {
  return {
    id: 1,
    nome: 'Multímetro Digital',
    patrimonio: 12345,
    siorg: 0,
    valor: 150,
    qtdeMinima: 1,
    localizacao: 'Armário 3',
    tipoItem: 'C',
    saldo: 10,
    descricao: 'Multímetro para medições',
    grupo: {id: 1, descricao: 'Eletrônica'},
    imageItem: [],
    imagemUrl: undefined,
    disponivelEmprestimoCalculado: 5,
    quantidadeEmprestada: 5,
    ...overrides
  };
}

describe('CartService', () => {
  let service: CartService;

  beforeEach(() => {
    // Limpa sessionStorage antes de cada teste
    sessionStorage.clear();

    TestBed.configureTestingModule({});
    service = TestBed.inject(CartService);
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  describe('estado inicial', () => {
    it('deve iniciar com carrinho vazio', () => {
      expect(service.items()).toEqual([]);
      expect(service.isEmpty()).toBe(true);
      expect(service.hasItems()).toBe(false);
      expect(service.totalItems()).toBe(0);
      expect(service.totalUnits()).toBe(0);
    });
  });

  describe('addItem', () => {
    it('deve adicionar item ao carrinho', () => {
      const item = createTestItem();

      const result = service.addItem(item, 2);

      expect(result).toBe(true);
      expect(service.items().length).toBe(1);
      expect(service.items()[0].item.id).toBe(item.id);
      expect(service.items()[0].qtde).toBe(2);
    });

    it('deve incrementar quantidade se item já existe', () => {
      const item = createTestItem();

      service.addItem(item, 2);
      service.addItem(item, 1);

      expect(service.items().length).toBe(1);
      expect(service.items()[0].qtde).toBe(3);
    });

    it('deve rejeitar quantidade maior que disponível', () => {
      const item = createTestItem({disponivelEmprestimoCalculado: 3});

      const result = service.addItem(item, 5);

      expect(result).toBe(false);
      expect(service.items().length).toBe(0);
    });

    it('deve rejeitar incremento que exceda disponibilidade', () => {
      const item = createTestItem({disponivelEmprestimoCalculado: 3});

      service.addItem(item, 2);
      const result = service.addItem(item, 2); // Total seria 4, excede 3

      expect(result).toBe(false);
      expect(service.items()[0].qtde).toBe(2); // Mantém quantidade anterior
    });

    it('deve rejeitar quantidade zero ou negativa', () => {
      const item = createTestItem();

      expect(service.addItem(item, 0)).toBe(false);
      expect(service.addItem(item, -1)).toBe(false);
      expect(service.items().length).toBe(0);
    });

    it('deve usar quantidade padrão 1 quando não especificada', () => {
      const item = createTestItem();

      service.addItem(item);

      expect(service.items()[0].qtde).toBe(1);
    });
  });

  describe('removeItem', () => {
    it('deve remover item do carrinho', () => {
      const item1 = createTestItem({id: 1});
      const item2 = createTestItem({id: 2, nome: 'Osciloscópio'});

      service.addItem(item1, 2);
      service.addItem(item2, 1);

      service.removeItem(1);

      expect(service.items().length).toBe(1);
      expect(service.items()[0].item.id).toBe(2);
    });

    it('não deve falhar ao remover item inexistente', () => {
      service.removeItem(999);

      expect(service.items().length).toBe(0);
    });
  });

  describe('updateQuantity', () => {
    it('deve atualizar quantidade do item', () => {
      const item = createTestItem();
      service.addItem(item, 2);

      const result = service.updateQuantity(item.id, 4);

      expect(result).toBe(true);
      expect(service.items()[0].qtde).toBe(4);
    });

    it('deve remover item quando quantidade é zero', () => {
      const item = createTestItem();
      service.addItem(item, 2);

      service.updateQuantity(item.id, 0);

      expect(service.items().length).toBe(0);
    });

    it('deve rejeitar quantidade maior que disponível', () => {
      const item = createTestItem({disponivelEmprestimoCalculado: 3});
      service.addItem(item, 2);

      const result = service.updateQuantity(item.id, 5);

      expect(result).toBe(false);
      expect(service.items()[0].qtde).toBe(2);
    });

    it('deve retornar false para item inexistente', () => {
      const result = service.updateQuantity(999, 5);

      expect(result).toBe(false);
    });
  });

  describe('clear', () => {
    it('deve limpar todos os itens', () => {
      const item1 = createTestItem({id: 1});
      const item2 = createTestItem({id: 2});

      service.addItem(item1, 1);
      service.addItem(item2, 2);

      service.clear();

      expect(service.items().length).toBe(0);
      expect(service.isEmpty()).toBe(true);
    });
  });

  describe('getItemQuantity', () => {
    it('deve retornar quantidade do item', () => {
      const item = createTestItem();
      service.addItem(item, 3);

      expect(service.getItemQuantity(item.id)).toBe(3);
    });

    it('deve retornar 0 para item não encontrado', () => {
      expect(service.getItemQuantity(999)).toBe(0);
    });
  });

  describe('isInCart', () => {
    it('deve retornar true se item está no carrinho', () => {
      const item = createTestItem();
      service.addItem(item, 1);

      expect(service.isInCart(item.id)).toBe(true);
    });

    it('deve retornar false se item não está no carrinho', () => {
      expect(service.isInCart(999)).toBe(false);
    });
  });

  describe('getCartItem', () => {
    it('deve retornar CartItem se encontrado', () => {
      const item = createTestItem();
      service.addItem(item, 2);

      const cartItem = service.getCartItem(item.id);

      expect(cartItem).toBeDefined();
      expect(cartItem?.item.id).toBe(item.id);
      expect(cartItem?.qtde).toBe(2);
    });

    it('deve retornar undefined se não encontrado', () => {
      expect(service.getCartItem(999)).toBeUndefined();
    });
  });

  describe('computed signals', () => {
    it('deve calcular totalItems corretamente', () => {
      const item1 = createTestItem({id: 1});
      const item2 = createTestItem({id: 2});
      const item3 = createTestItem({id: 3});

      service.addItem(item1, 1);
      service.addItem(item2, 1);
      service.addItem(item3, 1);

      expect(service.totalItems()).toBe(3);
    });

    it('deve calcular totalUnits corretamente', () => {
      const item1 = createTestItem({id: 1});
      const item2 = createTestItem({id: 2});

      service.addItem(item1, 2);
      service.addItem(item2, 3);

      expect(service.totalUnits()).toBe(5);
    });

    it('deve atualizar isEmpty e hasItems', () => {
      const item = createTestItem();

      expect(service.isEmpty()).toBe(true);
      expect(service.hasItems()).toBe(false);

      service.addItem(item, 1);

      expect(service.isEmpty()).toBe(false);
      expect(service.hasItems()).toBe(true);

      service.clear();

      expect(service.isEmpty()).toBe(true);
      expect(service.hasItems()).toBe(false);
    });
  });

  describe('persistência sessionStorage', () => {
    it('deve carregar carrinho do sessionStorage ao inicializar', () => {
      // Prepara dados no sessionStorage ANTES de criar o serviço
      const cartData: CartItem[] = [{
        item: createTestItem({id: 99, nome: 'Item Persistido'}),
        qtde: 3
      }];
      sessionStorage.setItem('lab-cart', JSON.stringify(cartData));

      // Recria o TestBed para forçar nova instância
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const newService = TestBed.inject(CartService);

      // Valida que o carrinho foi carregado do sessionStorage
      expect(newService.items().length).toBe(1);
      expect(newService.items()[0].item.id).toBe(99);
      expect(newService.items()[0].qtde).toBe(3);
    });
  });
});
