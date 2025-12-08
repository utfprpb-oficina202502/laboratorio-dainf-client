import {ComponentFixture, TestBed} from '@angular/core/testing';
import {provideRouter} from '@angular/router';
import {ConfirmationService, MessageService} from 'primeng/api';
import {ItemListComponent} from './item.list.component';
import {ItemService} from './item.service';
import {ReservaService} from '../reserva/reserva.service';
import {LoginService} from '../login/login.service';
import {ItemTestFactory} from './item.test-factory';
import {createServiceMock} from '../framework/testing/test-helpers';
import {PermissionService} from '../framework/service/permission.service';
import {LoaderService} from '../framework/loader/loader.service';
import {of, throwError} from 'rxjs';
import {Item} from './item';
import {Reserva} from '../reserva/reserva';


/**
 * Testes abrangentes para ItemListComponent
 * Cobre lógica de permissões, menu de ações customizado, reservas e integração com serviços
 */
describe('ItemListComponent', () => {
  let component: ItemListComponent;
  let fixture: ComponentFixture<ItemListComponent>;
  let itemService: jest.Mocked<ItemService>;
  let reservaService: jest.Mocked<ReservaService>;
  let loginService: jest.Mocked<LoginService>;
  let loaderService: jest.Mocked<LoaderService>;

  let mockItens: Item[];

  beforeAll(() => {
    mockItens = ItemTestFactory.createList(3);
  });

  beforeEach(async () => {
    const itemServiceSpy = createServiceMock<ItemService>([
      'findAll',
      'findAllPaged',
      'delete',
      'findOne'
    ]);

    const reservaServiceSpy = createServiceMock<ReservaService>([
      'findAllByIdItem'
    ]);

    const confirmationServiceSpy = createServiceMock<ConfirmationService>(['confirm']);
    const messageServiceSpy = createServiceMock<MessageService>(['add']);
    const loginServiceSpy = createServiceMock<LoginService>(['isAlunoOrProfessor']);
    const permissionServiceSpy = createServiceMock<PermissionService>([
      'canCreate', 'canEdit', 'canDelete', 'canExport', 'isReadOnly', 'userRole', 'isAlunoOrProfessor'
    ]);
    const loaderServiceSpy = createServiceMock<LoaderService>(['show', 'hide']);

    await TestBed.configureTestingModule({
      imports: [ItemListComponent],
      providers: [
        provideRouter([]),
        {provide: ItemService, useValue: itemServiceSpy},
        {provide: ReservaService, useValue: reservaServiceSpy},
        {provide: ConfirmationService, useValue: confirmationServiceSpy},
        {provide: MessageService, useValue: messageServiceSpy},
        {provide: LoginService, useValue: loginServiceSpy},
        {provide: PermissionService, useValue: permissionServiceSpy},
        {provide: LoaderService, useValue: loaderServiceSpy}
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ItemListComponent);
    component = fixture.componentInstance;

    itemService = TestBed.inject(ItemService) as jest.Mocked<ItemService>;
    reservaService = TestBed.inject(ReservaService) as jest.Mocked<ReservaService>;
    loginService = TestBed.inject(LoginService) as jest.Mocked<LoginService>;
    loaderService = TestBed.inject(LoaderService) as jest.Mocked<LoaderService>;

    // Setup default return values
    itemService.findAll.mockReturnValue(of(mockItens));
    itemService.findAllPaged.mockReturnValue(of({
      content: mockItens,
      totalElements: mockItens.length,
      totalPages: 1,
      size: mockItens.length,
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
    ItemTestFactory.resetIdCounter();
  });

  // ============================================================================
  // Component Setup (5 tests)
  // ============================================================================
  describe('Component Setup', () => {
    it('deve criar o componente', () => {
      expect(component).toBeTruthy();
    });

    it('deve injetar serviços corretamente', () => {
      expect(component['service']).toBe(itemService);
      expect(component['reservaService']).toBe(reservaService);
    });

    it('deve configurar tabela com colunas corretas', () => {
      expect(component['columnsTable']).toEqual([
        'id', 'imagem', 'nome', 'localizacao', 'grupo', 'saldo', 'actions'
      ]);
    });

    it('deve definir urlForm corretamente', () => {
      expect(component['urlForm']).toBe('item/form');
    });

    it('deve configurar tableConfig corretamente', () => {
      expect(component['tableConfig'].columns).toBeDefined();
      expect(component['tableConfig'].columns.length).toBe(7);
      expect(component['tableConfig'].stateKey).toBe('item-list');
    });
  });

  // ============================================================================
  // Redirecionamento Condicional para Catálogo (4 tests)
  // ============================================================================
  describe('Redirecionamento Condicional para Catálogo', () => {
    let navigateSpy: jest.SpyInstance;
    let originalHistoryState: unknown;

    beforeEach(() => {
      navigateSpy = jest.spyOn(component['router'], 'navigate').mockImplementation(() => Promise.resolve(true));
      originalHistoryState = history.state;
    });

    afterEach(() => {
      // Restaura history.state original
      Object.defineProperty(window, 'history', {
        value: {state: originalHistoryState},
        writable: true
      });
    });

    it('deve redirecionar aluno/professor para o catálogo por padrão', () => {
      Object.defineProperty(history, 'state', {value: {}, configurable: true});
      Object.defineProperty(component, 'isAlunoOrProfessor', {
        value: () => true,
        writable: true,
        configurable: true
      });

      component.ngOnInit();

      expect(navigateSpy).toHaveBeenCalledWith(['/item/catalogo'], {replaceUrl: true});
    });

    it('deve permitir aluno acessar tabela via toggle', () => {
      Object.defineProperty(history, 'state', {value: {fromToggle: true}, configurable: true});
      Object.defineProperty(component, 'isAlunoOrProfessor', {
        value: () => true,
        writable: true,
        configurable: true
      });

      component.ngOnInit();

      expect(navigateSpy).not.toHaveBeenCalledWith(['/item/catalogo'], expect.anything());
    });

    it('deve permitir professor acessar tabela via toggle', () => {
      Object.defineProperty(history, 'state', {value: {fromToggle: true}, configurable: true});
      Object.defineProperty(component, 'isAlunoOrProfessor', {
        value: () => true,
        writable: true,
        configurable: true
      });

      component.ngOnInit();

      expect(navigateSpy).not.toHaveBeenCalledWith(['/item/catalogo'], expect.anything());
    });

    it('não deve redirecionar admin/laboratorista em nenhum caso', () => {
      Object.defineProperty(history, 'state', {value: {}, configurable: true});
      Object.defineProperty(component, 'isAlunoOrProfessor', {
        value: () => false,
        writable: true,
        configurable: true
      });

      component.ngOnInit();

      expect(navigateSpy).not.toHaveBeenCalledWith(['/item/catalogo'], expect.anything());
    });
  });

  // ============================================================================
  // openOptions() - Custom Permission Logic (15 tests)
  // ============================================================================
  describe('openOptions() - Custom Permission Logic', () => {
    let mockEvent: Event;
    let mockItem: Item;

    beforeEach(() => {
      mockEvent = new Event('click');
      mockItem = ItemTestFactory.create({id: 1});

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

      component.openOptions(mockEvent, mockItem);

      expect(component.contextMenuItems.length).toBe(4);
      expect(component.contextMenuItems[0].label).toBe('Copiar');
      expect(component.contextMenuItems[1].label).toBe('Reservas');
      expect(component.contextMenuItems[2].label).toBe('Editar');
      expect(component.contextMenuItems[3].label).toBe('Remover');
    });

    it('deve mostrar opções limitadas para aluno/professor', () => {
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

      component.openOptions(mockEvent, mockItem);

      expect(component.contextMenuItems.length).toBe(2);
      expect(component.contextMenuItems[0].label).toBe('Reservas');
      expect(component.contextMenuItems[1].label).toBe('Visualizar');
    });

    it('deve mostrar opções limitadas para usuário read-only', () => {
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

      component.openOptions(mockEvent, mockItem);

      expect(component.contextMenuItems.length).toBe(2);
      expect(component.contextMenuItems[0].label).toBe('Reservas');
      expect(component.contextMenuItems[1].label).toBe('Visualizar');
    });

    it('deve incluir "Copiar" apenas para admin/laboratorista', () => {
      Object.defineProperty(component, 'isAlunoOrProfessor', {
        value: () => false,
        writable: true
      });

      component.openOptions(mockEvent, mockItem);

      const copyItem = component.contextMenuItems.find(item => item.label === 'Copiar');
      expect(copyItem).toBeTruthy();
      expect(copyItem?.icon).toBe('pi pi-copy');
    });

    it('não deve incluir "Copiar" para aluno/professor', () => {
      Object.defineProperty(component, 'isAlunoOrProfessor', {
        value: () => true,
        writable: true
      });

      component.openOptions(mockEvent, mockItem);

      const copyItem = component.contextMenuItems.find(item => item.label === 'Copiar');
      expect(copyItem).toBeUndefined();
    });

    it('deve incluir "Reservas" para todos os usuários', () => {
      // Teste com admin
      Object.defineProperty(component, 'isAlunoOrProfessor', {
        value: () => false,
        writable: true
      });

      component.openOptions(mockEvent, mockItem);

      const reservasItem = component.contextMenuItems.find(item => item.label === 'Reservas');
      expect(reservasItem).toBeTruthy();
      expect(reservasItem?.icon).toBe('pi pi-clone');
    });

    it('deve incluir "Reservas" para alunos/professores', () => {
      // Teste com aluno/professor
      Object.defineProperty(component, 'isAlunoOrProfessor', {
        value: () => true,
        writable: true
      });

      component.openOptions(mockEvent, mockItem);

      const reservasItem = component.contextMenuItems.find(item => item.label === 'Reservas');
      expect(reservasItem).toBeTruthy();
      expect(reservasItem?.icon).toBe('pi pi-clone');
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

      component.openOptions(mockEvent, mockItem);

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

      component.openOptions(mockEvent, mockItem);

      const removeItem = component.contextMenuItems.find(item => item.label === 'Remover');
      expect(removeItem).toBeTruthy();
      expect(removeItem?.icon).toBe('pi pi-trash');
    });

    it('deve definir selectedItem corretamente', () => {
      const item = ItemTestFactory.create({id: 42});

      component.openOptions(mockEvent, item);

      expect(component.selectedItem).toBe(item);
    });

    it('deve limpar contextMenuItems antes de adicionar novos', () => {
      component.contextMenuItems = [{ label: 'Item Antigo', icon: 'pi pi-old' }];
      Object.defineProperty(component, 'isAlunoOrProfessor', {
        value: () => true,
        writable: true
      });

      component.openOptions(mockEvent, mockItem);

      expect(component.contextMenuItems.length).toBe(2);
      expect(component.contextMenuItems[0].label).toBe('Reservas');
      expect(component.contextMenuItems[1].label).toBe('Visualizar');
    });

    it('deve chamar actionsMenu.toggle() com o evento correto', () => {
      const mockEvent = new Event('click');
      const mockPopover = { toggle: jest.fn() };
      Object.defineProperty(component, 'actionsMenu', {
        value: jest.fn().mockReturnValue(mockPopover),
        writable: true
      });

      component.openOptions(mockEvent, mockItem);

      expect(mockPopover.toggle).toHaveBeenCalledWith(mockEvent);
    });

    it('deve chamar cdr.markForCheck() para atualização da view', () => {
      const mockCdr = { markForCheck: jest.fn() };
      Object.defineProperty(component, 'cdr', {
        value: mockCdr,
        writable: true
      });

      component.openOptions(mockEvent, mockItem);

      expect(mockCdr.markForCheck).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // findReservasItem() (6 tests)
  // ============================================================================
  describe('findReservasItem()', () => {
    let mockReservas: Reserva[];

    beforeEach(() => {
      mockReservas = [
        {id: 1, descricao: 'Reserva 1'},
        {id: 2, descricao: 'Reserva 2'}
      ] as Reserva[];
    });

    it('deve buscar reservas do item com sucesso', () => {
      reservaService.findAllByIdItem.mockReturnValue(of(mockReservas));

      component.findReservasItem(123);

      expect(reservaService.findAllByIdItem).toHaveBeenCalledWith(123);
    });

    it('deve abrir dialog quando há reservas', () => {
      reservaService.findAllByIdItem.mockReturnValue(of(mockReservas));

      component.findReservasItem(123);

      expect(component.reservasItem).toEqual(mockReservas);
      expect(component.dialogReservaitem).toBe(true);
    });

    it('deve mostrar mensagem quando não há reservas', () => {
      reservaService.findAllByIdItem.mockReturnValue(of([]));
      const messageService = TestBed.inject(MessageService);
      const addSpy = jest.spyOn(messageService, 'add');

      component.findReservasItem(123);

      expect(addSpy).toHaveBeenCalledWith({
        severity: 'info',
        summary: 'Ops...',
        detail: 'Este item não possui nenhuma reserva.',
        life: 4000
      });
    });

    it('deve mostrar loader durante a busca', () => {
      reservaService.findAllByIdItem.mockReturnValue(of(mockReservas));
      const showSpy = jest.spyOn(loaderService, 'show');
      const hideSpy = jest.spyOn(loaderService, 'hide');

      component.findReservasItem(123);

      expect(showSpy).toHaveBeenCalled();
      expect(hideSpy).toHaveBeenCalled();
    });

    it('deve chamar cdr.markForCheck() quando há reservas', () => {
      reservaService.findAllByIdItem.mockReturnValue(of(mockReservas));
      const mockCdr = { markForCheck: jest.fn() };
      Object.defineProperty(component, 'cdr', {
        value: mockCdr,
        writable: true
      });

      component.findReservasItem(123);

      expect(mockCdr.markForCheck).toHaveBeenCalled();
    });

    it('deve lidar com erro na busca de reservas', () => {
      reservaService.findAllByIdItem.mockReturnValue(throwError(() => new Error('Erro')));
      const hideSpy = jest.spyOn(loaderService, 'hide');

      component.findReservasItem(123);

      expect(hideSpy).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // copyItem() (3 tests)
  // ============================================================================
  describe('copyItem()', () => {
    let navigateSpy: jest.SpyInstance;

    beforeEach(() => {
      navigateSpy = jest.spyOn(component['router'], 'navigate').mockImplementation(() => Promise.resolve(true));
    });

    afterEach(() => {
      navigateSpy.mockRestore();
    });

    it('deve navegar para item/form/copy com o ID correto', () => {
      const itemId = 456;

      component.copyItem(itemId);

      expect(navigateSpy).toHaveBeenCalledWith(['item/form/copy', itemId]);
    });

    it('deve funcionar com diferentes IDs', () => {
      const testIds = [1, 42, 999];

      testIds.forEach(id => {
        component.copyItem(id);
        expect(navigateSpy).toHaveBeenCalledWith(['item/form/copy', id]);
      });
    });

    it('deve passar o ID correto na rota', () => {
      component.copyItem(123);

      const [routeArray] = navigateSpy.mock.calls[0];
      expect(routeArray[0]).toBe('item/form/copy');
      expect(routeArray[1]).toBe(123);
    });
  });

  // ============================================================================
  // getGrupoBadgeSeverity() (8 tests)
  // ============================================================================
  describe('getGrupoBadgeSeverity()', () => {
    it('deve retornar "secondary" para grupo undefined', () => {
      const severity = component.getGrupoBadgeSeverity(undefined);

      expect(severity).toBe('secondary');
    });

    it('deve retornar "success" (verde) para grupo com ID 1', () => {
      const grupo = {id: 1, descricao: 'Eletrônicos'};

      const severity = component.getGrupoBadgeSeverity(grupo);

      expect(severity).toBe('success');
    });

    it('deve retornar "warn" (laranja) para grupo com ID 2', () => {
      const grupo = {id: 2, descricao: 'Ferramentas'};

      const severity = component.getGrupoBadgeSeverity(grupo);

      expect(severity).toBe('warn');
    });

    it('deve retornar "danger" (vermelho) para grupo com ID 3', () => {
      const grupo = {id: 3, descricao: 'Materiais'};

      const severity = component.getGrupoBadgeSeverity(grupo);

      expect(severity).toBe('danger');
    });

    it('deve retornar "secondary" (cinza) para grupo com ID 4', () => {
      const grupo = {id: 4, descricao: 'Químicos'};

      const severity = component.getGrupoBadgeSeverity(grupo);

      expect(severity).toBe('secondary');
    });

    it('deve retornar "contrast" (preto/branco) para grupo com ID 5', () => {
      const grupo = {id: 5, descricao: 'Outros'};

      const severity = component.getGrupoBadgeSeverity(grupo);

      expect(severity).toBe('contrast');
    });

    it('deve retornar "info" (azul) para grupo com ID 6', () => {
      const grupo = {id: 6, descricao: 'Especiais'};

      const severity = component.getGrupoBadgeSeverity(grupo);

      expect(severity).toBe('info');
    });

    it('deve usar módulo para IDs maiores que array de cores', () => {
      const grupo = {id: 8, descricao: 'Teste'}; // 8 % 6 = 2, deve retornar 'warn'

      const severity = component.getGrupoBadgeSeverity(grupo);

      expect(severity).toBe('warn');
    });
  });

  // ============================================================================
  // Base Class Overrides (5 tests)
  // ============================================================================
  describe('Base Class Overrides', () => {
    it('deve retornar nome de arquivo de exportação correto', () => {
      const filename = component['getExportFileName']();

      expect(filename).toBe('itens');
    });

    it('deve retornar nome da entidade correto', () => {
      const entityName = component['getEntityName']();

      expect(entityName).toBe('Item');
    });

    it('deve retornar nome plural da entidade correto', () => {
      const pluralName = component['getEntityPluralName']();

      expect(pluralName).toBe('Itens');
    });

    it('deve lidar com postFindAll (implementação vazia)', () => {
      expect(() => component['postFindAll']()).not.toThrow();
    });

    it('deve ter hostListenerColumnEnable habilitado', () => {
      expect(component['hostListenerColumnEnable']).toBe(true);
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
    it('deve integrar com ItemService', () => {
      expect(component['service']).toBeTruthy();
    });

    it('deve integrar com ReservaService', () => {
      expect(component['reservaService']).toBeTruthy();
    });

    it('deve integrar com Router para navegação', () => {
      expect(component['router']).toBeTruthy();
    });

    it('deve ter tableConfig com campos de filtro global', () => {
      expect(component['tableConfig'].globalFilterFields).toContain('id');
      expect(component['tableConfig'].globalFilterFields).toContain('nome');
      expect(component['tableConfig'].globalFilterFields).toContain('localizacao');
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

    it('deve ter coluna imagem com sortable false', () => {
      const column = component['tableConfig'].columns.find(c => c.field === 'imagem');
      expect(column?.sortable).toBe(false);
    });

    it('deve ter coluna nome com sortable true', () => {
      const column = component['tableConfig'].columns.find(c => c.field === 'nome');
      expect(column?.sortable).toBe(true);
    });

    it('deve ter coluna localizacao com sortable true', () => {
      const column = component['tableConfig'].columns.find(c => c.field === 'localizacao');
      expect(column?.sortable).toBe(true);
    });

    it('deve ter coluna grupo com sortable true', () => {
      const column = component['tableConfig'].columns.find(c => c.field === 'grupo');
      expect(column?.sortable).toBe(true);
    });

    it('deve ter coluna saldo com sortable true', () => {
      const column = component['tableConfig'].columns.find(c => c.field === 'saldo');
      expect(column?.sortable).toBe(true);
    });

    it('deve ter coluna actions com sortable false', () => {
      const column = component['tableConfig'].columns.find(c => c.field === 'actions');
      expect(column?.sortable).toBe(false);
    });
  });
});
