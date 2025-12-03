import {ComponentFixture, TestBed} from '@angular/core/testing';
import {ReservaListComponent} from './reserva.list.component';
import {ReservaService} from './reserva.service';
import {ConfirmationService, MessageService} from 'primeng/api';
import {RouterTestingModule} from '@angular/router/testing';
import {of} from 'rxjs';
import {Reserva} from './reserva';
import {LoginService} from '../login/login.service';
import {ReservaTestFactory} from './reserva.test-factory';
import {createServiceMock} from '../framework/testing/test-helpers';
import {PermissionService} from '../framework/service/permission.service';

// Services injetados no TestBed mas não referenciados diretamente nos testes
// São necessários para o componente funcionar mas não são assertados

/**
 * Testes abrangentes para ReservaListComponent
 * Cobre lógica de permissões, menu de ações e integração com serviços
 */
describe('ReservaListComponent', () => {
  let component: ReservaListComponent;
  let fixture: ComponentFixture<ReservaListComponent>;
  let reservaService: jest.Mocked<ReservaService>;
  let loginService: jest.Mocked<LoginService>;

  let mockReservas: Reserva[];

  beforeAll(() => {
    mockReservas = ReservaTestFactory.createList(3);
  });

  beforeEach(async () => {
    const reservaServiceSpy = createServiceMock<ReservaService>([
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

    await TestBed.configureTestingModule({
      imports: [RouterTestingModule, ReservaListComponent],
      providers: [
        {provide: ReservaService, useValue: reservaServiceSpy},
        {provide: ConfirmationService, useValue: confirmationServiceSpy},
        {provide: MessageService, useValue: messageServiceSpy},
        {provide: LoginService, useValue: loginServiceSpy},
        {provide: PermissionService, useValue: permissionServiceSpy}
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ReservaListComponent);
    component = fixture.componentInstance;

    reservaService = TestBed.inject(ReservaService) as jest.Mocked<ReservaService>;
    loginService = TestBed.inject(LoginService) as jest.Mocked<LoginService>;

    // Setup default return values
    reservaService.findAll.mockReturnValue(of(mockReservas));
    reservaService.findAllPaged.mockReturnValue(of({
      content: mockReservas,
      totalElements: mockReservas.length,
      totalPages: 1,
      size: mockReservas.length,
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
    ReservaTestFactory.resetIdCounter();
  });

  // ============================================================================
  // Component Setup (5 tests)
  // ============================================================================
  describe('Component Setup', () => {
    it('deve criar o componente', () => {
      expect(component).toBeTruthy();
    });

    it('deve injetar serviços corretamente', () => {
      expect(component['service']).toBe(reservaService);
    });

    it('deve configurar tabela com colunas corretas', () => {
      expect(component['columnsTable']).toEqual([
        'id',
        'descricao',
        'dataReserva',
        'dataRetirada',
        'usuarioNome',
        'actions'
      ]);
    });

    it('deve definir urlForm corretamente', () => {
      expect(component['urlForm']).toBe('reserva/form');
    });

    it('deve configurar tableConfig corretamente', () => {
      expect(component['tableConfig'].columns).toBeDefined();
      expect(component['tableConfig'].columns.length).toBe(6);
      expect(component['tableConfig'].stateKey).toBe('reserva-list');
    });
  });

  // ============================================================================
  // openOptions() - Permission Logic (12 tests)
  // ============================================================================
  describe('openOptions() - Permission Logic', () => {
    let mockEvent: Event;
    let mockReserva: Reserva;

    beforeEach(() => {
      mockEvent = new Event('click');
      mockReserva = ReservaTestFactory.create({id: 1});

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

      component.openOptions(mockEvent, mockReserva);

      expect(component.contextMenuItems.length).toBe(3);
      expect(component.contextMenuItems[0].label).toBe('Gerar Empréstimo');
      expect(component.contextMenuItems[1].label).toBe('Editar');
      expect(component.contextMenuItems[2].label).toBe('Remover');
    });

    it('deve mostrar apenas Visualizar para aluno/professor', () => {
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

      component.openOptions(mockEvent, mockReserva);

      expect(component.contextMenuItems.length).toBe(1);
      expect(component.contextMenuItems[0].label).toBe('Visualizar');
    });

    it('deve incluir "Gerar Empréstimo" apenas para admin/laboratorista', () => {
      Object.defineProperty(component, 'isAlunoOrProfessor', {
        value: () => false,
        writable: true
      });

      component.openOptions(mockEvent, mockReserva);

      const gerarEmprestimoItem = component.contextMenuItems.find(item => item.label === 'Gerar Empréstimo');
      expect(gerarEmprestimoItem).toBeTruthy();
      expect(gerarEmprestimoItem?.icon).toBe('pi pi-handshake');
    });

    it('não deve incluir "Gerar Empréstimo" para aluno/professor', () => {
      Object.defineProperty(component, 'isAlunoOrProfessor', {
        value: () => true,
        writable: true
      });

      component.openOptions(mockEvent, mockReserva);

      const gerarEmprestimoItem = component.contextMenuItems.find(item => item.label === 'Gerar Empréstimo');
      expect(gerarEmprestimoItem).toBeUndefined();
    });

    it('deve mostrar ícone "Editar" para admin/laboratorista', () => {
      Object.defineProperty(component, 'canEdit', {
        value: () => true,
        writable: true
      });
      Object.defineProperty(component, 'isAlunoOrProfessor', {
        value: () => false,
        writable: true
      });

      component.openOptions(mockEvent, mockReserva);

      const editItem = component.contextMenuItems.find(item => item.label === 'Editar');
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

      component.openOptions(mockEvent, mockReserva);

      const removeItem = component.contextMenuItems.find(item => item.label === 'Remover');
      expect(removeItem).toBeTruthy();
      expect(removeItem?.icon).toBe('pi pi-trash');
    });

    it('não deve incluir "Remover" para aluno/professor', () => {
      Object.defineProperty(component, 'isAlunoOrProfessor', {
        value: () => true,
        writable: true
      });

      component.openOptions(mockEvent, mockReserva);

      const removeItem = component.contextMenuItems.find(item => item.label === 'Remover');
      expect(removeItem).toBeUndefined();
    });

    it('deve limpar contextMenuItems antes de adicionar novos', () => {
      component.contextMenuItems = [{ label: 'Item Antigo', icon: 'pi pi-old' }];
      Object.defineProperty(component, 'isAlunoOrProfessor', {
        value: () => true,
        writable: true
      });

      component.openOptions(mockEvent, mockReserva);

      expect(component.contextMenuItems.length).toBe(1);
      expect(component.contextMenuItems[0].label).toBe('Visualizar');
    });

    it('deve definir selectedReserva corretamente', () => {
      const reserva = ReservaTestFactory.createFutura();
      component.openOptions(mockEvent, reserva);

      expect(component.selectedReserva).toBe(reserva);
    });

    it('deve chamar actionsMenu.toggle() com o evento correto', () => {
      const mockEvent = new Event('click');
      const mockPopover = { toggle: jest.fn() };
      Object.defineProperty(component, 'actionsMenu', {
        value: jest.fn().mockReturnValue(mockPopover),
        writable: true
      });

      component.openOptions(mockEvent, mockReserva);

      expect(mockPopover.toggle).toHaveBeenCalledWith(mockEvent);
    });

    it('deve chamar cdr.markForCheck() para atualização da view', () => {
      const mockCdr = { markForCheck: jest.fn() };
      Object.defineProperty(component, 'cdr', {
        value: mockCdr,
        writable: true
      });

      component.openOptions(mockEvent, mockReserva);

      expect(mockCdr.markForCheck).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // finalizarReserva() (3 tests)
  // ============================================================================
  describe('finalizarReserva()', () => {
    let mockReserva: Reserva;
    let setItemSpy: jest.SpyInstance;

    beforeEach(() => {
      mockReserva = ReservaTestFactory.create({id: 123});
      jest.spyOn(component['router'], 'navigate').mockImplementation(() => Promise.resolve(true));
      // No-op: localStorage.setItem é mockado para evitar efeitos colaterais
      setItemSpy = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => undefined);
    });

    afterEach(() => {
      setItemSpy.mockRestore();
    });

    it('deve salvar reserva no localStorage', () => {
      component.finalizarReserva(mockReserva);

      expect(setItemSpy).toHaveBeenCalledWith(
        'reserva-to-emprestimo',
        JSON.stringify(mockReserva)
      );
    });

    it('deve navegar para emprestimo/form/reserva', () => {
      component.finalizarReserva(mockReserva);

      expect(component['router'].navigate).toHaveBeenCalledWith(['emprestimo/form/reserva']);
    });

    it('deve passar dados corretos da reserva', () => {
      component.finalizarReserva(mockReserva);

      const savedData = JSON.parse(setItemSpy.mock.calls[0][1]);
      expect(savedData.id).toBe(123);
    });
  });

  // ============================================================================
  // Base Class Overrides (5 tests)
  // ============================================================================
  describe('Base Class Overrides', () => {
    it('deve retornar nome de arquivo de exportação correto', () => {
      const filename = component['getExportFileName']();

      expect(filename).toBe('reservas');
    });

    it('deve retornar nome da entidade correto', () => {
      const entityName = component['getEntityName']();

      expect(entityName).toBe('Reserva');
    });

    it('deve retornar nome plural da entidade correto', () => {
      const pluralName = component['getEntityPluralName']();

      expect(pluralName).toBe('Reservas');
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
    it('deve integrar com ReservaService', () => {
      expect(component['service']).toBeTruthy();
    });

    it('deve integrar com Router para navegação', () => {
      expect(component['router']).toBeTruthy();
    });

    it('deve ter tableConfig com campos de filtro global', () => {
      expect(component['tableConfig'].globalFilterFields).toContain('id');
      expect(component['tableConfig'].globalFilterFields).toContain('descricao');
    });

    it('deve ter campo de ordenação padrão definido', () => {
      expect(component['tableConfig'].defaultSortField).toBe('id');
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

    it('deve ter coluna dataReserva com sortable true', () => {
      const column = component['tableConfig'].columns.find(c => c.field === 'dataReserva');
      expect(column?.sortable).toBe(true);
    });

    it('deve ter coluna dataRetirada com sortable true', () => {
      const column = component['tableConfig'].columns.find(c => c.field === 'dataRetirada');
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
  });
});
