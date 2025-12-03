import {computed, effect, inject, Injectable, signal} from '@angular/core';
import {Item} from '../../item/item';
import {LoggerService} from './logger.service';

/**
 * Item no carrinho de reserva.
 * Armazena referência ao item e quantidade selecionada.
 */
export interface CartItem {
  item: Item;
  qtde: number;
}

/**
 * Chave utilizada para persistência no sessionStorage.
 */
const CART_STORAGE_KEY = 'lab-cart';

/**
 * Serviço de gerenciamento do carrinho de reserva.
 *
 * Permite ao usuário selecionar itens de qualquer modo de visualização
 * (tabela, catálogo, árvore) e mantém a seleção durante a navegação.
 *
 * @example
 * ```typescript
 * // Adicionar item ao carrinho
 * cartService.addItem(item, 2);
 *
 * // Verificar se item está no carrinho
 * if (cartService.isInCart(item.id)) {
 *   const qtde = cartService.getItemQuantity(item.id);
 * }
 *
 * // Navegar para reserva com itens
 * router.navigate(['/reserva/new'], {
 *   state: { cartItems: cartService.items() }
 * });
 * ```
 *
 * @description
 * - Usa **sessionStorage** para persistência (limpa ao fechar aba)
 * - Signals reativos para integração com componentes Angular
 * - Validação de quantidade vs disponibilidade
 */
@Injectable({
  providedIn: 'root'
})
export class CartService {
  private readonly logger = inject(LoggerService);

  /**
   * Estado interno do carrinho.
   * @internal
   */
  private readonly _items = signal<CartItem[]>([]);

  /**
   * Lista de itens no carrinho (somente leitura).
   */
  readonly items = this._items.asReadonly();

  /**
   * Número total de itens distintos no carrinho.
   */
  readonly totalItems = computed(() => this._items().length);

  /**
   * Soma total de unidades no carrinho.
   */
  readonly totalUnits = computed(() =>
    this._items().reduce((sum, ci) => sum + ci.qtde, 0)
  );

  /**
   * Indica se o carrinho está vazio.
   */
  readonly isEmpty = computed(() => this._items().length === 0);

  /**
   * Indica se o carrinho possui itens.
   */
  readonly hasItems = computed(() => this._items().length > 0);

  constructor() {
    this.loadFromSession();

    // Auto-save quando o estado muda
    // Nota: Para serviços singleton, o effect vive pelo tempo de vida da aplicação (comportamento esperado)
    effect(() => {
      const items = this._items();
      this.saveToSession(items);
    });
  }

  /**
   * Adiciona um item ao carrinho.
   *
   * Se o item já existe, incrementa a quantidade.
   * Valida se a quantidade não excede a disponibilidade.
   *
   * @param item - Item a ser adicionado
   * @param qtde - Quantidade (padrão: 1)
   * @returns `true` se adicionado com sucesso, `false` se quantidade indisponível
   *
   * @example
   * ```typescript
   * const success = cartService.addItem(multimetro, 2);
   * if (!success) {
   *   console.log('Quantidade indisponível');
   * }
   * ```
   */
  addItem(item: Item, qtde = 1): boolean {
    if (qtde <= 0) {
      return false;
    }

    const currentItems = this._items();
    const existingIndex = currentItems.findIndex(ci => ci.item.id === item.id);

    if (existingIndex >= 0) {
      // Item já existe - incrementa quantidade
      const newQtde = currentItems[existingIndex].qtde + qtde;

      // Valida disponibilidade
      if (newQtde > item.disponivelEmprestimoCalculado) {
        return false;
      }

      const updated = [...currentItems];
      updated[existingIndex] = {...updated[existingIndex], qtde: newQtde};
      this._items.set(updated);
    } else {
      // Novo item - valida disponibilidade
      if (qtde > item.disponivelEmprestimoCalculado) {
        return false;
      }

      this._items.set([...currentItems, {item, qtde}]);
    }

    return true;
  }

  /**
   * Remove um item do carrinho pelo ID.
   *
   * @param itemId - ID do item a remover
   */
  removeItem(itemId: number): void {
    this._items.update(items => items.filter(ci => ci.item.id !== itemId));
  }

  /**
   * Atualiza a quantidade de um item no carrinho.
   *
   * Se a quantidade for 0 ou negativa, remove o item.
   *
   * @param itemId - ID do item
   * @param qtde - Nova quantidade
   * @returns `true` se atualizado com sucesso, `false` se quantidade inválida
   */
  updateQuantity(itemId: number, qtde: number): boolean {
    if (qtde <= 0) {
      this.removeItem(itemId);
      return true;
    }

    const currentItems = this._items();
    const existingIndex = currentItems.findIndex(ci => ci.item.id === itemId);

    if (existingIndex < 0) {
      return false;
    }

    const item = currentItems[existingIndex].item;

    // Valida disponibilidade
    if (qtde > item.disponivelEmprestimoCalculado) {
      return false;
    }

    const updated = [...currentItems];
    updated[existingIndex] = {...updated[existingIndex], qtde};
    this._items.set(updated);

    return true;
  }

  /**
   * Limpa todos os itens do carrinho.
   */
  clear(): void {
    this._items.set([]);
  }

  /**
   * Retorna a quantidade de um item específico no carrinho.
   *
   * @param itemId - ID do item
   * @returns Quantidade no carrinho ou 0 se não encontrado
   */
  getItemQuantity(itemId: number): number {
    const cartItem = this._items().find(ci => ci.item.id === itemId);
    return cartItem?.qtde ?? 0;
  }

  /**
   * Verifica se um item está no carrinho.
   *
   * @param itemId - ID do item
   * @returns `true` se o item está no carrinho
   */
  isInCart(itemId: number): boolean {
    return this._items().some(ci => ci.item.id === itemId);
  }

  /**
   * Retorna um item do carrinho pelo ID.
   *
   * @param itemId - ID do item
   * @returns CartItem ou undefined se não encontrado
   */
  getCartItem(itemId: number): CartItem | undefined {
    return this._items().find(ci => ci.item.id === itemId);
  }

  /**
   * Salva o carrinho no sessionStorage.
   * @internal
   */
  private saveToSession(items: CartItem[]): void {
    try {
      if (this.isSessionStorageAvailable()) {
        sessionStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
      }
    } catch (error) {
      this.logger.error('Erro ao salvar carrinho no sessionStorage', error);
    }
  }

  /**
   * Carrega o carrinho do sessionStorage.
   * @internal
   */
  private loadFromSession(): void {
    try {
      if (this.isSessionStorageAvailable()) {
        const stored = sessionStorage.getItem(CART_STORAGE_KEY);
        if (stored) {
          const items: CartItem[] = JSON.parse(stored);
          this._items.set(items);
        }
      }
    } catch (error) {
      this.logger.error('Erro ao carregar carrinho do sessionStorage', error);
      this._items.set([]);
    }
  }

  /**
   * Verifica se sessionStorage está disponível.
   * @internal
   */
  private isSessionStorageAvailable(): boolean {
    try {
      return typeof window !== 'undefined' && 'sessionStorage' in window && window.sessionStorage !== null;
    } catch {
      return false;
    }
  }
}
