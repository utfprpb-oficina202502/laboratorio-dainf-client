/**
 * Application-wide constants
 * Centralized location for magic numbers and configuration values
 */

/**
 * UI Layer Z-Index Constants
 * Defines the stacking order of overlays and dialogs
 */
export const Z_INDEX = {
  /** Base z-index for toast notifications */
  TOAST: 999,
  /** Base z-index for modal dialogs and overlays */
  DIALOG: 10000,
  /** Base z-index for loading overlay (highest priority) */
  LOADER: 9999,
} as const;

/**
 * Table Pagination Constants
 * Default values for PrimeNG table pagination
 */
export const PAGINATION = {
  /** Default number of rows per page */
  DEFAULT_ROWS: 10,
  /** Available rows per page options */
  ROWS_PER_PAGE_OPTIONS: [5, 10, 25, 50, 100],
} as const;

/**
 * Table State Version Constants
 * Used for localStorage state management
 * Increment version number when table structure changes to clear old state
 */
export const TABLE_STATE_VERSION = {
  /** Current state version for all tables */
  CURRENT: 'v2',
} as const;

/**
 * Chart Configuration Constants
 * Default values for amCharts configuration
 */
export const CHART = {
  /** Default font size for chart labels */
  LABEL_FONT_SIZE: 13,
  /** Default chart height in pixels */
  DEFAULT_HEIGHT: 450,
} as const;

/**
 * Dialog Size Classes
 * Standardized dialog width classes (defined in styles.css)
 */
export const DIALOG_SIZE = {
  /** Small dialog - 400px (filters, confirmations) */
  SMALL: 'dialog-sm',
  /** Small fixed dialog - 400px exact */
  SMALL_FIXED: 'dialog-sm-fixed',
  /** Medium dialog - 500px max (forms, data entry) */
  MEDIUM: 'dialog-md',
  /** Medium-large dialog - 650px */
  MEDIUM_LARGE: 'dialog-md-lg',
  /** Large dialog - 800px max (complex forms) */
  LARGE: 'dialog-lg',
  /** Extra large dialog - 80% width (previews) */
  EXTRA_LARGE: 'dialog-xl',
} as const;

/**
 * Table Column Width Classes
 * Standardized column width utilities (defined in styles.css)
 */
export const COLUMN_WIDTH = {
  /** Checkbox/expand columns */
  XS: 'w-3rem',
  /** Very small columns */
  SM: 'w-6rem',
  /** ID/code columns */
  MD: 'w-8rem',
  /** Small action/status columns */
  LG: 'w-10rem',
  /** Medium columns */
  XL: 'w-12rem',
  /** Medium-large columns */
  XXL: 'w-14rem',
  /** Large columns */
  XXXL: 'w-16rem',
} as const;

/**
 * API Timeout Constants
 * HTTP request timeout values in milliseconds
 */
export const TIMEOUT = {
  /** Default API request timeout (2 minutes) */
  DEFAULT: 120000,
  /** Short timeout for quick operations (30 seconds) */
  SHORT: 30000,
  /** Long timeout for file uploads (5 minutes) */
  LONG: 300000,
} as const;

/**
 * Date Format Constants
 * Standardized date format strings for the application
 */
export const DATE_FORMAT = {
  /** Display format for dates (dd/MM/yyyy) */
  DISPLAY: 'dd/MM/yyyy',
  /** Display format for date-time (dd/MM/yyyy HH:mm) */
  DISPLAY_DATETIME: 'dd/MM/yyyy HH:mm',
  /** ISO format for API (yyyy-MM-dd) */
  ISO: 'yyyy-MM-dd',
  /** ISO format for date-time API (yyyy-MM-ddTHH:mm:ss) */
  ISO_DATETIME: 'yyyy-MM-ddTHH:mm:ss',
} as const;

/**
 * File Upload Constants
 * Maximum file sizes and allowed types
 */
export const FILE_UPLOAD = {
  /** Maximum file size in bytes (5MB) */
  MAX_SIZE: 5 * 1024 * 1024,
  /** Allowed image types */
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  /** Allowed document types */
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
} as const;

/**
 * Animation Duration Constants
 * Standard durations for UI animations in milliseconds
 */
export const ANIMATION = {
  /** Fast animation (150ms) */
  FAST: 150,
  /** Normal animation (300ms) */
  NORMAL: 300,
  /** Slow animation (500ms) */
  SLOW: 500,
} as const;

/**
 * Breakpoint Constants
 * Media query breakpoints (matching Tailwind defaults)
 */
export const BREAKPOINT = {
  /** Small devices (640px) */
  SM: 640,
  /** Medium devices (768px) */
  MD: 768,
  /** Large devices (1024px) */
  LG: 1024,
  /** Extra large devices (1280px) */
  XL: 1280,
  /** 2X large devices (1536px) */
  XXL: 1536,
} as const;

/**
 * Sort Order Constants
 * Valores de direção de ordenação compatíveis com PrimeNG
 *
 * @example
 * // Uso em componentes de lista
 * this.sortOrder = SORT_ORDER.ASC;
 *
 * // Verificação de direção
 * const direction = this.sortOrder === SORT_ORDER.ASC ? 'asc' : 'desc';
 */
export const SORT_ORDER = {
  /** Ordenação ascendente (A-Z, 0-9, mais antigo primeiro) */
  ASC: 1,
  /** Ordenação descendente (Z-A, 9-0, mais recente primeiro) */
  DESC: -1,
} as const;

/** Tipo para valores de ordenação */
export type SortOrderType = typeof SORT_ORDER[keyof typeof SORT_ORDER];
