import {TemplateRef} from '@angular/core';
import {TableColumnManagerService} from './table-column-manager.service';
import {TableColumn} from '../model/table-config.interface';

describe('TableColumnManagerService', () => {
  let service: TableColumnManagerService;

  beforeEach(() => {
    // Cria instância direta do serviço
    service = new TableColumnManagerService();
  });

  afterEach(() => {
    // Limpa templates após cada teste
    service.clearColumnTemplates();
  });

  // Helper para criar colunas de teste
  const createColumns = (): TableColumn[] => [
    {field: 'id', header: 'ID', sortable: true, filterable: true, toggleable: true, visible: true},
    {
      field: 'name',
      header: 'Nome',
      sortable: true,
      filterable: true,
      toggleable: true,
      visible: true
    },
    {
      field: 'email',
      header: 'Email',
      sortable: true,
      filterable: true,
      toggleable: true,
      visible: false
    },
    {
      field: 'actions',
      header: 'Ações',
      sortable: false,
      filterable: false,
      toggleable: false,
      visible: true
    }
  ];

  describe('initializeColumnToggle', () => {
    it('deve criar opções de toggle para colunas toggleable', () => {
      const columns = createColumns();

      const result = service.initializeColumnToggle(columns);

      expect(result.columnToggleOptions).toHaveLength(3); // id, name, email (actions é excluído)
      expect(result.columnToggleOptions).toEqual([
        {label: 'ID', value: 'id'},
        {label: 'Nome', value: 'name'},
        {label: 'Email', value: 'email'}
      ]);
    });

    it('deve criar modelo com colunas visíveis', () => {
      const columns = createColumns();

      const result = service.initializeColumnToggle(columns);

      expect(result.columnToggleModel).toEqual(['id', 'name']); // email está visible: false
    });

    it('deve excluir coluna actions das opções', () => {
      const columns = createColumns();

      const result = service.initializeColumnToggle(columns);

      expect(result.columnToggleOptions.find(opt => opt.value === 'actions')).toBeUndefined();
    });

    it('deve excluir colunas com toggleable: false', () => {
      const columns: TableColumn[] = [
        {field: 'id', header: 'ID', toggleable: false},
        {field: 'name', header: 'Nome', toggleable: true}
      ];

      const result = service.initializeColumnToggle(columns);

      expect(result.columnToggleOptions).toHaveLength(1);
      expect(result.columnToggleOptions[0].value).toBe('name');
    });
  });

  describe('handleColumnToggleChange', () => {
    it('deve atualizar visibilidade das colunas baseado na seleção', () => {
      const columns = createColumns();
      const selectedFields = ['id', 'email'];

      service.handleColumnToggleChange(columns, selectedFields);

      expect(columns.find(c => c.field === 'id')?.visible).toBe(true);
      expect(columns.find(c => c.field === 'name')?.visible).toBe(false);
      expect(columns.find(c => c.field === 'email')?.visible).toBe(true);
    });

    it('deve garantir pelo menos uma coluna visível quando array está vazio', () => {
      const columns = createColumns();

      const result = service.handleColumnToggleChange(columns, []);

      expect(result).toHaveLength(1);
      expect(result[0]).toBe('id'); // primeira coluna toggleable
    });

    it('deve retornar selectedFields inalterado quando columns é null', () => {
      const selectedFields = ['id', 'name'];

      const result = service.handleColumnToggleChange(null as any, selectedFields);

      expect(result).toEqual(selectedFields);
    });

    it('não deve alterar colunas com toggleable: false', () => {
      const columns: TableColumn[] = [
        {field: 'id', header: 'ID', toggleable: false, visible: true},
        {field: 'name', header: 'Nome', toggleable: true, visible: true}
      ];

      service.handleColumnToggleChange(columns, ['name']);

      expect(columns.find(c => c.field === 'id')?.visible).toBe(true); // não mudou
    });

    it('não deve alterar coluna actions', () => {
      const columns = createColumns();

      service.handleColumnToggleChange(columns, ['id']);

      expect(columns.find(c => c.field === 'actions')?.visible).toBe(true); // não mudou
    });
  });

  describe('updateColumnsForPermissions', () => {
    it('deve ocultar coluna actions quando isReadOnly é true', () => {
      const columns = createColumns();

      service.updateColumnsForPermissions(columns, true);

      expect(columns.find(c => c.field === 'actions')?.visible).toBe(false);
    });

    it('deve mostrar coluna actions quando isReadOnly é false', () => {
      const columns = createColumns();

      service.updateColumnsForPermissions(columns, false);

      expect(columns.find(c => c.field === 'actions')?.visible).toBe(true);
    });

    it('não deve fazer nada quando columns é null', () => {
      expect(() => {
        service.updateColumnsForPermissions(null as any, true);
      }).not.toThrow();
    });

    it('não deve fazer nada quando não há coluna actions', () => {
      const columns: TableColumn[] = [
        {field: 'id', header: 'ID'}
      ];

      expect(() => {
        service.updateColumnsForPermissions(columns, true);
      }).not.toThrow();
    });
  });

  describe('buildDisplayedColumns', () => {
    it('deve retornar todas as colunas quando responsive está desabilitado', () => {
      const columnsTable = ['id', 'name', 'actions'];

      const result = service.buildDisplayedColumns(columnsTable, false, 800);

      expect(result).toEqual(['id', 'name', 'actions']);
    });

    it('deve ocultar coluna actions em telas pequenas', () => {
      const columnsTable = ['id', 'name', 'actions'];

      const result = service.buildDisplayedColumns(columnsTable, true, 800);

      expect(result).toEqual(['id', 'name']);
    });

    it('deve mostrar coluna actions em telas grandes', () => {
      const columnsTable = ['id', 'name', 'actions'];

      const result = service.buildDisplayedColumns(columnsTable, true, 1200);

      expect(result).toEqual(['id', 'name', 'actions']);
    });

    it('deve usar breakpoint customizado', () => {
      const columnsTable = ['id', 'name', 'actions'];

      const result = service.buildDisplayedColumns(columnsTable, true, 900, 800);

      expect(result).toEqual(['id', 'name', 'actions']); // 900 > 800
    });

    it('não deve adicionar coluna actions se original não tem', () => {
      const columnsTable = ['id', 'name'];

      const result = service.buildDisplayedColumns(columnsTable, true, 1200);

      expect(result).toEqual(['id', 'name']); // não adiciona pois original não tem actions
    });
  });

  describe('getDisplayedColumnsFromConfig', () => {
    it('deve retornar campos de colunas visíveis', () => {
      const columns = createColumns();

      const result = service.getDisplayedColumnsFromConfig(columns);

      expect(result).toEqual(['id', 'name', 'actions']); // email está visible: false
    });

    it('deve retornar array vazio quando columns é null', () => {
      const result = service.getDisplayedColumnsFromConfig(null as any);

      expect(result).toEqual([]);
    });

    it('deve incluir colunas sem propriedade visible (padrão é true)', () => {
      const columns: TableColumn[] = [
        {field: 'id', header: 'ID'},
        {field: 'name', header: 'Nome', visible: false}
      ];

      const result = service.getDisplayedColumnsFromConfig(columns);

      expect(result).toEqual(['id']);
    });
  });

  describe('initializeGlobalFilterFields', () => {
    it('deve retornar campos filtráveis excluindo actions', () => {
      const columns = createColumns();

      const result = service.initializeGlobalFilterFields(columns);

      expect(result).toEqual(['id', 'name', 'email']);
    });

    it('deve retornar array vazio quando columns é null', () => {
      const result = service.initializeGlobalFilterFields(null as any);

      expect(result).toEqual([]);
    });

    it('deve excluir colunas com filterable: false', () => {
      const columns: TableColumn[] = [
        {field: 'id', header: 'ID', filterable: true},
        {field: 'name', header: 'Nome', filterable: false}
      ];

      const result = service.initializeGlobalFilterFields(columns);

      expect(result).toEqual(['id']);
    });
  });

  describe('registerColumnTemplate e getColumnTemplate', () => {
    it('deve registrar template de coluna', () => {
      const mockTemplate = {test: 'template'} as any as TemplateRef<any>;

      service.registerColumnTemplate('id', mockTemplate);

      expect(service.getColumnTemplate('id')).toBe(mockTemplate);
    });

    it('deve retornar undefined para template não registrado', () => {
      const result = service.getColumnTemplate('nonexistent');

      expect(result).toBeUndefined();
    });

    it('deve sobrescrever template existente', () => {
      const mockTemplate1 = {test: 'template1'} as any as TemplateRef<any>;
      const mockTemplate2 = {test: 'template2'} as any as TemplateRef<any>;

      service.registerColumnTemplate('id', mockTemplate1);
      service.registerColumnTemplate('id', mockTemplate2);

      expect(service.getColumnTemplate('id')).toBe(mockTemplate2);
    });
  });

  describe('clearColumnTemplates', () => {
    it('deve limpar todos os templates registrados', () => {
      const mockTemplate = {test: 'template'} as any as TemplateRef<any>;
      service.registerColumnTemplate('id', mockTemplate);
      service.registerColumnTemplate('name', mockTemplate);

      service.clearColumnTemplates();

      expect(service.getColumnTemplate('id')).toBeUndefined();
      expect(service.getColumnTemplate('name')).toBeUndefined();
    });
  });

  describe('getVisibleColumns', () => {
    it('deve retornar apenas colunas visíveis', () => {
      const columns = createColumns();

      const result = service.getVisibleColumns(columns);

      expect(result).toHaveLength(3); // id, name, actions
      expect(result.map(c => c.field)).toEqual(['id', 'name', 'actions']);
    });

    it('deve incluir colunas sem propriedade visible (padrão é true)', () => {
      const columns: TableColumn[] = [
        {field: 'id', header: 'ID'},
        {field: 'name', header: 'Nome', visible: false}
      ];

      const result = service.getVisibleColumns(columns);

      expect(result).toHaveLength(1);
      expect(result[0].field).toBe('id');
    });
  });

  describe('getSortableColumns', () => {
    it('deve retornar apenas colunas ordenáveis', () => {
      const columns = createColumns();

      const result = service.getSortableColumns(columns);

      expect(result).toHaveLength(3); // id, name, email (actions é sortable: false)
      expect(result.map(c => c.field)).toEqual(['id', 'name', 'email']);
    });
  });

  describe('getFilterableColumns', () => {
    it('deve retornar apenas colunas com filterable: true', () => {
      const columns = createColumns();

      const result = service.getFilterableColumns(columns);

      expect(result).toHaveLength(3); // id, name, email
      expect(result.map(c => c.field)).toEqual(['id', 'name', 'email']);
    });

    it('deve excluir colunas sem propriedade filterable', () => {
      const columns: TableColumn[] = [
        {field: 'id', header: 'ID', filterable: true},
        {field: 'name', header: 'Nome'} // sem filterable
      ];

      const result = service.getFilterableColumns(columns);

      expect(result).toHaveLength(1);
      expect(result[0].field).toBe('id');
    });
  });

  describe('getExportableColumns', () => {
    it('deve retornar colunas exportáveis (padrão é true)', () => {
      const columns: TableColumn[] = [
        {field: 'id', header: 'ID'},
        {field: 'name', header: 'Nome', exportable: false}
      ];

      const result = service.getExportableColumns(columns);

      expect(result).toHaveLength(1);
      expect(result[0].field).toBe('id');
    });
  });

  describe('getColumnCount', () => {
    it('deve contar apenas colunas visíveis', () => {
      const result = service.getColumnCount(5, false, false, false);

      expect(result).toBe(5);
    });

    it('deve adicionar 1 para tabela expansível', () => {
      const result = service.getColumnCount(5, true, false, false);

      expect(result).toBe(6);
    });

    it('deve adicionar 1 para tabela selecionável quando não é readOnly', () => {
      const result = service.getColumnCount(5, false, true, false);

      expect(result).toBe(6);
    });

    it('não deve adicionar coluna de seleção quando é readOnly', () => {
      const result = service.getColumnCount(5, false, true, true);

      expect(result).toBe(5);
    });

    it('deve contar corretamente com expansível e selecionável', () => {
      const result = service.getColumnCount(5, true, true, false);

      expect(result).toBe(7);
    });
  });

  describe('getColumnWidth', () => {
    it('deve retornar largura customizada quando definida', () => {
      const column: TableColumn = {field: 'id', header: 'ID', width: '200px'};

      const result = service.getColumnWidth(column);

      expect(result).toBe('200px');
    });

    it('deve retornar 80px para colunas boolean', () => {
      const column: TableColumn = {field: 'active', header: 'Ativo', type: 'boolean'};

      const result = service.getColumnWidth(column);

      expect(result).toBe('80px');
    });

    it('deve retornar 120px para colunas number', () => {
      const column: TableColumn = {field: 'age', header: 'Idade', type: 'number'};

      const result = service.getColumnWidth(column);

      expect(result).toBe('120px');
    });

    it('deve retornar 140px para colunas date', () => {
      const column: TableColumn = {field: 'createdAt', header: 'Criado em', type: 'date'};

      const result = service.getColumnWidth(column);

      expect(result).toBe('140px');
    });

    it('deve retornar minWidth para outros tipos', () => {
      const column: TableColumn = {field: 'name', header: 'Nome', minWidth: '150px'};

      const result = service.getColumnWidth(column);

      expect(result).toBe('150px');
    });

    it('deve retornar undefined quando não há width nem minWidth', () => {
      const column: TableColumn = {field: 'name', header: 'Nome'};

      const result = service.getColumnWidth(column);

      expect(result).toBeUndefined();
    });
  });

  describe('shouldShowActionsColumn', () => {
    it('deve retornar true quando actions está nas colunas exibidas e não é readOnly', () => {
      const result = service.shouldShowActionsColumn(['id', 'name', 'actions'], false);

      expect(result).toBe(true);
    });

    it('deve retornar false quando é readOnly', () => {
      const result = service.shouldShowActionsColumn(['id', 'name', 'actions'], true);

      expect(result).toBe(false);
    });

    it('deve retornar false quando actions não está nas colunas exibidas', () => {
      const result = service.shouldShowActionsColumn(['id', 'name'], false);

      expect(result).toBe(false);
    });
  });

  describe('testes de integração', () => {
    it('deve permitir fluxo completo de gerenciamento de colunas', () => {
      const columns = createColumns();

      // Inicializar toggle
      const toggleData = service.initializeColumnToggle(columns);
      expect(toggleData.columnToggleOptions).toHaveLength(3);

      // Atualizar visibilidade
      service.handleColumnToggleChange(columns, ['id', 'email']);
      expect(service.getVisibleColumns(columns)).toHaveLength(3); // id, email, actions

      // Atualizar por permissões
      service.updateColumnsForPermissions(columns, true);
      expect(columns.find(c => c.field === 'actions')?.visible).toBe(false);

      // Obter colunas exibidas
      const displayed = service.getDisplayedColumnsFromConfig(columns);
      expect(displayed).toEqual(['id', 'email']); // actions agora está hidden
    });

    it('deve gerenciar templates corretamente', () => {
      const mockTemplate1 = {test: 'template1'} as any as TemplateRef<any>;
      const mockTemplate2 = {test: 'template2'} as any as TemplateRef<any>;

      // Registrar templates
      service.registerColumnTemplate('id', mockTemplate1);
      service.registerColumnTemplate('name', mockTemplate2);

      // Recuperar templates
      expect(service.getColumnTemplate('id')).toBe(mockTemplate1);
      expect(service.getColumnTemplate('name')).toBe(mockTemplate2);

      // Limpar todos
      service.clearColumnTemplates();
      expect(service.getColumnTemplate('id')).toBeUndefined();
      expect(service.getColumnTemplate('name')).toBeUndefined();
    });

    it('deve calcular dimensões responsivas corretamente', () => {
      const columnsTable = ['id', 'name', 'email', 'actions'];

      // Tela pequena - deve ocultar actions
      const smallScreen = service.buildDisplayedColumns(columnsTable, true, 600);
      expect(smallScreen).toEqual(['id', 'name', 'email']);

      // Tela grande - deve mostrar actions
      const largeScreen = service.buildDisplayedColumns(columnsTable, true, 1200);
      expect(largeScreen).toEqual(['id', 'name', 'email', 'actions']);

      // Sem responsive - deve mostrar tudo
      const noResponsive = service.buildDisplayedColumns(columnsTable, false, 600);
      expect(noResponsive).toEqual(['id', 'name', 'email', 'actions']);
    });
  });
});
