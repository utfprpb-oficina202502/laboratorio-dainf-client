import {inject, Injectable} from '@angular/core';
import {MessageService} from 'primeng/api';
import {Table} from 'primeng/table';
import {LoggerService} from './logger.service';
import {TableColumn} from '../model/table-config.interface';
import type {ColumnSchema} from 'write-excel-file';
import writeXlsxFile from 'write-excel-file';

/**
 * Tipo para valores de célula suportados pelo Excel
 */
type ExcelCellValue = string | number | boolean | Date | null;

/**
 * Serviço responsável pela exportação de dados de tabela para formatos Excel e CSV.
 *
 * Funcionalidades:
 * - Usa write-excel-file para geração de Excel (compatível com CSP restritivo)
 * - Manipula acesso a campos de objetos aninhados (ex: 'grupo.descricao')
 * - Respeita colunas visíveis selecionadas pelo usuário (columnToggleModel)
 * - Suporta tipos de coluna personalizados com extração inteligente de valores de exibição
 * - Fornece feedback ao usuário via MessageService
 *
 * Uso em componentes:
 * ```typescript
 * export class MyListComponent {
 *   private exportService = inject(TableExportService);
 *
 *   exportExcel(): void {
 *     // Exporta apenas colunas visíveis (respeitando columnToggleModel)
 *     this.exportService.exportToExcel(this.items, this.columns, 'meus-dados', this.columnToggleModel);
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
   * Usa write-excel-file que é compatível com CSP restritivo (não usa eval)
   *
   * @param data Array de objetos a exportar
   * @param columns Configuração das colunas da tabela
   * @param fileName Nome base do arquivo (sem extensão)
   * @param visibleColumns Array opcional de campos visíveis (columnToggleModel) - se fornecido, apenas estas colunas serão exportadas
   */
  exportToExcel<T>(data: T[], columns: TableColumn[], fileName = 'dados', visibleColumns?: string[]): void {
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

    // Filtra e prepara colunas para exportação
    const exportableColumns = this.getExportableColumns(columns, visibleColumns);

    if (exportableColumns.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Aviso',
        detail: 'Nenhuma coluna disponível para exportação'
      });
      return;
    }

    // Cria schema para write-excel-file baseado nas colunas
    const schema = this.buildExcelSchema<T>(exportableColumns);

    // Gera e baixa arquivo Excel
    // Usa type assertion para resolver ambiguidade de overloads do TypeScript
    (writeXlsxFile as <ObjectType>(
      objects: ObjectType[],
      options: {
        schema: ColumnSchema<ObjectType, NonNullable<ExcelCellValue>>[];
        fileName: string;
        sheet?: string;
        headerStyle?: { fontWeight?: 'bold'; backgroundColor?: string };
      }
    ) => Promise<void>)(data, {
      schema,
      fileName: `${fileName}_export_${Date.now()}.xlsx`,
      sheet: 'Dados',
      headerStyle: {
        fontWeight: 'bold',
        backgroundColor: '#f5f5f5'
      }
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
   * Constrói o schema do write-excel-file baseado nas colunas da tabela
   *
   * @param columns Colunas a incluir na exportação
   * @returns Schema compatível com write-excel-file
   */
  private buildExcelSchema<T>(columns: TableColumn[]): ColumnSchema<T, NonNullable<ExcelCellValue>>[] {
    return columns.map(column => {
      const schemaColumn: ColumnSchema<T, NonNullable<ExcelCellValue>> = {
        column: column.header || column.field,
        width: this.calculateColumnWidth(column),
        value: (item: T) => this.extractCellValue(item, column)
      };

      // Define tipo baseado na configuração da coluna
      const columnType = this.mapColumnType(column.type);
      if (columnType) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (schemaColumn as any).type = columnType;
      }

      return schemaColumn;
    });
  }

  /**
   * Extrai valor da célula para exportação
   * Manipula objetos aninhados e tipos personalizados
   *
   * @param item Objeto de dados
   * @param column Configuração da coluna
   * @returns Valor formatado para a célula
   */
  private extractCellValue<T>(item: T, column: TableColumn): ExcelCellValue {
    const value = this.getFieldValue(item, column.field);

    if (value === null || value === undefined) {
      return null;
    }

    // Objetos (exceto Date) são tratados por método auxiliar
    if (typeof value === 'object' && !(value instanceof Date)) {
      return this.extractObjectDisplayValue(value as Record<string, unknown>);
    }

    // Converte baseado no tipo da coluna
    return this.convertValueByColumnType(value, column.type);
  }

  /**
   * Extrai valor de exibição de um objeto
   * Procura por propriedades comuns: descricao, nome, id
   *
   * @param obj Objeto a extrair valor
   * @returns String do valor encontrado ou vazio
   */
  private extractObjectDisplayValue(obj: Record<string, unknown>): string {
    const displayProps = ['descricao', 'nome', 'id'];

    for (const prop of displayProps) {
      if (Object.hasOwn(obj, prop)) {
        return this.safeStringify(obj[prop]);
      }
    }

    return '';
  }

  /**
   * Converte valor para o tipo apropriado baseado no tipo da coluna
   *
   * @param value Valor a converter
   * @param columnType Tipo da coluna
   * @returns Valor convertido
   */
  private convertValueByColumnType(value: unknown, columnType?: string): ExcelCellValue {
    switch (columnType) {
      case 'date':
        return this.convertToDate(value);
      case 'number':
      case 'currency':
        return typeof value === 'number' ? value : Number(value);
      case 'boolean':
        return Boolean(value);
      default:
        return this.safeStringify(value);
    }
  }

  /**
   * Converte valor para Date se possível
   *
   * @param value Valor a converter
   * @returns Date ou string se inválido
   */
  private convertToDate(value: unknown): Date | string {
    if (typeof value === 'string') {
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? value : date;
    }
    return this.safeStringify(value);
  }

  /**
   * Converte qualquer valor para string de forma segura
   * Evita [object Object] usando JSON.stringify para objetos
   *
   * @param value Valor a converter
   * @returns Representação string do valor
   */
  private safeStringify(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  }

  /**
   * Mapeia tipo de coluna da tabela para tipo do write-excel-file
   *
   * @param columnType Tipo da coluna na configuração
   * @returns Construtor de tipo ou undefined para string padrão
   */
  private mapColumnType(columnType?: string): typeof String | typeof Number | typeof Boolean | typeof Date | undefined {
    switch (columnType) {
      case 'number':
      case 'currency':
        return Number;
      case 'boolean':
        return Boolean;
      case 'date':
        return Date;
      default:
        return String;
    }
  }

  /**
   * Calcula largura apropriada para a coluna no Excel
   *
   * @param column Configuração da coluna
   * @returns Largura em caracteres
   */
  private calculateColumnWidth(column: TableColumn): number {
    // Usa header como base para largura mínima
    const headerLength = (column.header || column.field).length;
    // Largura mínima de 10, máxima de 50
    return Math.max(10, Math.min(headerLength + 4, 50));
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
   * Respeita a seleção de colunas visíveis do usuário (columnToggleModel)
   *
   * @param columns Todas as colunas da tabela
   * @param visibleColumns Array opcional de campos visíveis - se fornecido, apenas estas colunas serão incluídas
   * @returns Colunas que devem ser incluídas na exportação
   */
  private getExportableColumns(columns: TableColumn[], visibleColumns?: string[]): TableColumn[] {
    return columns.filter(col => {
      // Exclui coluna de ações
      if (col.field === 'actions') {
        return false;
      }

      // Exclui colunas marcadas como não exportáveis
      if (col.exportable === false) {
        return false;
      }

      // Se visibleColumns foi fornecido, filtra apenas colunas visíveis
      if (visibleColumns && visibleColumns.length > 0) {
        return visibleColumns.includes(col.field);
      }

      return true;
    });
  }

}
