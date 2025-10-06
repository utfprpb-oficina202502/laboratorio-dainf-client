import {inject, Injectable} from '@angular/core';
import {MessageService} from 'primeng/api';
import {Table} from 'primeng/table';
import {LoggerService} from './logger.service';
import {TableColumn} from '../model/table-config.interface';

/**
 * Service responsible for exporting table data to Excel and CSV formats.
 *
 * Features:
 * - Lazy-loads ExcelJS only when Excel export is triggered (saves ~947KB from initial bundle)
 * - Handles nested object field access (e.g., 'grupo.descricao')
 * - Auto-fits Excel column widths
 * - Supports custom column types with smart display value extraction
 * - Provides user feedback via MessageService
 */
@Injectable({
  providedIn: 'root'
})
export class TableExportService {
  private readonly messageService = inject(MessageService);
  private readonly logger = inject(LoggerService);

  /**
   * Export data to Excel format (.xlsx)
   * ExcelJS is lazy-loaded to avoid bloating initial bundle
   *
   * @param data Array of objects to export
   * @param columns Table columns configuration
   * @param fileName Base file name (without extension)
   */
  exportToExcel<T>(data: T[], columns: TableColumn[], fileName = 'dados'): void {
    if (!data || data.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Aviso',
        detail: 'Não há dados para exportar'
      });
      return;
    }

    // Show info message that export is being prepared
    this.messageService.add({
      severity: 'info',
      summary: 'Preparando exportação',
      detail: 'O arquivo Excel será baixado em breve...'
    });

    // Lazy-load ExcelJS only when export is triggered
    import('exceljs').then(async (ExcelJS) => {
      const exportData = this.prepareExportData(data, columns);
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Dados');

      // Add headers from first data object
      if (exportData.length > 0) {
        const headers = Object.keys(exportData[0]);
        worksheet.addRow(headers);

        // Add data rows
        exportData.forEach((row: Record<string, unknown>) => {
          worksheet.addRow(Object.values(row));
        });

        // Auto-fit columns
        worksheet.columns.forEach((column: unknown) => {
          let maxLength = 0;
          (column as {
            eachCell: (options: {
              includeEmpty: boolean
            }, callback: (cell: unknown) => void) => void;
            width?: number
          })
          .eachCell({includeEmpty: true}, (cell: unknown) => {
            const cellValue = (cell as { value?: unknown }).value;
            // Handle different cell value types for proper length calculation
            let columnLength = 10; // Default length
            if (cellValue !== null && cellValue !== undefined) {
              if (typeof cellValue === 'string' || typeof cellValue === 'number' || typeof cellValue === 'boolean') {
                columnLength = String(cellValue).length;
              } else if (typeof cellValue === 'object') {
                // For objects, use JSON stringification length (they shouldn't appear in export data)
                columnLength = JSON.stringify(cellValue).length;
              }
            }
            if (columnLength > maxLength) {
              maxLength = columnLength;
            }
          });
          (column as { width?: number }).width = Math.min(maxLength + 2, 50);
        });
      }

      // Generate buffer and download
      const buffer = await workbook.xlsx.writeBuffer();
      this.saveAsExcelFile(buffer, fileName);
    }).catch(error => {
      this.logger.error('Error exporting to Excel', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'Erro ao exportar dados para Excel'
      });
    });
  }

  /**
   * Export data to CSV format using PrimeNG's native CSV export
   *
   * @param table PrimeNG Table instance
   * @param data Array of objects to export
   * @param columns Table columns configuration
   */
  exportToCSV<T>(
    table: Table | null | undefined,
    data: T[],
    columns: TableColumn[]
  ): void {
    if (!table) {
      this.logger.warn('TableExportService: exportCSV called without table reference.');
      this.messageService.add({
        severity: 'warn',
        summary: 'Aviso',
        detail: 'Tabela não encontrada para exportação CSV'
      });
      return;
    }

    if (!data || data.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Aviso',
        detail: 'Não há dados para exportar'
      });
      return;
    }

    try {
      const exportableColumns = this.getExportableColumns(columns);
      if (!exportableColumns || exportableColumns.length === 0) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Aviso',
          detail: 'Nenhuma coluna disponível para exportação'
        });
        return;
      }

      // Set the columns property that PrimeNG exportCSV expects
      (table as unknown as { columns: unknown[] }).columns = exportableColumns.map(column => ({
        field: column.field,
        header: column.header
      }));

      // Show info message that export is being prepared
      this.messageService.add({
        severity: 'info',
        summary: 'Preparando exportação',
        detail: 'O arquivo CSV será baixado em breve...'
      });

      // Call the native PrimeNG exportCSV method
      table.exportCSV();

    } catch (error) {
      this.logger.error('Error exporting CSV', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'Erro ao exportar dados para CSV'
      });
    }
  }

  /**
   * Prepare data for export by extracting values from nested objects
   * and handling custom column types
   *
   * @param data Array of objects to export
   * @param columns Table columns configuration
   * @returns Array of flattened objects ready for export
   */
  private prepareExportData<T>(data: T[], columns: TableColumn[]): Record<string, unknown>[] {
    const exportableColumns = this.getExportableColumns(columns);

    return data.map(item => {
      const exportItem: Record<string, unknown> = {};

      exportableColumns.forEach(column => {
        const header = column.header || column.field;
        const value = this.getFieldValue(item, column.field);

        // Handle different column types for export
        if (column.type === 'custom' && value && typeof value === 'object') {
          // For custom columns with objects, try to get a display value
          if (Object.hasOwn(value, 'descricao')) {
            exportItem[header] = (value as Record<string, unknown>).descricao;
          } else if (Object.hasOwn(value, 'nome')) {
            exportItem[header] = (value as Record<string, unknown>).nome;
          } else if (Object.hasOwn(value, 'id')) {
            exportItem[header] = (value as Record<string, unknown>).id;
          } else {
            exportItem[header] = '';
          }
        } else {
          exportItem[header] = value ?? '';
        }
      });

      return exportItem;
    });
  }

  /**
   * Get nested field value from object using dot notation
   *
   * @param obj Object to extract value from
   * @param field Field path (e.g., 'grupo.descricao')
   * @returns Field value or undefined if not found
   */
  private getFieldValue(obj: unknown, field: string): unknown {
    if (!obj || !field) return undefined;

    // Handle nested properties (e.g., 'grupo.descricao')
    const parts = field.split('.');
    let value: unknown = obj;

    for (const part of parts) {
      if (value && typeof value === 'object' && Object.hasOwn(value, part)) {
        value = (value as Record<string, unknown>)[part];
      } else {
        return undefined;
      }
    }

    return value;
  }

  /**
   * Filter columns to get only exportable ones
   *
   * @param columns All table columns
   * @returns Columns that should be included in export
   */
  private getExportableColumns(columns: TableColumn[]): TableColumn[] {
    return columns.filter(col =>
      col.field !== 'actions' &&
      col.exportable !== false
    );
  }

  /**
   * Save Excel buffer as downloadable file
   *
   * @param buffer Excel file buffer
   * @param fileName Base file name (without extension)
   */
  private saveAsExcelFile(buffer: ArrayBuffer, fileName: string): void {
    try {
      // Use modern File System Access API with fallback
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = globalThis.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName}_export_${Date.now()}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      globalThis.URL.revokeObjectURL(url);
    } catch (error) {
      this.logger.error('Error saving Excel file', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'Erro ao salvar arquivo Excel'
      });
    }
  }
}
