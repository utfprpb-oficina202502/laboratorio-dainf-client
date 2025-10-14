import {inject, Injectable} from '@angular/core';
import {TableColumn} from '../model/table-config.interface';
import {LoggerService} from './logger.service';

/**
 * Serviço responsável pelo gerenciamento de persistência de estado de tabela (localStorage/sessionStorage).
 *
 * Funcionalidades:
 * - Salvar/restaurar estado da tabela (filtros, ordenação, paginação, colunas, seleção, linhas expandidas)
 * - Tipo de armazenamento configurável (localStorage vs sessionStorage)
 * - Serialização/deserialização automática de estado
 * - Tratamento de erros para operações de armazenamento
 * - Restauração de seleção após carregamento de dados
 * - Controle granular sobre quais propriedades de estado persistir
 * - Suporte a diferentes campos de rastreamento para seleção (padrão: 'id')
 *
 * Uso em componentes:
 * ```typescript
 * export class MyListComponent {
 *   private stateManager = inject(TableStateManagerService);
 *   private storage?: Storage;
 *   private stateKey = 'my-table-state';
 *
 *   ngOnInit(): void {
 *     // Inicializar armazenamento
 *     this.storage = this.stateManager.initializeStorage(true, 'local');
 *
 *     // Restaurar estado salvo
 *     const restored = this.stateManager.restoreState(
 *       this.storage,
 *       this.stateKey,
 *       this.columns
 *     );
 *
 *     if (restored) {
 *       this.filterValue = restored.filterValue ?? '';
 *       this.selectedItems = this.stateManager.restoreSelectionFromKeys(
 *         this.items,
 *         restored.selectedKeys ?? []
 *       );
 *     }
 *   }
 *
 *   saveCurrentState(): void {
 *     this.stateManager.saveState(
 *       this.storage,
 *       this.stateKey,
 *       {
 *         filterValue: this.filterValue,
 *         sortField: this.sortField,
 *         columns: this.columns,
 *         selectedItems: this.selectedItems
 *       }
 *     );
 *   }
 * }
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class TableStateManagerService {
  private readonly logger = inject(LoggerService);

  /**
   * Inicializa referência de armazenamento para persistência de estado
   *
   * @param stateful Se a persistência de estado está habilitada
   * @param stateStorage Tipo de armazenamento ('local' para localStorage ou 'session' para sessionStorage)
   * @returns Referência de armazenamento ou undefined se indisponível (ex: SSR, acesso negado)
   *
   * @example
   * ```typescript
   * // localStorage (padrão - persiste entre sessões do navegador)
   * const storage = this.stateManager.initializeStorage(true, 'local');
   *
   * // sessionStorage (limpa ao fechar aba)
   * const storage = this.stateManager.initializeStorage(true, 'session');
   *
   * // Desabilitado
   * const storage = this.stateManager.initializeStorage(false); // retorna undefined
   * ```
   */
  initializeStorage(stateful: boolean, stateStorage: 'local' | 'session' = 'local'): Storage | undefined {
    if (!stateful) {
      return undefined;
    }

    if (typeof globalThis === 'undefined') {
      return undefined;
    }

    try {
      return stateStorage === 'session' ? globalThis.sessionStorage : globalThis.localStorage;
    } catch (error) {
      this.logger.warn('Table state storage unavailable', error);
      return undefined;
    }
  }

  /**
   * Salva estado da tabela no armazenamento
   *
   * @param storage Referência de armazenamento (localStorage ou sessionStorage)
   * @param stateKey Chave única para o estado desta tabela (ex: 'table-state-ItemListComponent')
   * @param state Objeto de estado contendo configuração da tabela
   * @param stateProps Configuração para quais propriedades salvar (padrão: todas habilitadas)
   * @param trackByField Campo usado como chave única para itens selecionados (padrão: 'id')
   *
   * @example
   * ```typescript
   * // Salvar estado completo
   * this.stateManager.saveState(
   *   this.storage,
   *   'table-state-items',
   *   {
   *     filterValue: this.globalFilter,
   *     sortField: this.sortField,
   *     sortOrder: this.sortOrder,
   *     pageSize: this.pageSize,
   *     pageIndex: this.currentPage,
   *     columns: this.columns,
   *     expandedRows: this.expandedRows,
   *     selectedItems: this.selectedItems
   *   }
   * );
   *
   * // Salvar apenas filtros e ordenação
   * this.stateManager.saveState(
   *   this.storage,
   *   'table-state-items',
   *   {filterValue: this.globalFilter, sortField: this.sortField},
   *   {filters: true, sort: true, pagination: false, selection: false}
   * );
   *
   * // Usar campo diferente para rastreamento de seleção
   * this.stateManager.saveState(
   *   this.storage,
   *   'table-state-items',
   *   {selectedItems: this.selectedItems},
   *   undefined,
   *   'codigo' // usar campo 'codigo' ao invés de 'id'
   * );
   * ```
   */
  saveState(
    storage: Storage | undefined,
    stateKey: string,
    state: {
      filterValue?: string;
      sortField?: string;
      sortOrder?: number;
      pageSize?: number;
      pageIndex?: number;
      columns?: TableColumn[];
      columnToggleModel?: string[];
      expandedRows?: Record<string, boolean>;
      selectedItems?: unknown[];
    },
    stateProps?: {
      columns?: boolean;
      filters?: boolean;
      sort?: boolean;
      pagination?: boolean;
      selection?: boolean;
      expandedRows?: boolean;
    },
    trackByField = 'id'
  ): void {
    if (!storage) {
      return;
    }

    const props = this.mergeStateProps(stateProps);
    const stateToSave: Record<string, unknown> = {};

    this.saveFilterState(stateToSave, state, props);
    this.saveSortState(stateToSave, state, props);
    this.savePaginationState(stateToSave, state, props);
    this.saveColumnsState(stateToSave, state, props);
    this.saveExpandedRowsState(stateToSave, state, props);
    this.saveSelectionState(stateToSave, state, props, trackByField);

    if (Object.keys(stateToSave).length === 0) {
      return;
    }

    try {
      storage.setItem(stateKey, JSON.stringify(stateToSave));
    } catch (error) {
      this.logger.warn('Table state could not be saved', error);
    }
  }

  /**
   * Restaura estado da tabela do armazenamento
   *
   * @param storage Referência de armazenamento (localStorage ou sessionStorage)
   * @param stateKey Chave única para o estado desta tabela
   * @param columns Configuração atual de colunas (será modificada com visibilidade restaurada)
   * @param stateProps Configuração para quais propriedades restaurar (padrão: todas habilitadas)
   * @returns Objeto de estado restaurado ou null se não houver estado salvo ou erro
   *
   * @example
   * ```typescript
   * // Restaurar estado completo
   * const restored = this.stateManager.restoreState(
   *   this.storage,
   *   'table-state-items',
   *   this.columns
   * );
   *
   * if (restored) {
   *   // Aplicar filtros restaurados
   *   this.globalFilter = restored.filterValue ?? '';
   *
   *   // Aplicar ordenação restaurada
   *   this.sortField = restored.sortField;
   *   this.sortOrder = restored.sortOrder ?? 1;
   *
   *   // Aplicar paginação restaurada
   *   this.pageSize = restored.pageSize ?? 10;
   *   this.currentPage = restored.pageIndex ?? 0;
   *
   *   // Restaurar seleção (após carregar dados)
   *   this.loadData().then(() => {
   *     this.selectedItems = this.stateManager.restoreSelectionFromKeys(
   *       this.items,
   *       restored.selectedKeys ?? []
   *     );
   *   });
   * }
   *
   * // Restaurar apenas filtros
   * const restored = this.stateManager.restoreState(
   *   this.storage,
   *   'table-state-items',
   *   this.columns,
   *   {filters: true, sort: false, pagination: false}
   * );
   * ```
   */
  restoreState(
    storage: Storage | undefined,
    stateKey: string,
    columns?: TableColumn[],
    stateProps?: {
      columns?: boolean;
      filters?: boolean;
      sort?: boolean;
      pagination?: boolean;
      selection?: boolean;
      expandedRows?: boolean;
    }
  ): RestoredTableState | null {
    if (!storage) {
      return null;
    }

    const props = this.mergeStateProps(stateProps);

    try {
      const raw = storage.getItem(stateKey);
      if (!raw) {
        return null;
      }

      const state = JSON.parse(raw);
      const restored: RestoredTableState = {};

      this.restoreColumnsState(restored, state, props, columns);
      this.restoreFilterState(restored, state, props);
      this.restoreSortState(restored, state, props);
      this.restorePaginationState(restored, state, props);
      this.restoreExpandedRowsState(restored, state, props);
      this.restoreSelectionState(restored, state, props);

      return restored;
    } catch (error) {
      this.logger.warn('Table state could not be restored', error);
      return null;
    }
  }

  /**
   * Limpa estado da tabela do armazenamento
   *
   * @param storage Referência de armazenamento
   * @param stateKey Chave única para o estado desta tabela
   *
   * @example
   * ```typescript
   * // Limpar estado salvo (ex: ao fazer logout ou reset)
   * this.stateManager.clearState(this.storage, 'table-state-items');
   *
   * // Limpar e restaurar valores padrão
   * this.stateManager.clearState(this.storage, this.stateKey);
   * this.resetToDefaults();
   * ```
   */
  clearState(storage: Storage | undefined, stateKey: string): void {
    if (!storage) {
      return;
    }

    try {
      storage.removeItem(stateKey);
    } catch (error) {
      this.logger.warn('Table state could not be cleared', error);
    }
  }

  /**
   * Restaura itens selecionados a partir de chaves salvas
   *
   * @param items Todos os itens disponíveis
   * @param selectedKeys Chaves de seleção previamente salvas
   * @param trackByField Nome do campo a usar como chave única (padrão: 'id')
   * @returns Array de itens selecionados correspondentes às chaves salvas
   *
   * @example
   * ```typescript
   * // Após carregar dados, restaurar seleção salva
   * this.loadData().then(() => {
   *   const restored = this.stateManager.restoreState(this.storage, this.stateKey);
   *   if (restored?.selectedKeys) {
   *     this.selectedItems = this.stateManager.restoreSelectionFromKeys(
   *       this.items,
   *       restored.selectedKeys
   *     );
   *   }
   * });
   *
   * // Usar campo diferente como chave
   * this.selectedItems = this.stateManager.restoreSelectionFromKeys(
   *   this.items,
   *   restored.selectedKeys,
   *   'codigo' // usar 'codigo' ao invés de 'id'
   * );
   *
   * // Retorna array vazio se não houver chaves ou itens
   * const selected = this.stateManager.restoreSelectionFromKeys([], [1, 2, 3]); // []
   * const selected = this.stateManager.restoreSelectionFromKeys(items, []); // []
   * ```
   */
  restoreSelectionFromKeys(items: unknown[], selectedKeys: unknown[], trackByField = 'id'): unknown[] {
    if (!selectedKeys?.length || !items?.length) {
      return [];
    }
    const keySet = new Set(selectedKeys);
    return items.filter(item => keySet.has((item as Record<string, unknown>)?.[trackByField]));
  }

  /**
   * Constrói chave de estado padrão a partir do nome do componente
   *
   * @param componentName Nome do componente
   * @returns String de chave de estado no formato 'table-state-{componentName}'
   *
   * @example
   * ```typescript
   * // Gerar chave automática a partir do constructor
   * this.stateKey = this.stateManager.buildDefaultStateKey(this.constructor.name);
   * // Resultado: 'table-state-ItemListComponent'
   *
   * // Ou usar chave customizada diretamente
   * this.stateKey = 'my-custom-table-state';
   *
   * // Diferentes componentes terão chaves diferentes
   * const key1 = this.stateManager.buildDefaultStateKey('ItemListComponent');
   * // 'table-state-ItemListComponent'
   * const key2 = this.stateManager.buildDefaultStateKey('UserListComponent');
   * // 'table-state-UserListComponent'
   * ```
   */
  buildDefaultStateKey(componentName: string): string {
    return `table-state-${componentName}`;
  }

  /**
   * Mescla propriedades de estado padrão com substituições fornecidas
   * Todas as propriedades são habilitadas por padrão (columns, filters, sort, pagination, selection, expandedRows)
   */
  private mergeStateProps(stateProps?: Record<string, boolean>): Record<string, boolean> {
    const defaults = {
      columns: true,
      filters: true,
      sort: true,
      pagination: true,
      selection: true,
      expandedRows: true
    };
    return {...defaults, ...stateProps};
  }

  /**
   * Salva estado de filtro se habilitado
   */
  private saveFilterState(
    stateToSave: Record<string, unknown>,
    state: { filterValue?: string },
    props: Record<string, boolean>
  ): void {
    if (props.filters && state.filterValue !== undefined) {
      stateToSave.filterValue = state.filterValue;
    }
  }

  /**
   * Salva estado de ordenação se habilitado
   */
  private saveSortState(
    stateToSave: Record<string, unknown>,
    state: { sortField?: string; sortOrder?: number },
    props: Record<string, boolean>
  ): void {
    if (!props.sort) {
      return;
    }

    if (state.sortField !== undefined) {
      stateToSave.sortField = state.sortField;
    }
    if (state.sortOrder !== undefined) {
      stateToSave.sortOrder = state.sortOrder;
    }
  }

  /**
   * Salva estado de paginação se habilitado
   */
  private savePaginationState(
    stateToSave: Record<string, unknown>,
    state: { pageSize?: number; pageIndex?: number },
    props: Record<string, boolean>
  ): void {
    if (!props.pagination) {
      return;
    }

    if (state.pageSize !== undefined) {
      stateToSave.pageSize = state.pageSize;
    }
    if (state.pageIndex !== undefined) {
      stateToSave.pageIndex = state.pageIndex;
    }
  }

  /**
   * Salva estado de colunas se habilitado
   * Armazena apenas field e visible para cada coluna
   */
  private saveColumnsState(
    stateToSave: Record<string, unknown>,
    state: { columns?: TableColumn[]; columnToggleModel?: string[] },
    props: Record<string, boolean>
  ): void {
    if (!props.columns || !state.columns) {
      return;
    }

    stateToSave.columns = state.columns.map(col => ({
      field: col.field,
      visible: col.visible !== false
    }));

    if (state.columnToggleModel) {
      stateToSave.columnToggleModel = state.columnToggleModel;
    }
  }

  /**
   * Salva estado de linhas expandidas se habilitado
   * Armazena apenas as chaves das linhas expandidas (não as colapsadas)
   */
  private saveExpandedRowsState(
    stateToSave: Record<string, unknown>,
    state: { expandedRows?: Record<string, boolean> },
    props: Record<string, boolean>
  ): void {
    if (!props.expandedRows || !state.expandedRows) {
      return;
    }

    stateToSave.expandedRowKeys = Object.keys(state.expandedRows)
    .filter(key => state.expandedRows?.[key]);
  }

  /**
   * Salva estado de seleção se habilitado
   * Armazena apenas as chaves dos itens selecionados (usando trackByField)
   */
  private saveSelectionState(
    stateToSave: Record<string, unknown>,
    state: { selectedItems?: unknown[] },
    props: Record<string, boolean>,
    trackByField: string
  ): void {
    if (!props.selection || !state.selectedItems?.length) {
      return;
    }

    stateToSave.selectedKeys = this.getSelectionKeys(state.selectedItems, trackByField);
  }

  /**
   * Restaura estado de colunas do estado salvo
   * Atualiza visibilidade das colunas fornecidas e restaura columnToggleModel
   */
  private restoreColumnsState(
    restored: RestoredTableState,
    state: Record<string, unknown>,
    props: Record<string, boolean>,
    columns?: TableColumn[]
  ): void {
    if (!props.columns || !Array.isArray(state.columns) || !columns) {
      return;
    }

    for (const saved of state.columns) {
      const column = columns.find(col => col.field === saved.field);
      if (column) {
        column.visible = saved.visible !== false;
      }
    }

    if (Array.isArray(state.columnToggleModel)) {
      restored.columnToggleModel = state.columnToggleModel;
    }
  }

  /**
   * Restaura estado de filtro do estado salvo
   */
  private restoreFilterState(
    restored: RestoredTableState,
    state: Record<string, unknown>,
    props: Record<string, boolean>
  ): void {
    if (props.filters && typeof state.filterValue === 'string') {
      restored.filterValue = state.filterValue;
    }
  }

  /**
   * Restaura estado de ordenação do estado salvo
   */
  private restoreSortState(
    restored: RestoredTableState,
    state: Record<string, unknown>,
    props: Record<string, boolean>
  ): void {
    if (!props.sort) {
      return;
    }

    if (typeof state.sortField === 'string') {
      restored.sortField = state.sortField;
    }
    if (typeof state.sortOrder === 'number') {
      restored.sortOrder = state.sortOrder;
    }
  }

  /**
   * Restaura estado de paginação do estado salvo
   */
  private restorePaginationState(
    restored: RestoredTableState,
    state: Record<string, unknown>,
    props: Record<string, boolean>
  ): void {
    if (!props.pagination) {
      return;
    }

    if (typeof state.pageSize === 'number') {
      restored.pageSize = state.pageSize;
    }
    if (typeof state.pageIndex === 'number') {
      restored.pageIndex = state.pageIndex;
    }
  }

  /**
   * Restaura estado de linhas expandidas do estado salvo
   * Converte array de chaves em objeto Record<string, boolean>
   */
  private restoreExpandedRowsState(
    restored: RestoredTableState,
    state: Record<string, unknown>,
    props: Record<string, boolean>
  ): void {
    if (!props.expandedRows || !Array.isArray(state.expandedRowKeys)) {
      return;
    }

    restored.expandedRowKeys = state.expandedRowKeys.reduce(
      (acc: Record<string, boolean>, key: string) => {
        acc[key] = true;
        return acc;
      },
      {} as Record<string, boolean>
    );
  }

  /**
   * Restaura estado de seleção do estado salvo
   * Retorna apenas as chaves - use restoreSelectionFromKeys() para obter os itens completos
   */
  private restoreSelectionState(
    restored: RestoredTableState,
    state: Record<string, unknown>,
    props: Record<string, boolean>
  ): void {
    if (props.selection && Array.isArray(state.selectedKeys)) {
      restored.selectedKeys = state.selectedKeys;
    }
  }

  /**
   * Extrai chaves de seleção dos itens selecionados
   *
   * @param selectedItems Array de itens selecionados
   * @param trackByField Nome do campo a usar como chave única (padrão: 'id')
   * @returns Array de chaves de seleção (filtra undefined e null)
   */
  private getSelectionKeys(selectedItems: unknown[], trackByField = 'id'): unknown[] {
    if (!selectedItems?.length) {
      return [];
    }
    return selectedItems
    .map(item => (item as Record<string, unknown>)?.[trackByField])
    .filter(key => key !== undefined && key !== null);
  }
}

/**
 * Interface para estado de tabela restaurado
 *
 * Propriedades:
 * - filterValue: Valor do filtro global
 * - sortField: Campo de ordenação
 * - sortOrder: Ordem de ordenação (1 = ASC, -1 = DESC)
 * - pageSize: Tamanho da página
 * - pageIndex: Índice da página atual
 * - columnToggleModel: Modelo de toggle de colunas
 * - expandedRowKeys: Chaves de linhas expandidas
 * - selectedKeys: Chaves de itens selecionados (usar com restoreSelectionFromKeys para obter itens completos)
 */
export interface RestoredTableState {
  filterValue?: string;
  sortField?: string;
  sortOrder?: number;
  pageSize?: number;
  pageIndex?: number;
  columnToggleModel?: string[];
  expandedRowKeys?: Record<string, boolean>;
  selectedKeys?: unknown[];
}
