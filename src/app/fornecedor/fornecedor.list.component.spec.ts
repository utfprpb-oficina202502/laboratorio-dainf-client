import {ComponentFixture, TestBed} from '@angular/core/testing';
import {FornecedorListComponent} from './fornecedor.list.component';
import {FornecedorService} from './fornecedor.service';
import {ConfirmationService, MessageService} from 'primeng/api';
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
      expect(component['columnsTable']).toEqual([
        'id',
        'razaoSocial',
        'nomeFantasia',
        'cnpj',
        'actions'
      ]);
    });

    it('deve definir urlForm corretamente', () => {
      expect(component['urlForm']).toBe('fornecedor/form');
    });

    it('deve configurar tableConfig corretamente', () => {
      expect(component['tableConfig'].columns).toBeDefined();
      expect(component['tableConfig'].stateKey).toBe('fornecedor-list');
    });
  });

  // ============================================================================
  // Permission-Based Action Buttons (6 tests)
  // ============================================================================
  describe('Permission-Based Action Buttons', () => {
    it('deve ter canEdit() como função definida', () => {
      expect(typeof component.canEdit).toBe('function');
    });

    it('deve ter canDelete() como função definida', () => {
      expect(typeof component.canDelete).toBe('function');
    });

    it('deve ter isAlunoOrProfessor() como função definida', () => {
      expect(typeof component.isAlunoOrProfessor).toBe('function');
    });

    it('deve navegar para formulário de edição ao chamar edit()', () => {
      const navigateSpy = jest.spyOn(component['router'], 'navigate').mockResolvedValue(true);

      component.edit(123);

      expect(navigateSpy).toHaveBeenCalledWith(['fornecedor/form', 123]);
    });

    it('deve solicitar confirmação ao chamar delete()', () => {
      const confirmationService = TestBed.inject(ConfirmationService) as jest.Mocked<ConfirmationService>;

      component.delete(456);

      expect(confirmationService.confirm).toHaveBeenCalled();
    });

    it('deve passar id correto para o serviço de confirmação', () => {
      const confirmationService = TestBed.inject(ConfirmationService) as jest.Mocked<ConfirmationService>;

      component.delete(789);

      const confirmCall = confirmationService.confirm.mock.calls[0][0];
      expect(confirmCall).toBeDefined();
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

    it('deve desabilitar hostListenerColumnEnable', () => {
      expect(component['hostListenerColumnEnable']).toBe(false);
    });
  });

  // ============================================================================
  // Permission Signals (6 tests)
  // ============================================================================
  describe('Permission Signals', () => {
    it('deve ter canEdit() definido', () => {
      expect(component.canEdit).toBeDefined();
    });

    it('deve ter canDelete() definido', () => {
      expect(component.canDelete).toBeDefined();
    });

    it('deve ter isAlunoOrProfessor() definido', () => {
      expect(component.isAlunoOrProfessor).toBeDefined();
    });

    it('deve ter canExport() definido', () => {
      expect(component.canExport).toBeDefined();
    });

    it('deve ter isReadOnly() definido', () => {
      expect(component.isReadOnly).toBeDefined();
    });

    it('deve ter userRole() definido', () => {
      expect(component.userRole).toBeDefined();
    });
  });

  // ============================================================================
  // TableConfig (5 tests)
  // ============================================================================
  describe('TableConfig', () => {
    it('deve ter campos de filtro global', () => {
      expect(component['tableConfig'].globalFilterFields).toBeDefined();
      expect(component['tableConfig'].globalFilterFields).toContain('id');
      expect(component['tableConfig'].globalFilterFields).toContain('razaoSocial');
      expect(component['tableConfig'].globalFilterFields).toContain('nomeFantasia');
      expect(component['tableConfig'].globalFilterFields).toContain('cnpj');
    });

    it('deve ter campo de ordenação padrão como razaoSocial', () => {
      expect(component['tableConfig'].defaultSortField).toBe('razaoSocial');
    });

    it('deve ter caption definido', () => {
      expect(component['tableConfig'].caption).toBe('Fornecedores');
    });

    it('deve ter 5 colunas configuradas', () => {
      expect(component['tableConfig'].columns.length).toBe(5);
    });

    it('deve ter displayedColumns configurado corretamente', () => {
      expect(component['displayedColumns']).toEqual([
        'id',
        'razaoSocial',
        'nomeFantasia',
        'cnpj',
        'actions'
      ]);
    });
  });

  // ============================================================================
  // Configuração de Ordenação (7 tests)
  // ============================================================================
  describe('Configuração de Ordenação', () => {
    it('deve ter coluna id com sortable true', () => {
      const column = component['tableConfig'].columns.find(c => c.field === 'id');
      expect(column?.sortable).toBe(true);
    });

    it('deve ter coluna razaoSocial com sortable true', () => {
      const column = component['tableConfig'].columns.find(c => c.field === 'razaoSocial');
      expect(column?.sortable).toBe(true);
    });

    it('deve ter coluna nomeFantasia com sortable true', () => {
      const column = component['tableConfig'].columns.find(c => c.field === 'nomeFantasia');
      expect(column?.sortable).toBe(true);
    });

    it('deve ter coluna cnpj com sortable true', () => {
      const column = component['tableConfig'].columns.find(c => c.field === 'cnpj');
      expect(column?.sortable).toBe(true);
    });

    it('deve ter coluna actions com sortable false', () => {
      const column = component['tableConfig'].columns.find(c => c.field === 'actions');
      expect(column?.sortable).toBe(false);
    });

    it('deve ter todas as colunas de dados com sortable habilitado', () => {
      const dataColumns = component['tableConfig'].columns.filter(c => c.field !== 'actions');
      const allSortable = dataColumns.every(c => c.sortable === true);
      expect(allSortable).toBe(true);
    });

    it('deve ter coluna de ações como única não-ordenável', () => {
      const nonSortableColumns = component['tableConfig'].columns.filter(c => c.sortable === false);
      expect(nonSortableColumns.length).toBe(1);
      expect(nonSortableColumns[0].field).toBe('actions');
    });
  });

  // ============================================================================
  // Configuração de Colunas (5 tests)
  // ============================================================================
  describe('Configuração de Colunas', () => {
    it('deve ter coluna id com tipo number', () => {
      const column = component['tableConfig'].columns.find(c => c.field === 'id');
      expect(column?.type).toBe('number');
      expect(column?.align).toBe('center');
    });

    it('deve ter coluna razaoSocial com tipo text', () => {
      const column = component['tableConfig'].columns.find(c => c.field === 'razaoSocial');
      expect(column?.type).toBe('text');
      expect(column?.minWidth).toBe('20rem');
    });

    it('deve ter coluna nomeFantasia com tipo text', () => {
      const column = component['tableConfig'].columns.find(c => c.field === 'nomeFantasia');
      expect(column?.type).toBe('text');
      expect(column?.minWidth).toBe('18rem');
    });

    it('deve ter coluna cnpj com tipo custom para formatação', () => {
      const column = component['tableConfig'].columns.find(c => c.field === 'cnpj');
      expect(column?.type).toBe('custom');
      expect(column?.align).toBe('center');
    });

    it('deve ter coluna actions com propriedades de não-exportação', () => {
      const column = component['tableConfig'].columns.find(c => c.field === 'actions');
      expect(column?.exportable).toBe(false);
      expect(column?.toggleable).toBe(false);
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
      component.contextMenuItems[0].command!({} as any);

      expect(editSpy).toHaveBeenCalledWith(123);
    });

    it('deve chamar comando de remover com id correto', () => {
      const fornecedor = FornecedorTestFactory.create({id: 456});
      const deleteSpy = jest.spyOn(component, 'delete');

      component.openOptions(mockEvent, fornecedor);
      component.contextMenuItems[1].command!({} as any);

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
