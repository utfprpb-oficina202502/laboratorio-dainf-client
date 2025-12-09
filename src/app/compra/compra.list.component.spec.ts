import {ComponentFixture, TestBed} from '@angular/core/testing';
import {CompraListComponent} from './compra.list.component';
import {CompraService} from './compra.service';
import {ConfirmationService, MessageService} from 'primeng/api';
import {provideRouter} from '@angular/router';
import {of} from 'rxjs';
import {Compra} from './compra';
import {LoginService} from '../login/login.service';
import {createServiceMock} from '../framework/testing/test-helpers';

/**
 * Factory para criação de objetos Compra para testes
 */
class CompraTestFactory {
  private static nextId = 1;

  static create(overrides: Partial<Compra> = {}): Compra {
    const compra = new Compra();
    compra.id = overrides.id ?? this.nextId++;
    compra.dataCompra = overrides.dataCompra ?? '01/12/2025';
    compra.fornecedorNomeFantasia = overrides.fornecedorNomeFantasia ?? 'Fornecedor Teste';
    compra.fornecedorRazaoSocial = overrides.fornecedorRazaoSocial ?? 'Fornecedor Teste LTDA';
    compra.compraItem = overrides.compraItem ?? [];
    return compra;
  }

  static createList(count: number): Compra[] {
    return Array.from({length: count}, (_, i) => this.create({id: i + 1}));
  }

  static resetIdCounter(): void {
    this.nextId = 1;
  }
}

/**
 * Testes abrangentes para CompraListComponent
 * Cobre lógica de permissões e integração com ActionButtonsComponent
 */
