import {ComponentFixture, TestBed} from '@angular/core/testing';
import {signal} from '@angular/core';

import {ItemCardComponent} from './item-card.component';
import {CartService} from '../../../../framework/services/cart.service';
import {Item} from '../../../item';
import {Grupo} from '../../../../grupo/grupo';

/**
 * Factory para criar itens de teste.
 */
class ItemTestFactory {
  static createItem(overrides: Partial<Item> = {}): Item {
    const grupo: Grupo = {id: 1, descricao: 'Eletrônicos'};

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
      descricao: 'Placa microcontroladora Arduino Uno R3',
      grupo,
      imageItem: [],
      disponivelEmprestimoCalculado: 8,
      quantidadeEmprestada: 2,
      ...overrides
    } as Item;
  }

  static createItemSemDisponibilidade(): Item {
    return this.createItem({
      id: 2,
      nome: 'Raspberry Pi 4',
      disponivelEmprestimoCalculado: 0,
      saldo: 5,
      quantidadeEmprestada: 5
    });
  }

  static createItemComImagem(): Item {
    return this.createItem({
      id: 3,
      nome: 'Multímetro Digital',
      imagemUrl: 'http://example.com/multimetro.jpg'
    });
  }
}

describe('ItemCardComponent', () => {
  let component: ItemCardComponent;
  let fixture: ComponentFixture<ItemCardComponent>;
  let cartServiceMock: jest.Mocked<CartService>;

  beforeEach(async () => {
    // Mock do CartService com signals
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

    await TestBed.configureTestingModule({
      imports: [ItemCardComponent],
      providers: [
        {provide: CartService, useValue: cartServiceMock}
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ItemCardComponent);
    component = fixture.componentInstance;
  });

  describe('Inicialização', () => {
    it('deve criar o componente', () => {
      fixture.componentRef.setInput('item', ItemTestFactory.createItem());
      fixture.detectChanges();

      expect(component).toBeTruthy();
    });

    it('deve exibir informações do item corretamente', () => {
      const item = ItemTestFactory.createItem();
      fixture.componentRef.setInput('item', item);
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('Arduino Uno');
      expect(compiled.textContent).toContain('Armário A1');
      expect(compiled.textContent).toContain('Eletrônicos');
    });

    it('deve calcular disponibilidade corretamente', () => {
      const item = ItemTestFactory.createItem({disponivelEmprestimoCalculado: 5});
      fixture.componentRef.setInput('item', item);
      fixture.detectChanges();

      expect(component['disponibilidade']()).toBe(5);
    });

    it('deve usar saldo como fallback quando disponivelEmprestimoCalculado não existe', () => {
      const item = ItemTestFactory.createItem({
        disponivelEmprestimoCalculado: undefined as unknown as number,
        saldo: 15
      });
      fixture.componentRef.setInput('item', item);
      fixture.detectChanges();

      expect(component['disponibilidade']()).toBe(15);
    });
  });

  describe('Imagem', () => {
    it('deve usar imagemUrl quando disponível', () => {
      const item = ItemTestFactory.createItemComImagem();
      fixture.componentRef.setInput('item', item);
      fixture.detectChanges();

      expect(component['imageUrl']()).toBe('http://example.com/multimetro.jpg');
    });

    it('deve usar placeholder quando não há imagem', () => {
      const item = ItemTestFactory.createItem({imagemUrl: undefined, imageItem: []});
      fixture.componentRef.setInput('item', item);
      fixture.detectChanges();

      expect(component['imageUrl']()).toBe('no-image.svg');
    });

    it('deve usar base64 da primeira imagem como fallback', () => {
      const item = ItemTestFactory.createItem({
        imagemUrl: undefined,
        imageItem: [
          {
            id: 1,
            contentType: 'image/png',
            nameImage: 'test.png',
            item: {} as Item,
            base64: 'abc123',
            isCover: false
          }
        ]
      });
      fixture.componentRef.setInput('item', item);
      fixture.detectChanges();

      expect(component['imageUrl']()).toBe('data:image/png;base64,abc123');
    });

    it('deve prefixar URL relativa com URL do MinIO', () => {
      const item = ItemTestFactory.createItem({
        imagemUrl: 'cheeseball.jpg',
        imageItem: []
      });
      fixture.componentRef.setInput('item', item);
      fixture.detectChanges();

      // Deve prefixar com a URL do MinIO (do environment)
      expect(component['imageUrl']()).toContain('cheeseball.jpg');
      expect(component['imageUrl']()).toMatch(/^https?:\/\/.+cheeseball\.jpg$/);
    });
  });

  describe('Disponibilidade', () => {
    it('deve retornar severity danger quando disponibilidade é 0', () => {
      const item = ItemTestFactory.createItemSemDisponibilidade();
      fixture.componentRef.setInput('item', item);
      fixture.detectChanges();

      expect(component['availabilitySeverity']()).toBe('danger');
    });

    it('deve retornar severity warn quando disponibilidade é baixa (1-2)', () => {
      const item = ItemTestFactory.createItem({disponivelEmprestimoCalculado: 2});
      fixture.componentRef.setInput('item', item);
      fixture.detectChanges();

      expect(component['availabilitySeverity']()).toBe('warn');
    });

    it('deve retornar severity success quando disponibilidade é boa (>2)', () => {
      const item = ItemTestFactory.createItem({disponivelEmprestimoCalculado: 5});
      fixture.componentRef.setInput('item', item);
      fixture.detectChanges();

      expect(component['availabilitySeverity']()).toBe('success');
    });

    it('deve indicar hasAvailability false quando não há disponibilidade', () => {
      const item = ItemTestFactory.createItemSemDisponibilidade();
      fixture.componentRef.setInput('item', item);
      fixture.detectChanges();

      expect(component['hasAvailability']()).toBe(false);
    });

    it('deve calcular maxToAdd corretamente considerando itens no carrinho', () => {
      cartServiceMock.getItemQuantity.mockReturnValue(3);
      const item = ItemTestFactory.createItem({disponivelEmprestimoCalculado: 10});
      fixture.componentRef.setInput('item', item);
      fixture.detectChanges();

      expect(component['maxToAdd']()).toBe(7);
    });
  });

  describe('Carrinho', () => {
    it('deve adicionar item ao carrinho', () => {
      const item = ItemTestFactory.createItem();
      fixture.componentRef.setInput('item', item);
      fixture.detectChanges();

      component.addToCart();

      expect(cartServiceMock.addItem).toHaveBeenCalledWith(item, 1);
    });

    it('deve adicionar com quantidade selecionada', () => {
      const item = ItemTestFactory.createItem();
      fixture.componentRef.setInput('item', item);
      fixture.detectChanges();

      component['quantidade'].set(3);
      component.addToCart();

      expect(cartServiceMock.addItem).toHaveBeenCalledWith(item, 3);
    });

    it('deve resetar quantidade após adicionar', () => {
      const item = ItemTestFactory.createItem();
      fixture.componentRef.setInput('item', item);
      fixture.detectChanges();

      component['quantidade'].set(5);
      component.addToCart();

      expect(component['quantidade']()).toBe(1);
    });

    it('deve remover item do carrinho', () => {
      const item = ItemTestFactory.createItem({id: 42});
      fixture.componentRef.setInput('item', item);
      fixture.detectChanges();

      component.removeFromCart();

      expect(cartServiceMock.removeItem).toHaveBeenCalledWith(42);
    });

    it('deve verificar se item está no carrinho', () => {
      cartServiceMock.isInCart.mockReturnValue(true);
      const item = ItemTestFactory.createItem();
      fixture.componentRef.setInput('item', item);
      fixture.detectChanges();

      expect(component['isInCart']()).toBe(true);
    });

    it('não deve adicionar quando quantidade excede máximo', () => {
      cartServiceMock.getItemQuantity.mockReturnValue(8);
      const item = ItemTestFactory.createItem({disponivelEmprestimoCalculado: 8});
      fixture.componentRef.setInput('item', item);
      fixture.detectChanges();

      component['quantidade'].set(1);
      component.addToCart();

      expect(cartServiceMock.addItem).not.toHaveBeenCalled();
    });
  });

  describe('Controles de quantidade', () => {
    it('deve incrementar quantidade', () => {
      const item = ItemTestFactory.createItem();
      fixture.componentRef.setInput('item', item);
      fixture.detectChanges();

      expect(component['quantidade']()).toBe(1);
      component.incrementQuantity();
      expect(component['quantidade']()).toBe(2);
    });

    it('deve decrementar quantidade', () => {
      const item = ItemTestFactory.createItem();
      fixture.componentRef.setInput('item', item);
      fixture.detectChanges();

      component['quantidade'].set(3);
      component.decrementQuantity();
      expect(component['quantidade']()).toBe(2);
    });

    it('não deve decrementar abaixo de 1', () => {
      const item = ItemTestFactory.createItem();
      fixture.componentRef.setInput('item', item);
      fixture.detectChanges();

      expect(component['quantidade']()).toBe(1);
      component.decrementQuantity();
      expect(component['quantidade']()).toBe(1);
    });

    it('não deve incrementar acima do máximo disponível', () => {
      const item = ItemTestFactory.createItem({disponivelEmprestimoCalculado: 2});
      fixture.componentRef.setInput('item', item);
      fixture.detectChanges();

      component['quantidade'].set(2);
      component.incrementQuantity();
      expect(component['quantidade']()).toBe(2);
    });
  });

  describe('Eventos', () => {
    it('deve emitir viewDetails ao chamar onViewDetails', () => {
      const item = ItemTestFactory.createItem();
      fixture.componentRef.setInput('item', item);
      fixture.detectChanges();

      const emitSpy = jest.spyOn(component.viewDetails, 'emit');
      component.onViewDetails();

      expect(emitSpy).toHaveBeenCalledWith(item);
    });
  });
});
