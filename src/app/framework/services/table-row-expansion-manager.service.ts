import {Injectable} from '@angular/core';

/**
 * Service responsible for managing table row expansion state.
 *
 * Features:
 * - Track expanded rows by key
 * - Expand/collapse individual rows
 * - Expand/collapse all rows
 * - Support for single and multiple expansion modes
 * - Key-based row identification
 */
@Injectable({
  providedIn: 'root'
})
export class TableRowExpansionManagerService {
  /**
   * Check if a row is currently expanded
   *
   * @param expandedRows Current expanded rows state
   * @param rowKey Unique key for the row
   * @returns true if row is expanded
   */
  isRowExpanded(expandedRows: Record<string, boolean> | undefined, rowKey: string | null): boolean {
    if (!rowKey) {
      return false;
    }
    return !!expandedRows?.[rowKey];
  }

  /**
   * Toggle row expansion state
   *
   * @param expandedRows Current expanded rows state
   * @param rowKey Unique key for the row
   * @param expandMode Expansion mode ('single' or 'multiple')
   * @returns Updated expanded rows state
   */
  toggleRowExpansion(
    expandedRows: Record<string, boolean> | undefined,
    rowKey: string | null,
    expandMode: 'single' | 'multiple' = 'multiple'
  ): Record<string, boolean> {
    if (!rowKey) {
      return expandedRows || {};
    }

    const isCurrentlyExpanded = this.isRowExpanded(expandedRows, rowKey);

    if (expandMode === 'single') {
      // Single mode: only one row can be expanded at a time
      return isCurrentlyExpanded ? {} : {[rowKey]: true};
    } else {
      // Multiple mode: toggle this row while keeping others
      const updated = {...(expandedRows)};
      if (updated[rowKey]) {
        delete updated[rowKey];
      } else {
        updated[rowKey] = true;
      }
      return updated;
    }
  }

  /**
   * Expand a single row
   *
   * @param expandedRows Current expanded rows state
   * @param rowKey Unique key for the row
   * @param expandMode Expansion mode ('single' or 'multiple')
   * @returns Updated expanded rows state
   */
  expandRow(
    expandedRows: Record<string, boolean> | undefined,
    rowKey: string | null,
    expandMode: 'single' | 'multiple' = 'multiple'
  ): Record<string, boolean> {
    if (!rowKey) {
      return expandedRows || {};
    }

    if (expandMode === 'single') {
      // Single mode: clear others and expand this one
      return {[rowKey]: true};
    } else {
      // Multiple mode: add to existing
      return {...(expandedRows), [rowKey]: true};
    }
  }

  /**
   * Collapse a single row
   *
   * @param expandedRows Current expanded rows state
   * @param rowKey Unique key for the row
   * @returns Updated expanded rows state
   */
  collapseRow(
    expandedRows: Record<string, boolean> | undefined,
    rowKey: string | null
  ): Record<string, boolean> {
    if (!rowKey || !expandedRows?.[rowKey]) {
      return expandedRows || {};
    }

    const updated = {...expandedRows};
    delete updated[rowKey];
    return updated;
  }

  /**
   * Expand all rows
   *
   * @param rows Array of all rows
   * @param getRowKey Function to extract unique key from row
   * @returns Expanded rows state with all rows expanded
   */
  expandAllRows<T>(rows: T[], getRowKey: (row: T) => string | null): Record<string, boolean> {
    if (!rows?.length) {
      return {};
    }

    const expanded: Record<string, boolean> = {};
    for (const row of rows) {
      const key = getRowKey(row);
      if (key) {
        expanded[key] = true;
      }
    }
    return expanded;
  }

  /**
   * Collapse all rows
   *
   * @returns Empty expanded rows state
   */
  collapseAllRows(): Record<string, boolean> {
    return {};
  }

  /**
   * Get count of currently expanded rows
   *
   * @param expandedRows Current expanded rows state
   * @returns Number of expanded rows
   */
  getExpandedCount(expandedRows: Record<string, boolean> | undefined): number {
    if (!expandedRows) {
      return 0;
    }
    return Object.keys(expandedRows).filter(key => expandedRows[key]).length;
  }

  /**
   * Check if any rows are expanded
   *
   * @param expandedRows Current expanded rows state
   * @returns true if at least one row is expanded
   */
  hasExpandedRows(expandedRows: Record<string, boolean> | undefined): boolean {
    return this.getExpandedCount(expandedRows) > 0;
  }

  /**
   * Get array of expanded row keys
   *
   * @param expandedRows Current expanded rows state
   * @returns Array of keys for expanded rows
   */
  getExpandedKeys(expandedRows: Record<string, boolean> | undefined): string[] {
    if (!expandedRows) {
      return [];
    }
    return Object.keys(expandedRows).filter(key => expandedRows[key]);
  }
}
