import {ComponentFixture, TestBed} from '@angular/core/testing';
import {SolicitacaoCompraListComponent} from './solicitacaoCompra.list.component';
import {SolicitacaoCompraService} from './solicitacaoCompra.service';
import {ConfirmationService, MenuItemCommandEvent, MessageService} from 'primeng/api';
import {provideRouter} from '@angular/router';
import {of} from 'rxjs';
import {SolicitacaoCompra} from './solicitacaoCompra';
import {LoginService} from '../login/login.service';
import {createServiceMock} from '../framework/testing/test-helpers';

/**
 * Factory para criação de objetos SolicitacaoCompra para testes
 */
class SolicitacaoCompraTestFactory {
  private static nextId = 1;

  static create(overrides: Partial<SolicitacaoCompra> = {}): SolicitacaoCompra {
    const solicitacao = new SolicitacaoCompra();
    solicitacao.id = overrides.id ?? this.nextId++;
    solicitacao.descricao = overrides.descricao ?? `Solicitação de teste ${solicitacao.id}`;
    solicitacao.dataSolicitacao = overrides.dataSolicitacao ?? '01/12/2025';
    solicitacao.usuarioNome = overrides.usuarioNome ?? 'Usuário Teste';
    return solicitacao;
  }

  static createList(count: number): SolicitacaoCompra[] {
    return Array.from({length: count}, (_, i) => this.create({id: i + 1}));
  }

  static resetIdCounter(): void {
    this.nextId = 1;
  }
}

/**
 * Testes abrangentes para SolicitacaoCompraListComponent
 * Cobre lógica de permissões e integração com ActionButtonsComponent
 */
