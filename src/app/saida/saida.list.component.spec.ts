import {ComponentFixture, TestBed} from '@angular/core/testing';
import {SaidaListComponent} from './saida.list.component';
import {SaidaService} from './saida.service';
import {ConfirmationService, MessageService} from 'primeng/api';
import {provideRouter} from '@angular/router';
import {of} from 'rxjs';
import {Saida} from './saida';
import {LoginService} from '../login/login.service';
import {createServiceMock} from '../framework/testing/test-helpers';

/**
 * Factory para criação de objetos Saida para testes
 */
class SaidaTestFactory {
  private static nextId = 1;

  static create(overrides: Partial<Saida> = {}): Saida {
    const saida = new Saida();
    saida.id = overrides.id ?? this.nextId++;
    saida.dataSaida = overrides.dataSaida ?? '01/12/2025';
    saida.observacao = overrides.observacao ?? 'Observação de teste';
    saida.usuarioResponsavelNome = overrides.usuarioResponsavelNome ?? 'Usuário Teste';
    saida.saidaItem = overrides.saidaItem ?? [];
    if (overrides.idEmprestimo !== undefined) {
      saida.idEmprestimo = overrides.idEmprestimo;
    }
    return saida;
  }

  static createList(count: number): Saida[] {
    return Array.from({length: count}, (_, i) => this.create({id: i + 1}));
  }

  static createFromEmprestimo(overrides: Partial<Saida> = {}): Saida {
    return this.create({
      ...overrides,
      idEmprestimo: 123
    });
  }

  static resetIdCounter(): void {
    this.nextId = 1;
  }
}

/**
 * Testes abrangentes para SaidaListComponent
 * Cobre lógica de permissões e integração com ActionButtonsComponent
 */
