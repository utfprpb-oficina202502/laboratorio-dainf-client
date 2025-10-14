import {inject, Injectable} from '@angular/core';
import {MessageService} from 'primeng/api';
import {Table} from 'primeng/table';
import {LoggerService} from './logger.service';
import {TableColumn} from '../model/table-config.interface';

/**
 * Serviço responsável pela exportação de dados de tabela para formatos Excel e CSV.
 *
 * Funcionalidades:
 * - Carregamento lazy do ExcelJS apenas quando exportação Excel é disparada (economiza ~947KB do bundle inicial)
 * - Manipula acesso a campos de objetos aninhados (ex: 'grupo.descricao')
 * - Ajusta automaticamente larguras das colunas no Excel
 * - Suporta tipos de coluna personalizados com extração inteligente de valores de exibição
 * - Fornece feedback ao usuário via MessageService
 *
 * Uso em componentes:
 * ```typescript
 * export class MyListComponent {
 *   private exportService = inject(TableExportService);
 *
 *   exportExcel(): void {
 *     this.exportService.exportToExcel(this.items, this.columns, 'meus-dados');
 *   }
 *
 *   exportCSV(): void {
 *     this.exportService.exportToCSV(this.dataTable, this.items, this.columns);
 *   }
 * }
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class TableExportService {
  private readonly messageService = inject(MessageService);
  private readonly logger = inject(LoggerService);

  /**
   * Exporta dados para formato Excel (.xlsx)
   * ExcelJS é carregado de forma lazy para evitar aumentar bundle inicial
   *
   * @param data Array de objetos a exportar
   * @param columns Configuração das colunas da tabela
   * @param fileName Nome base do arquivo (sem extensão)
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

    // Exibe mensagem informativa que exportação está sendo preparada
    this.messageService.add({
      severity: 'info',
      summary: 'Preparando exportação',
      detail: 'O arquivo Excel será baixado em breve...'
    });

    // Carrega ExcelJS de forma lazy apenas quando exportação é disparada
    import('exceljs').then(async (ExcelJS) => {
      const exportData = this.prepareExportData(data, columns);
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Dados');

      // Adiciona cabeçalhos do primeiro objeto de dados
      if (exportData.length > 0) {
        const headers = Object.keys(exportData[0]);
        worksheet.addRow(headers);

        // Adiciona linhas de dados
        exportData.forEach((row: Record<string, unknown>) => {
          worksheet.addRow(Object.values(row));
        });

        // Ajusta largura das colunas automaticamente
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
            // Manipula diferentes tipos de valores de célula para cálculo correto de comprimento
            let columnLength = 10; // Comprimento padrão
            if (cellValue !== null && cellValue !== undefined) {
              if (typeof cellValue === 'string' || typeof cellValue === 'number' || typeof cellValue === 'boolean') {
                columnLength = String(cellValue).length;
              } else if (typeof cellValue === 'object') {
                // Para objetos, usa comprimento da string JSON (não deveriam aparecer nos dados de exportação)
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

      // Gera buffer e faz download
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
   * Exporta dados para formato CSV usando exportação CSV nativa do PrimeNG
   *
   * @param table Instância da Table do PrimeNG
   * @param data Array de objetos a exportar
   * @param columns Configuração das colunas da tabela
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

      // Define propriedade columns que exportCSV do PrimeNG espera
      (table as unknown as { columns: unknown[] }).columns = exportableColumns.map(column => ({
        field: column.field,
        header: column.header
      }));

      // Exibe mensagem informativa que exportação está sendo preparada
      this.messageService.add({
        severity: 'info',
        summary: 'Preparando exportação',
        detail: 'O arquivo CSV será baixado em breve...'
      });

      // Chama método nativo exportCSV do PrimeNG
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
   * Prepara dados para exportação extraindo valores de objetos aninhados
   * e manipulando tipos de coluna personalizados
   *
   * @param data Array de objetos a exportar
   * @param columns Configuração das colunas da tabela
   * @returns Array de objetos achatados prontos para exportação
   */
  private prepareExportData<T>(data: T[], columns: TableColumn[]): Record<string, unknown>[] {
    const exportableColumns = this.getExportableColumns(columns);

    return data.map(item => {
      const exportItem: Record<string, unknown> = {};

      exportableColumns.forEach(column => {
        const header = column.header || column.field;
        const value = this.getFieldValue(item, column.field);

        // Manipula diferentes tipos de coluna para exportação
        if (column.type === 'custom' && value && typeof value === 'object') {
          // Para colunas personalizadas com objetos, tenta obter um valor de exibição
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
   * Obtém valor de campo aninhado de objeto usando notação de ponto
   *
   * @param obj Objeto para extrair valor
   * @param field Caminho do campo (ex: 'grupo.descricao')
   * @returns Valor do campo ou undefined se não encontrado
   */
  private getFieldValue(obj: unknown, field: string): unknown {
    if (!obj || !field) return undefined;

    // Manipula propriedades aninhadas (ex: 'grupo.descricao')
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
   * Filtra colunas para obter apenas as exportáveis
   *
   * @param columns Todas as colunas da tabela
   * @returns Colunas que devem ser incluídas na exportação
   */
  private getExportableColumns(columns: TableColumn[]): TableColumn[] {
    return columns.filter(col =>
      col.field !== 'actions' &&
      col.exportable !== false
    );
  }

  /**
   * Salva buffer Excel como arquivo para download
   *
   * @param buffer Buffer do arquivo Excel
   * @param fileName Nome base do arquivo (sem extensão)
   */
  private saveAsExcelFile(buffer: ArrayBuffer, fileName: string): void {
    try {
      // Usa API moderna de File System Access com fallback
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
