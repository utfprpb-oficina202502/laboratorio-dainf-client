/**
 * Tipo que representa os formatos de exportação disponíveis para relatórios.
 *
 * @example
 * const formato: FormatoRelatorio = 'PDF';
 * const formatoExcel: FormatoRelatorio = 'EXCEL';
 */
export type FormatoRelatorio = 'PDF' | 'EXCEL';

/**
 * Extensões de arquivo correspondentes a cada formato.
 */
export const FORMATO_EXTENSAO: Record<FormatoRelatorio, string> = {
  PDF: 'pdf',
  EXCEL: 'xlsx'
};

/**
 * MIME types correspondentes a cada formato.
 */
export const FORMATO_MIME_TYPE: Record<FormatoRelatorio, string> = {
  PDF: 'application/pdf',
  EXCEL: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
};
