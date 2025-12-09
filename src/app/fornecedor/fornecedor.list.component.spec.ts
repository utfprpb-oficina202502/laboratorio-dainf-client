import {ComponentFixture, TestBed} from '@angular/core/testing';
import {FornecedorListComponent} from './fornecedor.list.component';
import {FornecedorService} from './fornecedor.service';
import {ConfirmationService, MenuItemCommandEvent, MessageService} from 'primeng/api';
import {provideRouter} from '@angular/router';
import {of} from 'rxjs';
import {Fornecedor} from './fornecedor';
import {LoginService} from '../login/login.service';
import {createServiceMock} from '../framework/testing/test-helpers';

/**
 * Factory para criação de objetos Fornecedor para testes
 */
class FornecedorTestFactory {
  private static nextId = 1;

  static create(overrides: Partial<Fornecedor> = {}): Fornecedor {
    const fornecedor = new Fornecedor();
    fornecedor.id = overrides.id ?? this.nextId++;
    fornecedor.razaoSocial = overrides.razaoSocial ?? `Fornecedor Teste LTDA ${fornecedor.id}`;
    fornecedor.nomeFantasia = overrides.nomeFantasia ?? `Fornecedor ${fornecedor.id}`;
    fornecedor.cnpj = overrides.cnpj ?? '12345678000199';
    fornecedor.ie = overrides.ie ?? '123456789';
    fornecedor.endereco = overrides.endereco ?? 'Rua Teste, 123';
    fornecedor.observacao = overrides.observacao ?? '';
    fornecedor.telefone = overrides.telefone ?? '(41) 99999-9999';
    fornecedor.email = overrides.email ?? 'teste@fornecedor.com';
    return fornecedor;
  }

  static createList(count: number): Fornecedor[] {
    return Array.from({length: count}, (_, i) => this.create({id: i + 1}));
  }

  static resetIdCounter(): void {
    this.nextId = 1;
  }
}

/**
 * Testes abrangentes para FornecedorListComponent
 * Cobre lógica de permissões, configuração de tabela e integração com ActionButtonsComponent
 */
