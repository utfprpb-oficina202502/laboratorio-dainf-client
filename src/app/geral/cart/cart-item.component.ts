import {ChangeDetectionStrategy, Component, computed, input, output} from '@angular/core';
import {CommonModule, NgOptimizedImage} from '@angular/common';
import {CartItem} from '../../framework/services/cart.service';
import {ItemAvailabilityUtil} from '../../framework/utils/item-availability.util';

import {ButtonModule} from 'primeng/button';
import {InputNumberModule} from 'primeng/inputnumber';
import {FormsModule} from '@angular/forms';
import {TooltipModule} from 'primeng/tooltip';

/**
 * Componente que exibe um item dentro do carrinho de reserva.
 *
 * Permite ajustar quantidade e remover o item.
 *
 * @example
 * ```html
 * <app-cart-item
 *   [cartItem]="item"
 *   (quantityChange)="onQuantityChange($event)"
 *   (remove)="onRemove($event)">
 * </app-cart-item>
 * ```
 */
@Component({
  selector: 'app-cart-item',
  templateUrl: './cart-item.component.html',
  imports: [
    CommonModule,
    NgOptimizedImage,
    ButtonModule,
    InputNumberModule,
    FormsModule,
    TooltipModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CartItemComponent {
  /**
   * Item do carrinho a ser exibido.
   */
  readonly cartItem = input.required<CartItem>();

  /**
   * Emitido quando a quantidade é alterada.
   * Envia o ID do item e a nova quantidade.
   */
  readonly quantityChange = output<{ itemId: number; qtde: number }>();

  /**
   * Emitido quando o item é removido.
   * Envia o ID do item.
   */
  readonly remove = output<number>();

  /**
   * Disponibilidade máxima do item.
   * Usa fallback para saldo quando disponivelEmprestimoCalculado não está definido.
   */
  protected readonly maxQuantity = computed(() =>
    ItemAvailabilityUtil.getDisponibilidade(this.cartItem().item)
  );

  /**
   * URL da imagem do item ou fallback.
   */
  protected readonly imageUrl = computed(() =>
    this.cartItem().item.imagemUrl || 'assets/no-image.svg'
  );

  /**
   * Indica se o item está esgotado (disponibilidade = 0).
   */
  protected readonly isUnavailable = computed(() =>
    ItemAvailabilityUtil.getDisponibilidade(this.cartItem().item) === 0
  );

  /**
   * Manipula mudança de quantidade via input number.
   */
  onQuantityChange(value: number | null): void {
    const itemId = this.cartItem().item.id;

    if (!value || value <= 0) {
      this.remove.emit(itemId);
    } else {
      this.quantityChange.emit({itemId, qtde: value});
    }
  }

  /**
   * Decrementa a quantidade em 1.
   */
  decrement(): void {
    const current = this.cartItem().qtde;
    const itemId = this.cartItem().item.id;

    if (current <= 1) {
      this.remove.emit(itemId);
    } else {
      this.quantityChange.emit({itemId, qtde: current - 1});
    }
  }

  /**
   * Incrementa a quantidade em 1.
   */
  increment(): void {
    const current = this.cartItem().qtde;
    const max = this.maxQuantity();
    const itemId = this.cartItem().item.id;

    if (current < max) {
      this.quantityChange.emit({itemId, qtde: current + 1});
    }
  }

  /**
   * Remove o item do carrinho.
   */
  onRemove(): void {
    this.remove.emit(this.cartItem().item.id);
  }
}