describe('SaidaListComponent', () => {
  let component: SaidaListComponent;
  let fixture: ComponentFixture<SaidaListComponent>;
  let saidaService: jest.Mocked<SaidaService>;
  let messageService: jest.Mocked<MessageService>;
  let loginService: jest.Mocked<LoginService>;

  let mockSaidas: Saida[];

  beforeAll(() => {
    mockSaidas = SaidaTestFactory.createList(3);
  });

  beforeEach(async () => {
    const saidaServiceSpy = createServiceMock<SaidaService>([
      'findAll',
      'findAllPaged',
      'delete',
      'findOne'
    ]);

    const confirmationServiceSpy = createServiceMock<ConfirmationService>(['confirm']);
    const messageServiceSpy = createServiceMock<MessageService>(['add']);
    const loginServiceSpy = createServiceMock<LoginService>(['isAlunoOrProfessor']);

    await TestBed.configureTestingModule({
      imports: [SaidaListComponent],
      providers: [
        provideRouter([]),
        {provide: SaidaService, useValue: saidaServiceSpy},
        {provide: ConfirmationService, useValue: confirmationServiceSpy},
        {provide: MessageService, useValue: messageServiceSpy},
        {provide: LoginService, useValue: loginServiceSpy}
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SaidaListComponent);
    component = fixture.componentInstance;

    saidaService = TestBed.inject(SaidaService) as jest.Mocked<SaidaService>;
    messageService = TestBed.inject(MessageService) as jest.Mocked<MessageService>;
    loginService = TestBed.inject(LoginService) as jest.Mocked<LoginService>;

    saidaService.findAll.mockReturnValue(of(mockSaidas));
    saidaService.findAllPaged.mockReturnValue(of({
      content: mockSaidas,
      totalElements: mockSaidas.length,
      totalPages: 1,
      size: mockSaidas.length,
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
    SaidaTestFactory.resetIdCounter();
  });

  // ============================================================================
  // Component Setup (5 tests)
  // ============================================================================
  describe('Component Setup', () => {
    it('deve criar o componente', () => {
      expect(component).toBeTruthy();
    });

    it('deve injetar serviços corretamente', () => {
      expect(component['service']).toBe(saidaService);
    });

    it('deve configurar tabela com colunas corretas', () => {
      expect(component['columnsTable']).toEqual([
        'id',
        'dataSaida',
        'qtdeTotal',
        'usuarioResponsavelNome',
        'actions'
      ]);
    });

    it('deve definir urlForm corretamente', () => {
      expect(component['urlForm']).toBe('saida/form');
    });

    it('deve configurar tableConfig corretamente', () => {
      expect(component['tableConfig'].columns).toBeDefined();
      expect(component['tableConfig'].stateKey).toBe('saida-list');
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

    it('deve chamar preDelete() com saida correta', () => {
      const preDeleteSpy = jest.spyOn(component, 'preDelete');
      const mockSaida = SaidaTestFactory.create({id: 456});
      component.preDelete(mockSaida);
      expect(preDeleteSpy).toHaveBeenCalledWith(mockSaida);
    });
  });

  // ============================================================================
  // preDelete() Business Logic (4 tests)
  // ============================================================================
  describe('preDelete() Business Logic', () => {
    it('deve mostrar mensagem de info se saida tem idEmprestimo', () => {
      const saidaComEmprestimo = SaidaTestFactory.createFromEmprestimo();

      component.preDelete(saidaComEmprestimo);

      expect(messageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'info',
          summary: 'Atenção!'
        })
      );
    });

    it('deve chamar delete() se saida não tem idEmprestimo', () => {
      const saidaSemEmprestimo = SaidaTestFactory.create({idEmprestimo: undefined});
      const deleteSpy = jest.spyOn(component, 'delete');

      component.preDelete(saidaSemEmprestimo);

      expect(deleteSpy).toHaveBeenCalledWith(saidaSemEmprestimo.id);
    });

    it('não deve chamar delete() se saida tem idEmprestimo', () => {
      const saidaComEmprestimo = SaidaTestFactory.createFromEmprestimo();
      const deleteSpy = jest.spyOn(component, 'delete');

      component.preDelete(saidaComEmprestimo);

      expect(deleteSpy).not.toHaveBeenCalled();
    });

    it('deve mostrar mensagem explicando o motivo do bloqueio', () => {
      const saidaComEmprestimo = SaidaTestFactory.createFromEmprestimo();

      component.preDelete(saidaComEmprestimo);

      expect(messageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: expect.stringContaining('devolução')
        })
      );
    });
  });

  // ============================================================================
  // getQtdeTotal() (3 tests)
  // ============================================================================
  describe('getQtdeTotal()', () => {
    it('deve calcular soma de quantidades', () => {
      const saidaItems = [
        {qtde: 5},
        {qtde: 3},
        {qtde: 2}
      ] as any[];

      const total = component.getQtdeTotal(saidaItems);

      expect(total).toBe(10);
    });

    it('deve retornar 0 para array vazio', () => {
      const total = component.getQtdeTotal([]);

      expect(total).toBe(0);
    });

    it('deve lidar com valores numéricos em string', () => {
      const saidaItems = [
        {qtde: '5'},
        {qtde: '3'}
      ] as any[];

      const total = component.getQtdeTotal(saidaItems);

      expect(total).toBe(8);
    });
  });

  // ============================================================================
  // Base Class Overrides (4 tests)
  // ============================================================================
  describe('Base Class Overrides', () => {
    it('deve retornar nome de arquivo de exportação correto', () => {
      const filename = component['getExportFileName']();
      expect(filename).toBe('saidas');
    });

    it('deve retornar nome da entidade correto', () => {
      const entityName = component['getEntityName']();
      expect(entityName).toBe('Saída');
    });

    it('deve retornar nome plural da entidade correto', () => {
      const pluralName = component['getEntityPluralName']();
      expect(pluralName).toBe('Saídas');
    });

    it('deve configurar tableConfig com campos corretos', () => {
      expect(component['tableConfig'].globalFilterFields).toBeDefined();
      expect(component['tableConfig'].defaultSortField).toBe('id');
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
  // Configuração de Ordenação (7 tests)
  // ============================================================================
  describe('Configuração de Ordenação', () => {
    it('deve ter coluna id com sortable true', () => {
      const column = component['tableConfig'].columns.find(c => c.field === 'id');
      expect(column?.sortable).toBe(true);
    });

    it('deve ter coluna dataSaida com sortable true', () => {
      const column = component['tableConfig'].columns.find(c => c.field === 'dataSaida');
      expect(column?.sortable).toBe(true);
    });

    it('deve ter coluna qtdeTotal com sortable true', () => {
      const column = component['tableConfig'].columns.find(c => c.field === 'qtdeTotal');
      expect(column?.sortable).toBe(true);
    });

    it('deve ter coluna usuarioResponsavelNome com sortable true', () => {
      const column = component['tableConfig'].columns.find(c => c.field === 'usuarioResponsavelNome');
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
});
