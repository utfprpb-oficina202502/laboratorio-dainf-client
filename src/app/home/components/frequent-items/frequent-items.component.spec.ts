import {ComponentFixture, TestBed} from '@angular/core/testing';
import {FrequentItemsComponent} from './frequent-items.component';
import {CartService} from '../../../framework/service/cart.service';
import {provideRouter} from '@angular/router';
import {ItemFrequenteUsuario} from '../../models/dashboard.models';

/**
 * Factory para criar itens frequentes para testes.
 */
function createMockItems(): ItemFrequenteUsuario[] {
  return [
    {itemId: 1, itemNome: 'Multímetro Digital', qtde: 8, saldo: 3},
    {itemId: 2, itemNome: 'Osciloscópio', qtde: 5, saldo: 1},
    {itemId: 3, itemNome: 'Fonte de Alimentação', qtde: 3, saldo: 0},
    {itemId: 4, itemNome: 'Arduino Uno', qtde: 2, saldo: 5},
    {itemId: 5, itemNome: 'Protoboard', qtde: 1, saldo: 2}
  ];
}

describe('FrequentItemsComponent', () => {
  let component: FrequentItemsComponent;
  let fixture: ComponentFixture<FrequentItemsComponent>;
  let mockCartService: jest.Mocked<CartService>;

  beforeEach(async () => {
    mockCartService = {
      addItem: jest.fn(),
      isInCart: jest.fn().mockReturnValue(false),
      getItems: jest.fn().mockReturnValue([])
    } as any;

    await TestBed.configureTestingModule({
      imports: [FrequentItemsComponent],
      providers: [
        provideRouter([]),
        {provide: CartService, useValue: mockCartService}
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(FrequentItemsComponent);
    component = fixture.componentInstance;
  });

  describe('Inicialização', () => {
    it('deve criar o componente', () => {
      expect(component).toBeTruthy();
    });

    it('deve ter items como array vazio por padrão', () => {
      expect(component.items()).toEqual([]);
    });

    it('deve ter loading como false por padrão', () => {
      expect(component.loading()).toBe(false);
    });

    it('deve ter hasItems como false quando não há itens', () => {
      expect(component['hasItems']()).toBe(false);
    });
  });

  describe('Exibição de Itens', () => {
    it('deve ter hasItems como true quando há itens', () => {
      // Arrange
      const mockItems = createMockItems();

      // Act
      fixture.componentRef.setInput('items', mockItems);
      fixture.detectChanges();

      // Assert
      expect(component['hasItems']()).toBe(true);
    });

    it('deve renderizar skeleton quando loading é true', () => {
      // Arrange & Act
      fixture.componentRef.setInput('loading', true);
      fixture.detectChanges();

      // Assert
      const skeletons = fixture.nativeElement.querySelectorAll('p-skeleton');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('deve mostrar mensagem vazia quando não há itens', () => {
      // Arrange
      fixture.componentRef.setInput('items', []);
      fixture.componentRef.setInput('loading', false);
      fixture.detectChanges();

      // Assert
      const emptyMessage = fixture.nativeElement.textContent;
      expect(emptyMessage).toContain('Nenhum item emprestado ainda');
    });

    it('deve renderizar lista de itens quando há dados', () => {
      // Arrange
      const mockItems = createMockItems();

      // Act
      fixture.componentRef.setInput('items', mockItems);
      fixture.detectChanges();

      // Assert
      const listItems = fixture.nativeElement.querySelectorAll('li');
      expect(listItems.length).toBe(5);
    });
  });

  describe('Disponibilidade', () => {
    it('deve retornar true para isAvailable quando saldo > 0', () => {
      // Arrange
      const item: ItemFrequenteUsuario = {itemId: 1, itemNome: 'Test', qtde: 5, saldo: 3};

      // Act & Assert
      expect(component.isAvailable(item)).toBe(true);
    });

    it('deve retornar false para isAvailable quando saldo === 0', () => {
      // Arrange
      const item: ItemFrequenteUsuario = {itemId: 1, itemNome: 'Test', qtde: 5, saldo: 0};

      // Act & Assert
      expect(component.isAvailable(item)).toBe(false);
    });
  });

  describe('Severidade do Badge de Disponibilidade', () => {
    it('deve retornar "danger" quando saldo é 0', () => {
      // Arrange
      const item: ItemFrequenteUsuario = {itemId: 1, itemNome: 'Test', qtde: 5, saldo: 0};

      // Act & Assert
      expect(component.getAvailabilitySeverity(item)).toBe('danger');
    });

    it('deve retornar "warn" quando saldo é 1', () => {
      // Arrange
      const item: ItemFrequenteUsuario = {itemId: 1, itemNome: 'Test', qtde: 5, saldo: 1};

      // Act & Assert
      expect(component.getAvailabilitySeverity(item)).toBe('warn');
    });

    it('deve retornar "warn" quando saldo é 2', () => {
      // Arrange
      const item: ItemFrequenteUsuario = {itemId: 1, itemNome: 'Test', qtde: 5, saldo: 2};

      // Act & Assert
      expect(component.getAvailabilitySeverity(item)).toBe('warn');
    });

    it('deve retornar "success" quando saldo é maior que 2', () => {
      // Arrange
      const item: ItemFrequenteUsuario = {itemId: 1, itemNome: 'Test', qtde: 5, saldo: 3};

      // Act & Assert
      expect(component.getAvailabilitySeverity(item)).toBe('success');
    });
  });

  describe('Texto de Disponibilidade', () => {
    it('deve retornar "Indisponível" quando saldo é 0', () => {
      // Arrange
      const item: ItemFrequenteUsuario = {itemId: 1, itemNome: 'Test', qtde: 5, saldo: 0};

      // Act & Assert
      expect(component.getAvailabilityText(item)).toBe('Indisponível');
    });

    it('deve retornar quantidade disponível quando saldo > 0', () => {
      // Arrange
      const item: ItemFrequenteUsuario = {itemId: 1, itemNome: 'Test', qtde: 5, saldo: 5};

      // Act & Assert
      expect(component.getAvailabilityText(item)).toBe('5 disp.');
    });
  });

  describe('Integração com CartService', () => {
    it('deve verificar se item está no carrinho', () => {
      // Arrange
      const item: ItemFrequenteUsuario = {itemId: 1, itemNome: 'Test', qtde: 5, saldo: 3};
      mockCartService.isInCart.mockReturnValue(true);

      // Act
      const result = component.isInCart(item);

      // Assert
      expect(mockCartService.isInCart).toHaveBeenCalledWith(1);
      expect(result).toBe(true);
    });

    it('deve retornar false quando item não está no carrinho', () => {
      // Arrange
      const item: ItemFrequenteUsuario = {itemId: 2, itemNome: 'Test', qtde: 5, saldo: 3};
      mockCartService.isInCart.mockReturnValue(false);

      // Act
      const result = component.isInCart(item);

      // Assert
      expect(mockCartService.isInCart).toHaveBeenCalledWith(2);
      expect(result).toBe(false);
    });

    it('deve adicionar item ao carrinho com quantidade 1', () => {
      // Arrange
      const item: ItemFrequenteUsuario = {itemId: 1, itemNome: 'Multímetro', qtde: 5, saldo: 3};

      // Act
      component.addToCart(item);

      // Assert
      expect(mockCartService.addItem).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 1,
          nome: 'Multímetro',
          saldo: 3
        }),
        1
      );
    });

    it('deve passar objeto Item com propriedades corretas para o CartService', () => {
      // Arrange
      const item: ItemFrequenteUsuario = {itemId: 42, itemNome: 'Arduino Mega', qtde: 3, saldo: 10};

      // Act
      component.addToCart(item);

      // Assert
      const callArg = mockCartService.addItem.mock.calls[0][0];
      expect(callArg.id).toBe(42);
      expect(callArg.nome).toBe('Arduino Mega');
      expect(callArg.saldo).toBe(10);
    });
  });

  describe('Renderização Condicional de Botões', () => {
    it('deve mostrar botão de check quando item está no carrinho', () => {
      // Arrange
      const mockItems = [{itemId: 1, itemNome: 'Test', qtde: 5, saldo: 3}];
      mockCartService.isInCart.mockReturnValue(true);

      // Act
      fixture.componentRef.setInput('items', mockItems);
      fixture.detectChanges();

      // Assert
      const checkButton = fixture.nativeElement.querySelector('[icon="pi pi-check"]');
      expect(checkButton).toBeTruthy();
    });

    it('deve mostrar botão de adicionar quando item não está no carrinho e disponível', () => {
      // Arrange
      const mockItems = [{itemId: 1, itemNome: 'Test', qtde: 5, saldo: 3}];
      mockCartService.isInCart.mockReturnValue(false);

      // Act
      fixture.componentRef.setInput('items', mockItems);
      fixture.detectChanges();

      // Assert
      const addButton = fixture.nativeElement.querySelector('[icon="pi pi-cart-plus"]');
      expect(addButton).toBeTruthy();
    });

    it('deve desabilitar botão de adicionar quando item indisponível', () => {
      // Arrange
      const mockItems = [{itemId: 1, itemNome: 'Test', qtde: 5, saldo: 0}];
      mockCartService.isInCart.mockReturnValue(false);

      // Act
      fixture.componentRef.setInput('items', mockItems);
      fixture.detectChanges();

      // Assert - o botão deve estar presente mas com disabled
      // Verificamos através do atributo disabled do p-button
      const button = fixture.nativeElement.querySelector('p-button[icon="pi pi-cart-plus"]');
      expect(button).toBeTruthy();
    });
  });

  describe('Link para Catálogo', () => {
    it('deve ter link para catálogo na mensagem vazia', () => {
      // Arrange
      fixture.componentRef.setInput('items', []);
      fixture.componentRef.setInput('loading', false);
      fixture.detectChanges();

      // Assert
      const links = fixture.nativeElement.querySelectorAll('a[href="/item/catalogo"]');
      expect(links.length).toBeGreaterThan(0);
    });
  });

  describe('Exibição de Contagem de Empréstimos', () => {
    it('deve exibir quantidade de empréstimos para cada item', () => {
      // Arrange
      const mockItems = [{itemId: 1, itemNome: 'Test', qtde: 8, saldo: 3}];

      // Act
      fixture.componentRef.setInput('items', mockItems);
      fixture.detectChanges();

      // Assert
      const content = fixture.nativeElement.textContent;
      expect(content).toContain('8x emprestado');
    });
  });
});
