import {TestBed} from '@angular/core/testing';
import {FormBuilder, ReactiveFormsModule} from '@angular/forms';
import {provideRouter} from '@angular/router';
import {MessageService} from 'primeng/api';
import {of} from 'rxjs';
import {ReservaFormComponent} from './reserva.form.component';
import {ReservaService} from './reserva.service';
import {ItemService} from '../item/item.service';
import {LoaderService} from '../framework/loader/loader.service';
import {LoginService} from '../login/login.service';
import {LoggerService} from '../framework/service/logger.service';
import {FormBusinessRulesService} from '../framework/service/form-business-rules.service';
import {CartService} from '../framework/service/cart.service';
import {Reserva} from './reserva';
import {ReservaItem} from './reservaItem';
import {Item} from '../item/item';

describe('ReservaFormComponent', () => {
  let component: any;
  let fixture: any;
  let itemService: jest.Mocked<ItemService>;
  let formBusinessRulesService: jest.Mocked<FormBusinessRulesService>;
  let reservaService: jest.Mocked<ReservaService>;
  let cartService: jest.Mocked<CartService>;

  beforeEach(() => {
    sessionStorage.clear();

    const messageServiceMock = {
      add: jest.fn()
    } as any;

    const itemServiceMock = {
      completeItem: jest.fn().mockReturnValue(of([])),
      findAllImagesItem: jest.fn().mockReturnValue(of([]))
    } as any;

    const loginServiceMock = {
      userLoggedIsAlunoOrProfessor: jest.fn().mockResolvedValue(false),
      getCurrentUser: jest.fn().mockReturnValue(of(null))
    } as any;

    const cartServiceMock = {
      clear: jest.fn()
    } as any;

    const formBusinessRulesServiceMock = {
      validateItemSaldo: jest.fn().mockReturnValue(true),
      showItemRequiredMessage: jest.fn(),
      showMinimumItemsMessage: jest.fn(),
      setTodayAsDefaultDate: jest.fn(),
      setCurrentUserAsResponsible: jest.fn(),
      removeItemById: jest.fn((items, id, field) => items.filter((item: any) => {
        const fieldParts = field.split('.');
        let value = item;
        for (const part of fieldParts) {
          value = value?.[part];
        }
        return value !== id;
      })),
      calculateTotalQuantity: jest.fn((items) => items.reduce((sum: number, item: any) => sum + (item.qtde || 0), 0))
    } as any;

    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, ReservaFormComponent],
      providers: [
        provideRouter([]),
        FormBuilder,
        {provide: MessageService, useValue: messageServiceMock},
        {provide: ReservaService, useValue: {save: jest.fn()}},
        {provide: ItemService, useValue: itemServiceMock},
        {provide: LoaderService, useValue: {show: jest.fn(), hide: jest.fn()}},
        {provide: LoginService, useValue: loginServiceMock},
        {provide: LoggerService, useValue: {error: jest.fn(), warn: jest.fn()}},
        {provide: FormBusinessRulesService, useValue: formBusinessRulesServiceMock},
        {provide: CartService, useValue: cartServiceMock}
      ]
    });

    itemService = TestBed.inject(ItemService) as jest.Mocked<ItemService>;
    formBusinessRulesService = TestBed.inject(FormBusinessRulesService) as jest.Mocked<FormBusinessRulesService>;
    reservaService = TestBed.inject(ReservaService) as jest.Mocked<ReservaService>;
    cartService = TestBed.inject(CartService) as jest.Mocked<CartService>;
    fixture = TestBed.createComponent(ReservaFormComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  describe('Component Initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should build form with correct controls', () => {
      component.ngOnInit();
      const formGroup = component.form();

      expect(formGroup).toBeTruthy();
      expect(formGroup?.get('id')).toBeTruthy();
      expect(formGroup?.get('descricao')).toBeTruthy();
      expect(formGroup?.get('usuario')).toBeTruthy();
      expect(formGroup?.get('dataReserva')).toBeTruthy();
      expect(formGroup?.get('dataRetirada')).toBeTruthy();
      expect(formGroup?.get('observacao')).toBeTruthy();
    });

    it('should initialize with empty reservaItems', () => {
      expect(component.reservaItems()).toEqual([]);
    });

    it('should initialize tempQtde with 1', () => {
      expect(component.tempQtde()).toBe(1);
    });
  });

  describe('findProdutos', () => {
    it('should call itemService.completeItem with correct parameters', () => {
      const event = {query: 'test'};
      const mockItems: Item[] = [{id: 1, nome: 'Item 1'} as Item];

      itemService.completeItem.mockReturnValue(of(mockItems));

      component.findProdutos(event);

      expect(itemService.completeItem).toHaveBeenCalledWith('test', true);
      expect(component.itemList()).toEqual(mockItems);
    });

    it('should update itemList signal with results', () => {
      const event = {query: 'mouse'};
      const mockItems: Item[] = [
        {id: 1, nome: 'Mouse USB'} as Item,
        {id: 2, nome: 'Mouse Wireless'} as Item
      ];

      itemService.completeItem.mockReturnValue(of(mockItems));

      component.findProdutos(event);

      expect(component.itemList()).toEqual(mockItems);
    });
  });

  describe('setQtdeDefaultItem', () => {
    it('should set tempQtde to 1', () => {
      component.tempQtde.set(5);

      component.setQtdeDefaultItem();

      expect(component.tempQtde()).toBe(1);
    });
  });

  describe('insertItem', () => {
    it('should show error when item is null', () => {
      component.tempItem.set(null);
      component.tempQtde.set(2);

      component.insertItem();

      expect(formBusinessRulesService.showItemRequiredMessage).toHaveBeenCalled();
      expect(component.reservaItems()).toEqual([]);
    });

    it('should show error when qtde is 0', () => {
      const mockItem: Item = {id: 1, nome: 'Item 1', saldo: 10} as Item;
      component.tempItem.set(mockItem);
      component.tempQtde.set(0);

      component.insertItem();

      expect(formBusinessRulesService.showItemRequiredMessage).toHaveBeenCalled();
    });

    it('should not insert item when validateItemSaldo returns false', () => {
      const mockItem: Item = {id: 1, nome: 'Item 1', saldo: 5} as Item;
      component.tempItem.set(mockItem);
      component.tempQtde.set(10);

      formBusinessRulesService.validateItemSaldo.mockReturnValue(false);

      component.insertItem();

      expect(formBusinessRulesService.validateItemSaldo).toHaveBeenCalledWith(mockItem, 10);
      expect(component.reservaItems()).toEqual([]);
    });

    it('should insert new item when valid', () => {
      const mockItem: Item = {id: 1, nome: 'Item 1', saldo: 10} as Item;
      component.tempItem.set(mockItem);
      component.tempQtde.set(3);

      formBusinessRulesService.validateItemSaldo.mockReturnValue(true);

      component.insertItem();

      const items = component.reservaItems();
      expect(items.length).toBe(1);
      expect(items[0].item).toEqual(mockItem);
      expect(items[0].qtde).toBe(3);
    });

    it('should increment quantity when adding existing item', () => {
      const mockItem: Item = {id: 1, nome: 'Item 1', saldo: 10} as Item;
      const existingReservaItem = new ReservaItem();
      existingReservaItem.item = mockItem;
      existingReservaItem.qtde = 2;

      component.reservaItems.set([existingReservaItem]);
      component.tempItem.set(mockItem);
      component.tempQtde.set(3);

      formBusinessRulesService.validateItemSaldo.mockReturnValue(true);

      component.insertItem();

      const items = component.reservaItems();
      expect(items.length).toBe(1);
      expect(items[0].qtde).toBe(5);
    });

    it('should not increment when validation fails for total quantity', () => {
      const mockItem: Item = {id: 1, nome: 'Item 1', saldo: 10} as Item;
      const existingReservaItem = new ReservaItem();
      existingReservaItem.item = mockItem;
      existingReservaItem.qtde = 8;

      component.reservaItems.set([existingReservaItem]);
      component.tempItem.set(mockItem);
      component.tempQtde.set(5);

      formBusinessRulesService.validateItemSaldo.mockReturnValueOnce(true).mockReturnValueOnce(false);

      component.insertItem();

      const items = component.reservaItems();
      expect(items.length).toBe(1);
      expect(items[0].qtde).toBe(8); // Should remain unchanged
    });

    it('should reset temp values after successful insert', () => {
      const mockItem: Item = {id: 1, nome: 'Item 1', saldo: 10} as Item;
      component.tempItem.set(mockItem);
      component.tempQtde.set(3);

      formBusinessRulesService.validateItemSaldo.mockReturnValue(true);

      component.insertItem();

      expect(component.tempItem()).toBeNull();
      expect(component.tempQtde()).toBe(1);
    });
  });

  describe('removeItem', () => {
    it('should remove item by id', () => {
      const mockItem1: Item = {id: 1, nome: 'Item 1'} as Item;
      const mockItem2: Item = {id: 2, nome: 'Item 2'} as Item;

      const reservaItem1 = new ReservaItem();
      reservaItem1.item = mockItem1;
      reservaItem1.qtde = 2;

      const reservaItem2 = new ReservaItem();
      reservaItem2.item = mockItem2;
      reservaItem2.qtde = 3;

      component.reservaItems.set([reservaItem1, reservaItem2]);

      component.removeItem(1);

      const items = component.reservaItems();
      expect(items.length).toBe(1);
      expect(items[0].item.id).toBe(2);
    });

    it('should handle removing non-existent item', () => {
      const mockItem: Item = {id: 1, nome: 'Item 1'} as Item;
      const reservaItem = new ReservaItem();
      reservaItem.item = mockItem;
      reservaItem.qtde = 2;

      component.reservaItems.set([reservaItem]);

      component.removeItem(999);

      expect(component.reservaItems().length).toBe(1);
    });
  });

  describe('showDialogImagens', () => {
    it('should not show dialog when tempItem is null', () => {
      component.tempItem.set(null);

      component.showDialogImagens();

      expect(itemService.findAllImagesItem).not.toHaveBeenCalled();
    });

    it('should show dialog when images exist', () => {
      const mockItem: Item = {id: 1, nome: 'Item 1'} as Item;
      component.tempItem.set(mockItem);

      const mockImages = [{id: 1, nameImage: 'test.jpg'} as any];
      itemService.findAllImagesItem.mockReturnValue(of(mockImages));

      component.showDialogImagens();

      expect(itemService.findAllImagesItem).toHaveBeenCalledWith(1);
      expect(component.images()).toEqual(mockImages);
      expect(component.dialogImagens()).toBe(true);
    });

    it('should show info message when no images', () => {
      const mockItem: Item = {id: 1, nome: 'Item 1'} as Item;
      const messageService = TestBed.inject(MessageService);
      component.tempItem.set(mockItem);

      itemService.findAllImagesItem.mockReturnValue(of([]));

      component.showDialogImagens();

      expect(messageService.add).toHaveBeenCalledWith(expect.objectContaining({
        severity: 'info',
        summary: 'Ops...'
      }));
      expect(component.dialogImagens()).toBe(false);
    });

    it('should handle error when loading images', () => {
      const mockItem: Item = {id: 1, nome: 'Item 1'} as Item;
      const loaderService = TestBed.inject(LoaderService);
      component.tempItem.set(mockItem);

      itemService.findAllImagesItem.mockReturnValue({
        subscribe: (callbacks: any) => {
          callbacks.error(new Error('Network error'));
          return {unsubscribe: jest.fn()};
        }
      } as any);

      component.showDialogImagens();

      expect(loaderService.hide).toHaveBeenCalled();
    });
  });

  describe('save', () => {
    it('should show error when no items added', () => {
      component.reservaItems.set([]);

      component.save();

      expect(component.validExtra).toBe(false);
      expect(formBusinessRulesService.showMinimumItemsMessage).toHaveBeenCalled();
    });

    it('should set validExtra to true when items exist', () => {
      const mockItem: Item = {id: 1, nome: 'Item 1'} as Item;
      const reservaItem = new ReservaItem();
      reservaItem.item = mockItem;
      reservaItem.qtde = 2;

      component.reservaItems.set([reservaItem]);

      // Mock the service save to prevent actual HTTP call
      reservaService.save.mockReturnValue(of({id: 1} as Reserva));

      // Spy on the parent save implementation to verify it's called
      const superSaveSpy = jest.spyOn(Object.getPrototypeOf(Object.getPrototypeOf(component)), 'save');

      component.save();

      expect(component.validExtra).toBe(true);
      expect(formBusinessRulesService.showMinimumItemsMessage).not.toHaveBeenCalled();
      expect(superSaveSpy).toHaveBeenCalled();
    });
  });

  describe('patchFormWithObject', () => {
    it('should patch form with reserva data', () => {
      component.ngOnInit();

      const mockReserva: Reserva = {
        id: 1,
        descricao: 'Test Reserva',
        usuario: {id: 1, nome: 'User'} as any,
        dataReserva: '01/01/2024',
        dataRetirada: '15/01/2024',
        observacao: 'Test observation',
        reservaItem: []
      } as Reserva;

      component.patchFormWithObject(mockReserva);

      const formGroup = component.form();
      expect(formGroup?.get('id')?.value).toBe(1);
      expect(formGroup?.get('descricao')?.value).toBe('Test Reserva');
      expect(formGroup?.get('dataReserva')?.value).toBe('01/01/2024');
      expect(formGroup?.get('dataRetirada')?.value).toBe('15/01/2024');
      expect(formGroup?.get('observacao')?.value).toBe('Test observation');
    });

    it('should set reservaItems from object', () => {
      component.ngOnInit();

      const mockItem: Item = {id: 1, nome: 'Item 1'} as Item;
      const reservaItem = new ReservaItem();
      reservaItem.item = mockItem;
      reservaItem.qtde = 3;

      const mockReserva: Reserva = {
        id: 1,
        descricao: 'Test',
        reservaItem: [reservaItem]
      } as Reserva;

      component.patchFormWithObject(mockReserva);

      expect(component.reservaItems().length).toBe(1);
      expect(component.reservaItems()[0].item.id).toBe(1);
      expect(component.reservaItems()[0].qtde).toBe(3);
    });
  });

  describe('prepareFormValue', () => {
    it('should include reservaItems in form value', () => {
      component.ngOnInit();

      const mockItem: Item = {id: 1, nome: 'Item 1'} as Item;
      const reservaItem = new ReservaItem();
      reservaItem.item = mockItem;
      reservaItem.qtde = 2;

      component.reservaItems.set([reservaItem]);

      const formValue = {descricao: 'Test'};
      const prepared = component.prepareFormValue(formValue);

      expect(prepared.reservaItem).toEqual([reservaItem]);
    });

    it('should include id when editing', () => {
      component.ngOnInit();
      const formGroup = component.form();
      formGroup?.patchValue({id: 5});

      const formValue = {descricao: 'Test'};
      const prepared = component.prepareFormValue(formValue);

      expect(prepared.id).toBe(5);
    });

    it('should include usuario', () => {
      component.ngOnInit();
      const formGroup = component.form();
      const mockUser = {id: 1, nome: 'User'};
      formGroup?.patchValue({usuario: mockUser});

      const formValue = {descricao: 'Test'};
      const prepared = component.prepareFormValue(formValue);

      expect(prepared.usuario).toEqual(mockUser);
    });
  });

  describe('verifyFormDisable', () => {
    it('should disable form for aluno/professor viewing existing record', () => {
      const loginService = TestBed.inject(LoginService);
      (loginService.userLoggedIsAlunoOrProfessor as jest.Mock).mockResolvedValue(true);

      component.ngOnInit();
      component.object.set({id: 1} as Reserva);

      // Simulate the isAlunoOrProfessor returning true
      jest.spyOn(component, 'isAlunoOrProfessor').mockReturnValue(true);

      component.verifyFormDisable();

      expect(component.disableForm()).toBe(true);
    });

    it('should not disable form for admin user', () => {
      component.ngOnInit();
      component.object.set({id: 1} as Reserva);

      jest.spyOn(component, 'isAlunoOrProfessor').mockReturnValue(false);

      component.verifyFormDisable();

      expect(component.disableForm()).toBe(false);
    });

    it('should not disable form for new record', () => {
      component.ngOnInit();
      component.object.set({} as Reserva);

      jest.spyOn(component, 'isAlunoOrProfessor').mockReturnValue(true);

      component.verifyFormDisable();

      expect(component.disableForm()).toBe(false);
    });
  });

  describe('postEdit', () => {
    it('should call verifyFormDisable', () => {
      const verifyFormDisableSpy = jest.spyOn(component, 'verifyFormDisable');

      component.postEdit();

      expect(verifyFormDisableSpy).toHaveBeenCalled();
    });
  });

  describe('back', () => {
    it('should clear storage and call parent back', () => {
      sessionStorage.setItem('reserva_items_draft', JSON.stringify([]));
      const superBackSpy = jest.spyOn(Object.getPrototypeOf(Object.getPrototypeOf(component)), 'back');

      component.back();

      expect(sessionStorage.getItem('reserva_items_draft')).toBeNull();
      expect(superBackSpy).toHaveBeenCalled();
    });
  });

  describe('postSave', () => {
    it('should clear storage and call parent postSave', () => {
      sessionStorage.setItem('reserva_items_draft', JSON.stringify([]));
      const callback = jest.fn();
      const superPostSaveSpy = jest.spyOn(Object.getPrototypeOf(Object.getPrototypeOf(component)), 'postSave');

      component.postSave(callback);

      expect(sessionStorage.getItem('reserva_items_draft')).toBeNull();
      expect(superPostSaveSpy).toHaveBeenCalledWith(callback);
    });
  });

  describe('SessionStorage operations', () => {
    beforeEach(() => {
      sessionStorage.clear();
    });

    afterEach(() => {
      sessionStorage.clear();
    });

    it('should save items to sessionStorage when reservaItems change', () => {
      const mockItem: Item = {id: 1, nome: 'Item 1'} as Item;
      const reservaItem = new ReservaItem();
      reservaItem.item = mockItem;
      reservaItem.qtde = 2;

      component.reservaItems.set([reservaItem]);

      // Trigger effect by running change detection
      fixture.detectChanges();

      const stored = sessionStorage.getItem('reserva_items_draft') ?? '[]';
      const parsed = JSON.parse(stored);
      expect(parsed.length).toBe(1);
    });

    it('should load items from sessionStorage on init', () => {
      const mockItem: Item = {id: 1, nome: 'Item 1'} as Item;
      const reservaItem = new ReservaItem();
      reservaItem.item = mockItem;
      reservaItem.qtde = 3;

      sessionStorage.setItem('reserva_items_draft', JSON.stringify([reservaItem]));

      // Create new component instance
      const newFixture = TestBed.createComponent(ReservaFormComponent);
      const newComponent = newFixture.componentInstance as any;
      newFixture.detectChanges();

      expect(newComponent.reservaItems().length).toBe(1);
      expect(newComponent.reservaItems()[0].qtde).toBe(3);
    });

    it('should handle invalid JSON in sessionStorage gracefully', () => {
      sessionStorage.setItem('reserva_items_draft', 'invalid-json');

      // Create new component - should not throw
      const newFixture = TestBed.createComponent(ReservaFormComponent);
      const newComponent = newFixture.componentInstance as any;
      newFixture.detectChanges();

      expect(newComponent.reservaItems()).toEqual([]);
    });
  });

  describe('loadCartItems', () => {
    it('should load cart items from history state', () => {
      const mockItem: Item = {id: 1, nome: 'Item do Carrinho'} as Item;
      const cartItems = [{item: mockItem, qtde: 2}];

      // Mock history.state
      const originalState = history.state;
      Object.defineProperty(history, 'state', {
        value: {cartItems},
        writable: true,
        configurable: true
      });

      const messageService = TestBed.inject(MessageService);

      // Create new component to trigger ngOnInit
      const newFixture = TestBed.createComponent(ReservaFormComponent);
      const newComponent = newFixture.componentInstance as any;
      newFixture.detectChanges();

      expect(newComponent.reservaItems().length).toBe(1);
      expect(newComponent.reservaItems()[0].item.nome).toBe('Item do Carrinho');
      expect(newComponent.reservaItems()[0].qtde).toBe(2);
      expect(cartService.clear).toHaveBeenCalled();
      expect(messageService.add).toHaveBeenCalledWith(expect.objectContaining({
        severity: 'info',
        summary: 'Itens carregados'
      }));

      // Restore original state
      Object.defineProperty(history, 'state', {
        value: originalState,
        writable: true,
        configurable: true
      });
    });

    it('should save cart items to sessionStorage after loading', () => {
      const mockItem: Item = {id: 1, nome: 'Item'} as Item;
      const cartItems = [{item: mockItem, qtde: 3}];

      const originalState = history.state;
      Object.defineProperty(history, 'state', {
        value: {cartItems},
        writable: true,
        configurable: true
      });

      const newFixture = TestBed.createComponent(ReservaFormComponent);
      newFixture.detectChanges();

      const stored = sessionStorage.getItem('reserva_items_draft');
      expect(stored).not.toBeNull();

      Object.defineProperty(history, 'state', {
        value: originalState,
        writable: true,
        configurable: true
      });
    });
  });

  describe('Form disable effect', () => {
    it('should disable form controls when disableForm is true', () => {
      component.ngOnInit();
      fixture.detectChanges();

      component.disableForm.set(true);
      fixture.detectChanges();

      const formGroup = component.form();
      expect(formGroup?.get('descricao')?.disabled).toBe(true);
      expect(formGroup?.get('dataReserva')?.disabled).toBe(true);
      expect(formGroup?.get('dataRetirada')?.disabled).toBe(true);
      expect(formGroup?.get('observacao')?.disabled).toBe(true);
    });

    it('should enable form controls when disableForm is false', () => {
      component.ngOnInit();
      fixture.detectChanges();

      component.disableForm.set(true);
      fixture.detectChanges();

      component.disableForm.set(false);
      fixture.detectChanges();

      const formGroup = component.form();
      expect(formGroup?.get('descricao')?.disabled).toBe(false);
    });
  });

  describe('Computed Signals', () => {
    it('qtdeTotal should calculate total quantity', () => {
      const mockItem1: Item = {id: 1, nome: 'Item 1'} as Item;
      const mockItem2: Item = {id: 2, nome: 'Item 2'} as Item;

      const reservaItem1 = new ReservaItem();
      reservaItem1.item = mockItem1;
      reservaItem1.qtde = 3;

      const reservaItem2 = new ReservaItem();
      reservaItem2.item = mockItem2;
      reservaItem2.qtde = 5;

      component.reservaItems.set([reservaItem1, reservaItem2]);

      expect(component.qtdeTotal()).toBe(8);
    });

    it('hasItems should return true when items exist', () => {
      const mockItem: Item = {id: 1, nome: 'Item 1'} as Item;
      const reservaItem = new ReservaItem();
      reservaItem.item = mockItem;
      reservaItem.qtde = 1;

      component.reservaItems.set([reservaItem]);

      expect(component.hasItems()).toBe(true);
    });

    it('hasItems should return false when no items', () => {
      component.reservaItems.set([]);

      expect(component.hasItems()).toBe(false);
    });
  });
});
