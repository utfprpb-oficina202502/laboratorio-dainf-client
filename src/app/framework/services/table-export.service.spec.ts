import {TestBed} from '@angular/core/testing';
import {MessageService} from 'primeng/api';
import {Table} from 'primeng/table';
import {TableExportService} from './table-export.service';
import {LoggerService} from './logger.service';
import {TableColumn} from '../model/table-config.interface';
// Importa o módulo mockado para acessar a função mock
import writeXlsxFile from 'write-excel-file';

// Jest.mock é hoisted para o topo do arquivo
jest.mock('write-excel-file', () => ({
  __esModule: true,
  default: jest.fn()
}));

describe('TableExportService', () => {
  let service: TableExportService;
  let messageService: jest.Mocked<MessageService>;
  let loggerService: jest.Mocked<LoggerService>;

  /**
   * Helper para aguardar promises assíncronas
   */
  async function waitForAsync(): Promise<void> {
    await Promise.resolve();
    await Promise.resolve(); // Double flush for nested promises
  }

  // Mock data para testes
  const mockColumns: TableColumn[] = [
    {field: 'id', header: 'ID', type: 'number'},
    {field: 'name', header: 'Nome'},
    {field: 'grupo.descricao', header: 'Grupo'},
    {field: 'actions', header: 'Ações'}
  ];

  const mockData = [
    {id: 1, name: 'Item 1', grupo: {descricao: 'Grupo A'}},
    {id: 2, name: 'Item 2', grupo: {descricao: 'Grupo B'}},
    {id: 3, name: 'Item 3', grupo: {descricao: 'Grupo C'}}
  ];

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Configura o mock para retornar Promise.resolve()
    (writeXlsxFile as jest.Mock).mockResolvedValue(undefined);

    // Cria mocks dos serviços
    messageService = {
      add: jest.fn()
    } as unknown as jest.Mocked<MessageService>;

    loggerService = {
      error: jest.fn(),
      warn: jest.fn()
    } as unknown as jest.Mocked<LoggerService>;

    TestBed.configureTestingModule({
      providers: [
        TableExportService,
        {provide: MessageService, useValue: messageService},
        {provide: LoggerService, useValue: loggerService}
      ]
    });

    service = TestBed.inject(TableExportService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('exportToExcel', () => {
    it('deve exibir warning quando não há dados', () => {
      service.exportToExcel([], mockColumns, 'test');

      expect(messageService.add).toHaveBeenCalledWith({
        severity: 'warn',
        summary: 'Aviso',
        detail: 'Não há dados para exportar'
      });
      expect((writeXlsxFile as jest.Mock)).not.toHaveBeenCalled();
    });

    it('deve exibir warning quando dados são null', () => {
      service.exportToExcel(null as unknown as unknown[], mockColumns, 'test');

      expect(messageService.add).toHaveBeenCalledWith({
        severity: 'warn',
        summary: 'Aviso',
        detail: 'Não há dados para exportar'
      });
      expect((writeXlsxFile as jest.Mock)).not.toHaveBeenCalled();
    });

    it('deve exibir mensagem informativa ao iniciar exportação', async () => {
      service.exportToExcel(mockData, mockColumns, 'test');

      await waitForAsync();

      expect(messageService.add).toHaveBeenCalledWith({
        severity: 'info',
        summary: 'Preparando exportação',
        detail: 'O arquivo Excel será baixado em breve...'
      });
    });

    it('deve chamar writeXlsxFile com schema e opções corretas', async () => {
      service.exportToExcel(mockData, mockColumns, 'test');

      await waitForAsync();

      expect((writeXlsxFile as jest.Mock)).toHaveBeenCalledWith(
        mockData,
        expect.objectContaining({
          schema: expect.any(Array),
          fileName: expect.stringContaining('test_export_'),
          sheet: 'Dados',
          headerStyle: expect.objectContaining({
            fontWeight: 'bold',
            backgroundColor: '#f5f5f5'
          })
        })
      );
    });

    it('deve filtrar coluna actions do schema', async () => {
      service.exportToExcel(mockData, mockColumns, 'test');

      await waitForAsync();

      const callArgs = (writeXlsxFile as jest.Mock).mock.calls[0];
      const options = callArgs[1] as unknown as { schema: { column: string }[] };
      const schemaColumns = options.schema.map(s => s.column);

      expect(schemaColumns).not.toContain('Ações');
      expect(schemaColumns).toContain('ID');
      expect(schemaColumns).toContain('Nome');
      expect(schemaColumns).toContain('Grupo');
    });

    it('deve usar nome de arquivo padrão quando não fornecido', async () => {
      service.exportToExcel(mockData, mockColumns);

      await waitForAsync();

      const callArgs = (writeXlsxFile as jest.Mock).mock.calls[0];
      const options = callArgs[1] as unknown as { fileName: string };

      expect(options.fileName).toContain('dados_export_');
      expect(options.fileName).toContain('.xlsx');
    });

    it('deve usar nome de arquivo fornecido', async () => {
      service.exportToExcel(mockData, mockColumns, 'meus-dados');

      await waitForAsync();

      const callArgs = (writeXlsxFile as jest.Mock).mock.calls[0];
      const options = callArgs[1] as unknown as { fileName: string };

      expect(options.fileName).toContain('meus-dados_export_');
      expect(options.fileName).toContain('.xlsx');
    });

    it('deve respeitar visibleColumns quando fornecido', async () => {
      const visibleColumns = ['id', 'name']; // Apenas id e name visíveis

      service.exportToExcel(mockData, mockColumns, 'test', visibleColumns);

      await waitForAsync();

      const callArgs = (writeXlsxFile as jest.Mock).mock.calls[0];
      const options = callArgs[1] as unknown as { schema: { column: string }[] };
      const schemaColumns = options.schema.map(s => s.column);

      expect(schemaColumns).toEqual(['ID', 'Nome']);
      expect(schemaColumns).not.toContain('Grupo');
    });

    it('deve ignorar visibleColumns vazio e exportar todas as colunas', async () => {
      service.exportToExcel(mockData, mockColumns, 'test', []);

      await waitForAsync();

      const callArgs = (writeXlsxFile as jest.Mock).mock.calls[0];
      const options = callArgs[1] as unknown as { schema: { column: string }[] };
      const schemaColumns = options.schema.map(s => s.column);

      // Deve incluir todas exceto 'actions'
      expect(schemaColumns).toContain('ID');
      expect(schemaColumns).toContain('Nome');
      expect(schemaColumns).toContain('Grupo');
    });

    it('deve exibir warning quando não há colunas exportáveis', async () => {
      const onlyActionsColumns: TableColumn[] = [
        {field: 'actions', header: 'Ações'}
      ];

      service.exportToExcel(mockData, onlyActionsColumns, 'test');

      await waitForAsync();

      expect(messageService.add).toHaveBeenCalledWith({
        severity: 'warn',
        summary: 'Aviso',
        detail: 'Nenhuma coluna disponível para exportação'
      });
      expect((writeXlsxFile as jest.Mock)).not.toHaveBeenCalled();
    });

    it('deve filtrar colunas com exportable=false', async () => {
      const columnsWithNonExportable: TableColumn[] = [
        {field: 'id', header: 'ID'},
        {field: 'name', header: 'Nome'},
        {field: 'internal', header: 'Internal', exportable: false}
      ];

      service.exportToExcel(mockData, columnsWithNonExportable, 'test');

      await waitForAsync();

      const callArgs = (writeXlsxFile as jest.Mock).mock.calls[0];
      const options = callArgs[1] as unknown as { schema: { column: string }[] };
      const schemaColumns = options.schema.map(s => s.column);

      expect(schemaColumns).not.toContain('Internal');
    });

    it('deve manipular campos de objetos aninhados', async () => {
      const dataWithNested = [{id: 1, user: {profile: {name: 'John'}}}];
      const columnsWithNested: TableColumn[] = [
        {field: 'id', header: 'ID'},
        {field: 'user.profile.name', header: 'User Name'}
      ];

      service.exportToExcel(dataWithNested, columnsWithNested, 'test');

      await waitForAsync();

      expect((writeXlsxFile as jest.Mock)).toHaveBeenCalled();
    });

    it('deve manipular colunas com type=custom e objeto com descricao', async () => {
      const dataWithCustom = [{id: 1, item: {descricao: 'Item A', id: 100}}];
      const columnsWithCustom: TableColumn[] = [
        {field: 'id', header: 'ID'},
        {field: 'item', header: 'Item', type: 'custom'}
      ];

      service.exportToExcel(dataWithCustom, columnsWithCustom, 'test');

      await waitForAsync();

      expect((writeXlsxFile as jest.Mock)).toHaveBeenCalled();
    });

    it('deve manipular erro durante exportação', async () => {
      (writeXlsxFile as jest.Mock).mockRejectedValueOnce(new Error('Export failed'));

      service.exportToExcel(mockData, mockColumns, 'test');

      await waitForAsync();

      expect(loggerService.error).toHaveBeenCalledWith('Error exporting to Excel', expect.any(Error));
      expect(messageService.add).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'Erro',
        detail: 'Erro ao exportar dados para Excel'
      });
    });

    it('deve criar schema com larguras de coluna baseadas nos headers', async () => {
      const columnsWithLongHeaders: TableColumn[] = [
        {field: 'id', header: 'ID'},
        {field: 'longName', header: 'Este é um header muito longo para testar'}
      ];

      service.exportToExcel(mockData, columnsWithLongHeaders, 'test');

      await waitForAsync();

      const callArgs = (writeXlsxFile as jest.Mock).mock.calls[0];
      const options = callArgs[1] as unknown as { schema: { width: number }[] };

      // Verifica que larguras foram definidas
      expect(options.schema[0].width).toBeDefined();
      expect(options.schema[1].width).toBeDefined();
      // Header longo deve ter largura maior (até o limite de 50)
      expect(options.schema[1].width).toBeGreaterThan(options.schema[0].width);
    });
  });

  describe('exportToCSV', () => {
    let mockTable: jest.Mocked<Table>;

    beforeEach(() => {
      mockTable = {
        exportCSV: jest.fn(),
        columns: []
      } as unknown as jest.Mocked<Table>;
    });

    it('deve exibir warning quando table é null', () => {
      service.exportToCSV(null, mockData, mockColumns);

      expect(loggerService.warn).toHaveBeenCalledWith(
        'TableExportService: exportCSV called without table reference.'
      );
      expect(messageService.add).toHaveBeenCalledWith({
        severity: 'warn',
        summary: 'Aviso',
        detail: 'Tabela não encontrada para exportação CSV'
      });
    });

    it('deve exibir warning quando table é undefined', () => {
      service.exportToCSV(undefined, mockData, mockColumns);

      expect(loggerService.warn).toHaveBeenCalledWith(
        'TableExportService: exportCSV called without table reference.'
      );
    });

    it('deve exibir warning quando não há dados', () => {
      service.exportToCSV(mockTable, [], mockColumns);

      expect(messageService.add).toHaveBeenCalledWith({
        severity: 'warn',
        summary: 'Aviso',
        detail: 'Não há dados para exportar'
      });
    });

    it('deve exibir warning quando dados são null', () => {
      service.exportToCSV(mockTable, null as unknown as unknown[], mockColumns);

      expect(messageService.add).toHaveBeenCalledWith({
        severity: 'warn',
        summary: 'Aviso',
        detail: 'Não há dados para exportar'
      });
    });

    it('deve exibir warning quando não há colunas exportáveis', () => {
      const nonExportableColumns: TableColumn[] = [
        {field: 'actions', header: 'Ações'},
        {field: 'other', header: 'Other', exportable: false}
      ];

      service.exportToCSV(mockTable, mockData, nonExportableColumns);

      expect(messageService.add).toHaveBeenCalledWith({
        severity: 'warn',
        summary: 'Aviso',
        detail: 'Nenhuma coluna disponível para exportação'
      });
    });

    it('deve configurar columns na table antes de exportar', () => {
      service.exportToCSV(mockTable, mockData, mockColumns);

      expect(mockTable.columns).toBeDefined();
      expect(Array.isArray(mockTable.columns)).toBe(true);
    });

    it('deve filtrar coluna actions das colunas exportáveis', () => {
      service.exportToCSV(mockTable, mockData, mockColumns);

      const columns = mockTable.columns as { field: string }[];
      const hasActions = columns.some((col) => col.field === 'actions');
      expect(hasActions).toBe(false);
    });

    it('deve filtrar colunas com exportable=false', () => {
      const columnsWithNonExportable: TableColumn[] = [
        {field: 'id', header: 'ID'},
        {field: 'name', header: 'Nome'},
        {field: 'internal', header: 'Internal', exportable: false}
      ];

      service.exportToCSV(mockTable, mockData, columnsWithNonExportable);

      const columns = mockTable.columns as { field: string }[];
      const hasInternal = columns.some((col) => col.field === 'internal');
      expect(hasInternal).toBe(false);
    });

    it('deve exibir mensagem informativa ao iniciar exportação', () => {
      service.exportToCSV(mockTable, mockData, mockColumns);

      expect(messageService.add).toHaveBeenCalledWith({
        severity: 'info',
        summary: 'Preparando exportação',
        detail: 'O arquivo CSV será baixado em breve...'
      });
    });

    it('deve chamar exportCSV da table do PrimeNG', () => {
      service.exportToCSV(mockTable, mockData, mockColumns);

      expect(mockTable.exportCSV).toHaveBeenCalled();
    });

    it('deve manipular erro durante exportação', () => {
      mockTable.exportCSV.mockImplementation(() => {
        throw new Error('Export failed');
      });

      service.exportToCSV(mockTable, mockData, mockColumns);

      expect(loggerService.error).toHaveBeenCalledWith('Error exporting CSV', expect.any(Error));
      expect(messageService.add).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'Erro',
        detail: 'Erro ao exportar dados para CSV'
      });
    });

    it('deve incluir field e header nas colunas exportáveis', () => {
      service.exportToCSV(mockTable, mockData, mockColumns);

      const columns = mockTable.columns as { field: string; header: string }[];
      expect(columns.length).toBeGreaterThan(0);
      columns.forEach((col) => {
        expect(col).toHaveProperty('field');
        expect(col).toHaveProperty('header');
      });
    });

    it('deve preservar ordem das colunas', () => {
      service.exportToCSV(mockTable, mockData, mockColumns);

      const columns = mockTable.columns as { field: string }[];
      expect(columns[0].field).toBe('id');
      expect(columns[1].field).toBe('name');
      expect(columns[2].field).toBe('grupo.descricao');
    });
  });

  describe('testes de integração', () => {
    it('deve realizar fluxo completo de exportação Excel com dados reais', async () => {
      service.exportToExcel(mockData, mockColumns, 'test-export');

      await waitForAsync();

      // Verifica mensagem informativa
      expect(messageService.add).toHaveBeenCalledWith(
        expect.objectContaining({severity: 'info'})
      );

      // Verifica chamada do writeXlsxFile
      expect((writeXlsxFile as jest.Mock)).toHaveBeenCalledWith(
        mockData,
        expect.objectContaining({
          fileName: expect.stringContaining('test-export_export_'),
          sheet: 'Dados'
        })
      );
    });

    it('deve realizar fluxo completo de exportação CSV com dados reais', () => {
      const mockTable: jest.Mocked<Table> = {
        exportCSV: jest.fn(),
        columns: []
      } as unknown as jest.Mocked<Table>;

      service.exportToCSV(mockTable, mockData, mockColumns);

      // Verifica mensagem informativa
      expect(messageService.add).toHaveBeenCalledWith(
        expect.objectContaining({severity: 'info'})
      );

      // Verifica configuração das colunas
      expect(mockTable.columns).toBeDefined();
      expect(Array.isArray(mockTable.columns)).toBe(true);

      // Verifica chamada do método exportCSV
      expect(mockTable.exportCSV).toHaveBeenCalled();
    });
  });
});
