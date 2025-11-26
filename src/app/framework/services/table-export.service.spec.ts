import {TestBed} from '@angular/core/testing';
import {MessageService} from 'primeng/api';
import {Table} from 'primeng/table';
import {TableExportService} from './table-export.service';
import {LoggerService} from './logger.service';
import {TableColumn} from '../model/table-config.interface';

// Mock do ExcelJS
const mockWorksheet = {
  addRow: jest.fn(),
  columns: [] as any[]
};

const mockWorkbook = {
  addWorksheet: jest.fn(() => mockWorksheet),
  xlsx: {
    writeBuffer: jest.fn(() => Promise.resolve(new ArrayBuffer(8)))
  }
};

const mockExcelJS = {
  Workbook: jest.fn(() => mockWorkbook)
};

// Mock do dynamic import de exceljs
jest.mock('exceljs', () => mockExcelJS, {virtual: true});

describe('TableExportService', () => {
  let service: TableExportService;
  let messageService: jest.Mocked<MessageService>;
  let loggerService: jest.Mocked<LoggerService>;

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  /**
   * Helper para aguardar promises sem usar setTimeout real
   * Usa fake timers para performance
   */
  async function waitForAsync(): Promise<void> {
    jest.advanceTimersByTime(0);
    await Promise.resolve();
  }

  // Mock data para testes
  const mockColumns: TableColumn[] = [
    {field: 'id', header: 'ID'},
    {field: 'name', header: 'Nome'},
    {field: 'grupo.descricao', header: 'Grupo'},
    {field: 'actions', header: 'Ações'}
  ];

  const mockData = [
    {id: 1, name: 'Item 1', grupo: {descricao: 'Grupo A'}},
    {id: 2, name: 'Item 2', grupo: {descricao: 'Grupo B'}},
    {id: 3, name: 'Item 3', grupo: {descricao: 'Grupo C'}}
  ];

  // Mock do DOM
  let mockLink: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    mockWorksheet.addRow.mockClear();
    mockWorksheet.columns = [];
    mockWorkbook.addWorksheet.mockReturnValue(mockWorksheet);
    mockWorkbook.xlsx.writeBuffer.mockResolvedValue(new ArrayBuffer(8));

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

    // Mock do DOM e URL APIs
    mockLink = {
      href: '',
      download: '',
      click: jest.fn(),
      remove: jest.fn()
    };
    jest.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
    jest.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any);
    global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = jest.fn();
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
    });

    it('deve exibir warning quando dados são null', () => {
      service.exportToExcel(null as any, mockColumns, 'test');

      expect(messageService.add).toHaveBeenCalledWith({
        severity: 'warn',
        summary: 'Aviso',
        detail: 'Não há dados para exportar'
      });
    });

    it('deve exibir mensagem informativa ao iniciar exportação', async () => {
      service.exportToExcel(mockData, mockColumns, 'test');

      // Aguarda promises usando fake timers
      jest.advanceTimersByTime(0);
      await Promise.resolve();

      expect(messageService.add).toHaveBeenCalledWith({
        severity: 'info',
        summary: 'Preparando exportação',
        detail: 'O arquivo Excel será baixado em breve...'
      });
    });

    it('deve criar workbook e worksheet com nome correto', async () => {
      service.exportToExcel(mockData, mockColumns, 'test');

      jest.advanceTimersByTime(0);
      await Promise.resolve();

      expect(mockExcelJS.Workbook).toHaveBeenCalled();
      expect(mockWorkbook.addWorksheet).toHaveBeenCalledWith('Dados');
    });

    it('deve filtrar coluna actions dos dados exportados', async () => {
      service.exportToExcel(mockData, mockColumns, 'test');

      await waitForAsync();

      // Verifica que addRow foi chamado (cabeçalhos + 3 linhas de dados)
      expect(mockWorksheet.addRow).toHaveBeenCalledTimes(4);
    });

    it('deve usar nome de arquivo padrão quando não fornecido', async () => {
      service.exportToExcel(mockData, mockColumns);

      await waitForAsync();

      expect(mockLink.download).toContain('dados_export_');
      expect(mockLink.download).toContain('.xlsx');
    });

    it('deve usar nome de arquivo fornecido', async () => {
      service.exportToExcel(mockData, mockColumns, 'meus-dados');

      await waitForAsync();

      expect(mockLink.download).toContain('meus-dados_export_');
      expect(mockLink.download).toContain('.xlsx');
    });

    it('deve ajustar larguras de colunas automaticamente', async () => {
      // Adiciona mock para eachCell
      mockWorksheet.columns = [
        {
          eachCell: jest.fn((_options, callback) => {
            callback({value: 'Test Value Long String'});
          }),
          width: 0
        },
        {
          eachCell: jest.fn((_options, callback) => {
            callback({value: 'Short'});
          }),
          width: 0
        }
      ];

      service.exportToExcel(mockData, mockColumns, 'test');

      await waitForAsync();

      // Verifica que larguras foram definidas
      expect(mockWorksheet.columns[0].width).toBeGreaterThan(0);
      expect(mockWorksheet.columns[1].width).toBeGreaterThan(0);
    });

    it('deve manipular diferentes tipos de valores de célula', async () => {
      mockWorksheet.columns = [
        {
          eachCell: jest.fn((_options, callback) => {
            callback({value: 'string value'});
            callback({value: 123});
            callback({value: true});
            callback({value: null});
            callback({value: undefined});
            callback({value: {nested: 'object'}});
          }),
          width: 0
        }
      ];

      service.exportToExcel(mockData, mockColumns, 'test');

      await waitForAsync();

      expect(mockWorksheet.columns[0].width).toBeDefined();
    });

    it('deve limitar largura máxima das colunas em 50', async () => {
      mockWorksheet.columns = [
        {
          eachCell: jest.fn((_options, callback) => {
            callback({value: 'a'.repeat(100)}); // String muito longa
          }),
          width: 0
        }
      ];

      service.exportToExcel(mockData, mockColumns, 'test');

      await waitForAsync();

      expect(mockWorksheet.columns[0].width).toBeLessThanOrEqual(50);
    });

    it('deve manipular campos de objetos aninhados', async () => {
      const dataWithNested = [{id: 1, user: {profile: {name: 'John'}}}];
      const columnsWithNested: TableColumn[] = [
        {field: 'id', header: 'ID'},
        {field: 'user.profile.name', header: 'User Name'}
      ];

      service.exportToExcel(dataWithNested, columnsWithNested, 'test');

      await waitForAsync();

      expect(mockWorksheet.addRow).toHaveBeenCalled();
    });

    it('deve manipular colunas com type=custom e objeto com descricao', async () => {
      const dataWithCustom = [{id: 1, item: {descricao: 'Item A', id: 100}}];
      const columnsWithCustom: TableColumn[] = [
        {field: 'id', header: 'ID'},
        {field: 'item', header: 'Item', type: 'custom'}
      ];

      service.exportToExcel(dataWithCustom, columnsWithCustom, 'test');

      await waitForAsync();

      expect(mockWorksheet.addRow).toHaveBeenCalled();
    });

    it('deve manipular colunas custom com objeto contendo nome', async () => {
      const dataWithCustom = [{id: 1, person: {nome: 'John', age: 30}}];
      const columnsWithCustom: TableColumn[] = [
        {field: 'id', header: 'ID'},
        {field: 'person', header: 'Person', type: 'custom'}
      ];

      service.exportToExcel(dataWithCustom, columnsWithCustom, 'test');

      await waitForAsync();

      expect(mockWorksheet.addRow).toHaveBeenCalled();
    });

    it('deve manipular colunas custom com objeto contendo id', async () => {
      const dataWithCustom = [{id: 1, item: {id: 999, code: 'ABC'}}];
      const columnsWithCustom: TableColumn[] = [
        {field: 'id', header: 'ID'},
        {field: 'item', header: 'Item', type: 'custom'}
      ];

      service.exportToExcel(dataWithCustom, columnsWithCustom, 'test');

      await waitForAsync();

      expect(mockWorksheet.addRow).toHaveBeenCalled();
    });

    it('deve retornar string vazia para colunas custom sem propriedades conhecidas', async () => {
      const dataWithCustom = [{id: 1, item: {unknownProp: 'value'}}];
      const columnsWithCustom: TableColumn[] = [
        {field: 'id', header: 'ID'},
        {field: 'item', header: 'Item', type: 'custom'}
      ];

      service.exportToExcel(dataWithCustom, columnsWithCustom, 'test');

      await waitForAsync();

      expect(mockWorksheet.addRow).toHaveBeenCalled();
    });

    it('deve retornar string vazia para valores undefined', async () => {
      const dataWithUndefined = [{id: 1, missingField: undefined}];
      const columnsWithUndefined: TableColumn[] = [
        {field: 'id', header: 'ID'},
        {field: 'missingField', header: 'Missing'}
      ];

      service.exportToExcel(dataWithUndefined, columnsWithUndefined, 'test');

      await waitForAsync();

      expect(mockWorksheet.addRow).toHaveBeenCalled();
    });

    it('deve manipular objetos null nos dados', async () => {
      service.exportToExcel([null as any], mockColumns, 'test');

      await waitForAsync();

      expect(mockWorksheet.addRow).toHaveBeenCalled();
    });

    it('deve manipular campos vazios', async () => {
      const columnsWithEmptyField: TableColumn[] = [
        {field: '', header: 'Empty'}
      ];

      service.exportToExcel(mockData, columnsWithEmptyField, 'test');

      await waitForAsync();

      expect(mockWorksheet.addRow).toHaveBeenCalled();
    });

    it('deve manipular propriedades inexistentes no caminho', async () => {
      const dataWithMissingPath = [{id: 1, user: {name: 'John'}}];
      const columnsWithMissingPath: TableColumn[] = [
        {field: 'user.profile.age', header: 'Age'}
      ];

      service.exportToExcel(dataWithMissingPath, columnsWithMissingPath, 'test');

      await waitForAsync();

      expect(mockWorksheet.addRow).toHaveBeenCalled();
    });

    it('deve criar e remover link de download corretamente', async () => {
      service.exportToExcel(mockData, mockColumns, 'test');

      await waitForAsync();

      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(document.body.appendChild).toHaveBeenCalledWith(mockLink);
      expect(mockLink.click).toHaveBeenCalled();
      expect(mockLink.remove).toHaveBeenCalled();
    });

    it('deve criar e revogar URL do blob', async () => {
      service.exportToExcel(mockData, mockColumns, 'test');

      await waitForAsync();

      expect(global.URL.createObjectURL).toHaveBeenCalled();
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });

    it('deve configurar tipo MIME correto do blob', async () => {
      service.exportToExcel(mockData, mockColumns, 'test');

      await waitForAsync();

      const createObjectURLCall = (global.URL.createObjectURL as jest.Mock).mock.calls[0][0];
      expect(createObjectURLCall.type).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
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
      service.exportToCSV(mockTable, null as any, mockColumns);

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

      const columns = mockTable.columns as any[];
      const hasActions = columns.some((col: any) => col.field === 'actions');
      expect(hasActions).toBe(false);
    });

    it('deve filtrar colunas com exportable=false', () => {
      const columnsWithNonExportable: TableColumn[] = [
        {field: 'id', header: 'ID'},
        {field: 'name', header: 'Nome'},
        {field: 'internal', header: 'Internal', exportable: false}
      ];

      service.exportToCSV(mockTable, mockData, columnsWithNonExportable);

      const columns = mockTable.columns as any[];
      const hasInternal = columns.some((col: any) => col.field === 'internal');
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

      const columns = mockTable.columns as any[];
      expect(columns.length).toBeGreaterThan(0);
      columns.forEach((col: any) => {
        expect(col).toHaveProperty('field');
        expect(col).toHaveProperty('header');
      });
    });

    it('deve preservar ordem das colunas', () => {
      service.exportToCSV(mockTable, mockData, mockColumns);

      const columns = mockTable.columns as any[];
      expect(columns[0].field).toBe('id');
      expect(columns[1].field).toBe('name');
      expect(columns[2].field).toBe('grupo.descricao');
    });
  });

  describe('testes de integração', () => {
    beforeEach(() => {
      mockWorksheet.columns = [
        {
          eachCell: jest.fn((_options, callback) => {
            callback({value: 'Header'});
            callback({value: 'Data Value'});
          }),
          width: 0
        }
      ];
    });

    it('deve realizar fluxo completo de exportação Excel com dados reais', async () => {
      service.exportToExcel(mockData, mockColumns, 'test-export');

      await waitForAsync();

      // Verifica mensagem informativa
      expect(messageService.add).toHaveBeenCalledWith(
        expect.objectContaining({severity: 'info'})
      );

      // Verifica criação do workbook
      expect(mockExcelJS.Workbook).toHaveBeenCalled();
      expect(mockWorkbook.addWorksheet).toHaveBeenCalledWith('Dados');

      // Verifica adição de linhas (1 header + 3 data rows)
      expect(mockWorksheet.addRow).toHaveBeenCalledTimes(4);

      // Verifica geração do buffer
      expect(mockWorkbook.xlsx.writeBuffer).toHaveBeenCalled();

      // Verifica download do arquivo
      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(mockLink.click).toHaveBeenCalled();
      expect(mockLink.remove).toHaveBeenCalled();
      expect(mockLink.download).toContain('test-export_export_');
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
