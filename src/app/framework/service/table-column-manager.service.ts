import {Injectable, TemplateRef} from '@angular/core';
import {TableColumn} from '../model/table-config.interface';

/**
 * Serviço responsável pelo gerenciamento de operações de colunas de tabela.
 *
 * Funcionalidades:
 * - Gerenciamento de visibilidade de colunas
 * - Registro e recuperação de templates de colunas
 * - Filtragem de colunas (visíveis, ordenáveis, filtráveis, exportáveis)
 * - Atualização de colunas baseada em permissões
 * - Cálculo de largura de colunas
 * - Exibição responsiva de colunas
 *
 * Uso em componentes:
 * ```typescript
 * export class MyListComponent {
 *   private columnManager = inject(TableColumnManagerService);
 *
 *   ngOnInit(): void {
 *     // Inicializar toggle de colunas
 *     const toggleData = this.columnManager.initializeColumnToggle(this.columns);
 *     this.columnToggleOptions = toggleData.columnToggleOptions;
 *     this.columnToggleModel = toggleData.columnToggleModel;
 *
 *     // Atualizar colunas baseado em permissões
 *     this.columnManager.updateColumnsForPermissions(this.columns, this.isReadOnly);
 *   }
 * }
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class TableColumnManagerService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly columnTemplates = new Map<string, TemplateRef<any>>();

  /**
   * Inicializa opções e modelo de toggle de colunas
   *
   * @param columns Todas as colunas da tabela
   * @returns Objeto com arrays columnToggleOptions e columnToggleModel
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
   * Processa evento de mudança de toggle de colunas
   *
   * @param columns Todas as colunas da tabela (serão modificadas)
   * @param selectedFields Array com nomes dos campos de colunas selecionadas
   * @returns columnToggleModel atualizado
   */
  handleColumnToggleChange(columns: TableColumn[], selectedFields: string[]): string[] {
    if (!columns) {
      return selectedFields;
    }

    // Garante que pelo menos uma coluna esteja visível
    if (!selectedFields || selectedFields.length === 0) {
      const fallback = columns.find(col => col.toggleable !== false && col.field !== 'actions');
      if (fallback) {
        selectedFields = [fallback.field];
      }
    }

    // Atualiza visibilidade das colunas
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
   * Atualiza colunas baseado nas permissões do usuário
   *
   * @param columns Todas as colunas da tabela (serão modificadas)
   * @param isReadOnly Se a tabela está em modo somente leitura
   */
  updateColumnsForPermissions(columns: TableColumn[], isReadOnly: boolean): void {
    if (!columns) {
      return;
    }

    const actionsColumn = columns.find(col => col.field === 'actions');
    if (actionsColumn) {
      // Força visibilidade baseada em permissões, sobrescrevendo qualquer estado restaurado
      // Admin e Laboratorista devem sempre ver a coluna de ações
      actionsColumn.visible = !isReadOnly;
    }
  }

  /**
   * Constrói array de colunas exibidas para comportamento responsivo
   *
   * @param columnsTable Colunas base para exibir
   * @param enableResponsive Se o comportamento responsivo está habilitado
   * @param windowWidth Largura atual da janela
   * @param breakpoint Breakpoint de largura para ocultar coluna de ações (padrão: 1024px)
   * @returns Array com nomes dos campos das colunas a exibir
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
      // Oculta coluna de ações em telas pequenas
      responsiveColumns = responsiveColumns.filter(column => column !== 'actions');
    } else if (!responsiveColumns.includes('actions') && columnsTable.includes('actions')) {
      // Mostra coluna de ações em telas grandes
      responsiveColumns = [...responsiveColumns, 'actions'];
    }

    return responsiveColumns;
  }

  /**
   * Atualiza colunas exibidas baseado nas colunas visíveis
   *
   * @param columns Todas as colunas da tabela
   * @returns Array com nomes dos campos das colunas visíveis
   */
  getDisplayedColumnsFromConfig(columns: TableColumn[]): string[] {
    if (!columns) {
      return [];
    }

    const visibleColumns = columns.filter(col => col.visible !== false);
    return visibleColumns.map(col => col.field);
  }

  /**
   * Inicializa campos de filtro global a partir das colunas
   *
   * @param columns Todas as colunas da tabela
   * @returns Array com nomes dos campos que devem ser filtráveis globalmente
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
   * Registra um template para uma coluna específica
   *
   * @param field Nome do campo da coluna
   * @param template Referência do template a registrar
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  registerColumnTemplate(field: string, template: TemplateRef<any>): void {
    this.columnTemplates.set(field, template);
  }

  /**
   * Obtém o template registrado para uma coluna
   *
   * @param field Nome do campo da coluna
   * @returns Referência do template ou undefined
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getColumnTemplate(field: string): TemplateRef<any> | undefined {
    return this.columnTemplates.get(field);
  }

  /**
   * Limpa todos os templates de colunas registrados
   */
  clearColumnTemplates(): void {
    this.columnTemplates.clear();
  }

  /**
   * Obtém as colunas visíveis
   *
   * @param columns Todas as colunas da tabela
   * @returns Array com as colunas visíveis
   */
  getVisibleColumns(columns: TableColumn[]): TableColumn[] {
    return columns.filter(col => col.visible !== false);
  }

  /**
   * Obtém as colunas ordenáveis
   *
   * @param columns Todas as colunas da tabela
   * @returns Array com as colunas ordenáveis
   */
  getSortableColumns(columns: TableColumn[]): TableColumn[] {
    return columns.filter(col => col.sortable !== false);
  }

  /**
   * Obtém as colunas filtráveis
   *
   * @param columns Todas as colunas da tabela
   * @returns Array com as colunas filtráveis
   */
  getFilterableColumns(columns: TableColumn[]): TableColumn[] {
    return columns.filter(col => col.filterable === true);
  }

  /**
   * Obtém as colunas exportáveis
   *
   * @param columns Todas as colunas da tabela
   * @returns Array com as colunas exportáveis
   */
  getExportableColumns(columns: TableColumn[]): TableColumn[] {
    return columns.filter(col => col.exportable !== false);
  }

  /**
   * Calcula o total de colunas incluindo colunas especiais
   *
   * @param visibleColumnsCount Número de colunas de dados visíveis
   * @param expandable Se a tabela tem linhas expansíveis
   * @param selectable Se a tabela tem coluna de seleção
   * @param isReadOnly Se a tabela está em modo somente leitura
   * @returns Contagem total de colunas
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
   * Obtém a largura da coluna com dimensionamento automático baseado no tipo
   *
   * @param column Configuração da coluna
   * @returns Largura da coluna como string CSS ou undefined
   */
  getColumnWidth(column: TableColumn): string | undefined {
    if (column.width) {
      return column.width;
    }

    // Dimensionamento automático baseado no tipo da coluna
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
   * Verifica se a coluna de ações deve ser exibida
   *
   * @param displayedColumns Array com campos de colunas atualmente exibidas
   * @param isReadOnly Se a tabela está em modo somente leitura
   * @returns true se a coluna de ações deve ser exibida
   */
  shouldShowActionsColumn(displayedColumns: string[], isReadOnly: boolean): boolean {
    return displayedColumns.includes('actions') && !isReadOnly;
  }
}
