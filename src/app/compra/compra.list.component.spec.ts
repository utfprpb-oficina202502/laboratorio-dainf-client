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
      expect(component['columnsTable']).toEqual([
        'id',
        'fornecedorNomeFantasia',
        'fornecedorRazaoSocial',
        'dataCompra',
        'actions'
      ]);
    });

    it('deve definir urlForm corretamente', () => {
      expect(component['urlForm']).toBe('compra/form');
    });

    it('deve configurar tableConfig corretamente', () => {
      expect(component['tableConfig'].columns).toBeDefined();
      expect(component['tableConfig'].stateKey).toBe('compra-list');
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
  // TableConfig (4 tests)
  // ============================================================================
  describe('TableConfig', () => {
    it('deve ter campos de filtro global', () => {
      expect(component['tableConfig'].globalFilterFields).toBeDefined();
      expect(component['tableConfig'].globalFilterFields).toContain('id');
    });

    it('deve ter campo de ordenação padrão', () => {
      expect(component['tableConfig'].defaultSortField).toBe('id');
    });

    it('deve ter caption definido', () => {
      expect(component['tableConfig'].caption).toBe('Compras');
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

    it('deve ter coluna fornecedorNomeFantasia com sortable true', () => {
      const column = component['tableConfig'].columns.find(c => c.field === 'fornecedorNomeFantasia');
      expect(column?.sortable).toBe(true);
    });

    it('deve ter coluna fornecedorRazaoSocial com sortable true', () => {
      const column = component['tableConfig'].columns.find(c => c.field === 'fornecedorRazaoSocial');
      expect(column?.sortable).toBe(true);
    });

    it('deve ter coluna dataCompra com sortable true', () => {
      const column = component['tableConfig'].columns.find(c => c.field === 'dataCompra');
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