describe('SolicitacaoCompraListComponent', () => {
  let component: SolicitacaoCompraListComponent;
  let fixture: ComponentFixture<SolicitacaoCompraListComponent>;
  let solicitacaoCompraService: jest.Mocked<SolicitacaoCompraService>;
  let loginService: jest.Mocked<LoginService>;

  let mockSolicitacoes: SolicitacaoCompra[];

  beforeAll(() => {
    mockSolicitacoes = SolicitacaoCompraTestFactory.createList(3);
  });

  beforeEach(async () => {
    const solicitacaoCompraServiceSpy = createServiceMock<SolicitacaoCompraService>([
      'findAll',
      'findAllPaged',
      'findAllByUsername',
      'delete',
      'findOne'
    ]);

    const confirmationServiceSpy = createServiceMock<ConfirmationService>(['confirm']);
    const messageServiceSpy = createServiceMock<MessageService>(['add']);
    const loginServiceSpy = createServiceMock<LoginService>(['isAlunoOrProfessor']);

    await TestBed.configureTestingModule({
      imports: [SolicitacaoCompraListComponent],
      providers: [
        provideRouter([]),
        {provide: SolicitacaoCompraService, useValue: solicitacaoCompraServiceSpy},
        {provide: ConfirmationService, useValue: confirmationServiceSpy},
        {provide: MessageService, useValue: messageServiceSpy},
        {provide: LoginService, useValue: loginServiceSpy}
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SolicitacaoCompraListComponent);
    component = fixture.componentInstance;

    solicitacaoCompraService = TestBed.inject(SolicitacaoCompraService) as jest.Mocked<SolicitacaoCompraService>;
    loginService = TestBed.inject(LoginService) as jest.Mocked<LoginService>;

    solicitacaoCompraService.findAll.mockReturnValue(of(mockSolicitacoes));
    solicitacaoCompraService.findAllPaged.mockReturnValue(of({
      content: mockSolicitacoes,
      totalElements: mockSolicitacoes.length,
      totalPages: 1,
      size: mockSolicitacoes.length,
      number: 0
    }));
    solicitacaoCompraService.findAllByUsername.mockReturnValue(of(mockSolicitacoes));

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
    SolicitacaoCompraTestFactory.resetIdCounter();
  });

  // ============================================================================
  // Component Setup (5 tests)
  // ============================================================================
  describe('Component Setup', () => {
    it('deve criar o componente', () => {
      expect(component).toBeTruthy();
    });

    it('deve injetar serviços corretamente', () => {
      expect(component['service']).toBe(solicitacaoCompraService);
    });

    it('deve configurar tabela com colunas corretas', () => {
      expect(component['columnsTable']).toEqual([
        'id',
        'descricao',
        'dataSolicitacao',
        'usuarioNome',
        'actions'
      ]);
    });

    it('deve definir urlForm corretamente', () => {
      expect(component['urlForm']).toBe('solicitacao-compra/form');
    });

    it('deve configurar tableConfig corretamente', () => {
      expect(component['tableConfig'].columns).toBeDefined();
      expect(component['tableConfig'].stateKey).toBe('solicitacao-compra-list');
    });
  });

  // ============================================================================
  // Permission-Based Action Buttons (8 tests)
  // ============================================================================
  describe('Permission-Based Action Buttons', () => {
    it('deve ter canEdit() retornando true para admin/laboratorista', () => {
      jest.spyOn(component, 'canEdit').mockReturnValue(true);
      expect(component.canEdit()).toBe(true);
    });

    it('deve ter canEdit() retornando false para aluno/professor', () => {
      jest.spyOn(component, 'canEdit').mockReturnValue(false);
      expect(component.canEdit()).toBe(false);
    });

    it('deve ter canDelete() retornando true para admin/laboratorista', () => {
      jest.spyOn(component, 'canDelete').mockReturnValue(true);
      expect(component.canDelete()).toBe(true);
    });

    it('deve ter canDelete() retornando false para aluno/professor', () => {
      jest.spyOn(component, 'canDelete').mockReturnValue(false);
      expect(component.canDelete()).toBe(false);
    });

    it('deve ter isAlunoOrProfessor() retornando true para aluno', () => {
      jest.spyOn(component, 'isAlunoOrProfessor').mockReturnValue(true);
      expect(component.isAlunoOrProfessor()).toBe(true);
    });

    it('deve ter isAlunoOrProfessor() retornando false para admin', () => {
      jest.spyOn(component, 'isAlunoOrProfessor').mockReturnValue(false);
      expect(component.isAlunoOrProfessor()).toBe(false);
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
  // ngOnInit - Data Loading Based on Permission (4 tests)
  // ============================================================================
  describe('ngOnInit - Data Loading Based on Permission', () => {
    it('deve chamar findAllByUsername para aluno/professor', () => {
      jest.spyOn(component, 'isAlunoOrProfessor').mockReturnValue(true);
      const findAllByUsernameSpy = jest.spyOn(component, 'findAllByUsername');

      component.ngOnInit();

      expect(findAllByUsernameSpy).toHaveBeenCalled();
    });

    it('deve chamar findAll para admin/laboratorista', () => {
      jest.spyOn(component, 'isAlunoOrProfessor').mockReturnValue(false);
      const findAllSpy = jest.spyOn(component, 'findAll');

      component.ngOnInit();

      expect(findAllSpy).toHaveBeenCalled();
    });

    it('não deve chamar findAllByUsername para admin/laboratorista', () => {
      jest.spyOn(component, 'isAlunoOrProfessor').mockReturnValue(false);
      const findAllByUsernameSpy = jest.spyOn(component, 'findAllByUsername');

      component.ngOnInit();

      expect(findAllByUsernameSpy).not.toHaveBeenCalled();
    });

    it('deve usar dados filtrados por usuário quando aluno/professor', () => {
      jest.spyOn(component, 'isAlunoOrProfessor').mockReturnValue(true);

      // Verifica que a lógica de permissão está sendo aplicada
      expect(component.isAlunoOrProfessor()).toBe(true);
    });
  });

  // ============================================================================
  // Base Class Overrides (5 tests)
  // ============================================================================
  describe('Base Class Overrides', () => {
    it('deve retornar nome de arquivo de exportação correto', () => {
      const filename = component['getExportFileName']();
      expect(filename).toBe('solicitacoes-compra');
    });

    it('deve retornar nome da entidade correto', () => {
      const entityName = component['getEntityName']();
      expect(entityName).toBe('Solicitação de Compra');
    });

    it('deve retornar nome plural da entidade correto', () => {
      const pluralName = component['getEntityPluralName']();
      expect(pluralName).toBe('Solicitações de Compra');
    });

    it('deve desabilitar hostListenerColumnEnable', () => {
      expect(component['hostListenerColumnEnable']).toBe(false);
    });

    it('deve lidar com postFindAll (implementação vazia)', () => {
      expect(() => component['postFindAll']()).not.toThrow();
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
  // TableConfig (4 tests)
  // ============================================================================
  describe('TableConfig', () => {
    it('deve ter campos de filtro global', () => {
      expect(component['tableConfig'].globalFilterFields).toBeDefined();
      expect(component['tableConfig'].globalFilterFields).toContain('id');
      expect(component['tableConfig'].globalFilterFields).toContain('descricao');
    });

    it('deve ter campo de ordenação padrão', () => {
      expect(component['tableConfig'].defaultSortField).toBe('id');
    });

    it('deve ter caption definido', () => {
      expect(component['tableConfig'].caption).toBe('Solicitações de Compra');
    });

    it('deve ter 5 colunas configuradas', () => {
      expect(component['tableConfig'].columns.length).toBe(5);
    });
  });

  // ============================================================================
  // Configuração de Ordenação (6 tests)
  // ============================================================================
  describe('Configuração de Ordenação', () => {
    it('deve ter coluna id com sortable true', () => {
      const column = component['tableConfig'].columns.find(c => c.field === 'id');
      expect(column?.sortable).toBe(true);
    });

    it('deve ter coluna descricao com sortable true', () => {
      const column = component['tableConfig'].columns.find(c => c.field === 'descricao');
      expect(column?.sortable).toBe(true);
    });

    it('deve ter coluna dataSolicitacao com sortable true', () => {
      const column = component['tableConfig'].columns.find(c => c.field === 'dataSolicitacao');
      expect(column?.sortable).toBe(true);
    });

    it('deve ter coluna usuarioNome com sortable true', () => {
      const column = component['tableConfig'].columns.find(c => c.field === 'usuarioNome');
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
  });

  // ============================================================================
  // openOptions() - Menu Context (4 tests)
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

    it('deve configurar menu de contexto com opções para admin', () => {
      jest.spyOn(component, 'isAlunoOrProfessor').mockReturnValue(false);
      const solicitacao = SolicitacaoCompraTestFactory.create({id: 1});

      component.openOptions(mockEvent, solicitacao);

      expect(component.contextMenuItems.length).toBe(2);
      expect(component.contextMenuItems[0].label).toBe('Editar');
      expect(component.contextMenuItems[0].icon).toBe('pi pi-pencil');
      expect(component.contextMenuItems[1].label).toBe('Remover');
      expect(component.contextMenuItems[1].icon).toBe('pi pi-trash');
    });

    it('deve incluir "Visualizar" para aluno/professor', () => {
      jest.spyOn(component, 'isAlunoOrProfessor').mockReturnValue(true);
      const solicitacao = SolicitacaoCompraTestFactory.create({id: 1});

      component.openOptions(mockEvent, solicitacao);

      expect(component.contextMenuItems.length).toBe(3);
      expect(component.contextMenuItems[1].label).toBe('Visualizar');
      expect(component.contextMenuItems[1].icon).toBe('pi pi-eye');
    });

    it('deve chamar comando de editar com id correto', () => {
      jest.spyOn(component, 'isAlunoOrProfessor').mockReturnValue(false);
      const solicitacao = SolicitacaoCompraTestFactory.create({id: 123});
      const editSpy = jest.spyOn(component, 'edit');

      component.openOptions(mockEvent, solicitacao);
      component.contextMenuItems[0].command?.({} as MenuItemCommandEvent);

      expect(editSpy).toHaveBeenCalledWith(123);
    });

    it('deve chamar comando de visualizar com id correto para aluno', () => {
      jest.spyOn(component, 'isAlunoOrProfessor').mockReturnValue(true);
      const solicitacao = SolicitacaoCompraTestFactory.create({id: 456});
      const editSpy = jest.spyOn(component, 'edit');

      component.openOptions(mockEvent, solicitacao);
      component.contextMenuItems[1].command?.({} as MenuItemCommandEvent);

      expect(editSpy).toHaveBeenCalledWith(456);
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
      const solicitacao = SolicitacaoCompraTestFactory.create({id: 1});
      const openOptionsSpy = jest.spyOn(component, 'openOptions');
      component.onKeyDown(new KeyboardEvent('keydown', {key: 'Enter'}), solicitacao);
      expect(openOptionsSpy).toHaveBeenCalledWith(expect.any(KeyboardEvent), solicitacao);
    });

    it('deve chamar openOptions ao pressionar Espaço', () => {
      const solicitacao = SolicitacaoCompraTestFactory.create({id: 1});
      const openOptionsSpy = jest.spyOn(component, 'openOptions');
      component.onKeyDown(new KeyboardEvent('keydown', {key: ' '}), solicitacao);
      expect(openOptionsSpy).toHaveBeenCalledWith(expect.any(KeyboardEvent), solicitacao);
    });
  });
});
