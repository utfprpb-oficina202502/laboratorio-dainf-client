import {Item} from '../../item/item';

/**
 * Utilitário para cálculos relacionados à disponibilidade de itens.
 *
 * Centraliza a lógica de disponibilidade para evitar duplicação
 * entre componentes (Catálogo, Árvore, Formulário de Item).
 *
 * @example
 * ```typescript
 * import {ItemAvailabilityUtil} from './item-availability.util';
 *
 * const disponivel = ItemAvailabilityUtil.getDisponibilidade(item);
 * const severity = ItemAvailabilityUtil.getAvailabilitySeverity(item);
 * ```
 */
export class ItemAvailabilityUtil {
  /**
   * Retorna a quantidade disponível para empréstimo de um item.
   *
   * Prioriza `disponivelEmprestimoCalculado` (calculado pelo backend),
   * fallback para `saldo`, ou 0 se nenhum estiver disponível.
   *
   * @param item Item para verificar disponibilidade
   * @returns Quantidade disponível para empréstimo
   */
  static getDisponibilidade(item: Item | null | undefined): number {
    if (!item) return 0;
    return item.disponivelEmprestimoCalculado ?? item.saldo ?? 0;
  }

  /**
   * Retorna a severity do badge de disponibilidade para PrimeNG.
   *
   * - `danger`: Sem disponibilidade (0)
   * - `warn`: Baixa disponibilidade (1-2)
   * - `success`: Disponibilidade normal (3+)
   *
   * @param item Item para verificar
   * @returns Severity para p-tag do PrimeNG
   */
  static getAvailabilitySeverity(item: Item | null | undefined): 'danger' | 'warn' | 'success' {
    const disponivel = this.getDisponibilidade(item);
    if (disponivel === 0) return 'danger';
    if (disponivel <= 2) return 'warn';
    return 'success';
  }

  /**
   * Calcula o máximo que pode ser adicionado ao carrinho.
   *
   * @param item Item para verificar
   * @param inCartQuantity Quantidade já no carrinho
   * @returns Quantidade máxima que pode ser adicionada
   */
  static getMaxToAdd(item: Item | null | undefined, inCartQuantity: number): number {
    const disponivel = this.getDisponibilidade(item);
    return Math.max(0, disponivel - inCartQuantity);
  }

  /**
   * Verifica se há disponibilidade para adicionar ao carrinho.
   *
   * @param item Item para verificar
   * @param inCartQuantity Quantidade já no carrinho
   * @returns true se há disponibilidade
   */
  static hasAvailability(item: Item | null | undefined, inCartQuantity = 0): boolean {
    return this.getMaxToAdd(item, inCartQuantity) > 0;
  }

  /**
   * Formata a disponibilidade para exibição.
   *
   * @param item Item para formatar
   * @returns String formatada (ex: "5 unidades", "1 unidade")
   */
  static formatDisponibilidade(item: Item | null | undefined): string {
    const disponivel = this.getDisponibilidade(item);
    return `${disponivel} ${disponivel === 1 ? 'unidade' : 'unidades'}`;
  }
}
