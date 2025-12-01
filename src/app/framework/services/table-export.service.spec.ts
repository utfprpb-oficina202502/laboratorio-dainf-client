import {TestBed} from '@angular/core/testing';
import {MessageService} from 'primeng/api';
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

  /**
   * Interface para mocks de download CSV
   */
  interface CSVDownloadMocks {
    mockClick: jest.Mock;
    mockLink: HTMLAnchorElement;
    mockCreateElement: jest.SpyInstance;
    mockAppendChild: jest.SpyInstance;
    mockRemoveChild: jest.SpyInstance;
    cleanup: () => void;
  }

  /**
   * Helper para configurar mocks de download CSV
   * Evita duplicação de código entre testes
   */
  function setupCSVDownloadMocks(): CSVDownloadMocks {
    const mockClick = jest.fn();
    const mockLink = {
      setAttribute: jest.fn(),
      style: {},
      click: mockClick
    } as unknown as HTMLAnchorElement;

    const mockCreateElement = jest.spyOn(document, 'createElement').mockReturnValue(mockLink);
    const mockAppendChild = jest.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink);
    const mockRemoveChild = jest.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink);

    global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = jest.fn();

    return {
      mockClick,
      mockLink,
      mockCreateElement,
      mockAppendChild,
      mockRemoveChild,
      cleanup: () => {
        mockCreateElement.mockRestore();
        mockAppendChild.mockRestore();
        mockRemoveChild.mockRestore();
      }
    };
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
    let csvMocks: CSVDownloadMocks;

    beforeEach(() => {
      csvMocks = setupCSVDownloadMocks();
    });

    afterEach(() => {
      csvMocks.cleanup();
    });

    it('deve exibir warning quando não há dados', () => {
      service.exportToCSV(null, [], mockColumns);

      expect(messageService.add).toHaveBeenCalledWith({
        severity: 'warn',
        summary: 'Aviso',
        detail: 'Não há dados para exportar'
      });
    });

    it('deve exibir warning quando dados são null', () => {
      service.exportToCSV(null, null as unknown as unknown[], mockColumns);

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

      service.exportToCSV(null, mockData, nonExportableColumns);

      expect(messageService.add).toHaveBeenCalledWith({
        severity: 'warn',
        summary: 'Aviso',
        detail: 'Nenhuma coluna disponível para exportação'
      });
    });

    it('deve exibir mensagem informativa ao iniciar exportação', () => {
      service.exportToCSV(null, mockData, mockColumns);

      expect(messageService.add).toHaveBeenCalledWith({
        severity: 'info',
        summary: 'Preparando exportação',
        detail: 'O arquivo CSV será baixado em breve...'
      });
    });

    it('deve criar e baixar arquivo CSV', () => {
      service.exportToCSV(null, mockData, mockColumns, 'test');

      expect(csvMocks.mockCreateElement).toHaveBeenCalledWith('a');
      expect(csvMocks.mockLink.setAttribute).toHaveBeenCalledWith('href', 'blob:mock-url');
      expect(csvMocks.mockLink.setAttribute).toHaveBeenCalledWith('download', expect.stringContaining('test_export_'));
      expect(csvMocks.mockClick).toHaveBeenCalled();
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });

    it('deve usar nome de arquivo padrão quando não fornecido', () => {
      service.exportToCSV(null, mockData, mockColumns);

      expect(csvMocks.mockLink.setAttribute).toHaveBeenCalledWith('download', expect.stringContaining('dados_export_'));
    });

    it('deve usar nome de arquivo fornecido', () => {
      service.exportToCSV(null, mockData, mockColumns, 'meus-dados');

      expect(csvMocks.mockLink.setAttribute).toHaveBeenCalledWith('download', expect.stringContaining('meus-dados_export_'));
    });

    it('deve usar exportValueGetter customizado no CSV', () => {
      const dataWithRoles = [
        {id: 1, roles: [{nome: 'ROLE_ADMIN'}]}
      ];
      const columnsWithGetter: TableColumn[] = [
        {field: 'id', header: 'ID'},
        {
          field: 'roles',
          header: 'Papéis',
          exportValueGetter: () => 'Admin Formatado'
        }
      ];

      service.exportToCSV(null, dataWithRoles, columnsWithGetter, 'test');

      // Verifica que o CSV foi gerado (download foi disparado)
      expect(csvMocks.mockClick).toHaveBeenCalled();
    });
  });

  describe('extractArrayDisplayValue (via exportToExcel)', () => {
    it('deve formatar array de objetos com propriedade nome como lista separada por ponto-e-vírgula', async () => {
      const dataWithArray = [
        {id: 1, permissoes: [{nome: 'Admin'}, {nome: 'User'}]}
      ];
      const columnsWithArray: TableColumn[] = [
        {field: 'id', header: 'ID'},
        {field: 'permissoes', header: 'Permissões'}
      ];

      service.exportToExcel(dataWithArray, columnsWithArray, 'test');

      await waitForAsync();

      expect((writeXlsxFile as jest.Mock)).toHaveBeenCalled();
      const callArgs = (writeXlsxFile as jest.Mock).mock.calls[0];
      const options = callArgs[1] as {
        schema: { column: string; value: (item: unknown) => unknown }[]
      };

      // Testa a função value do schema para o campo permissoes
      const permissoesSchema = options.schema.find(s => s.column === 'Permissões');
      const result = permissoesSchema?.value(dataWithArray[0]);

      expect(result).toBe('Admin; User');
    });

    it('deve formatar array de objetos com propriedade descricao', async () => {
      const dataWithArray = [
        {id: 1, grupos: [{descricao: 'Grupo A'}, {descricao: 'Grupo B'}]}
      ];
      const columnsWithArray: TableColumn[] = [
        {field: 'id', header: 'ID'},
        {field: 'grupos', header: 'Grupos'}
      ];

      service.exportToExcel(dataWithArray, columnsWithArray, 'test');

      await waitForAsync();

      const callArgs = (writeXlsxFile as jest.Mock).mock.calls[0];
      const options = callArgs[1] as {
        schema: { column: string; value: (item: unknown) => unknown }[]
      };
      const gruposSchema = options.schema.find(s => s.column === 'Grupos');
      const result = gruposSchema?.value(dataWithArray[0]);

      expect(result).toBe('Grupo A; Grupo B');
    });

    it('deve retornar string vazia para array vazio', async () => {
      const dataWithEmptyArray = [{id: 1, items: []}];
      const columnsWithArray: TableColumn[] = [
        {field: 'id', header: 'ID'},
        {field: 'items', header: 'Items'}
      ];

      service.exportToExcel(dataWithEmptyArray, columnsWithArray, 'test');

      await waitForAsync();

      const callArgs = (writeXlsxFile as jest.Mock).mock.calls[0];
      const options = callArgs[1] as {
        schema: { column: string; value: (item: unknown) => unknown }[]
      };
      const itemsSchema = options.schema.find(s => s.column === 'Items');
      const result = itemsSchema?.value(dataWithEmptyArray[0]);

      expect(result).toBe('');
    });

    it('deve formatar array de valores primitivos', async () => {
      const dataWithPrimitiveArray = [{id: 1, tags: ['tag1', 'tag2', 'tag3']}];
      const columnsWithArray: TableColumn[] = [
        {field: 'id', header: 'ID'},
        {field: 'tags', header: 'Tags'}
      ];

      service.exportToExcel(dataWithPrimitiveArray, columnsWithArray, 'test');

      await waitForAsync();

      const callArgs = (writeXlsxFile as jest.Mock).mock.calls[0];
      const options = callArgs[1] as {
        schema: { column: string; value: (item: unknown) => unknown }[]
      };
      const tagsSchema = options.schema.find(s => s.column === 'Tags');
      const result = tagsSchema?.value(dataWithPrimitiveArray[0]);

      expect(result).toBe('tag1; tag2; tag3');
    });
  });

  describe('exportValueGetter', () => {
    it('deve usar exportValueGetter customizado quando definido', async () => {
      const dataWithRoles = [
        {id: 1, roles: [{nome: 'ROLE_ADMIN'}, {nome: 'ROLE_USER'}]}
      ];
      const columnsWithGetter: TableColumn[] = [
        {field: 'id', header: 'ID'},
        {
          field: 'roles',
          header: 'Papéis',
          exportValueGetter: (item: unknown) => {
            const data = item as { roles: { nome: string }[] };
            return data.roles.map(r => r.nome.replace('ROLE_', '')).join(', ');
          }
        }
      ];

      service.exportToExcel(dataWithRoles, columnsWithGetter, 'test');

      await waitForAsync();

      const callArgs = (writeXlsxFile as jest.Mock).mock.calls[0];
      const options = callArgs[1] as {
        schema: { column: string; value: (item: unknown) => unknown }[]
      };
      const rolesSchema = options.schema.find(s => s.column === 'Papéis');
      const result = rolesSchema?.value(dataWithRoles[0]);

      expect(result).toBe('ADMIN, USER');
    });

    it('deve retornar null quando exportValueGetter retorna null', async () => {
      const dataWithNull = [{id: 1, opcional: null}];
      const columnsWithNullGetter: TableColumn[] = [
        {field: 'id', header: 'ID'},
        {
          field: 'opcional',
          header: 'Opcional',
          exportValueGetter: () => null
        }
      ];

      service.exportToExcel(dataWithNull, columnsWithNullGetter, 'test');

      await waitForAsync();

      const callArgs = (writeXlsxFile as jest.Mock).mock.calls[0];
      const options = callArgs[1] as {
        schema: { column: string; value: (item: unknown) => unknown }[]
      };
      const opcionalSchema = options.schema.find(s => s.column === 'Opcional');
      const result = opcionalSchema?.value(dataWithNull[0]);

      expect(result).toBeNull();
    });

    it('deve priorizar exportValueGetter sobre extração padrão', async () => {
      const data = [{id: 1, valor: 'original'}];
      const columns: TableColumn[] = [
        {field: 'id', header: 'ID'},
        {
          field: 'valor',
          header: 'Valor',
          exportValueGetter: () => 'customizado'
        }
      ];

      service.exportToExcel(data, columns, 'test');

      await waitForAsync();

      const callArgs = (writeXlsxFile as jest.Mock).mock.calls[0];
      const options = callArgs[1] as {
        schema: { column: string; value: (item: unknown) => unknown }[]
      };
      const valorSchema = options.schema.find(s => s.column === 'Valor');
      const result = valorSchema?.value(data[0]);

      expect(result).toBe('customizado');
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
      // Usa helper para configurar mocks
      const mocks = setupCSVDownloadMocks();

      service.exportToCSV(null, mockData, mockColumns, 'test-export');

      // Verifica mensagem informativa
      expect(messageService.add).toHaveBeenCalledWith(
        expect.objectContaining({severity: 'info'})
      );

      // Verifica que o download foi disparado
      expect(mocks.mockClick).toHaveBeenCalled();
      expect(mocks.mockLink.setAttribute).toHaveBeenCalledWith('download', expect.stringContaining('test-export_export_'));

      // Cleanup
      mocks.cleanup();
    });
  });
});
