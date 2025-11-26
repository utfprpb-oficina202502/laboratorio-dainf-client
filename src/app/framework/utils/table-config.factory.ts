import { TableColumn, TableConfiguration } from '../model/table-config.interface';

/**
 * Interface fortemente tipada para configuração de tabelas PrimeNG.
 * Propriedades opcionais marcadas conforme uso comum.
 */
export interface TableConfig {
  columns: TableColumn[];
  globalFilterFields: string[];
  defaultSortField?: string;
  defaultSortOrder?: number;
  caption?: string;
  trackByField?: string;
  emptyMessage?: string;
  loadingMessage?: string;
  globalFilterPlaceholder?: string;
  columnToggle?: boolean;
  expandable?: boolean;
  expandMode?: 'single' | 'multiple';
  rowExpansionKey?: string;
  stateful?: boolean;
  stateKey?: string;
  stateStorage?: 'local' | 'session';
  stateProps?: {
    columns?: boolean;
    filters?: boolean;
    sort?: boolean;
    pagination?: boolean;
    selection?: boolean;
    expandedRows?: boolean;
  };
  resizableColumns?: boolean;
  columnResizeMode?: 'fit' | 'expand';
  lazy?: boolean;
  preloadData?: boolean;
  keyboardShortcuts?: boolean;
  pageSizeOptions?: number[];
  [key: string]: unknown; // Para extensibilidade futura
}

/**
 * Factory para configuração padrão de tabelas PrimeNG.
 * Permite sobrescrever campos específicos por lista.
 * @author DAINF/UTFPR
 * @param partialConfig Configuração parcial a ser sobrescrita
 * @returns Configuração completa da tabela
 * @example
 * const tableConfig = createTableConfig({
 *   columns: [...],
 *   globalFilterFields: ['id', 'nome']
 * });
 */
export function createTableConfig(partialConfig: Partial<TableConfiguration>): TableConfiguration {
  const config: TableConfiguration = {
    columns: [],
    globalFilterFields: [],
    defaultSortField: 'id',
    defaultSortOrder: -1 as -1, // Garante tipo 1 | -1
    caption: '',
    trackByField: 'id',
    emptyMessage: 'Nenhum registro encontrado.',
    loadingMessage: 'Carregando registros...',
    globalFilterPlaceholder: 'Buscar...',
    columnToggle: true,
    expandable: false,
    expandMode: 'single',
    rowExpansionKey: 'id',
    stateful: true,
    stateKey: '',
    stateStorage: 'local',
    stateProps: {
      columns: true,
      filters: true,
      sort: true,
      pagination: true,
      selection: true,
      expandedRows: true
    },
    resizableColumns: true,
    columnResizeMode: 'fit',
    lazy: true,
    preloadData: true,
    keyboardShortcuts: true,
    ...partialConfig
  };
  // Garante que defaultSortOrder seja 1 | -1 se definido
  if (partialConfig.defaultSortOrder !== undefined) {
    config.defaultSortOrder = (partialConfig.defaultSortOrder === 1 || partialConfig.defaultSortOrder === -1)
      ? partialConfig.defaultSortOrder
      : -1 as -1;
  }
  return config;
}
