import {TableRowExpansionManagerService} from './table-row-expansion-manager.service';

describe('TableRowExpansionManagerService', () => {
  let service: TableRowExpansionManagerService;

  beforeEach(() => {
    // Cria instância direta do serviço (não precisa de TestBed)
    service = new TableRowExpansionManagerService();
  });

  describe('isRowExpanded', () => {
    it('deve retornar false quando rowKey é null', () => {
      const expandedRows = {'1': true};

      const result = service.isRowExpanded(expandedRows, null);

      expect(result).toBe(false);
    });

    it('deve retornar false quando expandedRows é undefined', () => {
      const result = service.isRowExpanded(undefined, '1');

      expect(result).toBe(false);
    });

    it('deve retornar true quando linha está expandida', () => {
      const expandedRows = {'1': true, '2': false};

      const result = service.isRowExpanded(expandedRows, '1');

      expect(result).toBe(true);
    });

    it('deve retornar false quando linha não está expandida', () => {
      const expandedRows = {'1': true, '2': false};

      const result = service.isRowExpanded(expandedRows, '2');

      expect(result).toBe(false);
    });

    it('deve retornar false quando linha não existe no estado', () => {
      const expandedRows = {'1': true};

      const result = service.isRowExpanded(expandedRows, '3');

      expect(result).toBe(false);
    });
  });

  describe('toggleRowExpansion', () => {
    describe('modo múltiplo', () => {
      it('deve expandir linha quando não estava expandida', () => {
        const expandedRows = {'1': true};

        const result = service.toggleRowExpansion(expandedRows, '2', 'multiple');

        expect(result).toEqual({'1': true, '2': true});
      });

      it('deve recolher linha quando estava expandida', () => {
        const expandedRows = {'1': true, '2': true};

        const result = service.toggleRowExpansion(expandedRows, '2', 'multiple');

        expect(result).toEqual({'1': true});
      });

      it('deve criar novo estado quando expandedRows é undefined', () => {
        const result = service.toggleRowExpansion(undefined, '1', 'multiple');

        expect(result).toEqual({'1': true});
      });

      it('deve retornar estado vazio quando rowKey é null', () => {
        const expandedRows = {'1': true};

        const result = service.toggleRowExpansion(expandedRows, null, 'multiple');

        expect(result).toEqual({'1': true});
      });
    });

    describe('modo único', () => {
      it('deve expandir linha e limpar outras quando linha não estava expandida', () => {
        const expandedRows = {'1': true, '2': true};

        const result = service.toggleRowExpansion(expandedRows, '3', 'single');

        expect(result).toEqual({'3': true});
      });

      it('deve recolher linha quando estava expandida em modo único', () => {
        const expandedRows = {'1': true};

        const result = service.toggleRowExpansion(expandedRows, '1', 'single');

        expect(result).toEqual({});
      });
    });
  });

  describe('expandRow', () => {
    describe('modo múltiplo', () => {
      it('deve adicionar linha ao estado existente', () => {
        const expandedRows = {'1': true};

        const result = service.expandRow(expandedRows, '2', 'multiple');

        expect(result).toEqual({'1': true, '2': true});
      });

      it('deve criar novo estado quando expandedRows é undefined', () => {
        const result = service.expandRow(undefined, '1', 'multiple');

        expect(result).toEqual({'1': true});
      });

      it('deve retornar estado vazio quando rowKey é null', () => {
        const result = service.expandRow(undefined, null, 'multiple');

        expect(result).toEqual({});
      });
    });

    describe('modo único', () => {
      it('deve limpar outras linhas e expandir apenas a selecionada', () => {
        const expandedRows = {'1': true, '2': true};

        const result = service.expandRow(expandedRows, '3', 'single');

        expect(result).toEqual({'3': true});
      });
    });
  });

  describe('collapseRow', () => {
    it('deve remover linha do estado', () => {
      const expandedRows = {'1': true, '2': true};

      const result = service.collapseRow(expandedRows, '2');

      expect(result).toEqual({'1': true});
    });

    it('deve retornar estado vazio quando expandedRows é undefined', () => {
      const result = service.collapseRow(undefined, '1');

      expect(result).toEqual({});
    });

    it('deve retornar estado inalterado quando rowKey é null', () => {
      const expandedRows = {'1': true};

      const result = service.collapseRow(expandedRows, null);

      expect(result).toEqual({'1': true});
    });

    it('deve retornar estado inalterado quando linha não existe', () => {
      const expandedRows = {'1': true};

      const result = service.collapseRow(expandedRows, '3');

      expect(result).toEqual({'1': true});
    });
  });

  describe('expandAllRows', () => {
    interface TestRow {
      id: string;
      name: string;
    }

    it('deve expandir todas as linhas', () => {
      const rows: TestRow[] = [
        {id: '1', name: 'Item 1'},
        {id: '2', name: 'Item 2'},
        {id: '3', name: 'Item 3'}
      ];

      const result = service.expandAllRows(rows, (row) => row.id);

      expect(result).toEqual({'1': true, '2': true, '3': true});
    });

    it('deve retornar estado vazio quando array é vazio', () => {
      const result = service.expandAllRows<TestRow>([], (row) => row.id);

      expect(result).toEqual({});
    });

    it('deve retornar estado vazio quando array é undefined', () => {
      const result = service.expandAllRows<TestRow>(undefined as any, (row) => row.id);

      expect(result).toEqual({});
    });

    it('deve ignorar linhas com chave null', () => {
      const rows: TestRow[] = [
        {id: '1', name: 'Item 1'},
        {id: null as any, name: 'Item 2'},
        {id: '3', name: 'Item 3'}
      ];

      const result = service.expandAllRows(rows, (row) => row.id);

      expect(result).toEqual({'1': true, '3': true});
    });
  });

  describe('collapseAllRows', () => {
    it('deve retornar estado vazio', () => {
      const result = service.collapseAllRows();

      expect(result).toEqual({});
    });
  });

  describe('getExpandedCount', () => {
    it('deve retornar contagem correta de linhas expandidas', () => {
      const expandedRows = {'1': true, '2': true, '3': false};

      const result = service.getExpandedCount(expandedRows);

      expect(result).toBe(2);
    });

    it('deve retornar 0 quando expandedRows é undefined', () => {
      const result = service.getExpandedCount(undefined);

      expect(result).toBe(0);
    });

    it('deve retornar 0 quando não há linhas expandidas', () => {
      const expandedRows = {'1': false, '2': false};

      const result = service.getExpandedCount(expandedRows);

      expect(result).toBe(0);
    });

    it('deve retornar 0 para estado vazio', () => {
      const result = service.getExpandedCount({});

      expect(result).toBe(0);
    });
  });

  describe('hasExpandedRows', () => {
    it('deve retornar true quando há linhas expandidas', () => {
      const expandedRows = {'1': true};

      const result = service.hasExpandedRows(expandedRows);

      expect(result).toBe(true);
    });

    it('deve retornar false quando não há linhas expandidas', () => {
      const expandedRows = {'1': false, '2': false};

      const result = service.hasExpandedRows(expandedRows);

      expect(result).toBe(false);
    });

    it('deve retornar false quando expandedRows é undefined', () => {
      const result = service.hasExpandedRows(undefined);

      expect(result).toBe(false);
    });

    it('deve retornar false para estado vazio', () => {
      const result = service.hasExpandedRows({});

      expect(result).toBe(false);
    });
  });

  describe('getExpandedKeys', () => {
    it('deve retornar array com chaves das linhas expandidas', () => {
      const expandedRows = {'1': true, '2': false, '3': true};

      const result = service.getExpandedKeys(expandedRows);

      expect(result).toEqual(['1', '3']);
    });

    it('deve retornar array vazio quando expandedRows é undefined', () => {
      const result = service.getExpandedKeys(undefined);

      expect(result).toEqual([]);
    });

    it('deve retornar array vazio quando não há linhas expandidas', () => {
      const expandedRows = {'1': false, '2': false};

      const result = service.getExpandedKeys(expandedRows);

      expect(result).toEqual([]);
    });

    it('deve retornar array vazio para estado vazio', () => {
      const result = service.getExpandedKeys({});

      expect(result).toEqual([]);
    });
  });

  describe('testes de integração', () => {
    interface TestItem {
      id: string;
      name: string;
    }

    it('deve permitir fluxo completo de expansão de linhas', () => {
      const items: TestItem[] = [
        {id: '1', name: 'Item 1'},
        {id: '2', name: 'Item 2'},
        {id: '3', name: 'Item 3'}
      ];
      let expandedRows: Record<string, boolean> = {};

      // Expandir linha individual
      expandedRows = service.expandRow(expandedRows, '1', 'multiple');
      expect(service.isRowExpanded(expandedRows, '1')).toBe(true);
      expect(service.getExpandedCount(expandedRows)).toBe(1);

      // Adicionar mais linhas
      expandedRows = service.expandRow(expandedRows, '2', 'multiple');
      expect(service.getExpandedCount(expandedRows)).toBe(2);
      expect(service.getExpandedKeys(expandedRows)).toEqual(['1', '2']);

      // Alternar linha (deve recolher)
      expandedRows = service.toggleRowExpansion(expandedRows, '1', 'multiple');
      expect(service.isRowExpanded(expandedRows, '1')).toBe(false);
      expect(service.getExpandedCount(expandedRows)).toBe(1);

      // Expandir todas
      expandedRows = service.expandAllRows(items, (row) => row.id);
      expect(service.getExpandedCount(expandedRows)).toBe(3);
      expect(service.hasExpandedRows(expandedRows)).toBe(true);

      // Recolher todas
      expandedRows = service.collapseAllRows();
      expect(service.getExpandedCount(expandedRows)).toBe(0);
      expect(service.hasExpandedRows(expandedRows)).toBe(false);
    });

    it('deve funcionar corretamente em modo único', () => {
      let expandedRows: Record<string, boolean> = {};

      // Expandir primeira linha
      expandedRows = service.expandRow(expandedRows, '1', 'single');
      expect(service.getExpandedCount(expandedRows)).toBe(1);

      // Expandir segunda linha (deve limpar primeira)
      expandedRows = service.expandRow(expandedRows, '2', 'single');
      expect(service.getExpandedCount(expandedRows)).toBe(1);
      expect(service.isRowExpanded(expandedRows, '1')).toBe(false);
      expect(service.isRowExpanded(expandedRows, '2')).toBe(true);

      // Alternar linha expandida (deve recolher)
      expandedRows = service.toggleRowExpansion(expandedRows, '2', 'single');
      expect(service.getExpandedCount(expandedRows)).toBe(0);
    });
  });
});
