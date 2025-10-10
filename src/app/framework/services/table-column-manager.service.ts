import {Injectable, TemplateRef} from '@angular/core';
import {TableColumn} from '../model/table-config.interface';

/**
 * Service responsible for managing table column operations.
 *
 * Features:
 * - Column visibility management
 * - Column template registration and retrieval
 * - Column filtering (visible, sortable, filterable, exportable)
 * - Permission-based column updates
 * - Column width calculations
 * - Responsive column display
 */
@Injectable({
  providedIn: 'root'
})
export class TableColumnManagerService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly columnTemplates = new Map<string, TemplateRef<any>>();

  /**
   * Initialize column toggle options and model
   *
   * @param columns All table columns
   * @returns Object with columnToggleOptions and columnToggleModel arrays
   */
  initializeColumnToggle(columns: TableColumn[]): {
    columnToggleOptions: { label: string; value: string }[];
    columnToggleModel: string[];
  } {
    const columnToggleOptions = columns
    .filter(col => col.toggleable !== false && col.field !== 'actions')
    .map(col => ({label: col.header, value: col.field}));

    const columnToggleModel = columns
    .filter(col => col.toggleable !== false && col.visible !== false && col.field !== 'actions')
    .map(col => col.field);

    return {columnToggleOptions, columnToggleModel};
  }

  /**
   * Handle column toggle change event
   *
   * @param columns All table columns (will be modified)
   * @param selectedFields Array of selected column field names
   * @returns Updated columnToggleModel
   */
  handleColumnToggleChange(columns: TableColumn[], selectedFields: string[]): string[] {
    if (!columns) {
      return selectedFields;
    }

    // Ensure at least one column is visible
    if (!selectedFields || selectedFields.length === 0) {
      const fallback = columns.find(col => col.toggleable !== false && col.field !== 'actions');
      if (fallback) {
        selectedFields = [fallback.field];
      }
    }

    // Update column visibility
    const selectedSet = new Set(selectedFields);
    for (const column of columns) {
      if (column.toggleable === false || column.field === 'actions') {
        continue;
      }
      column.visible = selectedSet.has(column.field);
    }

    return selectedFields;
  }

  /**
   * Update columns based on user permissions
   *
   * @param columns All table columns (will be modified)
   * @param isReadOnly Whether the table is in read-only mode
   */
  updateColumnsForPermissions(columns: TableColumn[], isReadOnly: boolean): void {
    if (!columns) {
      return;
    }

    const actionsColumn = columns.find(col => col.field === 'actions');
    if (actionsColumn) {
      // Force visibility based on permissions, overriding any restored state
      // Admin and Laboratorista should always see actions column
      actionsColumn.visible = !isReadOnly;
    }
  }

  /**
   * Build displayed columns array for responsive behavior
   *
   * @param columnsTable Base columns to display
   * @param enableResponsive Whether responsive behavior is enabled
   * @param windowWidth Current window width
   * @param breakpoint Width breakpoint for hiding actions column (default: 1024px)
   * @returns Array of column field names to display
   */
  buildDisplayedColumns(
    columnsTable: string[],
    enableResponsive: boolean,
    windowWidth: number,
    breakpoint = 1024
  ): string[] {
    if (!enableResponsive) {
      return [...columnsTable];
    }

    let responsiveColumns = [...columnsTable];

    if (windowWidth <= breakpoint) {
      // Hide actions column on small screens
      responsiveColumns = responsiveColumns.filter(column => column !== 'actions');
    } else if (!responsiveColumns.includes('actions') && columnsTable.includes('actions')) {
      // Show actions column on large screens
      responsiveColumns = [...responsiveColumns, 'actions'];
    }

    return responsiveColumns;
  }

  /**
   * Update displayed columns based on visible columns
   *
   * @param columns All table columns
   * @returns Array of visible column field names
   */
  getDisplayedColumnsFromConfig(columns: TableColumn[]): string[] {
    if (!columns) {
      return [];
    }

    const visibleColumns = columns.filter(col => col.visible !== false);
    return visibleColumns.map(col => col.field);
  }

  /**
   * Initialize global filter fields from columns
   *
   * @param columns All table columns
   * @returns Array of field names that should be globally filterable
   */
  initializeGlobalFilterFields(columns: TableColumn[]): string[] {
    if (!columns) {
      return [];
    }

    return columns
    .filter(col => col.field !== 'actions' && col.filterable !== false)
    .map(col => col.field);
  }

  /**
   * Register a template for a specific column
   *
   * @param field Column field name
   * @param template Template reference to register
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  registerColumnTemplate(field: string, template: TemplateRef<any>): void {
    this.columnTemplates.set(field, template);
  }

  /**
   * Get registered template for a column
   *
   * @param field Column field name
   * @returns Template reference or undefined
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getColumnTemplate(field: string): TemplateRef<any> | undefined {
    return this.columnTemplates.get(field);
  }

  /**
   * Clear all registered column templates
   */
  clearColumnTemplates(): void {
    this.columnTemplates.clear();
  }

  /**
   * Get visible columns
   *
   * @param columns All table columns
   * @returns Array of visible columns
   */
  getVisibleColumns(columns: TableColumn[]): TableColumn[] {
    return columns.filter(col => col.visible !== false);
  }

  /**
   * Get sortable columns
   *
   * @param columns All table columns
   * @returns Array of sortable columns
   */
  getSortableColumns(columns: TableColumn[]): TableColumn[] {
    return columns.filter(col => col.sortable !== false);
  }

  /**
   * Get filterable columns
   *
   * @param columns All table columns
   * @returns Array of filterable columns
   */
  getFilterableColumns(columns: TableColumn[]): TableColumn[] {
    return columns.filter(col => col.filterable === true);
  }

  /**
   * Get exportable columns
   *
   * @param columns All table columns
   * @returns Array of exportable columns
   */
  getExportableColumns(columns: TableColumn[]): TableColumn[] {
    return columns.filter(col => col.exportable !== false);
  }

  /**
   * Calculate total column count including special columns
   *
   * @param visibleColumnsCount Number of visible data columns
   * @param expandable Whether table has expandable rows
   * @param selectable Whether table has selection column
   * @param isReadOnly Whether table is in read-only mode
   * @returns Total column count
   */
  getColumnCount(
    visibleColumnsCount: number,
    expandable: boolean,
    selectable: boolean,
    isReadOnly: boolean
  ): number {
    let count = visibleColumnsCount;

    if (expandable) {
      count++;
    }

    if (selectable && !isReadOnly) {
      count++;
    }

    return count;
  }

  /**
   * Get column width with auto-sizing based on type
   *
   * @param column Column configuration
   * @returns Column width as CSS string or undefined
   */
  getColumnWidth(column: TableColumn): string | undefined {
    if (column.width) {
      return column.width;
    }

    // Auto-size based on column type
    switch (column.type) {
      case 'boolean':
        return '80px';
      case 'number':
        return '120px';
      case 'date':
        return '140px';
      default:
        return column.minWidth || undefined;
    }
  }

  /**
   * Check if actions column should be shown
   *
   * @param displayedColumns Array of currently displayed column fields
   * @param isReadOnly Whether table is in read-only mode
   * @returns true if actions column should be shown
   */
  shouldShowActionsColumn(displayedColumns: string[], isReadOnly: boolean): boolean {
    return displayedColumns.includes('actions') && !isReadOnly;
  }
}
