import {TestBed} from '@angular/core/testing';
import {TableStateManagerService} from './table-state-manager.service';
import {LoggerService} from './logger.service';
import {TableColumn} from '../model/table-config.interface';

describe('TableStateManagerService', () => {
  let service: TableStateManagerService;
  let loggerService: jest.Mocked<LoggerService>;
  let mockStorage: Storage;

  // Mock columns para testes
  const mockColumns: TableColumn[] = [
    {field: 'id', header: 'ID', visible: true},
    {field: 'name', header: 'Nome', visible: true},
    {field: 'email', header: 'Email', visible: false},
    {field: 'actions', header: 'Ações', visible: true}
  ];

  beforeEach(() => {
    // Mock do LoggerService
    loggerService = {
      warn: jest.fn(),
      error: jest.fn()
    } as unknown as jest.Mocked<LoggerService>;

    // Mock do Storage
    const store: Record<string, string> = {};
    mockStorage = {
      getItem: jest.fn((key: string) => store[key] || null),
      setItem: jest.fn((key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: jest.fn((key: string) => {
        delete store[key];
      }),
      clear: jest.fn(() => {
        Object.keys(store).forEach(key => delete store[key]);
      }),
      get length() {
        return Object.keys(store).length;
      },
      key: jest.fn((index: number) => Object.keys(store)[index] || null)
    };

    TestBed.configureTestingModule({
      providers: [
        TableStateManagerService,
        {provide: LoggerService, useValue: loggerService}
      ]
    });

    service = TestBed.inject(TableStateManagerService);
  });

  describe('initializeStorage', () => {
    it('deve retornar undefined quando stateful é false', () => {
      const result = service.initializeStorage(false);

      expect(result).toBeUndefined();
    });

    it('deve retornar localStorage quando stateful é true e stateStorage é local', () => {
      const result = service.initializeStorage(true, 'local');

      expect(result).toBe(globalThis.localStorage);
    });

    it('deve retornar sessionStorage quando stateStorage é session', () => {
      const result = service.initializeStorage(true, 'session');

      expect(result).toBe(globalThis.sessionStorage);
    });

    it('deve retornar localStorage por padrão quando stateStorage não é especificado', () => {
      const result = service.initializeStorage(true);

      expect(result).toBe(globalThis.localStorage);
    });

    it('deve retornar undefined e loggar warning quando storage não está disponível', () => {
      // Simula ambiente onde localStorage lança erro
      const originalLocalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
      Object.defineProperty(globalThis, 'localStorage', {
        get: () => {
          throw new Error('Storage access denied');
        },
        configurable: true
      });

      const result = service.initializeStorage(true, 'local');

      expect(result).toBeUndefined();
      expect(loggerService.warn).toHaveBeenCalledWith('Table state storage unavailable', expect.any(Error));

      // Restaura localStorage original
      if (originalLocalStorage) {
        Object.defineProperty(globalThis, 'localStorage', originalLocalStorage);
      }
    });
  });

  describe('saveState', () => {
    const stateKey = 'test-table-state';

    it('não deve fazer nada quando storage é undefined', () => {
      service.saveState(undefined, stateKey, {filterValue: 'test'});

      expect(mockStorage.setItem).not.toHaveBeenCalled();
    });

    it('deve salvar filterValue quando fornecido', () => {
      service.saveState(mockStorage, stateKey, {filterValue: 'test filter'});

      expect(mockStorage.setItem).toHaveBeenCalledWith(
        stateKey,
        JSON.stringify({filterValue: 'test filter'})
      );
    });

    it('deve salvar sortField e sortOrder quando fornecidos', () => {
      service.saveState(mockStorage, stateKey, {
        sortField: 'name',
        sortOrder: -1
      });

      expect(mockStorage.setItem).toHaveBeenCalledWith(
        stateKey,
        JSON.stringify({sortField: 'name', sortOrder: -1})
      );
    });

    it('deve salvar pageSize e pageIndex quando fornecidos', () => {
      service.saveState(mockStorage, stateKey, {
        pageSize: 20,
        pageIndex: 3
      });

      expect(mockStorage.setItem).toHaveBeenCalledWith(
        stateKey,
        JSON.stringify({pageSize: 20, pageIndex: 3})
      );
    });

    it('deve salvar columns state quando fornecido', () => {
      service.saveState(mockStorage, stateKey, {
        columns: mockColumns
      });

      const savedData = JSON.parse((mockStorage.setItem as jest.Mock).mock.calls[0][1]);
      expect(savedData.columns).toEqual([
        {field: 'id', visible: true},
        {field: 'name', visible: true},
        {field: 'email', visible: false},
        {field: 'actions', visible: true}
      ]);
    });

    it('deve salvar columnToggleModel quando fornecido', () => {
      service.saveState(mockStorage, stateKey, {
        columns: mockColumns,
        columnToggleModel: ['id', 'name']
      });

      const savedData = JSON.parse((mockStorage.setItem as jest.Mock).mock.calls[0][1]);
      expect(savedData.columnToggleModel).toEqual(['id', 'name']);
    });

    it('deve salvar expandedRows quando fornecido', () => {
      service.saveState(mockStorage, stateKey, {
        expandedRows: {'1': true, '2': true, '3': false}
      });

      const savedData = JSON.parse((mockStorage.setItem as jest.Mock).mock.calls[0][1]);
      expect(savedData.expandedRowKeys).toEqual(['1', '2']); // Apenas as expandidas
    });

    it('deve salvar selectedItems usando trackByField padrão (id)', () => {
      const selectedItems = [
        {id: 1, name: 'Item 1'},
        {id: 2, name: 'Item 2'}
      ];

      service.saveState(mockStorage, stateKey, {selectedItems});

      const savedData = JSON.parse((mockStorage.setItem as jest.Mock).mock.calls[0][1]);
      expect(savedData.selectedKeys).toEqual([1, 2]);
    });

    it('deve salvar selectedItems usando trackByField customizado', () => {
      const selectedItems = [
        {codigo: 'A1', name: 'Item 1'},
        {codigo: 'A2', name: 'Item 2'}
      ];

      service.saveState(mockStorage, stateKey, {selectedItems}, undefined, 'codigo');

      const savedData = JSON.parse((mockStorage.setItem as jest.Mock).mock.calls[0][1]);
      expect(savedData.selectedKeys).toEqual(['A1', 'A2']);
    });

    it('deve respeitar stateProps para salvar apenas propriedades específicas', () => {
      service.saveState(
        mockStorage,
        stateKey,
        {
          filterValue: 'test',
          sortField: 'name',
          pageSize: 20
        },
        {
          filters: true,
          sort: false,
          pagination: false
        }
      );

      const savedData = JSON.parse((mockStorage.setItem as jest.Mock).mock.calls[0][1]);
      expect(savedData).toEqual({filterValue: 'test'});
      expect(savedData.sortField).toBeUndefined();
      expect(savedData.pageSize).toBeUndefined();
    });

    it('não deve salvar quando state está vazio', () => {
      service.saveState(mockStorage, stateKey, {});

      expect(mockStorage.setItem).not.toHaveBeenCalled();
    });

    it('deve loggar warning quando setItem lança erro', () => {
      const errorStorage = {
        ...mockStorage,
        setItem: jest.fn(() => {
          throw new Error('Quota exceeded');
        })
      };

      service.saveState(errorStorage, stateKey, {filterValue: 'test'});

      expect(loggerService.warn).toHaveBeenCalledWith('Table state could not be saved', expect.any(Error));
    });

    it('deve filtrar selectedKeys null e undefined', () => {
      const selectedItems = [
        {id: 1, name: 'Item 1'},
        {id: null, name: 'Item 2'},
        {id: undefined, name: 'Item 3'},
        {id: 3, name: 'Item 4'}
      ];

      service.saveState(mockStorage, stateKey, {selectedItems});

      const savedData = JSON.parse((mockStorage.setItem as jest.Mock).mock.calls[0][1]);
      expect(savedData.selectedKeys).toEqual([1, 3]);
    });

    it('deve salvar estado completo com todas as propriedades', () => {
      service.saveState(mockStorage, stateKey, {
        filterValue: 'test',
        sortField: 'name',
        sortOrder: 1,
        pageSize: 10,
        pageIndex: 0,
        columns: mockColumns,
        columnToggleModel: ['id', 'name'],
        expandedRows: {'1': true},
        selectedItems: [{id: 1}]
      });

      const savedData = JSON.parse((mockStorage.setItem as jest.Mock).mock.calls[0][1]);
      expect(Object.keys(savedData).length).toBeGreaterThan(5);
      expect(savedData.filterValue).toBe('test');
      expect(savedData.sortField).toBe('name');
      expect(savedData.columns).toBeDefined();
    });
  });

  describe('restoreState', () => {
    const stateKey = 'test-table-state';

    it('deve retornar null quando storage é undefined', () => {
      const result = service.restoreState(undefined, stateKey);

      expect(result).toBeNull();
    });

    it('deve retornar null quando não há estado salvo', () => {
      const result = service.restoreState(mockStorage, stateKey);

      expect(result).toBeNull();
    });

    it('deve restaurar filterValue', () => {
      mockStorage.setItem(stateKey, JSON.stringify({filterValue: 'saved filter'}));

      const result = service.restoreState(mockStorage, stateKey);

      expect(result).toEqual({filterValue: 'saved filter'});
    });

    it('deve restaurar sortField e sortOrder', () => {
      mockStorage.setItem(stateKey, JSON.stringify({
        sortField: 'email',
        sortOrder: -1
      }));

      const result = service.restoreState(mockStorage, stateKey);

      expect(result).toEqual({sortField: 'email', sortOrder: -1});
    });

    it('deve restaurar pageSize e pageIndex', () => {
      mockStorage.setItem(stateKey, JSON.stringify({
        pageSize: 50,
        pageIndex: 2
      }));

      const result = service.restoreState(mockStorage, stateKey);

      expect(result).toEqual({pageSize: 50, pageIndex: 2});
    });

    it('deve restaurar columns state e atualizar visibilidade', () => {
      const columns = [...mockColumns];
      mockStorage.setItem(stateKey, JSON.stringify({
        columns: [
          {field: 'id', visible: true},
          {field: 'name', visible: false},
          {field: 'email', visible: true}
        ]
      }));

      const result = service.restoreState(mockStorage, stateKey, columns);

      expect(columns[0].visible).toBe(true); // id mantém true
      expect(columns[1].visible).toBe(false); // name muda para false
      expect(columns[2].visible).toBe(true); // email muda para true
      expect(result).toBeDefined();
    });

    it('deve restaurar columnToggleModel', () => {
      const columns = [...mockColumns];
      mockStorage.setItem(stateKey, JSON.stringify({
        columns: [{field: 'id', visible: true}],
        columnToggleModel: ['id', 'email']
      }));

      const result = service.restoreState(mockStorage, stateKey, columns);

      expect(result?.columnToggleModel).toEqual(['id', 'email']);
    });

    it('deve restaurar expandedRowKeys', () => {
      mockStorage.setItem(stateKey, JSON.stringify({
        expandedRowKeys: ['1', '2', '3']
      }));

      const result = service.restoreState(mockStorage, stateKey);

      expect(result?.expandedRowKeys).toEqual({
        '1': true,
        '2': true,
        '3': true
      });
    });

    it('deve restaurar selectedKeys', () => {
      mockStorage.setItem(stateKey, JSON.stringify({
        selectedKeys: [1, 2, 3]
      }));

      const result = service.restoreState(mockStorage, stateKey);

      expect(result?.selectedKeys).toEqual([1, 2, 3]);
    });

    it('deve respeitar stateProps para restaurar apenas propriedades específicas', () => {
      mockStorage.setItem(stateKey, JSON.stringify({
        filterValue: 'test',
        sortField: 'name',
        pageSize: 20
      }));

      const result = service.restoreState(
        mockStorage,
        stateKey,
        undefined,
        {filters: true, sort: false, pagination: false}
      );

      expect(result?.filterValue).toBe('test');
      expect(result?.sortField).toBeUndefined();
      expect(result?.pageSize).toBeUndefined();
    });

    it('deve retornar null e loggar warning quando JSON.parse lança erro', () => {
      mockStorage.setItem(stateKey, 'invalid json');

      const result = service.restoreState(mockStorage, stateKey);

      expect(result).toBeNull();
      expect(loggerService.warn).toHaveBeenCalledWith('Table state could not be restored', expect.any(Error));
    });

    it('deve restaurar estado completo com todas as propriedades', () => {
      const columns = [...mockColumns];
      mockStorage.setItem(stateKey, JSON.stringify({
        filterValue: 'test',
        sortField: 'name',
        sortOrder: 1,
        pageSize: 10,
        pageIndex: 0,
        columns: [{field: 'id', visible: true}],
        columnToggleModel: ['id'],
        expandedRowKeys: ['1'],
        selectedKeys: [1, 2]
      }));

      const result = service.restoreState(mockStorage, stateKey, columns);

      expect(result).toBeDefined();
      expect(result?.filterValue).toBe('test');
      expect(result?.sortField).toBe('name');
      expect(result?.selectedKeys).toEqual([1, 2]);
      expect(result?.expandedRowKeys).toEqual({'1': true});
    });

    it('não deve restaurar columns quando columns não é fornecido', () => {
      mockStorage.setItem(stateKey, JSON.stringify({
        columns: [{field: 'id', visible: false}]
      }));

      const result = service.restoreState(mockStorage, stateKey);

      // columns não deve modificar array externo se não foi fornecido
      expect(result).toBeDefined();
    });

    it('deve ignorar tipo incorreto de valores no estado salvo', () => {
      mockStorage.setItem(stateKey, JSON.stringify({
        filterValue: 123, // number ao invés de string
        sortField: true, // boolean ao invés de string
        pageSize: 'invalid' // string ao invés de number
      }));

      const result = service.restoreState(mockStorage, stateKey);

      expect(result?.filterValue).toBeUndefined(); // filtrado por tipo
      expect(result?.sortField).toBeUndefined(); // filtrado por tipo
      expect(result?.pageSize).toBeUndefined(); // filtrado por tipo
    });
  });

  describe('clearState', () => {
    const stateKey = 'test-table-state';

    it('não deve fazer nada quando storage é undefined', () => {
      service.clearState(undefined, stateKey);

      expect(mockStorage.removeItem).not.toHaveBeenCalled();
    });

    it('deve remover item do storage', () => {
      mockStorage.setItem(stateKey, JSON.stringify({filterValue: 'test'}));

      service.clearState(mockStorage, stateKey);

      expect(mockStorage.removeItem).toHaveBeenCalledWith(stateKey);
      expect(mockStorage.getItem(stateKey)).toBeNull();
    });

    it('deve loggar warning quando removeItem lança erro', () => {
      const errorStorage = {
        ...mockStorage,
        removeItem: jest.fn(() => {
          throw new Error('Remove failed');
        })
      };

      service.clearState(errorStorage, stateKey);

      expect(loggerService.warn).toHaveBeenCalledWith('Table state could not be cleared', expect.any(Error));
    });
  });

  describe('restoreSelectionFromKeys', () => {
    const items = [
      {id: 1, name: 'Item 1'},
      {id: 2, name: 'Item 2'},
      {id: 3, name: 'Item 3'}
    ];

    it('deve retornar array vazio quando selectedKeys está vazio', () => {
      const result = service.restoreSelectionFromKeys(items, []);

      expect(result).toEqual([]);
    });

    it('deve retornar array vazio quando items está vazio', () => {
      const result = service.restoreSelectionFromKeys([], [1, 2]);

      expect(result).toEqual([]);
    });

    it('deve retornar array vazio quando selectedKeys é null/undefined', () => {
      expect(service.restoreSelectionFromKeys(items, null as any)).toEqual([]);
      expect(service.restoreSelectionFromKeys(items, undefined as any)).toEqual([]);
    });

    it('deve restaurar itens selecionados por id padrão', () => {
      const result = service.restoreSelectionFromKeys(items, [1, 3]);

      expect(result).toEqual([
        {id: 1, name: 'Item 1'},
        {id: 3, name: 'Item 3'}
      ]);
    });

    it('deve restaurar itens selecionados usando trackByField customizado', () => {
      const customItems = [
        {codigo: 'A1', name: 'Item 1'},
        {codigo: 'A2', name: 'Item 2'},
        {codigo: 'A3', name: 'Item 3'}
      ];

      const result = service.restoreSelectionFromKeys(customItems, ['A1', 'A3'], 'codigo');

      expect(result).toEqual([
        {codigo: 'A1', name: 'Item 1'},
        {codigo: 'A3', name: 'Item 3'}
      ]);
    });

    it('deve ignorar chaves que não correspondem a nenhum item', () => {
      const result = service.restoreSelectionFromKeys(items, [1, 99, 100]);

      expect(result).toEqual([{id: 1, name: 'Item 1'}]);
    });

    it('deve funcionar com diferentes tipos de chaves', () => {
      const stringItems = [
        {id: 'abc', name: 'Item 1'},
        {id: 'def', name: 'Item 2'}
      ];

      const result = service.restoreSelectionFromKeys(stringItems, ['abc']);

      expect(result).toEqual([{id: 'abc', name: 'Item 1'}]);
    });
  });

  describe('buildDefaultStateKey', () => {
    it('deve construir chave correta para nome do componente', () => {
      const result = service.buildDefaultStateKey('ItemListComponent');

      expect(result).toBe('table-state-ItemListComponent');
    });

    it('deve construir chave correta para diferentes componentes', () => {
      expect(service.buildDefaultStateKey('UserListComponent')).toBe('table-state-UserListComponent');
      expect(service.buildDefaultStateKey('ProductListComponent')).toBe('table-state-ProductListComponent');
    });

    it('deve funcionar com string vazia', () => {
      const result = service.buildDefaultStateKey('');

      expect(result).toBe('table-state-');
    });
  });

  describe('testes de integração', () => {
    it('deve realizar fluxo completo: save → restore → clear', () => {
      const stateKey = 'integration-test';
      const columns = [...mockColumns];

      // 1. Salvar estado
      service.saveState(mockStorage, stateKey, {
        filterValue: 'test',
        sortField: 'name',
        sortOrder: -1,
        pageSize: 20,
        pageIndex: 1,
        columns: columns,
        selectedItems: [{id: 1}, {id: 2}]
      });

      // 2. Restaurar estado
      const restored = service.restoreState(mockStorage, stateKey, columns);

      expect(restored).toBeDefined();
      expect(restored?.filterValue).toBe('test');
      expect(restored?.sortField).toBe('name');
      expect(restored?.sortOrder).toBe(-1);
      expect(restored?.pageSize).toBe(20);
      expect(restored?.pageIndex).toBe(1);
      expect(restored?.selectedKeys).toEqual([1, 2]);

      // 3. Limpar estado
      service.clearState(mockStorage, stateKey);

      const afterClear = service.restoreState(mockStorage, stateKey, columns);
      expect(afterClear).toBeNull();
    });

    it('deve manter estados independentes para chaves diferentes', () => {
      const key1 = 'table-1';
      const key2 = 'table-2';

      service.saveState(mockStorage, key1, {filterValue: 'filter1'});
      service.saveState(mockStorage, key2, {filterValue: 'filter2'});

      const restored1 = service.restoreState(mockStorage, key1);
      const restored2 = service.restoreState(mockStorage, key2);

      expect(restored1?.filterValue).toBe('filter1');
      expect(restored2?.filterValue).toBe('filter2');
    });

    it('deve restaurar seleção após salvar e carregar dados', () => {
      const stateKey = 'selection-test';
      const items = [
        {id: 1, name: 'Item 1'},
        {id: 2, name: 'Item 2'},
        {id: 3, name: 'Item 3'}
      ];

      // Salvar seleção
      service.saveState(mockStorage, stateKey, {
        selectedItems: [items[0], items[2]] // seleciona items 1 e 3
      });

      // Restaurar chaves
      const restored = service.restoreState(mockStorage, stateKey);

      // Restaurar itens completos
      const selectedItems = service.restoreSelectionFromKeys(
        items,
        restored?.selectedKeys ?? []
      );

      expect(selectedItems).toEqual([items[0], items[2]]);
    });

    it('deve usar stateKey gerado automaticamente', () => {
      const componentName = 'ItemListComponent';
      const stateKey = service.buildDefaultStateKey(componentName);

      service.saveState(mockStorage, stateKey, {filterValue: 'auto-key-test'});

      const restored = service.restoreState(mockStorage, stateKey);

      expect(restored?.filterValue).toBe('auto-key-test');
      expect(stateKey).toBe('table-state-ItemListComponent');
    });
  });
});
