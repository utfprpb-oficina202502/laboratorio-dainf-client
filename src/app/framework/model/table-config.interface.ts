import { TemplateRef } from '@angular/core';

/**
 * Configuration interface for table columns with full customization support
 */
export interface TableColumn {
  /** Field name in the data object */
  field: string;

  /** Display header text */
  header: string;

  /** Column data type for appropriate rendering and filtering */
  type?: 'text' | 'number' | 'date' | 'boolean' | 'currency' | 'custom';

  /** Enable/disable sorting for this column */
  sortable?: boolean;

  /** Enable/disable filtering for this column */
  filterable?: boolean;

  /** Fixed width (e.g., '100px', '10rem') */
  width?: string;

  /** Minimum width (e.g., '200px', '15rem') */
  minWidth?: string;

  /** Text alignment */
  align?: 'left' | 'center' | 'right';

  /** Column visibility */
  visible?: boolean;

  /** Include in export operations */
  exportable?: boolean;

  /** Custom template reference for cell content */
  template?: TemplateRef<any>;

  /** Filter type for column filtering */
  filterType?: 'text' | 'number' | 'date' | 'dropdown' | 'boolean';

  /** Options for dropdown filters */
  filterOptions?: { label: string; value: any }[];

  /** Format string for dates, numbers, etc. */
  format?: string;

  /** Angular pipe name to apply to cell content */
  pipe?: string;

  /** Arguments for the pipe */
  pipeArgs?: any[];

  /** CSS classes to apply to column cells */
  styleClass?: string;

  /** CSS classes to apply to column header */
  headerClass?: string;

  /** Tooltip text for column header */
  tooltip?: string;

  /** Whether column can be resized */
  resizable?: boolean;

  /** Whether column can be reordered */
  reorderable?: boolean;
}

/**
 * Complete table configuration interface
 */
export interface TableConfiguration {
  /** Column definitions */
  columns: TableColumn[];

  /** Enable row selection (checkboxes) */
  selectable?: boolean;

  /** Enable column resizing */
  resizable?: boolean;

  /** Enable column reordering */
  reorderable?: boolean;

  /** Enable export functionality */
  exportable?: boolean;

  /** Fields to include in global search */
  globalFilterFields?: string[];

  /** Sorting mode */
  sortMode?: 'single' | 'multiple';

  /** Default sort field */
  defaultSortField?: string;

  /** Default sort order (1 = asc, -1 = desc) */
  defaultSortOrder?: 1 | -1;

  /** Default page size */
  pageSize?: number;

  /** Available page size options */
  pageSizeOptions?: number[];

  /** Enable virtual scrolling for large datasets */
  virtualScrolling?: boolean;

  /** Field to use for trackBy function */
  trackByField?: string;

  /** Enable row hover effect */
  rowHover?: boolean;

  /** Enable striped rows */
  striped?: boolean;

  /** Table CSS classes */
  styleClass?: string;

  /** Enable responsive design */
  responsive?: boolean;

  /** Custom empty message */
  emptyMessage?: string;

  /** Loading message */
  loadingMessage?: string;

  /** Enable global filter */
  globalFilter?: boolean;

  /** Global filter placeholder text */
  globalFilterPlaceholder?: string;

  /** Table caption for accessibility */
  caption?: string;

  /** Auto-layout table columns */
  autoLayout?: boolean;
}

/**
 * Column state for saving user preferences
 */
export interface ColumnState {
  field: string;
  width?: string;
  order?: number;
  visible?: boolean;
  sortOrder?: number;
}

/**
 * Filter parameters for advanced filtering
 */
export interface FilterParams {
  globalFilter?: string;
  columnFilters?: { [key: string]: any };
  sortField?: string;
  sortOrder?: number;
}

/**
 * Bulk action definition
 */
export interface BulkAction {
  id: string;
  label: string;
  icon?: string;
  severity?: 'success' | 'info' | 'warning' | 'danger' | 'help' | 'primary' | 'secondary';
  confirmation?: {
    message: string;
    header?: string;
  };
  permission?: string;
  handler: (selectedItems: any[]) => void;
}

/**
 * Export configuration
 */
export interface ExportConfig {
  excel?: {
    enabled: boolean;
    filename?: string;
    sheetName?: string;
  };
  csv?: {
    enabled: boolean;
    filename?: string;
    separator?: string;
  };
  pdf?: {
    enabled: boolean;
    filename?: string;
  };
}