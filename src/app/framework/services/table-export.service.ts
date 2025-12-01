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
   * Exporta dados para formato CSV com suporte a exportValueGetter customizado
   * Não usa exportação nativa do PrimeNG para garantir formatação correta de valores
   *
   * @param table Instância da Table do PrimeNG (usado apenas para referência, pode ser null)
   * @param data Array de objetos a exportar
   * @param columns Configuração das colunas da tabela
   * @param fileName Nome base do arquivo (sem extensão)
   */
  exportToCSV<T>(
    _table: Table | null | undefined,
    data: T[],
    columns: TableColumn[],
    fileName = 'dados'
  ): void {
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

      // Exibe mensagem informativa que exportação está sendo preparada
      this.messageService.add({
        severity: 'info',
        summary: 'Preparando exportação',
        detail: 'O arquivo CSV será baixado em breve...'
      });

      // Gera conteúdo CSV manualmente para respeitar exportValueGetter
      const csvContent = this.generateCSVContent(data, exportableColumns);

      // Cria e baixa arquivo CSV
      this.downloadCSV(csvContent, `${fileName}_export_${Date.now()}.csv`);

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
   * Gera conteúdo CSV a partir dos dados e colunas
   * Respeita exportValueGetter para formatação customizada de valores
   *
   * @param data Array de objetos a exportar
   * @param columns Colunas exportáveis
   * @returns String com conteúdo CSV
   */
  private generateCSVContent<T>(data: T[], columns: TableColumn[]): string {
    const separator = ',';
    const lineBreak = '\r\n';

    // Cabeçalho
    const headers = columns.map(col => this.escapeCSVValue(col.header || col.field));
    const headerLine = headers.join(separator);

    // Linhas de dados
    const dataLines = data.map(item => {
      const values = columns.map(col => {
        const cellValue = this.extractCellValue(item, col);
        return this.escapeCSVValue(cellValue);
      });
      return values.join(separator);
    });

    return headerLine + lineBreak + dataLines.join(lineBreak);
  }

  /**
   * Escapa valor para formato CSV
   * Adiciona aspas se necessário e escapa aspas internas
   *
   * @param value Valor a escapar
   * @returns Valor formatado para CSV
   */
  private escapeCSVValue(value: ExcelCellValue): string {
    if (value === null || value === undefined) {
      return '';
    }

    let stringValue: string;
    if (value instanceof Date) {
      stringValue = value.toLocaleDateString('pt-BR');
    } else {
      stringValue = String(value);
    }

    // Se contém separador (vírgula), quebra de linha ou aspas, precisa escapar
    if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
      // Escapa aspas duplicando-as e envolve em aspas
      return '"' + stringValue.replaceAll('"', '""') + '"';
    }

    return stringValue;
  }

  /**
   * Cria e baixa arquivo CSV
   *
   * @param content Conteúdo CSV
   * @param fileName Nome do arquivo
   */
  private downloadCSV(content: string, fileName: string): void {
    // BOM para UTF-8 (garante encoding correto em Excel)
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + content], {type: 'text/csv;charset=utf-8;'});

    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
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

        // write-excel-file exige formato para células de data
        if (columnType === Date) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (schemaColumn as any).format = 'dd/mm/yyyy';
        }
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
    // Se a coluna tem exportValueGetter customizado, usa ele
    if (column.exportValueGetter) {
      const customValue = column.exportValueGetter(item);
      return customValue ?? null;
    }

    const value = this.getFieldValue(item, column.field);

    if (value === null || value === undefined) {
      return null;
    }

    // Arrays são formatados como lista separada por vírgula
    if (Array.isArray(value)) {
      return this.extractArrayDisplayValue(value);
    }

    // Objetos (exceto Date) são tratados por método auxiliar
    if (typeof value === 'object' && !(value instanceof Date)) {
      return this.extractObjectDisplayValue(value as Record<string, unknown>);
    }

    // Converte baseado no tipo da coluna
    return this.convertValueByColumnType(value, column.type);
  }

  /**
   * Extrai valor de exibição de um array
   * Formata como lista separada por ponto-e-vírgula: "valor1; valor2; valor3"
   * Usa ponto-e-vírgula para não conflitar com separador CSV (vírgula)
   *
   * @param arr Array a extrair valores
   * @returns String formatada com valores separados por ponto-e-vírgula
   */
  private extractArrayDisplayValue(arr: unknown[]): string {
    if (arr.length === 0) {
      return '';
    }

    const displayValues = arr.map(item => {
      if (item === null || item === undefined) {
        return '';
      }
      if (typeof item === 'object') {
        return this.extractObjectDisplayValue(item as Record<string, unknown>);
      }
      // Primitivos: string, number, boolean, bigint, symbol
      return this.safeStringify(item);
    }).filter(v => v !== '');

    return displayValues.join('; ');
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
   * @returns Date ou null se inválido
   */
  private convertToDate(value: unknown): Date | null {
    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? null : value;
    }
    if (typeof value === 'string' || typeof value === 'number') {
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? null : date;
    }
    return null;
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
