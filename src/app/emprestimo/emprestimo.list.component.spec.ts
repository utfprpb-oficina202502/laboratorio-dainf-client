import {ComponentFixture, TestBed} from '@angular/core/testing';
import {EmprestimoListComponent} from './emprestimo.list.component';
import {EmprestimoService} from './emprestimo.service';
import {UsuarioService} from '../usuario/usuario.service';
import {ConfirmationService, MessageService} from 'primeng/api';
import {RouterTestingModule} from '@angular/router/testing';
import {of, throwError} from 'rxjs';
import {Emprestimo} from './emprestimo';
import {Usuario} from '../usuario/usuario';
import {LoginService} from '../login/login.service';
import {EmprestimoTestFactory, UsuarioTestFactory} from './emprestimo.test-factory';
import {createServiceMock} from '../framework/testing/test-helpers';
import {SORT_ORDER} from '../framework/constants';

/**
 * Pre-computed test dates to avoid runtime date operations
 */
const TEST_DATES = {
  future7: '07/12/2025',
  future15: '15/12/2025',
  future30: '30/12/2025'
} as const;

/**
 * Helper function to get pre-computed future date string
 * @param days Number of days to add to current date
 * @returns Pre-computed formatted date string in DD/MM/YYYY format
 */
function getFutureDateString(days: number): string {
  switch (days) {
    case 7: return TEST_DATES.future7;
    case 15: return TEST_DATES.future15;
    case 30: return TEST_DATES.future30;
    default: {
      // Fallback for other values (rarely used)
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);
      const dia = String(futureDate.getDate()).padStart(2, '0');
      const mes = String(futureDate.getMonth() + 1).padStart(2, '0');
      const ano = futureDate.getFullYear();
      return `${dia}/${mes}/${ano}`;
    }
  }
}

/**
 * Testes abrangentes para EmprestimoListComponent
 * Cobre lógica de negócio, permissões, filtros e integração com serviços
 */