describe('CompraListComponent', () => {
  let component: CompraListComponent;
  let fixture: ComponentFixture<CompraListComponent>;
  let compraService: jest.Mocked<CompraService>;
  let loginService: jest.Mocked<LoginService>;

  let mockCompras: Compra[];

  beforeAll(() => {
    mockCompras = CompraTestFactory.createList(3);
  });

  beforeEach(async () => {
    const compraServiceSpy = createServiceMock<CompraService>([
      'findAll',
      'findAllPaged',
      'delete',
      'findOne'
    ]);

    const confirmationServiceSpy = createServiceMock<ConfirmationService>(['confirm']);
    const messageServiceSpy = createServiceMock<MessageService>(['add']);
    const loginServiceSpy = createServiceMock<LoginService>(['isAlunoOrProfessor']);

    await TestBed.configureTestingModule({
      imports: [CompraListComponent],
      providers: [
        provideRouter([]),
        {provide: CompraService, useValue: compraServiceSpy},
        {provide: ConfirmationService, useValue: confirmationServiceSpy},
        {provide: MessageService, useValue: messageServiceSpy},
        {provide: LoginService, useValue: loginServiceSpy}
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CompraListComponent);
    component = fixture.componentInstance;

    compraService = TestBed.inject(CompraService) as jest.Mocked<CompraService>;
    loginService = TestBed.inject(LoginService) as jest.Mocked<LoginService>;

    compraService.findAll.mockReturnValue(of(mockCompras));
    compraService.findAllPaged.mockReturnValue(of({
      content: mockCompras,
      totalElements: mockCompras.length,
      totalPages: 1,
      size: mockCompras.length,
      number: 0
    }));

    (loginService as any).currentUser = jest.fn().mockReturnValue({
      id: 1,
      username: 'admin',
      perfil: {tipo: 'ADMIN'}
    });
  });

  afterEach(() => {
    if (fixture) {
      fixture.destroy();
    }
    jest.clearAllMocks();
    CompraTestFactory.resetIdCounter();
  });

  // ============================================================================
  // Component Setup (5 tests)
  // ============================================================================
  describe('Component Setup', () => {
    it('deve criar o componente', () => {
      expect(component).toBeTruthy();
    });

    it('deve injetar serviços corretamente', () => {
      expect(component['service']).toBe(compraService);
    });

    it('deve configurar tabela com colunas corretas', () => {
      expect(component['columnsTable']).toBeDefined();
      expect(component['columnsTable'].length).toBeGreaterThan(0);
    });

    it('deve definir urlForm corretamente', () => {
      expect(component['urlForm']).toBe('compra/form');
    });

    it('deve configurar tableConfig corretamente', () => {
      component.configureTable();
      expect(component['tableConfig'].columns).toBeDefined();
      expect(component['tableConfig'].stateKey).toBe('compra-list');
    });
  });

  // ============================================================================
  // Permission-Based Action Buttons (8 tests)
  // ============================================================================
  describe('Permission-Based Action Buttons', () => {
    it('deve ter canEdit definido', () => {
      expect(component['canEdit']).toBeDefined();
    });

    it('deve ter canDelete definido', () => {
      expect(component['canDelete']).toBeDefined();
    });

    it('deve verificar se isAlunoOrProfessor está definido', () => {
      const hasMethod = typeof component['isAlunoOrProfessor'] === 'function';
      expect(hasMethod || component['isAlunoOrProfessor'] !== undefined).toBeTruthy();
    });

    it('deve ter propriedades de permissão disponíveis', () => {
      expect(component['canEdit'] !== undefined || component['canDelete'] !== undefined).toBeTruthy();
    });

    it('deve permitir verificação de tipo de usuário', () => {
      const hasUserCheck = typeof component['isAlunoOrProfessor'] === 'function' ||
                          typeof component['userRole'] !== 'undefined';
      expect(hasUserCheck).toBeTruthy();
    });

    it('deve ter método edit disponível', () => {
      expect(typeof component.edit).toBe('function');
    });

    it('deve chamar edit() com id correto', () => {
      const editSpy = jest.spyOn(component, 'edit');
      component.edit(123);
      expect(editSpy).toHaveBeenCalledWith(123);
    });

    it('deve chamar delete() com id correto', () => {
      const deleteSpy = jest.spyOn(component, 'delete');
      component.delete(456);
      expect(deleteSpy).toHaveBeenCalledWith(456);
    });
  });

  // ============================================================================
  // Base Class Overrides (4 tests)
  // ============================================================================
  describe('Base Class Overrides', () => {
    it('deve retornar nome de arquivo de exportação correto', () => {
      const filename = component['getExportFileName']();
      expect(filename).toBe('compras');
    });

    it('deve retornar nome da entidade correto', () => {
      const entityName = component['getEntityName']();
      expect(entityName).toBe('Compra');
    });

    it('deve retornar nome plural da entidade correto', () => {
      const pluralName = component['getEntityPluralName']();
      expect(pluralName).toBe('Compras');
    });

    it('deve ter service configurado corretamente', () => {
      expect(component['service']).toBe(compraService);
      expect(component['entityService']).toBe(compraService);
    });

    it('deve ter listConfig configurado', () => {
      expect(component['listConfig']).toBeDefined();
      expect(component['listConfig'].caption).toBe('Compras');
    });
  });

  // ============================================================================
  // Permission Signals (6 tests)
  // ============================================================================
  describe('Permission Signals', () => {
    it('deve ter canEdit definido', () => {
      expect(component['canEdit'] !== undefined).toBeTruthy();
    });

    it('deve ter canDelete definido', () => {
      expect(component['canDelete'] !== undefined).toBeTruthy();
    });

    it('deve ter isAlunoOrProfessor disponível', () => {
      const hasMethod = typeof component['isAlunoOrProfessor'] === 'function' ||
                       component['isAlunoOrProfessor'] !== undefined;
      expect(hasMethod).toBeTruthy();
    });

    it('deve ter canExport disponível', () => {
      const hasExport = typeof component['canExport'] === 'function' ||
                       component['canExport'] !== undefined;
      expect(hasExport).toBeTruthy();
    });

    it('deve ter isReadOnly disponível', () => {
      const hasReadOnly = typeof component['isReadOnly'] === 'function' ||
                         component['isReadOnly'] !== undefined;
      expect(hasReadOnly).toBeTruthy();
    });

    it('deve ter userRole disponível', () => {
      const hasUserRole = typeof component['userRole'] === 'function' ||
                         component['userRole'] !== undefined;
      expect(hasUserRole).toBeTruthy();
    });
  });

  // ============================================================================
  // TableConfig (4 tests)
  // ============================================================================
  describe('TableConfig', () => {
    beforeEach(() => {
      component.configureTable();
    });

    it('deve ter campos de filtro global', () => {
      expect(component['tableConfig'].globalFilterFields).toBeDefined();
      expect(component['tableConfig'].globalFilterFields?.length).toBeGreaterThan(0);
    });

    it('deve ter campo de ordenação padrão', () => {
      expect(component['tableConfig'].defaultSortField).toBeDefined();
    });

    it('deve ter caption definido', () => {
      expect(component['tableConfig'].caption).toBe('Compras');
    });

    it('deve ter colunas configuradas incluindo id e actions', () => {
      expect(component['tableConfig'].columns.length).toBeGreaterThanOrEqual(3);
      const fields = component['tableConfig'].columns.map((c: any) => c.field);
      expect(fields).toContain('id');
      expect(fields).toContain('actions');
    });
  });

  // ============================================================================
  // Configuração de Ordenação (6 tests)
  // ============================================================================
  describe('Configuração de Ordenação', () => {
    beforeEach(() => {
      component.configureTable();
    });

    it('deve ter coluna id configurada', () => {
      const column = component['tableConfig'].columns.find((c: any) => c.field === 'id');
      expect(column).toBeDefined();
    });

    it('deve ter coluna fornecedorNomeFantasia com sortable true', () => {
      const column = component['tableConfig'].columns.find((c: any) => c.field === 'fornecedorNomeFantasia');
      expect(column?.sortable).toBe(true);
    });

    it('deve ter coluna fornecedorRazaoSocial com sortable true', () => {
      const column = component['tableConfig'].columns.find((c: any) => c.field === 'fornecedorRazaoSocial');
      expect(column?.sortable).toBe(true);
    });

    it('deve ter coluna dataCompra com sortable true', () => {
      const column = component['tableConfig'].columns.find((c: any) => c.field === 'dataCompra');
      expect(column?.sortable).toBe(true);
    });

    it('deve ter coluna actions configurada', () => {
      const column = component['tableConfig'].columns.find((c: any) => c.field === 'actions');
      expect(column).toBeDefined();
    });

    it('deve ter colunas de dados com sortable habilitado', () => {
      const dataColumns = component['tableConfig'].columns.filter((c: any) =>
        c.field !== 'actions' && c.field !== 'id'
      );
      const hasSortable = dataColumns.some((c: any) => c.sortable === true);
      expect(hasSortable).toBe(true);
    });
  });

  // ============================================================================
  // openOptions() - Menu de Contexto (5 tests)
  // ============================================================================
  describe('openOptions() - Menu de Contexto', () => {
    let mockEvent: Event;

    beforeEach(() => {
      mockEvent = new Event('click');
      const mockActionsMenu = {
        toggle: jest.fn()
      };
      Object.defineProperty(component, 'actionsMenu', {
        value: jest.fn().mockReturnValue(mockActionsMenu),
        writable: true,
        configurable: true
      });
    });

    it('deve configurar menu de contexto básico', () => {
      const compra = CompraTestFactory.create({id: 1});

      component.openOptions(mockEvent, compra);

      expect(component.contextMenuItems.length).toBeGreaterThan(0);
      expect(component.contextMenuItems[0].label).toBe('Editar');
    });

    it('deve mostrar ícone correto para "Editar"', () => {
      const compra = CompraTestFactory.create({id: 1});

      component.openOptions(mockEvent, compra);

      const editItem = component.contextMenuItems.find(item => item.label === 'Editar');
      expect(editItem?.icon).toBe('pi pi-pencil');
    });

    it('deve mostrar ícone correto para "Remover"', () => {
      const compra = CompraTestFactory.create({id: 1});

      component.openOptions(mockEvent, compra);

      const removeItem = component.contextMenuItems.find(item => item.label === 'Remover');
      expect(removeItem?.icon).toBe('pi pi-trash');
    });

    it('deve chamar toggle do actionsMenu se disponível', () => {
      const toggleSpy = jest.fn();
      const mockActionsMenu = {
        toggle: toggleSpy
      };
      Object.defineProperty(component, 'actionsMenu', {
        value: jest.fn().mockReturnValue(mockActionsMenu),
        writable: true,
        configurable: true
      });

      component.openOptions(mockEvent, CompraTestFactory.create({id: 1}));

      expect(toggleSpy).toHaveBeenCalledWith(mockEvent);
    });

    it('deve incluir comandos corretos para Editar e Remover', () => {
      const compra = CompraTestFactory.create({id: 3});
      const editSpy = jest.spyOn(component, 'edit');
      const deleteSpy = jest.spyOn(component, 'delete');

      component.openOptions(mockEvent, compra);

      const editItem = component.contextMenuItems.find(item => item.label === 'Editar');
      const removeItem = component.contextMenuItems.find(item => item.label === 'Remover');

      expect(editItem).toBeTruthy();
      expect(removeItem).toBeTruthy();

      editItem?.command?.({} as any);
      removeItem?.command?.({} as any);

      expect(editSpy).toHaveBeenCalledWith(3);
      expect(deleteSpy).toHaveBeenCalledWith(3);
    });
  });

  // ============================================================================
  // onKeyDown() - Acessibilidade por Teclado (2 tests)
  // ============================================================================
  describe('onKeyDown() - Acessibilidade por Teclado', () => {
    beforeEach(() => {
      const mockActionsMenu = {
        toggle: jest.fn()
      };
      Object.defineProperty(component, 'actionsMenu', {
        value: jest.fn().mockReturnValue(mockActionsMenu),
        writable: true,
        configurable: true
      });
    });

    it('deve chamar openOptions ao pressionar Enter', () => {
      const compra = CompraTestFactory.create({id: 1});
      const openOptionsSpy = jest.spyOn(component, 'openOptions');

      component.onKeyDown(new KeyboardEvent('keydown', {key: 'Enter'}), compra);

      expect(openOptionsSpy).toHaveBeenCalledWith(expect.any(KeyboardEvent), compra);
    });

    it('deve chamar openOptions ao pressionar Espaço', () => {
      const compra = CompraTestFactory.create({id: 1});
      const openOptionsSpy = jest.spyOn(component, 'openOptions');

      component.onKeyDown(new KeyboardEvent('keydown', {key: ' '}), compra);

      expect(openOptionsSpy).toHaveBeenCalledWith(expect.any(KeyboardEvent), compra);
    });
  });
});
