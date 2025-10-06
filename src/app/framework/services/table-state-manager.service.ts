import {inject, Injectable} from '@angular/core';
import {TableColumn} from '../model/table-config.interface';
import {LoggerService} from './logger.service';

/**
 * Service responsible for managing table state persistence (localStorage/sessionStorage).
 *
 * Features:
 * - Save/restore table state (filters, sorting, pagination, columns, selection, expanded rows)
 * - Configurable storage type (localStorage vs sessionStorage)
 * - Automatic state serialization/deserialization
 * - Error handling for storage operations
 * - Selection state restoration after data loads
 */
@Injectable({
  providedIn: 'root'
})
export class TableStateManagerService {
  private readonly logger = inject(LoggerService);

  /**
   * Initialize storage reference for state persistence
   *
   * @param stateful Whether state persistence is enabled
   * @param stateStorage Storage type ('local' or 'session')
   * @returns Storage reference or undefined if unavailable
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
   * Save table state to storage
   *
   * @param storage Storage reference (localStorage or sessionStorage)
   * @param stateKey Unique key for this table's state
   * @param state State object containing table configuration
   * @param stateProps Configuration for which properties to save
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
   * Restore table state from storage
   *
   * @param storage Storage reference (localStorage or sessionStorage)
   * @param stateKey Unique key for this table's state
   * @param columns Current column configuration (will be modified with restored visibility)
   * @param stateProps Configuration for which properties to restore
   * @returns Restored state object
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
   * Clear table state from storage
   *
   * @param storage Storage reference
   * @param stateKey Unique key for this table's state
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
   * Restore selected items from saved keys
   *
   * @param items All available items
   * @param selectedKeys Previously saved selection keys
   * @param trackByField Field name to use as unique key (default: 'id')
   * @returns Array of selected items matching the saved keys
   */
  restoreSelectionFromKeys(items: unknown[], selectedKeys: unknown[], trackByField = 'id'): unknown[] {
    if (!selectedKeys?.length || !items?.length) {
      return [];
    }
    const keySet = new Set(selectedKeys);
    return items.filter(item => keySet.has((item as Record<string, unknown>)?.[trackByField]));
  }

  /**
   * Build default state key from component constructor name
   *
   * @param componentName Name of the component
   * @returns State key string
   */
  buildDefaultStateKey(componentName: string): string {
    return `table-state-${componentName}`;
  }

  /**
   * Merge default state props with provided overrides
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
   * Save filter state if enabled
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
   * Save sort state if enabled
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
   * Save pagination state if enabled
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
   * Save columns state if enabled
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
   * Save expanded rows state if enabled
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
   * Save selection state if enabled
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
   * Restore columns state from saved state
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
   * Restore filter state from saved state
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
   * Restore sort state from saved state
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
   * Restore pagination state from saved state
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
   * Restore expanded rows state from saved state
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
   * Restore selection state from saved state
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
   * Extract selection keys from selected items
   *
   * @param selectedItems Array of selected items
   * @param trackByField Field name to use as a unique key (default: 'id')
   * @returns Array of selection keys
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
 * Interface for restored table state
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
