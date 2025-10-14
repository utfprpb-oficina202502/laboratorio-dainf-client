import {Injectable} from '@angular/core';

/**
 * Serviço responsável pelo gerenciamento de estado de expansão de linhas de tabela.
 *
 * Funcionalidades:
 * - Rastreamento de linhas expandidas por chave única
 * - Expandir/recolher linhas individuais
 * - Expandir/recolher todas as linhas
 * - Suporte para modos de expansão única e múltipla
 * - Identificação de linhas baseada em chave
 *
 * Uso em componentes:
 * ```typescript
 * export class MyListComponent {
 *   private expansionManager = inject(TableRowExpansionManagerService);
 *   expandedRows: Record<string, boolean> = {};
 *
 *   toggleRow(item: T): void {
 *     this.expandedRows = this.expansionManager.toggleRowExpansion(
 *       this.expandedRows,
 *       item.id,
 *       'multiple' // ou 'single'
 *     );
 *   }
 *
 *   expandAll(): void {
 *     this.expandedRows = this.expansionManager.expandAllRows(
 *       this.items,
 *       (row) => row.id
 *     );
 *   }
 * }
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class TableRowExpansionManagerService {
  /**
   * Verifica se uma linha está atualmente expandida
   *
   * @param expandedRows Estado atual de linhas expandidas
   * @param rowKey Chave única da linha
   * @returns true se a linha estiver expandida
   */
  isRowExpanded(expandedRows: Record<string, boolean> | undefined, rowKey: string | null): boolean {
    if (!rowKey) {
      return false;
    }
    return !!expandedRows?.[rowKey];
  }

  /**
   * Alterna o estado de expansão de uma linha
   *
   * @param expandedRows Estado atual de linhas expandidas
   * @param rowKey Chave única da linha
   * @param expandMode Modo de expansão ('single' para única ou 'multiple' para múltiplas)
   * @returns Estado atualizado de linhas expandidas
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
      // Modo único: apenas uma linha pode estar expandida por vez
      return isCurrentlyExpanded ? {} : {[rowKey]: true};
    } else {
      // Modo múltiplo: alterna esta linha mantendo as outras
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
   * Expande uma única linha
   *
   * @param expandedRows Estado atual de linhas expandidas
   * @param rowKey Chave única da linha
   * @param expandMode Modo de expansão ('single' para única ou 'multiple' para múltiplas)
   * @returns Estado atualizado de linhas expandidas
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
      // Modo único: limpa outras e expande apenas esta
      return {[rowKey]: true};
    } else {
      // Modo múltiplo: adiciona às existentes
      return {...(expandedRows), [rowKey]: true};
    }
  }

  /**
   * Recolhe uma única linha
   *
   * @param expandedRows Estado atual de linhas expandidas
   * @param rowKey Chave única da linha
   * @returns Estado atualizado de linhas expandidas
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
   * Expande todas as linhas
   *
   * @param rows Array com todas as linhas
   * @param getRowKey Função para extrair chave única da linha
   * @returns Estado de linhas expandidas com todas as linhas expandidas
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
   * Recolhe todas as linhas
   *
   * @returns Estado vazio de linhas expandidas
   */
  collapseAllRows(): Record<string, boolean> {
    return {};
  }

  /**
   * Obtém a contagem de linhas atualmente expandidas
   *
   * @param expandedRows Estado atual de linhas expandidas
   * @returns Número de linhas expandidas
   */
  getExpandedCount(expandedRows: Record<string, boolean> | undefined): number {
    if (!expandedRows) {
      return 0;
    }
    return Object.keys(expandedRows).filter(key => expandedRows[key]).length;
  }

  /**
   * Verifica se há linhas expandidas
   *
   * @param expandedRows Estado atual de linhas expandidas
   * @returns true se pelo menos uma linha estiver expandida
   */
  hasExpandedRows(expandedRows: Record<string, boolean> | undefined): boolean {
    return this.getExpandedCount(expandedRows) > 0;
  }

  /**
   * Obtém array com as chaves das linhas expandidas
   *
   * @param expandedRows Estado atual de linhas expandidas
   * @returns Array com as chaves das linhas expandidas
   */
  getExpandedKeys(expandedRows: Record<string, boolean> | undefined): string[] {
    if (!expandedRows) {
      return [];
    }
    return Object.keys(expandedRows).filter(key => expandedRows[key]);
  }
}
