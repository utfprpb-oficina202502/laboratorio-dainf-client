import {TestBed, ComponentFixture} from '@angular/core/testing';
import {RouterTestingModule} from '@angular/router/testing';
import {ConfirmationService, MessageService} from 'primeng/api';
import {RelatorioListComponent} from './relatorio.list.component';
import {RelatorioService} from './relatorio.service';
import {LoginService} from '../login/login.service';
import {RelatorioTestFactory} from './relatorio.test-factory';
import {createServiceMock} from '../framework/testing/test-helpers';
import {PermissionService} from '../framework/service/permission.service';
import {LoaderService} from '../framework/loader/loader.service';
import {of} from 'rxjs';
import {Relatorio} from './relatorio';

// Services injetados no TestBed mas não referenciados diretamente nos testes
// São necessários para o componente funcionar mas não são assertados

/**
 * Testes abrangentes para RelatorioListComponent
 * Cobre lógica de permissões, menu de ações customizado e integração com serviços
 */
describe('RelatorioListComponent', () => {
  let component: RelatorioListComponent;
  let fixture: ComponentFixture<RelatorioListComponent>;
  let relatorioService: jest.Mocked<RelatorioService>;
  let loginService: jest.Mocked<LoginService>;

  let mockRelatorios: Relatorio[];

  beforeAll(() => {
    mockRelatorios = RelatorioTestFactory.createList(3);
  });

  beforeEach(async () => {
    const relatorioServiceSpy = createServiceMock<RelatorioService>([
      'findAll',
      'findAllPaged',
      'delete',
      'findOne'
    ]);

    const confirmationServiceSpy = createServiceMock<ConfirmationService>(['confirm']);
    const messageServiceSpy = createServiceMock<MessageService>(['add']);
    const loginServiceSpy = createServiceMock<LoginService>(['isAlunoOrProfessor']);
    const permissionServiceSpy = createServiceMock<PermissionService>([
      'canCreate', 'canEdit', 'canDelete', 'canExport', 'isReadOnly', 'userRole', 'isAlunoOrProfessor'
    ]);
    const loaderServiceSpy = createServiceMock<LoaderService>(['show', 'hide']);

    await TestBed.configureTestingModule({
      imports: [RouterTestingModule, RelatorioListComponent],
      providers: [
        {provide: RelatorioService, useValue: relatorioServiceSpy},
        {provide: ConfirmationService, useValue: confirmationServiceSpy},
        {provide: MessageService, useValue: messageServiceSpy},
        {provide: LoginService, useValue: loginServiceSpy},
        {provide: PermissionService, useValue: permissionServiceSpy},
        {provide: LoaderService, useValue: loaderServiceSpy}
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RelatorioListComponent);
    component = fixture.componentInstance;

    relatorioService = TestBed.inject(RelatorioService) as jest.Mocked<RelatorioService>;
    loginService = TestBed.inject(LoginService) as jest.Mocked<LoginService>;

    // Setup default return values
    relatorioService.findAll.mockReturnValue(of(mockRelatorios));
    relatorioService.findAllPaged.mockReturnValue(of({
      content: mockRelatorios,
      totalElements: mockRelatorios.length,
      totalPages: 1,
      size: mockRelatorios.length,
      number: 0
    }));

    // Mock currentUser signal for permission checks
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
    RelatorioTestFactory.resetIdCounter();
  });

  // ============================================================================
  // Component Setup (5 tests)
  // ============================================================================
  describe('Component Setup', () => {
    it('deve criar o componente', () => {
      expect(component).toBeTruthy();
    });

    it('deve injetar serviços corretamente', () => {
      expect(component['service']).toBe(relatorioService);
    });

    it('deve configurar tabela com colunas corretas', () => {
      expect(component['columnsTable']).toEqual([
        'id',
        'nome',
        'actions'
      ]);
    });

    it('deve definir urlForm corretamente', () => {
      expect(component['urlForm']).toBe('relatorio/form');
    });

    it('deve configurar tableConfig corretamente', () => {
      expect(component['tableConfig'].columns).toBeDefined();
      expect(component['tableConfig'].columns.length).toBe(3);
      expect(component['tableConfig'].stateKey).toBe('relatorio-list');
    });
  });

  // ============================================================================
  // openOptions() - Custom Permission Logic (15 tests)
  // ============================================================================
  describe('openOptions() - Custom Permission Logic', () => {
    let mockEvent: Event;
    let mockRelatorio: Relatorio;

    beforeEach(() => {
      mockEvent = new Event('click');
      mockRelatorio = RelatorioTestFactory.create({id: 1});

      // Mock do viewChild actionsMenu
      const mockActionsMenu = {
        toggle: jest.fn(),
        hide: jest.fn()
      };
      Object.defineProperty(component, 'actionsMenu', {
        value: jest.fn().mockReturnValue(mockActionsMenu),
        writable: true,
        configurable: true
      });
    });

    it('deve mostrar todas as opções para admin/laboratorista', () => {
      // Mock permission methods to return true for admin
      Object.defineProperty(component, 'canEdit', {
        value: () => true,
        writable: true
      });
      Object.defineProperty(component, 'canDelete', {
        value: () => true,
        writable: true
      });
      Object.defineProperty(component, 'isReadOnly', {
        value: () => false,
        writable: true
      });
      Object.defineProperty(component, 'isAlunoOrProfessor', {
        value: () => false,
        writable: true
      });

      component.openOptions(mockEvent, mockRelatorio);

      expect(component.contextMenuItems.length).toBe(3);
      expect(component.contextMenuItems[0].label).toBe('Editar');
      expect(component.contextMenuItems[1].label).toBe('Remover');
      expect(component.contextMenuItems[2].label).toBe('Gerar Relatório');
    });

    it('deve mostrar apenas Visualizar e Gerar Relatório para aluno/professor', () => {
      // Mock permission methods to return false for student/professor
      Object.defineProperty(component, 'canEdit', {
        value: () => false,
        writable: true
      });
      Object.defineProperty(component, 'canDelete', {
        value: () => false,
        writable: true
      });
      Object.defineProperty(component, 'isReadOnly', {
        value: () => false,
        writable: true
      });
      Object.defineProperty(component, 'isAlunoOrProfessor', {
        value: () => true,
        writable: true
      });

      component.openOptions(mockEvent, mockRelatorio);

      expect(component.contextMenuItems.length).toBe(2);
      expect(component.contextMenuItems[0].label).toBe('Visualizar');
      expect(component.contextMenuItems[1].label).toBe('Gerar Relatório');
    });

    it('deve mostrar apenas Visualizar e Gerar Relatório para usuário read-only', () => {
      Object.defineProperty(component, 'canEdit', {
        value: () => false,
        writable: true
      });
      Object.defineProperty(component, 'canDelete', {
        value: () => false,
        writable: true
      });
      Object.defineProperty(component, 'isReadOnly', {
        value: () => true,
        writable: true
      });
      Object.defineProperty(component, 'isAlunoOrProfessor', {
        value: () => false,
        writable: true
      });

      component.openOptions(mockEvent, mockRelatorio);

      expect(component.contextMenuItems.length).toBe(2);
      expect(component.contextMenuItems[0].label).toBe('Visualizar');
      expect(component.contextMenuItems[1].label).toBe('Gerar Relatório');
    });

    it('deve incluir "Editar" apenas para admin/laboratorista', () => {
      Object.defineProperty(component, 'canEdit', {
        value: () => true,
        writable: true
      });
      Object.defineProperty(component, 'isAlunoOrProfessor', {
        value: () => false,
        writable: true
      });

      component.openOptions(mockEvent, mockRelatorio);

      const editItem = component.contextMenuItems.find(item => item.label === 'Editar');
      expect(editItem).toBeTruthy();
      expect(editItem?.icon).toBe('pi pi-pencil');
    });

    it('deve incluir "Remover" apenas para admin/laboratorista', () => {
      Object.defineProperty(component, 'canDelete', {
        value: () => true,
        writable: true
      });
      Object.defineProperty(component, 'isAlunoOrProfessor', {
        value: () => false,
        writable: true
      });

      component.openOptions(mockEvent, mockRelatorio);

      const removeItem = component.contextMenuItems.find(item => item.label === 'Remover');
      expect(removeItem).toBeTruthy();
      expect(removeItem?.icon).toBe('pi pi-trash');
    });

    it('deve incluir "Gerar Relatório" para todos os usuários', () => {
      // Teste com admin
      Object.defineProperty(component, 'isAlunoOrProfessor', {
        value: () => false,
        writable: true
      });

      component.openOptions(mockEvent, mockRelatorio);

      const generateItem = component.contextMenuItems.find(item => item.label === 'Gerar Relatório');
      expect(generateItem).toBeTruthy();
      expect(generateItem?.icon).toBe('pi pi-file-pdf');
    });

    it('deve incluir "Gerar Relatório" para alunos/professores', () => {
      // Teste com aluno/professor
      Object.defineProperty(component, 'isAlunoOrProfessor', {
        value: () => true,
        writable: true
      });

      component.openOptions(mockEvent, mockRelatorio);

      const generateItem = component.contextMenuItems.find(item => item.label === 'Gerar Relatório');
      expect(generateItem).toBeTruthy();
      expect(generateItem?.icon).toBe('pi pi-file-pdf');
    });

    it('deve incluir "Gerar Relatório" para usuários read-only', () => {
      // Teste com read-only
      Object.defineProperty(component, 'isReadOnly', {
        value: () => true,
        writable: true
      });

      component.openOptions(mockEvent, mockRelatorio);

      const generateItem = component.contextMenuItems.find(item => item.label === 'Gerar Relatório');
      expect(generateItem).toBeTruthy();
      expect(generateItem?.icon).toBe('pi pi-file-pdf');
    });

    it('deve limpar contextMenuItems antes de adicionar novos', () => {
      component.contextMenuItems = [{ label: 'Item Antigo', icon: 'pi pi-old' }];
      Object.defineProperty(component, 'isAlunoOrProfessor', {
        value: () => true,
        writable: true
      });

      component.openOptions(mockEvent, mockRelatorio);

      expect(component.contextMenuItems.length).toBe(2);
      expect(component.contextMenuItems[0].label).toBe('Visualizar');
      expect(component.contextMenuItems[1].label).toBe('Gerar Relatório');
    });

    it('deve chamar actionsMenu.toggle() com o evento correto', () => {
      const mockEvent = new Event('click');
      const mockPopover = { toggle: jest.fn() };
      Object.defineProperty(component, 'actionsMenu', {
        value: jest.fn().mockReturnValue(mockPopover),
        writable: true
      });

      component.openOptions(mockEvent, mockRelatorio);

      expect(mockPopover.toggle).toHaveBeenCalledWith(mockEvent);
    });

    it('deve chamar cdr.markForCheck() para atualização da view', () => {
      const mockCdr = { markForCheck: jest.fn() };
      Object.defineProperty(component, 'cdr', {
        value: mockCdr,
        writable: true
      });

      component.openOptions(mockEvent, mockRelatorio);

      expect(mockCdr.markForCheck).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // generateReport() (3 tests)
  // ============================================================================
  describe('generateReport()', () => {
    let navigateSpy: jest.SpyInstance;

    beforeEach(() => {
      navigateSpy = jest.spyOn(component['router'], 'navigate').mockImplementation(() => Promise.resolve(true));
    });

    afterEach(() => {
      navigateSpy.mockRestore();
    });

    it('deve navegar para relatorio/view com o ID correto', () => {
      const relatorioId = 123;

      component.generateReport(relatorioId);

      expect(navigateSpy).toHaveBeenCalledWith(['relatorio/view', relatorioId]);
    });

    it('deve mostrar loader durante a navegação', () => {
      const loaderService = TestBed.inject(LoaderService);
      const showSpy = jest.spyOn(loaderService, 'show');

      component.generateReport(123);

      expect(showSpy).toHaveBeenCalled();
    });

    it('deve funcionar com diferentes IDs', () => {
      const testIds = [1, 42, 999];

      testIds.forEach(id => {
        component.generateReport(id);
        expect(navigateSpy).toHaveBeenCalledWith(['relatorio/view', id]);
      });
    });
  });

  // ============================================================================
  // Base Class Overrides (5 tests)
  // ============================================================================
  describe('Base Class Overrides', () => {
    it('deve retornar nome de arquivo de exportação correto', () => {
      const filename = component['getExportFileName']();

      expect(filename).toBe('relatorios');
    });

    it('deve retornar nome da entidade correto', () => {
      const entityName = component['getEntityName']();

      expect(entityName).toBe('Relatório');
    });

    it('deve retornar nome plural da entidade correto', () => {
      const pluralName = component['getEntityPluralName']();

      expect(pluralName).toBe('Relatórios');
    });

    it('deve lidar com postFindAll (implementação vazia)', () => {
      expect(() => component['postFindAll']()).not.toThrow();
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
  // Integration Tests (4 tests)
  // ============================================================================
  describe('Integration Tests', () => {
    it('deve integrar com RelatorioService', () => {
      expect(component['service']).toBeTruthy();
    });

    it('deve integrar com Router para navegação', () => {
      expect(component['router']).toBeTruthy();
    });

    it('deve ter tableConfig com campos de filtro global', () => {
      expect(component['tableConfig'].globalFilterFields).toContain('id');
      expect(component['tableConfig'].globalFilterFields).toContain('nome');
    });

    it('deve ter campo de ordenação padrão definido', () => {
      expect(component['tableConfig'].defaultSortField).toBe('id');
    });
  });

  // ============================================================================
  // Configuração de Ordenação (3 tests)
  // ============================================================================
  describe('Configuração de Ordenação', () => {
    it('deve ter coluna id com sortable true', () => {
      const column = component['tableConfig'].columns.find(c => c.field === 'id');
      expect(column?.sortable).toBe(true);
    });

    it('deve ter coluna nome com sortable true', () => {
      const column = component['tableConfig'].columns.find(c => c.field === 'nome');
      expect(column?.sortable).toBe(true);
    });

    it('deve ter coluna actions com sortable false', () => {
      const column = component['tableConfig'].columns.find(c => c.field === 'actions');
      expect(column?.sortable).toBe(false);
    });
  });
});