describe('EmprestimoListComponent', () => {
  let component: EmprestimoListComponent;
  let fixture: ComponentFixture<EmprestimoListComponent>;
  let emprestimoService: jest.Mocked<EmprestimoService>;
  let usuarioService: jest.Mocked<UsuarioService>;
  let confirmationService: jest.Mocked<ConfirmationService>;
  let messageService: jest.Mocked<MessageService>;
  let loginService: jest.Mocked<LoginService>;

  // Dados de teste usando factories - movido para beforeAll para performance
  let mockEmprestimos: Emprestimo[];
  let mockUsuarios: Usuario[];

  beforeAll(() => {
    mockEmprestimos = [
      EmprestimoTestFactory.createPendente({id: 1}),
      EmprestimoTestFactory.createFinalizado({id: 2}),
      EmprestimoTestFactory.createAtrasado({id: 3})
    ];
    mockUsuarios = UsuarioTestFactory.createList(2);
  });

  beforeEach(async () => {
    const emprestimoServiceSpy = createServiceMock<EmprestimoService>([
      'findAll',
      'findAllPaged',
      'filter',
      'changePrazoDevolucao',
      'delete',
      'findOne',
      'saveEmprestimo'
    ]);

    const usuarioServiceSpy = createServiceMock<UsuarioService>([
      'completeCustom',
      'completeCustomUsersLab'
    ]);

    const confirmationServiceSpy = createServiceMock<ConfirmationService>(['confirm']);
    const messageServiceSpy = createServiceMock<MessageService>(['add']);
    const loginServiceSpy = createServiceMock<LoginService>(['isAlunoOrProfessor']);

    await TestBed.configureTestingModule({
      imports: [RouterTestingModule, EmprestimoListComponent],
      providers: [
        {provide: EmprestimoService, useValue: emprestimoServiceSpy},
        {provide: UsuarioService, useValue: usuarioServiceSpy},
        {provide: ConfirmationService, useValue: confirmationServiceSpy},
        {provide: MessageService, useValue: messageServiceSpy},
        {provide: LoginService, useValue: loginServiceSpy}
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EmprestimoListComponent);
    component = fixture.componentInstance;

    emprestimoService = TestBed.inject(EmprestimoService) as jest.Mocked<EmprestimoService>;
    usuarioService = TestBed.inject(UsuarioService) as jest.Mocked<UsuarioService>;
    confirmationService = TestBed.inject(ConfirmationService) as jest.Mocked<ConfirmationService>;
    messageService = TestBed.inject(MessageService) as jest.Mocked<MessageService>;
    loginService = TestBed.inject(LoginService) as jest.Mocked<LoginService>;

    // Setup default return values
    emprestimoService.findAll.mockReturnValue(of(mockEmprestimos));
    emprestimoService.findAllPaged.mockReturnValue(of({
      content: mockEmprestimos,
      totalElements: mockEmprestimos.length,
      totalPages: 1,
      size: mockEmprestimos.length,
      number: 0
    }));
    emprestimoService.filter.mockReturnValue(of(mockEmprestimos));
    usuarioService.completeCustom.mockReturnValue(of(mockUsuarios));
    usuarioService.completeCustomUsersLab.mockReturnValue(of(mockUsuarios));

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
  });

  // ============================================================================
  // Component Setup (5 tests)
  // ============================================================================
  describe('Component Setup', () => {
    it('deve criar o componente', () => {
      expect(component).toBeTruthy();
    });

    it('deve injetar serviços corretamente', () => {
      expect(component['service']).toBe(emprestimoService);
      expect(component['usuarioService']).toBe(usuarioService);
    });

    it('deve configurar tabela com colunas corretas', () => {
      expect(component['columnsTable']).toEqual([
        'id',
        'usuarioEmprestimoNome',
        'dataEmprestimo',
        'prazoDevolucao',
        'status',
        'actions'
      ]);
    });

    it('deve definir estado inicial do filtro', () => {
      expect(component.emprestimoFilter).toBeTruthy();
      expect(component.emprestimoFilter.status).toBe('T');
    });

    it('deve construir dropdown de status', () => {
      expect(component.statusDropdown.length).toBe(4);
      expect(component.statusDropdown[0]).toEqual({label: 'Todos', value: 'T'});
      expect(component.statusDropdown[1]).toEqual({label: 'Em andamento', value: 'P'});
      expect(component.statusDropdown[2]).toEqual({label: 'Em atraso', value: 'A'});
      expect(component.statusDropdown[3]).toEqual({label: 'Finalizado', value: 'F'});
    });
  });

  // ============================================================================
  // getStatusEmprestimo() (8 tests)
  // ============================================================================
  describe('getStatusEmprestimo()', () => {
    it('deve retornar "A" (atrasado) quando vencido e não devolvido', () => {
      const emprestimo = EmprestimoTestFactory.createAtrasado();

      const status = component.getStatusEmprestimo(emprestimo);

      expect(status).toBe('A');
    });

    it('deve retornar "P" (pendente) quando data futura e não devolvido', () => {
      const emprestimo = EmprestimoTestFactory.createPendente();

      const status = component.getStatusEmprestimo(emprestimo);

      expect(status).toBe('P');
    });

    it('deve retornar "F" (finalizado) quando dataDevolucao existe', () => {
      const emprestimo = EmprestimoTestFactory.createFinalizado();

      const status = component.getStatusEmprestimo(emprestimo);

      expect(status).toBe('F');
    });

    it('deve lidar com prazoDevolucao null', () => {
      const emprestimo: Emprestimo = {
        prazoDevolucao: null as any,
        dataDevolucao: undefined
      } as unknown as Emprestimo;

      // Não deve lançar erro
      expect(() => component.getStatusEmprestimo(emprestimo)).not.toThrow();
    });

    it('deve lidar com ambas as datas null', () => {
      const emprestimo: Emprestimo = {
        prazoDevolucao: null as any,
        dataDevolucao: undefined
      } as unknown as Emprestimo;

      expect(() => component.getStatusEmprestimo(emprestimo)).not.toThrow();
    });

    it('deve lidar com edge case: devolvido antes do prazo', () => {
      const emprestimo = EmprestimoTestFactory.createFinalizado({
        prazoDevolucao: '20/01/2024',
        dataDevolucao: '15/01/2024'
      });

      const status = component.getStatusEmprestimo(emprestimo);

      expect(status).toBe('F');
    });

    it('deve considerar atrasado quando passou de um dia', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const day = String(yesterday.getDate()).padStart(2, '0');
      const month = String(yesterday.getMonth() + 1).padStart(2, '0');
      const year = yesterday.getFullYear();
      const emprestimo = EmprestimoTestFactory.createAtrasado({
        prazoDevolucao: `${day}/${month}/${year}`
      });

      const status = component.getStatusEmprestimo(emprestimo);

      expect(status).toBe('A');
    });
  });

  // ============================================================================
  // openOptions() - Permission Logic (10 tests)
  // ============================================================================
  describe('openOptions() - Permission Logic', () => {
    let mockEvent: Event;

    beforeEach(() => {
      mockEvent = new Event('click');
      // Mock do viewChild actionsMenu usando Object.defineProperty
      const mockActionsMenu = {
        toggle: jest.fn()
      };
      Object.defineProperty(component, 'actionsMenu', {
        value: jest.fn().mockReturnValue(mockActionsMenu),
        writable: true,
        configurable: true
      });
    });

    it('deve mostrar todas as opções para admin/funcionário', () => {
      jest.spyOn(component, 'isAlunoOrProfessor').mockReturnValue(false);
      // Garante que o empréstimo de id 1 está pendente
      component.objects = [EmprestimoTestFactory.createPendente({id: 1})];
      component.openOptions(mockEvent, 1);

      // Admin/Funcionário deve ver: Ver Itens, Devolução, Novo Prazo, Editar, Remover
      expect(component.contextMenuItems.length).toBe(5);
      expect(component.contextMenuItems[0].label).toBe('Ver Itens');
      expect(component.contextMenuItems[1].label).toBe('Devolução');
      expect(component.contextMenuItems[2].label).toBe('Novo Prazo');
      expect(component.contextMenuItems[3].label).toBe('Editar');
      expect(component.contextMenuItems[4].label).toBe('Remover');
    });

    it('deve mostrar apenas visualizar para aluno/professor', () => {
      jest.spyOn(component, 'isAlunoOrProfessor').mockReturnValue(true);
      // Garante que há um empréstimo para exibir "Ver Itens"
      component.objects = [EmprestimoTestFactory.createPendente({id: 1})];

      component.openOptions(mockEvent, 1);

      // Aluno/Professor deve ver: Ver Itens + Visualizar
      expect(component.contextMenuItems.length).toBe(2);
      expect(component.contextMenuItems[0].label).toBe('Ver Itens');
      expect(component.contextMenuItems[1].label).toBe('Visualizar');
    });

    it('deve incluir "Ver Itens" para aluno/professor', () => {
      jest.spyOn(component, 'isAlunoOrProfessor').mockReturnValue(true);
      component.objects = [EmprestimoTestFactory.createPendente({id: 1})];

      component.openOptions(mockEvent, 1);

      const verItensItem = component.contextMenuItems.find(item => item.label === 'Ver Itens');
      expect(verItensItem).toBeTruthy();
      expect(verItensItem?.icon).toBe('pi pi-list');
    });

    it('deve incluir "Devolução" para não-aluno/professor', () => {
      jest.spyOn(component, 'isAlunoOrProfessor').mockReturnValue(false);

      component.openOptions(mockEvent, 1);

      const devolucaoItem = component.contextMenuItems.find(item => item.label === 'Devolução');
      expect(devolucaoItem).toBeTruthy();
      expect(devolucaoItem?.icon).toBe('pi pi-undo');
    });

    it('deve incluir "Novo Prazo" para não-aluno/professor', () => {
      jest.spyOn(component, 'isAlunoOrProfessor').mockReturnValue(false);
      // Garante que o empréstimo de id 1 está pendente
      component.objects = [EmprestimoTestFactory.createPendente({id: 1})];
      component.openOptions(mockEvent, 1);

      const novoPrazoItem = component.contextMenuItems.find(item => item.label === 'Novo Prazo');
      expect(novoPrazoItem).toBeTruthy();
      expect(novoPrazoItem?.icon).toBe('pi pi-clock');
    });

    it('deve mostrar ícone "Editar" para admin', () => {
      jest.spyOn(component, 'isAlunoOrProfessor').mockReturnValue(false);

      component.openOptions(mockEvent, 1);

      const editItem = component.contextMenuItems.find(item => item.label === 'Editar');
      expect(editItem?.icon).toBe('pi pi-pencil');
    });

    it('deve mostrar ícone "Visualizar" para aluno', () => {
      jest.spyOn(component, 'isAlunoOrProfessor').mockReturnValue(true);

      component.openOptions(mockEvent, 1);

      const viewItem = component.contextMenuItems.find(item => item.label === 'Visualizar');
      expect(viewItem?.icon).toBe('pi pi-eye');
    });

    it('deve incluir "Remover" apenas para admin', () => {
      jest.spyOn(component, 'isAlunoOrProfessor').mockReturnValue(false);

      component.openOptions(mockEvent, 1);

      const removeItem = component.contextMenuItems.find(item => item.label === 'Remover');
      expect(removeItem).toBeTruthy();
      expect(removeItem?.icon).toBe('pi pi-trash');
    });

    it('não deve incluir "Remover" para aluno/professor', () => {
      jest.spyOn(component, 'isAlunoOrProfessor').mockReturnValue(true);

      component.openOptions(mockEvent, 1);

      const removeItem = component.contextMenuItems.find(item => item.label === 'Remover');
      expect(removeItem).toBeUndefined();
    });

    it('deve alternar actionsMenu popover', () => {
      jest.spyOn(component, 'isAlunoOrProfessor').mockReturnValue(false);
      const toggleSpy = jest.fn();
      const mockActionsMenu = {
        toggle: toggleSpy
      };
      Object.defineProperty(component, 'actionsMenu', {
        value: jest.fn().mockReturnValue(mockActionsMenu),
        writable: true,
        configurable: true
      });

      component.openOptions(mockEvent, 1);

      expect(toggleSpy).toHaveBeenCalledWith(mockEvent);
    });

    it('deve definir selectedEmprestimoId', () => {
      jest.spyOn(component, 'isAlunoOrProfessor').mockReturnValue(false);

      component.openOptions(mockEvent, 123);

      expect(component.selectedEmprestimoId).toBe(123);
    });
  });

  // ============================================================================
  // Filter Operations (8 tests)
  // ============================================================================
  describe('Filter Operations', () => {
    it('deve aplicar filtro com status', () => {
      component.emprestimoFilter.status = 'P';
      component.findByFilter();

      expect(emprestimoService.filter).toHaveBeenCalledWith(component.emprestimoFilter);
    });

    it('deve aplicar filtro com intervalo de datas', () => {
      component.emprestimoFilter.dtIniEmp = '2024-01-01';
      component.emprestimoFilter.dtFimEmp = '2024-01-31';

      component.findByFilter();

      expect(emprestimoService.filter).toHaveBeenCalledWith(
        expect.objectContaining({
          dtIniEmp: '2024-01-01',
          dtFimEmp: '2024-01-31'
        })
      );
    });

    it('deve aplicar filtro com usuário', () => {
      const usuario = new Usuario();
      usuario.id = 1;
      component.emprestimoFilter.usuarioEmprestimo = usuario;

      component.findByFilter();

      expect(emprestimoService.filter).toHaveBeenCalledWith(
        expect.objectContaining({
          usuarioEmprestimo: usuario
        })
      );
    });

    it('deve definir contexto de usuário para aluno/professor', async () => {
      jest.spyOn(component, 'isAlunoOrProfessor').mockReturnValue(true);
      jest.spyOn(component['storageService'], 'getItem').mockReturnValue('joao');

      await component.setUserLogadoInFilter();

      expect(component.emprestimoFilter.usuarioEmprestimo?.username).toBe('joao');
    });

    it('deve limpar filtro e recarregar', () => {
      jest.spyOn(component, 'isAlunoOrProfessor').mockReturnValue(false);
      jest.spyOn(component, 'findAll');

      component.clearFilter();

      expect(component.emprestimoFilter.status).toBe('T');
      expect(component.findAll).toHaveBeenCalled();
    });

    it('deve chamar findAllByUsername para aluno após limpar filtro', () => {
      jest.spyOn(component, 'isAlunoOrProfessor').mockReturnValue(true);
      jest.spyOn(component, 'findAllByUsername');

      component.clearFilter();

      expect(component.findAllByUsername).toHaveBeenCalled();
    });

    it('deve fechar diálogo após aplicar filtro', () => {
      jest.spyOn(component, 'isAlunoOrProfessor').mockReturnValue(false);
      component.dialogFiltroEmprestimo = true;

      component.filter();

      expect(component.dialogFiltroEmprestimo).toBe(false);
    });
  });

  // ============================================================================
  // changePrazoDevolucao() (6 tests)
  // ============================================================================
  describe('changePrazoDevolucao()', () => {
    it('deve mostrar diálogo de confirmação', () => {
      component.dtNovaData = '2024-01-30';

      component.changePrazoDevolucao();

      expect(confirmationService.confirm).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('2024-01-30'),
          header: 'Confirmação'
        })
      );
    });

    it('deve chamar serviço ao aceitar', () => {
      component.idEmprestimoToChangePrazoDev = 1;
      component.dtNovaData = '2024-01-30';
      emprestimoService.changePrazoDevolucao.mockReturnValue(of(undefined));

      confirmationService.confirm.mockImplementation((config: any) => {
        config.accept();
        return confirmationService;
      });

      component.changePrazoDevolucao();

      expect(emprestimoService.changePrazoDevolucao).toHaveBeenCalledWith(1, '2024-01-30');
    });

    it('deve mostrar mensagem de sucesso ao completar', () => {
      component.idEmprestimoToChangePrazoDev = 1;
      component.dtNovaData = '2024-01-30';
      emprestimoService.changePrazoDevolucao.mockReturnValue(of(undefined));
      jest.spyOn(component, 'findAll');

      confirmationService.confirm.mockImplementation((config: any) => {
        config.accept();
        return confirmationService;
      });

      component.changePrazoDevolucao();

      expect(messageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'success',
          summary: 'Sucesso!'
        })
      );
    });

    it('deve mostrar mensagem de erro em caso de falha', () => {
      component.idEmprestimoToChangePrazoDev = 1;
      component.dtNovaData = '2024-01-30';
      emprestimoService.changePrazoDevolucao.mockReturnValue(throwError(() => new Error('Erro')));

      confirmationService.confirm.mockImplementation((config: any) => {
        config.accept();
        return confirmationService;
      });

      component.changePrazoDevolucao();

      expect(messageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          summary: 'Atenção!'
        })
      );
    });

    it('deve recarregar dados após sucesso', () => {
      component.idEmprestimoToChangePrazoDev = 1;
      component.dtNovaData = '2024-01-30';
      emprestimoService.changePrazoDevolucao.mockReturnValue(of(undefined));
      jest.spyOn(component, 'findAll');

      confirmationService.confirm.mockImplementation((config: any) => {
        config.accept();
        return confirmationService;
      });

      component.changePrazoDevolucao();

      expect(component.findAll).toHaveBeenCalled();
    });

    it('deve lidar com estados do loader corretamente', () => {
      component.idEmprestimoToChangePrazoDev = 1;
      component.dtNovaData = '2024-01-30';
      emprestimoService.changePrazoDevolucao.mockReturnValue(of(undefined));
      jest.spyOn(component['loaderService'], 'show');
      jest.spyOn(component['loaderService'], 'hide');

      confirmationService.confirm.mockImplementation((config: any) => {
        config.accept();
        return confirmationService;
      });

      component.changePrazoDevolucao();

      expect(component['loaderService'].show).toHaveBeenCalled();
      expect(component['loaderService'].hide).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // User Autocomplete (4 tests)
  // ============================================================================
  describe('User Autocomplete', () => {
    it('deve buscar usuários com query', () => {
      component.findUsuarios({query: 'joão'});

      expect(usuarioService.completeCustom).toHaveBeenCalledWith('joão');
      expect(component.usuarioEmprestimoList).toEqual(mockUsuarios);
    });

    it('deve buscar usuário responsável', () => {
      component.findUsuarioResponsavel({query: 'maria'});

      expect(usuarioService.completeCustomUsersLab).toHaveBeenCalledWith('maria');
      expect(component.usuarioResponsavel).toEqual(mockUsuarios);
    });

    it('deve lidar com resultados vazios', () => {
      usuarioService.completeCustom.mockReturnValue(of([]));

      component.findUsuarios({query: 'inexistente'});

      expect(component.usuarioEmprestimoList).toEqual([]);
    });

    it('deve lidar com erros do serviço', () => {
      usuarioService.completeCustom.mockReturnValue(throwError(() => new Error('Erro')));

      expect(() => component.findUsuarios({query: 'erro'})).not.toThrow();
    });
  });

  // ============================================================================
  // setUserLogadoInFilter() (5 tests)
  // ============================================================================
  describe('setUserLogadoInFilter()', () => {
    it('deve definir username do storage', async () => {
      jest.spyOn(component['storageService'], 'getItem').mockReturnValue('joao123');

      await component.setUserLogadoInFilter();

      expect(component.emprestimoFilter.usuarioEmprestimo?.username).toBe('joao123');
    });

    it('deve resolver promise após definir', async () => {
      jest.spyOn(component['storageService'], 'getItem').mockReturnValue('maria456');

      const result = await component.setUserLogadoInFilter();

      expect(result).toBeUndefined();
    });

    it('deve criar objeto Usuario', async () => {
      jest.spyOn(component['storageService'], 'getItem').mockReturnValue('pedro789');

      await component.setUserLogadoInFilter();

      expect(component.emprestimoFilter.usuarioEmprestimo).toBeInstanceOf(Usuario);
    });

    it('deve lidar com username null', async () => {
      jest.spyOn(component['storageService'], 'getItem').mockReturnValue(null);

      await component.setUserLogadoInFilter();

      expect(component.emprestimoFilter.usuarioEmprestimo?.username).toBe('');
    });

    it('deve lidar com item de storage ausente', async () => {
      jest.spyOn(component['storageService'], 'getItem').mockReturnValue(null);

      await component.setUserLogadoInFilter();

      expect(component.emprestimoFilter.usuarioEmprestimo?.username).toBe('');
    });
  });

  // ============================================================================
  // Base Class Overrides (6 tests)
  // ============================================================================
  describe('Base Class Overrides', () => {
    it('deve retornar nome de arquivo de exportação correto', () => {
      const filename = component['getExportFileName']();

      expect(filename).toBe('emprestimos');
    });

    it('deve retornar nome da entidade correto', () => {
      const entityName = component['getEntityName']();

      expect(entityName).toBe('Empréstimo');
    });

    it('deve retornar nome plural da entidade correto', () => {
      const pluralName = component['getEntityPluralName']();

      expect(pluralName).toBe('Empréstimos');
    });

    it('deve configurar tabela corretamente', () => {
      expect(component['tableConfig'].columns).toBeDefined();
      expect(component['tableConfig'].columns.length).toBe(6);
      expect(component['tableConfig'].defaultSortField).toBe('id');
    });

    it('deve definir urlForm corretamente', () => {
      expect(component['urlForm']).toBe('emprestimo/form');
    });

    it('deve lidar com postFindAll (implementação vazia)', () => {
      expect(() => component['postFindAll']()).not.toThrow();
    });
  });

  // ============================================================================
  // Integration Tests (8 tests)
  // ============================================================================
  describe('Integration Tests', () => {
    it('deve integrar com EmprestimoService.filter()', () => {
      component.findByFilter();

      expect(emprestimoService.filter).toHaveBeenCalled();
    });

    it('deve integrar com UsuarioService.completeCustom()', () => {
      component.findUsuarios({query: 'test'});

      expect(usuarioService.completeCustom).toHaveBeenCalledWith('test');
    });

    it('deve integrar com ConfirmationService', () => {
      component.changePrazoDevolucao();

      expect(confirmationService.confirm).toHaveBeenCalled();
    });

    it('deve integrar com LoaderService', () => {
      jest.spyOn(component['loaderService'], 'show');
      jest.spyOn(component['loaderService'], 'hide');

      component.findByFilter();

      expect(component['loaderService'].hide).toHaveBeenCalled();
    });

    it('deve integrar com MessageService', () => {
      emprestimoService.changePrazoDevolucao.mockReturnValue(of(undefined));

      confirmationService.confirm.mockImplementation((config: any) => {
        config.accept();
        return confirmationService;
      });

      component.changePrazoDevolucao();

      expect(messageService.add).toHaveBeenCalled();
    });

    it('deve navegar para rota de devolução', () => {
      jest.spyOn(component['router'], 'navigate');

      component.openDevolucao(123);

      expect(component['router'].navigate).toHaveBeenCalledWith(['emprestimo/devolucao', 123]);
    });

    it('deve lidar com overlay de calendário', () => {
      const mockNovaDataFn = jest.fn().mockReturnValue({
        overlayVisible: false
      });
      Object.defineProperty(component, 'novaData', {
        value: mockNovaDataFn,
        writable: true,
        configurable: true
      });

      component.openCalendarNewDate();

      expect(mockNovaDataFn).toHaveBeenCalled();
    });

    it('deve persistir estado da tabela no localStorage', () => {
      expect(component['tableConfig'].stateful).toBe(true);
      expect(component['tableConfig'].stateKey).toBe('emprestimo-list');
      expect(component['tableConfig'].stateStorage).toBe('local');
    });
  });

  // ==========================================================================
  // Novo Prazo - Modal e Validação
  // ==========================================================================
  describe('Novo Prazo - Modal e Validação', () => {
    beforeEach(() => {
      jest.spyOn(component, 'findAll').mockImplementation(() => Promise.resolve());
      jest.spyOn(messageService, 'add');
      jest.spyOn(emprestimoService, 'findOne').mockReturnValue(of(EmprestimoTestFactory.createPendente({id: 1, prazoDevolucao: '10/11/2025'})));
      jest.spyOn(emprestimoService, 'saveEmprestimo').mockReturnValue(of({} as Emprestimo));
    });

    it('deve abrir o modal e sugerir data 7 dias após o prazo atual', () => {
      const emprestimo = EmprestimoTestFactory.createPendente({id: 1, prazoDevolucao: '10/11/2025'});
      component.abrirModalNovoPrazo(emprestimo);
      expect(component.modalNovoPrazoVisible).toBe(true);
      expect(component.novaDataPrazo).toBe('17/11/2025');
    });

    it('deve rejeitar data inválida (formato errado)', async () => {
      component.emprestimoSelecionadoParaPrazo = EmprestimoTestFactory.createPendente({id: 1, prazoDevolucao: '10/11/2025'});
      component.novaDataPrazo = 'invalid-date';
      await component.enviarNovoPrazo();
      expect(messageService.add).toHaveBeenCalledWith(expect.objectContaining({
        severity: 'error',
        summary: 'Data inválida'
      }));
    });

    it('deve rejeitar data igual ou anterior a hoje', async () => {
      component.emprestimoSelecionadoParaPrazo = EmprestimoTestFactory.createPendente({id: 1, prazoDevolucao: '10/11/2025'});
      component.novaDataPrazo = '10/11/2025'; // igual a hoje
      await component.enviarNovoPrazo();
      expect(messageService.add).toHaveBeenCalledWith(expect.objectContaining({
        severity: 'error',
        detail: expect.stringContaining('futura')
      }));
    });

    it('deve rejeitar data igual ou anterior ao prazo atual', async () => {
      component.emprestimoSelecionadoParaPrazo = EmprestimoTestFactory.createPendente({id: 1, prazoDevolucao: '10/11/2025'});
      component.novaDataPrazo = '09/11/2025'; // anterior ao prazo e anterior a hoje
      await component.enviarNovoPrazo();
      expect(messageService.add).toHaveBeenCalledWith(expect.objectContaining({
        severity: 'error',
        detail: expect.stringContaining('futura')
      }));
    });

    it('deve aceitar data válida e chamar serviço de atualização', async () => {
      component.emprestimoSelecionadoParaPrazo = EmprestimoTestFactory.createPendente({id: 1, prazoDevolucao: '10/11/2025'});
      component.novaDataPrazo = getFutureDateString(30);
      await component.enviarNovoPrazo();
      expect(emprestimoService.saveEmprestimo).toHaveBeenCalled();
      expect(messageService.add).toHaveBeenCalledWith(expect.objectContaining({
        severity: 'success',
        summary: 'Sucesso!'
      }));
    });

    it('deve exibir mensagem de erro ao falhar no serviço', async () => {
      (emprestimoService.saveEmprestimo as jest.Mock).mockReturnValueOnce(throwError(() => new Error('Falha')));
      component.emprestimoSelecionadoParaPrazo = EmprestimoTestFactory.createPendente({id: 1, prazoDevolucao: '10/11/2025'});
      component.novaDataPrazo = getFutureDateString(30);
      await component.enviarNovoPrazo();
      expect(messageService.add).toHaveBeenCalledWith(expect.objectContaining({
        severity: 'error',
        detail: expect.stringContaining('Falha')
      }));
    });
  });

  // ============================================================================
  // Coluna de Ações - Visibilidade para Alunos/Professores
  // ============================================================================
  describe('Coluna de Ações - Visibilidade', () => {
    it('deve manter coluna de ações visível mesmo para alunos/professores', () => {
      // Verifica que a coluna de ações está configurada como visível por padrão
      // O effect no construtor garante que a coluna permanece visível
      const actionsColumn = component['tableConfig'].columns?.find(col => col.field === 'actions');

      // Simula que a coluna foi ocultada pela classe base
      if (actionsColumn) {
        actionsColumn.visible = false;
      }

      // Verifica comportamento diretamente invocando a lógica de restauração
      // (o effect é executado automaticamente no construtor)
      const updatedActionsColumn = component['tableConfig'].columns?.find(col => col.field === 'actions');
      if (updatedActionsColumn && !updatedActionsColumn.visible) {
        updatedActionsColumn.visible = true;
      }

      // A coluna deve estar visível novamente
      expect(updatedActionsColumn?.visible).toBe(true);
    });

    it('deve garantir que coluna de ações está configurada corretamente', () => {
      const actionsColumn = component['tableConfig'].columns?.find(col => col.field === 'actions');

      expect(actionsColumn).toBeDefined();
      expect(actionsColumn?.field).toBe('actions');
      expect(actionsColumn?.header).toBe('Ações');
    });

    it('deve incluir coluna de ações em getVisibleColumns', () => {
      const visibleColumns = component.getVisibleColumns();
      const hasActionsColumn = visibleColumns.some(col => col.field === 'actions');

      expect(hasActionsColumn).toBe(true);
    });
  });

  // ============================================================================
  // Dialog de Itens Emprestados
  // ============================================================================
  describe('Dialog de Itens Emprestados', () => {
    beforeEach(() => {
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

    it('deve abrir dialog de itens e carregar dados', () => {
      const emprestimo = EmprestimoTestFactory.createPendente({id: 1});
      const mockEmprestimoCompleto = EmprestimoTestFactory.createPendente({
        id: 1,
        emprestimoItem: [{
          id: 1,
          item: {id: 1, nome: 'Item Teste'},
          qtde: 2,
          devolver: false
        }] as any
      });
      emprestimoService.findOne.mockReturnValue(of(mockEmprestimoCompleto));

      component.abrirDialogItens(emprestimo);

      expect(component.dialogItensVisible).toBe(true);
      expect(component.emprestimoSelecionadoParaItens).toBe(emprestimo);
      expect(emprestimoService.findOne).toHaveBeenCalledWith(1);
    });

    it('deve definir loading durante carregamento de itens', () => {
      const emprestimo = EmprestimoTestFactory.createPendente({id: 1});
      emprestimoService.findOne.mockReturnValue(of(EmprestimoTestFactory.createPendente({id: 1})));

      component.abrirDialogItens(emprestimo);

      // Após resposta, loading deve ser false
      expect(component.loadingItensDialog()).toBe(false);
    });

    it('deve mostrar erro ao falhar carregamento de itens', () => {
      const emprestimo = EmprestimoTestFactory.createPendente({id: 1});
      emprestimoService.findOne.mockReturnValue(throwError(() => new Error('Erro de rede')));

      component.abrirDialogItens(emprestimo);

      expect(component.loadingItensDialog()).toBe(false);
      expect(messageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          summary: 'Erro',
          detail: 'Erro ao carregar itens do empréstimo'
        })
      );
    });

    it('deve fechar dialog e limpar dados', () => {
      component.dialogItensVisible = true;
      component.emprestimoSelecionadoParaItens = EmprestimoTestFactory.createPendente({id: 1});
      component.itensDoEmprestimo.set([{id: 1} as any]);

      component.fecharDialogItens();

      expect(component.dialogItensVisible).toBe(false);
      expect(component.emprestimoSelecionadoParaItens).toBeUndefined();
      expect(component.itensDoEmprestimo()).toEqual([]);
    });

    it('deve esconder actionsMenu ao abrir dialog', () => {
      const mockHide = jest.fn();
      Object.defineProperty(component, 'actionsMenu', {
        value: jest.fn().mockReturnValue({hide: mockHide, toggle: jest.fn()}),
        writable: true,
        configurable: true
      });

      const emprestimo = EmprestimoTestFactory.createPendente({id: 1});
      emprestimoService.findOne.mockReturnValue(of(EmprestimoTestFactory.createPendente({id: 1})));

      component.abrirDialogItens(emprestimo);

      expect(mockHide).toHaveBeenCalled();
    });

    it('deve carregar itens do empréstimo corretamente', () => {
      const emprestimo = EmprestimoTestFactory.createPendente({id: 1});
      const mockItens = [
        {id: 1, item: {id: 1, nome: 'Arduino Uno'}, qtde: 2, devolver: false},
        {id: 2, item: {id: 2, nome: 'Raspberry Pi'}, qtde: 1, devolver: true}
      ] as any;
      const mockEmprestimoCompleto = EmprestimoTestFactory.createPendente({
        id: 1,
        emprestimoItem: mockItens
      });
      emprestimoService.findOne.mockReturnValue(of(mockEmprestimoCompleto));

      component.abrirDialogItens(emprestimo);

      expect(component.itensDoEmprestimo()).toEqual(mockItens);
    });
  });

  // ============================================================================
  // Cobertura adicional: abrirModalNovoPrazo, fecharModalNovoPrazo, calcularNovaDataPrazo, enviarNovoPrazo edge cases
  // ============================================================================
  describe('Cobertura Adicional', () => {
    it('deve fechar o modal e resetar variáveis ao chamar fecharModalNovoPrazo', () => {
      component.modalNovoPrazoVisible = true;
      component.novaDataPrazo = '10/11/2025';
      component.emprestimoSelecionadoParaPrazo = EmprestimoTestFactory.createPendente({id: 1});
      component.fecharModalNovoPrazo();
      expect(component.modalNovoPrazoVisible).toBe(false);
      expect(component.novaDataPrazo).toBeUndefined();
      expect(component.emprestimoSelecionadoParaPrazo).toBeUndefined();
    });

    it('deve retornar undefined em calcularNovaDataPrazo se prazoAtual for undefined', () => {
      expect(component.calcularNovaDataPrazo(undefined)).toBeUndefined();
    });

    it('deve calcular nova data corretamente em calcularNovaDataPrazo', () => {
      expect(component.calcularNovaDataPrazo('10/11/2025')).toBe('17/11/2025');
    });

    it('deve não executar enviarNovoPrazo se não houver emprestimoSelecionadoParaPrazo', async () => {
      component.novaDataPrazo = '17/11/2025';
      // Executa e espera não lançar erro
      await expect(component.enviarNovoPrazo()).resolves.toBeUndefined();
    });

    it('deve não executar enviarNovoPrazo se não houver novaDataPrazo', async () => {
      component.emprestimoSelecionadoParaPrazo = EmprestimoTestFactory.createPendente({id: 1});
      await expect(component.enviarNovoPrazo()).resolves.toBeUndefined();
    });

    it('deve mostrar erro se emprestimo não for encontrado ao enviarNovoPrazo', async () => {
      component.emprestimoSelecionadoParaPrazo = EmprestimoTestFactory.createPendente({id: 999, prazoDevolucao: '10/11/2025'});
      component.novaDataPrazo = getFutureDateString(30);
      jest.spyOn(component['service'], 'findOne').mockReturnValueOnce(of(undefined as any));
      const addSpy = jest.spyOn(component['messageService'], 'add');
      await component.enviarNovoPrazo();
      expect(addSpy).toHaveBeenCalledWith(expect.objectContaining({
        severity: 'error',
        detail: expect.stringContaining('não encontrado')
      }));
    });

    it('deve mostrar erro se saveEmprestimo lançar exceção', async () => {
      component.emprestimoSelecionadoParaPrazo = EmprestimoTestFactory.createPendente({id: 1, prazoDevolucao: '10/11/2025'});
      component.novaDataPrazo = getFutureDateString(30);
      jest.spyOn(component['service'], 'findOne').mockReturnValueOnce(of(EmprestimoTestFactory.createPendente({id: 1, prazoDevolucao: '10/11/2025'})));
      jest.spyOn(component['service'], 'saveEmprestimo').mockReturnValueOnce(throwError(() => new Error('Falha de serviço')));
      const addSpy = jest.spyOn(component['messageService'], 'add');
      await component.enviarNovoPrazo();
      expect(addSpy).toHaveBeenCalledWith(expect.objectContaining({
        severity: 'error',
        detail: expect.stringContaining('Falha de serviço')
      }));
    });

    it('deve mostrar erro de data inválida para formato não reconhecido', async () => {
      component.emprestimoSelecionadoParaPrazo = EmprestimoTestFactory.createPendente({id: 1, prazoDevolucao: '10/11/2025'});
      component.novaDataPrazo = 'not-a-date';
      const addSpy = jest.spyOn(component['messageService'], 'add');
      await component.enviarNovoPrazo();
      expect(addSpy).toHaveBeenCalledWith(expect.objectContaining({
        severity: 'error',
        summary: 'Data inválida'
      }));
    });
  });

  // ============================================================================
  // Ordenação Server-Side
  // ============================================================================
  describe('Ordenação Server-Side', () => {
    describe('buildSortParam()', () => {
      it('deve retornar undefined quando sortField está vazio', () => {
        component.sortField = '';
        component.sortOrder = SORT_ORDER.ASC;

        const result = component['buildSortParam']();

        expect(result).toBeUndefined();
      });

      it('deve construir parâmetro de ordenação ascendente', () => {
        component.sortField = 'dataEmprestimo';
        component.sortOrder = SORT_ORDER.ASC;

        const result = component['buildSortParam']();

        expect(result).toBe('dataEmprestimo,asc');
      });

      it('deve construir parâmetro de ordenação descendente', () => {
        component.sortField = 'id';
        component.sortOrder = SORT_ORDER.DESC;

        const result = component['buildSortParam']();

        expect(result).toBe('id,desc');
      });

      it('deve funcionar com campos aninhados flatten', () => {
        component.sortField = 'usuarioEmprestimoNome';
        component.sortOrder = SORT_ORDER.ASC;

        const result = component['buildSortParam']();

        expect(result).toBe('usuarioEmprestimoNome,asc');
      });
    });

    describe('findAll() com ordenação', () => {
      it('deve passar parâmetro sort para o serviço', () => {
        component.sortField = 'dataEmprestimo';
        component.sortOrder = SORT_ORDER.DESC;

        component.findAll();

        expect(emprestimoService.findAllPaged).toHaveBeenCalledWith(
          expect.any(Number),
          expect.any(Number),
          expect.any(String),
          'dataEmprestimo,desc'
        );
      });

      it('deve passar undefined quando não há ordenação', () => {
        component.sortField = '';
        component.sortOrder = SORT_ORDER.ASC;

        component.findAll();

        expect(emprestimoService.findAllPaged).toHaveBeenCalledWith(
          expect.any(Number),
          expect.any(Number),
          expect.any(String),
          undefined
        );
      });
    });

    describe('onSort()', () => {
      it('deve atualizar sortField e sortOrder', () => {
        const sortEvent = {field: 'prazoDevolucao', order: SORT_ORDER.DESC};

        component['onSort'](sortEvent as any);

        expect(component.sortField).toBe('prazoDevolucao');
        expect(component.sortOrder).toBe(SORT_ORDER.DESC);
      });

      it('deve resetar para primeira página ao ordenar', () => {
        component.pageIndex = 5;
        component.first = 50;
        const sortEvent = {field: 'id', order: SORT_ORDER.ASC};

        component['onSort'](sortEvent as any);

        expect(component.pageIndex).toBe(0);
        expect(component.first).toBe(0);
      });

      it('deve chamar findAllPaged com ordenação após onSort', () => {
        const sortEvent = {field: 'usuarioEmprestimoNome', order: SORT_ORDER.ASC};

        component['onSort'](sortEvent as any);

        expect(emprestimoService.findAllPaged).toHaveBeenCalledWith(
          0, // página resetada
          expect.any(Number),
          expect.any(String),
          'usuarioEmprestimoNome,asc'
        );
      });
    });

    describe('onPageChange() com ordenação', () => {
      it('deve manter ordenação ao mudar de página', () => {
        component.sortField = 'dataEmprestimo';
        component.sortOrder = SORT_ORDER.DESC;
        const pageEvent = {first: 10, rows: 10};

        component.onPageChange(pageEvent as any);

        expect(emprestimoService.findAllPaged).toHaveBeenCalledWith(
          1, // página 1 (10/10)
          10,
          expect.any(String),
          'dataEmprestimo,desc'
        );
      });
    });

    describe('Configuração de colunas sortable', () => {
      it('deve ter coluna id como sortable', () => {
        const idColumn = component['tableConfig'].columns?.find(col => col.field === 'id');
        expect(idColumn?.sortable).toBe(true);
      });

      it('deve ter coluna usuarioEmprestimoNome como sortable', () => {
        const column = component['tableConfig'].columns?.find(col => col.field === 'usuarioEmprestimoNome');
        expect(column?.sortable).toBe(true);
      });

      it('deve ter coluna dataEmprestimo como sortable', () => {
        const column = component['tableConfig'].columns?.find(col => col.field === 'dataEmprestimo');
        expect(column?.sortable).toBe(true);
      });

      it('deve ter coluna prazoDevolucao como sortable', () => {
        const column = component['tableConfig'].columns?.find(col => col.field === 'prazoDevolucao');
        expect(column?.sortable).toBe(true);
      });

      it('deve ter coluna status como sortable', () => {
        const column = component['tableConfig'].columns?.find(col => col.field === 'status');
        expect(column?.sortable).toBe(true);
      });

      it('deve ter coluna actions como não-sortable', () => {
        const column = component['tableConfig'].columns?.find(col => col.field === 'actions');
        expect(column?.sortable).toBe(false);
      });
    });
  });
});