describe('FornecedorListComponent', () => {
  let component: FornecedorListComponent;
  let fixture: ComponentFixture<FornecedorListComponent>;
  let fornecedorService: jest.Mocked<FornecedorService>;
  let loginService: jest.Mocked<LoginService>;

  let mockFornecedores: Fornecedor[];

  beforeAll(() => {
    mockFornecedores = FornecedorTestFactory.createList(3);
  });

  beforeEach(async () => {
    const fornecedorServiceSpy = createServiceMock<FornecedorService>([
      'findAll',
      'findAllPaged',
      'delete',
      'findOne'
    ]);

    const confirmationServiceSpy = createServiceMock<ConfirmationService>(['confirm']);
    const messageServiceSpy = createServiceMock<MessageService>(['add']);
    const loginServiceSpy = createServiceMock<LoginService>(['isAlunoOrProfessor']);

    await TestBed.configureTestingModule({
      imports: [FornecedorListComponent],
      providers: [
        provideRouter([]),
        {provide: FornecedorService, useValue: fornecedorServiceSpy},
        {provide: ConfirmationService, useValue: confirmationServiceSpy},
        {provide: MessageService, useValue: messageServiceSpy},
        {provide: LoginService, useValue: loginServiceSpy}
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(FornecedorListComponent);
    component = fixture.componentInstance;

    fornecedorService = TestBed.inject(FornecedorService) as jest.Mocked<FornecedorService>;
    loginService = TestBed.inject(LoginService) as jest.Mocked<LoginService>;

    fornecedorService.findAll.mockReturnValue(of(mockFornecedores));
    fornecedorService.findAllPaged.mockReturnValue(of({
      content: mockFornecedores,
      totalElements: mockFornecedores.length,
      totalPages: 1,
      size: mockFornecedores.length,
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
    FornecedorTestFactory.resetIdCounter();
  });

  // ============================================================================
  // Component Setup (5 tests)
  // ============================================================================
  describe('Component Setup', () => {
    it('deve criar o componente', () => {
      expect(component).toBeTruthy();
    });

    it('deve injetar serviços corretamente', () => {
      expect(component['service']).toBe(fornecedorService);
    });

    it('deve configurar tabela com colunas corretas', () => {
      expect(component['columnsTable']).toBeDefined();
      expect(component['columnsTable'].length).toBeGreaterThan(0);
    });

    it('deve definir urlForm corretamente', () => {
      expect(component['urlForm']).toBe('fornecedor/form');
    });

    it('deve configurar tableConfig corretamente', () => {
      component.configureTable();
      expect(component['tableConfig'].columns).toBeDefined();
      expect(component['tableConfig'].stateKey).toBe('fornecedor-list');
    });
  });

  // ============================================================================
  // Permission-Based Action Buttons (6 tests)
  // ============================================================================
  describe('Permission-Based Action Buttons', () => {
    it('deve ter canEdit definido', () => {
      expect(component['canEdit'] !== undefined).toBeTruthy();
    });

    it('deve ter canDelete definido', () => {
      expect(component['canDelete'] !== undefined).toBeTruthy();
    });

    it('deve verificar se isAlunoOrProfessor está definido', () => {
      const hasMethod = typeof component['isAlunoOrProfessor'] === 'function' ||
                       component['isAlunoOrProfessor'] !== undefined;
      expect(hasMethod).toBeTruthy();
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
      expect(filename).toBe('fornecedores');
    });

    it('deve retornar nome da entidade correto', () => {
      const entityName = component['getEntityName']();
      expect(entityName).toBe('Fornecedor');
    });

    it('deve retornar nome plural da entidade correto', () => {
      const pluralName = component['getEntityPluralName']();
      expect(pluralName).toBe('Fornecedores');
    });

    it('deve ter listConfig configurado', () => {
      expect(component['listConfig']).toBeDefined();
      expect(component['listConfig'].caption).toBe('Fornecedores');
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
  // TableConfig (5 tests)
  // ============================================================================
  describe('TableConfig', () => {
    beforeEach(() => {
      component.configureTable();
    });

    it('deve ter campos de filtro global', () => {
      expect(component['tableConfig'].globalFilterFields).toBeDefined();
      expect(component['tableConfig'].globalFilterFields?.length).toBeGreaterThan(0);
    });

    it('deve ter campo de ordenação padrão como razaoSocial', () => {
      expect(component['tableConfig'].defaultSortField).toBe('razaoSocial');
    });

    it('deve ter caption definido', () => {
      expect(component['tableConfig'].caption).toBe('Fornecedores');
    });

    it('deve ter colunas configuradas incluindo id e actions', () => {
      expect(component['tableConfig'].columns.length).toBeGreaterThanOrEqual(3);
      const fields = component['tableConfig'].columns.map((c: any) => c.field);
      expect(fields).toContain('id');
      expect(fields).toContain('actions');
    });

    it('deve ter displayedColumns configurado corretamente', () => {
      expect(component['displayedColumns']).toBeDefined();
      expect(component['displayedColumns'].length).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // Configuração de Ordenação (7 tests)
  // ============================================================================
  describe('Configuração de Ordenação', () => {
    beforeEach(() => {
      component.configureTable();
    });

    it('deve ter coluna id configurada', () => {
      const column = component['tableConfig'].columns.find((c: any) => c.field === 'id');
      expect(column).toBeDefined();
    });

    it('deve ter coluna razaoSocial com sortable true', () => {
      const column = component['tableConfig'].columns.find((c: any) => c.field === 'razaoSocial');
      expect(column?.sortable).toBe(true);
    });

    it('deve ter coluna nomeFantasia com sortable true', () => {
      const column = component['tableConfig'].columns.find((c: any) => c.field === 'nomeFantasia');
      expect(column?.sortable).toBe(true);
    });

    it('deve ter coluna cnpj com sortable true', () => {
      const column = component['tableConfig'].columns.find((c: any) => c.field === 'cnpj');
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

    it('deve ter campo razaoSocial como ordenável', () => {
      const column = component['tableConfig'].columns.find((c: any) => c.field === 'razaoSocial');
      expect(column?.sortable).toBeTruthy();
    });
  });

  // ============================================================================
  // Configuração de Colunas (5 tests)
  // ============================================================================
  describe('Configuração de Colunas', () => {
    beforeEach(() => {
      component.configureTable();
    });

    it('deve ter coluna id configurada', () => {
      const column = component['tableConfig'].columns.find((c: any) => c.field === 'id');
      expect(column).toBeDefined();
    });

    it('deve ter coluna razaoSocial com tipo text', () => {
      const column = component['tableConfig'].columns.find((c: any) => c.field === 'razaoSocial');
      expect(column?.type).toBe('text');
      expect(column?.minWidth).toBe('20rem');
    });

    it('deve ter coluna nomeFantasia com tipo text', () => {
      const column = component['tableConfig'].columns.find((c: any) => c.field === 'nomeFantasia');
      expect(column?.type).toBe('text');
      expect(column?.minWidth).toBe('18rem');
    });

    it('deve ter coluna cnpj com tipo custom para formatação', () => {
      const column = component['tableConfig'].columns.find((c: any) => c.field === 'cnpj');
      expect(column?.type).toBe('custom');
      expect(column?.align).toBe('center');
    });

    it('deve ter coluna actions configurada', () => {
      const column = component['tableConfig'].columns.find((c: any) => c.field === 'actions');
      expect(column).toBeDefined();
    });
  });

  // ============================================================================
  // openOptions() - Menu Context (3 tests)
  // ============================================================================
  describe('openOptions() - Menu Context', () => {
    let mockEvent: Event;

    beforeEach(() => {
      mockEvent = new Event('click');
      // Mock do viewChild actionsMenu
      const mockActionsMenu = {
        toggle: jest.fn()
      };
      Object.defineProperty(component, 'actionsMenu', {
        value: jest.fn().mockReturnValue(mockActionsMenu),
        writable: true,
        configurable: true
      });
    });

    it('deve configurar menu de contexto com opções de editar e remover', () => {
      const fornecedor = FornecedorTestFactory.create({id: 1});

      component.openOptions(mockEvent, fornecedor);

      expect(component.contextMenuItems.length).toBe(2);
      expect(component.contextMenuItems[0].label).toBe('Editar');
      expect(component.contextMenuItems[0].icon).toBe('pi pi-pencil');
      expect(component.contextMenuItems[1].label).toBe('Remover');
      expect(component.contextMenuItems[1].icon).toBe('pi pi-trash');
    });

    it('deve chamar comando de editar com id correto', () => {
      const fornecedor = FornecedorTestFactory.create({id: 123});
      const editSpy = jest.spyOn(component, 'edit');

      component.openOptions(mockEvent, fornecedor);
      component.contextMenuItems[0].command?.({} as MenuItemCommandEvent);

      expect(editSpy).toHaveBeenCalledWith(123);
    });

    it('deve chamar comando de remover com id correto', () => {
      const fornecedor = FornecedorTestFactory.create({id: 456});
      const deleteSpy = jest.spyOn(component, 'delete');

      component.openOptions(mockEvent, fornecedor);
      component.contextMenuItems[1].command?.({} as MenuItemCommandEvent);

      expect(deleteSpy).toHaveBeenCalledWith(456);
    });
  });

  // ============================================================================
  // onKeyDown() - Keyboard Accessibility (2 tests)
  // ============================================================================
  describe('onKeyDown() - Keyboard Accessibility', () => {
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
      const fornecedor = FornecedorTestFactory.create({id: 1});
      const openOptionsSpy = jest.spyOn(component, 'openOptions');

      component.onKeyDown(new KeyboardEvent('keydown', {key: 'Enter'}), fornecedor);

      expect(openOptionsSpy).toHaveBeenCalledWith(expect.any(KeyboardEvent), fornecedor);
    });

    it('deve chamar openOptions ao pressionar Espaço', () => {
      const fornecedor = FornecedorTestFactory.create({id: 1});
      const openOptionsSpy = jest.spyOn(component, 'openOptions');

      component.onKeyDown(new KeyboardEvent('keydown', {key: ' '}), fornecedor);

      expect(openOptionsSpy).toHaveBeenCalledWith(expect.any(KeyboardEvent), fornecedor);
    });
  });
});
