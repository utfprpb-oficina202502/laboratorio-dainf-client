import {ComponentFixture, TestBed} from '@angular/core/testing';
import {ReactiveFormsModule} from '@angular/forms';
import {provideRouter} from '@angular/router';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {provideNoopAnimations} from '@angular/platform-browser/animations';
import {MessageService} from 'primeng/api';
import {of, throwError} from 'rxjs';
import {CompraFormComponent} from './compra.form.component';
import {CompraService} from './compra.service';
import {FornecedorService} from '../fornecedor/fornecedor.service';
import {ItemService} from '../item/item.service';
import {LoaderService} from '../framework/loader/loader.service';
import {LoginService} from '../login/login.service';
import {LoggerService} from '../framework/services/logger.service';
import {Compra} from './compra';
import {Fornecedor} from '../fornecedor/fornecedor';
import {Item} from '../item/item';
import {CompraItem} from './compraItem';

/**
 * Comprehensive tests for CompraFormComponent
 * Covers form validation, business logic, item management, and autocomplete functionality
 */
describe('CompraFormComponent', () => {
  let component: CompraFormComponent;
  let fixture: ComponentFixture<CompraFormComponent>;
  let compraService: jest.Mocked<CompraService>;
  let fornecedorService: jest.Mocked<FornecedorService>;
  let itemService: jest.Mocked<ItemService>;
  let messageService: jest.Mocked<MessageService>;
  let loggerService: jest.Mocked<LoggerService>;

  // Mock data moved to beforeAll for performance
  let mockFornecedores: Partial<Fornecedor>[];
  let mockItems: Partial<Item>[];
  let mockCompra: Partial<Compra>;

  beforeAll(() => {
    mockFornecedores = [
      {
        id: 1,
        nomeFantasia: 'Fornecedor A',
        razaoSocial: 'Fornecedor A Ltda',
        cnpj: '12345678000190'
      },
      {id: 2, nomeFantasia: 'Fornecedor B', razaoSocial: 'Fornecedor B SA', cnpj: '98765432000100'}
    ];

    mockItems = [
      {
        id: 1,
        nome: 'Item A',
        valor: 50.00,
        saldo: 10,
        tipoItem: 'C',
        disponivelEmprestimoCalculado: 10
      },
      {
        id: 2,
        nome: 'Item B',
        valor: 100.00,
        patrimonio: 12345,
        saldo: 5,
        tipoItem: 'P',
        disponivelEmprestimoCalculado: 5
      }
    ];

    mockCompra = {
      id: 1,
      fornecedor: mockFornecedores[0] as Fornecedor,
      usuario: {id: 1, nome: 'Usuário Teste'} as any,
      dataCompra: '24/11/2025',
      compraItem: [
        {id: 1, item: mockItems[0] as Item, qtde: 2, valor: 100.00} as CompraItem,
        {id: 2, item: mockItems[1] as Item, qtde: 1, valor: 100.00} as CompraItem
      ]
    };
  });

  beforeEach(async () => {
    const compraServiceMock = {
      save: jest.fn(),
      findOne: jest.fn()
    };

    const fornecedorServiceMock = {
      complete: jest.fn()
    };

    const itemServiceMock = {
      completeItem: jest.fn()
    };

    const messageServiceMock = {
      add: jest.fn()
    };

    const loaderServiceMock = {
      show: jest.fn(),
      hide: jest.fn()
    };

    const loginServiceMock = {
      getCurrentUser: jest.fn().mockReturnValue(of({id: 1, nome: 'Usuário Teste'})),
      userLoggedIsAlunoOrProfessor: jest.fn().mockResolvedValue(false)
    };

    const loggerServiceMock = {
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn()
    };

    await TestBed.configureTestingModule({
      imports: [
        CompraFormComponent,
        HttpClientTestingModule,
        ReactiveFormsModule
      ],
      providers: [
        provideRouter([]),
        {provide: CompraService, useValue: compraServiceMock},
        {provide: FornecedorService, useValue: fornecedorServiceMock},
        {provide: ItemService, useValue: itemServiceMock},
        {provide: MessageService, useValue: messageServiceMock},
        {provide: LoaderService, useValue: loaderServiceMock},
        {provide: LoginService, useValue: loginServiceMock},
        {provide: LoggerService, useValue: loggerServiceMock},
        provideNoopAnimations()
      ]
    }).compileComponents();

    compraService = TestBed.inject(CompraService) as jest.Mocked<CompraService>;
    fornecedorService = TestBed.inject(FornecedorService) as jest.Mocked<FornecedorService>;
    itemService = TestBed.inject(ItemService) as jest.Mocked<ItemService>;
    messageService = TestBed.inject(MessageService) as jest.Mocked<MessageService>;
    loggerService = TestBed.inject(LoggerService) as jest.Mocked<LoggerService>;

    fixture = TestBed.createComponent(CompraFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    if (fixture) {
      fixture.destroy();
    }
    jest.clearAllMocks();
  });

  describe('Component Initialization', () => {
    it('should create component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize form with correct structure', () => {
      const formGroup = component['form']();

      expect(formGroup).toBeTruthy();
      expect(formGroup?.get('id')).toBeTruthy();
      expect(formGroup?.get('fornecedor')).toBeTruthy();
      expect(formGroup?.get('usuario')).toBeTruthy();
      expect(formGroup?.get('dataCompra')).toBeTruthy();
    });

    it('should set today as default date on initialization', () => {
      component.ngOnInit();
      const formGroup = component['form']();
      const dataCompra = formGroup?.get('dataCompra')?.value;

      expect(dataCompra).toBeTruthy();
    });

    it('should set current user as responsible on initialization', () => {
      component.ngOnInit();
      const formGroup = component['form']();
      const usuario = formGroup?.get('usuario')?.value;

      expect(usuario).toBeTruthy();
      expect(usuario.nome).toBe('Usuário Teste');
    });

    it('should initialize with empty items list', () => {
      expect(component['compraItems']()).toEqual([]);
      expect(component['hasItems']()).toBe(false);
    });
  });

  describe('Form Validation', () => {
    it('should require fornecedor', () => {
      const formGroup = component['form']();
      const fornecedorControl = formGroup?.get('fornecedor');

      fornecedorControl?.setValue(null);
      expect(fornecedorControl?.hasError('required')).toBe(true);

      fornecedorControl?.setValue(mockFornecedores[0]);
      expect(fornecedorControl?.hasError('required')).toBe(false);
    });

    it('should require dataCompra', () => {
      const formGroup = component['form']();
      const dataCompraControl = formGroup?.get('dataCompra');

      dataCompraControl?.setValue('');
      expect(dataCompraControl?.hasError('required')).toBe(true);

      dataCompraControl?.setValue('24/11/2025');
      expect(dataCompraControl?.hasError('required')).toBe(false);
    });

    it('should have id field disabled', () => {
      const formGroup = component['form']();
      const idControl = formGroup?.get('id');

      expect(idControl?.disabled).toBe(true);
    });

    it('should have usuario field disabled', () => {
      const formGroup = component['form']();
      const usuarioControl = formGroup?.get('usuario');

      expect(usuarioControl?.disabled).toBe(true);
    });
  });

  describe('Fornecedor Autocomplete', () => {
    it('should fetch fornecedores on autocomplete event', () => {
      fornecedorService.complete.mockReturnValue(of(mockFornecedores as Fornecedor[]));

      component.findFornecedores({query: 'Fornecedor'} as any);

      expect(fornecedorService.complete).toHaveBeenCalledWith('Fornecedor');
      expect(component['fornecedorList']()).toEqual(mockFornecedores);
    });

    it('should handle error when fetching fornecedores', () => {
      const error = new Error('Network error');
      fornecedorService.complete.mockReturnValue(throwError(() => error));

      component.findFornecedores({query: 'test'} as any);

      expect(loggerService.error).toHaveBeenCalledWith('Erro ao buscar fornecedores:', error);
      expect(messageService.add).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'Erro',
        detail: 'Não foi possível buscar fornecedores. Tente novamente.'
      });
      expect(component['fornecedorList']()).toEqual([]);
    });
  });

  describe('Item Autocomplete', () => {
    it('should fetch items when query has at least 2 characters', () => {
      itemService.completeItem.mockReturnValue(of(mockItems as Item[]));

      component.findProdutos({query: 'Item'} as any);

      expect(itemService.completeItem).toHaveBeenCalledWith('Item', false);
      expect(component['itemList']()).toEqual(mockItems);
    });

    it('should not fetch items when query has less than 2 characters', () => {
      component.findProdutos({query: 'I'} as any);

      expect(itemService.completeItem).not.toHaveBeenCalled();
      expect(component['itemList']()).toEqual([]);
    });

    it('should clear item list when query is empty', () => {
      component.findProdutos({query: ''} as any);

      expect(itemService.completeItem).not.toHaveBeenCalled();
      expect(component['itemList']()).toEqual([]);
    });

    it('should handle error when fetching items', () => {
      const error = new Error('Network error');
      itemService.completeItem.mockReturnValue(throwError(() => error));

      component.findProdutos({query: 'test'} as any);

      expect(loggerService.error).toHaveBeenCalledWith('Erro ao buscar itens:', error);
      expect(messageService.add).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'Erro',
        detail: 'Não foi possível buscar itens. Tente novamente.'
      });
      expect(component['itemList']()).toEqual([]);
    });
  });

  describe('Item Management', () => {
    beforeEach(() => {
      component['tempItem'].set(mockItems[0] as Item);
      component['tempQtde'].set(2);
      component['tempValor'].set(100.00);
    });

    it('should set price when item is selected', () => {
      component['tempItem'].set(mockItems[0] as Item);
      component.setPrecoProduto();

      expect(component['tempValor']()).toBe(50.00);
      expect(component['tempQtde']()).toBe(1);
    });

    it('should insert new item to the list', () => {
      component.insertItem();

      const items = component['compraItems']();
      expect(items.length).toBe(1);
      expect(items[0].item).toEqual(mockItems[0]);
      expect(items[0].qtde).toBe(2);
      expect(items[0].valor).toBe(100.00);
    });

    it('should update quantity when inserting existing item', () => {
      // First insertion
      component.insertItem();

      // Set same item again
      component['tempItem'].set(mockItems[0] as Item);
      component['tempQtde'].set(3);
      component['tempValor'].set(150.00);

      // Second insertion
      component.insertItem();

      const items = component['compraItems']();
      expect(items.length).toBe(1);
      expect(items[0].qtde).toBe(5); // 2 + 3
    });

    it('should reset temp values after inserting item', () => {
      component.insertItem();

      expect(component['tempItem']()).toBeNull();
      expect(component['tempQtde']()).toBe(1);
      expect(component['tempValor']()).toBe(0);
    });

    it('should show message when trying to insert without item', () => {
      component['tempItem'].set(null);
      const showItemRequiredMessageSpy = jest.spyOn(component as any, 'showItemRequiredMessage');

      component.insertItem();

      expect(showItemRequiredMessageSpy).toHaveBeenCalled();
      expect(component['compraItems']().length).toBe(0);
    });

    it('should show message when trying to insert without quantity', () => {
      component['tempQtde'].set(0);
      const showItemRequiredMessageSpy = jest.spyOn(component as any, 'showItemRequiredMessage');

      component.insertItem();

      expect(showItemRequiredMessageSpy).toHaveBeenCalled();
      expect(component['compraItems']().length).toBe(0);
    });

    it('should remove item from the list', () => {
      // Insert two items
      component.insertItem();

      component['tempItem'].set(mockItems[1] as Item);
      component['tempQtde'].set(1);
      component['tempValor'].set(100.00);
      component.insertItem();

      expect(component['compraItems']().length).toBe(2);

      // Remove first item
      component.removeItem(mockItems[0].id ?? 0);

      const items = component['compraItems']();
      expect(items.length).toBe(1);
      expect(items[0].item.id).toBe(mockItems[1].id);
    });
  });

  describe('Computed Values', () => {
    beforeEach(() => {
      const items: Partial<CompraItem>[] = [
        {item: mockItems[0] as Item, qtde: 2, valor: 100.00},
        {item: mockItems[1] as Item, qtde: 1, valor: 100.00}
      ];
      component['compraItems'].set(items as CompraItem[]);
    });

    it('should calculate total compra correctly', () => {
      expect(component['totalCompra']()).toBe(200.00);
    });

    it('should calculate total quantity correctly', () => {
      expect(component['qtdeTotal']()).toBe(3);
    });

    it('should return 0 for total when no items', () => {
      component['compraItems'].set([]);
      expect(component['totalCompra']()).toBe(0);
    });

    it('should indicate when has items', () => {
      expect(component['hasItems']()).toBe(true);

      component['compraItems'].set([]);
      expect(component['hasItems']()).toBe(false);
    });
  });

  describe('Save Functionality', () => {
    beforeEach(() => {
      const formGroup = component['form']();
      formGroup?.patchValue({
        fornecedor: mockFornecedores[0],
        dataCompra: '24/11/2025'
      });
    });

    it('should not save when no items are added', () => {
      const showMinimumItemsMessageSpy = jest.spyOn(component as any, 'showMinimumItemsMessage');

      component.save();

      expect(showMinimumItemsMessageSpy).toHaveBeenCalledWith(
        'Necessário informar o fornecedor e adicionar ao menos um item!'
      );
      expect(compraService.save).not.toHaveBeenCalled();
    });

    it('should not save when fornecedor is not an object', () => {
      const formGroup = component['form']();
      formGroup?.patchValue({fornecedor: 'Invalid'});

      component['tempItem'].set(mockItems[0] as Item);
      component['tempQtde'].set(1);
      component.insertItem();

      const showMinimumItemsMessageSpy = jest.spyOn(component as any, 'showMinimumItemsMessage');

      component.save();

      expect(showMinimumItemsMessageSpy).toHaveBeenCalled();
      expect(compraService.save).not.toHaveBeenCalled();
    });

    it('should prepare form value correctly with items', () => {
      component['tempItem'].set(mockItems[0] as Item);
      component['tempQtde'].set(2);
      component.insertItem();

      const formGroup = component['form']();
      const formValue = formGroup?.getRawValue();
      const prepared = component['prepareFormValue'](formValue);

      expect(prepared.fornecedor).toEqual(mockFornecedores[0]);
      expect(prepared.dataCompra).toBe('24/11/2025');
      expect(prepared.compraItem).toHaveLength(1);
      expect(prepared.compraItem?.[0]?.item.id).toBe(mockItems[0].id);
      expect(prepared.compraItem?.[0]?.qtde).toBe(2);
    });
  });

  describe('Edit Mode', () => {
    it('should patch form with compra data', () => {
      component['patchFormWithObject'](mockCompra as Compra);

      const formGroup = component['form']();
      expect(formGroup?.get('id')?.value).toBe(mockCompra.id);
      expect(formGroup?.get('fornecedor')?.value).toEqual(mockCompra.fornecedor);
      expect(formGroup?.get('dataCompra')?.value).toBe(mockCompra.dataCompra);
      expect(component['compraItems']()).toEqual(mockCompra.compraItem);
    });

    it('should set items when patching form', () => {
      component['patchFormWithObject'](mockCompra as Compra);

      expect(component['compraItems']().length).toBe(2);
      expect(component['hasItems']()).toBe(true);
    });
  });

  describe('Max Date', () => {
    it('should set maxDate to today', () => {
      const today = new Date();
      const maxDate = component['maxDate']();

      expect(maxDate.getDate()).toBe(today.getDate());
      expect(maxDate.getMonth()).toBe(today.getMonth());
      expect(maxDate.getFullYear()).toBe(today.getFullYear());
    });
  });
});
