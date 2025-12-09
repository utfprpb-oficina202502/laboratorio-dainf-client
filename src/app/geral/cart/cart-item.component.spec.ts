import {ComponentFixture, TestBed} from '@angular/core/testing';
import {CartItemComponent} from './cart-item.component';
import {CartItem} from '../../framework/service/cart.service';
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

/**
 * Factory para criar CartItem de teste.
 */
function createCartItem(itemOverrides: Partial<Item> = {}, qtde = 2): CartItem {
  return {
    item: createTestItem(itemOverrides),
    qtde
  };
}

describe('CartItemComponent', () => {
  let component: CartItemComponent;
  let fixture: ComponentFixture<CartItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CartItemComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(CartItemComponent);
    component = fixture.componentInstance;
  });

  describe('maxQuantity', () => {
    it('deve retornar disponivelEmprestimoCalculado quando definido', () => {
      const cartItem = createCartItem({disponivelEmprestimoCalculado: 5});
      fixture.componentRef.setInput('cartItem', cartItem);
      fixture.detectChanges();

      expect(component['maxQuantity']()).toBe(5);
    });

    it('deve usar saldo como fallback quando disponivelEmprestimoCalculado é undefined', () => {
      const cartItem = createCartItem({
        disponivelEmprestimoCalculado: undefined as unknown as number,
        saldo: 8
      });
      fixture.componentRef.setInput('cartItem', cartItem);
      fixture.detectChanges();

      expect(component['maxQuantity']()).toBe(8);
    });

    it('deve retornar 0 quando disponivelEmprestimoCalculado e saldo são undefined', () => {
      const cartItem = createCartItem({
        disponivelEmprestimoCalculado: undefined as unknown as number,
        saldo: undefined as unknown as number
      }, 1);
      fixture.componentRef.setInput('cartItem', cartItem);
      fixture.detectChanges();

      expect(component['maxQuantity']()).toBe(0);
    });

    it('deve retornar 0 quando disponivelEmprestimoCalculado é 0', () => {
      const cartItem = createCartItem({disponivelEmprestimoCalculado: 0, saldo: 10});
      fixture.componentRef.setInput('cartItem', cartItem);
      fixture.detectChanges();

      expect(component['maxQuantity']()).toBe(0);
    });
  });

  describe('isUnavailable', () => {
    it('deve retornar true quando disponibilidade é 0', () => {
      const cartItem = createCartItem({disponivelEmprestimoCalculado: 0}, 1);
      fixture.componentRef.setInput('cartItem', cartItem);
      fixture.detectChanges();

      expect(component['isUnavailable']()).toBe(true);
    });

    it('deve retornar false quando há disponibilidade', () => {
      const cartItem = createCartItem({disponivelEmprestimoCalculado: 5});
      fixture.componentRef.setInput('cartItem', cartItem);
      fixture.detectChanges();

      expect(component['isUnavailable']()).toBe(false);
    });

    it('deve usar saldo como fallback para verificar disponibilidade', () => {
      const cartItem = createCartItem({
        disponivelEmprestimoCalculado: undefined as unknown as number,
        saldo: 5
      });
      fixture.componentRef.setInput('cartItem', cartItem);
      fixture.detectChanges();

      expect(component['isUnavailable']()).toBe(false);
    });

    it('deve retornar true quando saldo é 0 e disponivelEmprestimoCalculado é undefined', () => {
      const cartItem = createCartItem({
        disponivelEmprestimoCalculado: undefined as unknown as number,
        saldo: 0
      }, 1);
      fixture.componentRef.setInput('cartItem', cartItem);
      fixture.detectChanges();

      expect(component['isUnavailable']()).toBe(true);
    });
  });

  describe('imageUrl', () => {
    it('deve retornar imagemUrl quando definida', () => {
      const cartItem = createCartItem({imagemUrl: 'http://example.com/image.jpg'});
      fixture.componentRef.setInput('cartItem', cartItem);
      fixture.detectChanges();

      expect(component['imageUrl']()).toBe('http://example.com/image.jpg');
    });

    it('deve retornar fallback quando imagemUrl não está definida', () => {
      const cartItem = createCartItem({imagemUrl: undefined});
      fixture.componentRef.setInput('cartItem', cartItem);
      fixture.detectChanges();

      expect(component['imageUrl']()).toBe('assets/no-image.svg');
    });
  });

  describe('increment', () => {
    it('deve emitir quantityChange quando current < max', () => {
      const cartItem = createCartItem({disponivelEmprestimoCalculado: 5}, 2);
      fixture.componentRef.setInput('cartItem', cartItem);
      fixture.detectChanges();

      const emitSpy = jest.spyOn(component.quantityChange, 'emit');
      component.increment();

      expect(emitSpy).toHaveBeenCalledWith({itemId: 1, qtde: 3});
    });

    it('não deve emitir quando current >= max', () => {
      const cartItem = createCartItem({disponivelEmprestimoCalculado: 2}, 2);
      fixture.componentRef.setInput('cartItem', cartItem);
      fixture.detectChanges();

      const emitSpy = jest.spyOn(component.quantityChange, 'emit');
      component.increment();

      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('deve permitir incremento usando saldo como fallback', () => {
      const cartItem = createCartItem({
        disponivelEmprestimoCalculado: undefined as unknown as number,
        saldo: 5
      }, 2);
      fixture.componentRef.setInput('cartItem', cartItem);
      fixture.detectChanges();

      const emitSpy = jest.spyOn(component.quantityChange, 'emit');
      component.increment();

      expect(emitSpy).toHaveBeenCalledWith({itemId: 1, qtde: 3});
    });

    it('não deve permitir incremento quando saldo é atingido', () => {
      const cartItem = createCartItem({
        disponivelEmprestimoCalculado: undefined as unknown as number,
        saldo: 2
      }, 2);
      fixture.componentRef.setInput('cartItem', cartItem);
      fixture.detectChanges();

      const emitSpy = jest.spyOn(component.quantityChange, 'emit');
      component.increment();

      expect(emitSpy).not.toHaveBeenCalled();
    });
  });

  describe('decrement', () => {
    it('deve emitir quantityChange quando qtde > 1', () => {
      const cartItem = createCartItem({}, 3);
      fixture.componentRef.setInput('cartItem', cartItem);
      fixture.detectChanges();

      const emitSpy = jest.spyOn(component.quantityChange, 'emit');
      component.decrement();

      expect(emitSpy).toHaveBeenCalledWith({itemId: 1, qtde: 2});
    });

    it('deve emitir remove quando qtde = 1', () => {
      const cartItem = createCartItem({}, 1);
      fixture.componentRef.setInput('cartItem', cartItem);
      fixture.detectChanges();

      const removeSpy = jest.spyOn(component.remove, 'emit');
      component.decrement();

      expect(removeSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('onQuantityChange', () => {
    it('deve emitir remove quando valor é null', () => {
      const cartItem = createCartItem({}, 2);
      fixture.componentRef.setInput('cartItem', cartItem);
      fixture.detectChanges();

      const removeSpy = jest.spyOn(component.remove, 'emit');
      component.onQuantityChange(null);

      expect(removeSpy).toHaveBeenCalledWith(1);
    });

    it('deve emitir remove quando valor é 0', () => {
      const cartItem = createCartItem({}, 2);
      fixture.componentRef.setInput('cartItem', cartItem);
      fixture.detectChanges();

      const removeSpy = jest.spyOn(component.remove, 'emit');
      component.onQuantityChange(0);

      expect(removeSpy).toHaveBeenCalledWith(1);
    });

    it('deve emitir remove quando valor é negativo', () => {
      const cartItem = createCartItem({}, 2);
      fixture.componentRef.setInput('cartItem', cartItem);
      fixture.detectChanges();

      const removeSpy = jest.spyOn(component.remove, 'emit');
      component.onQuantityChange(-1);

      expect(removeSpy).toHaveBeenCalledWith(1);
    });

    it('deve emitir quantityChange quando valor é positivo', () => {
      const cartItem = createCartItem({}, 2);
      fixture.componentRef.setInput('cartItem', cartItem);
      fixture.detectChanges();

      const emitSpy = jest.spyOn(component.quantityChange, 'emit');
      component.onQuantityChange(5);

      expect(emitSpy).toHaveBeenCalledWith({itemId: 1, qtde: 5});
    });
  });

  describe('onRemove', () => {
    it('deve emitir remove com o id do item', () => {
      const cartItem = createCartItem({id: 42}, 2);
      fixture.componentRef.setInput('cartItem', cartItem);
      fixture.detectChanges();

      const removeSpy = jest.spyOn(component.remove, 'emit');
      component.onRemove();

      expect(removeSpy).toHaveBeenCalledWith(42);
    });
  });
});
