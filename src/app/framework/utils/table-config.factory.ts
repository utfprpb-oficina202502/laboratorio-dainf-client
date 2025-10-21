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
export function createTableConfig(partialConfig: Partial<any>): any {
  return {
    columns: [],
    globalFilterFields: [],
    defaultSortField: 'id',
    defaultSortOrder: -1,
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
}

