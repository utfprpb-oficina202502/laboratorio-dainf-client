import {ChangeDetectionStrategy, Component, inject, signal} from '@angular/core';
import {CommonModule} from '@angular/common';

import {CartService} from '../../framework/services/cart.service';
import {CartModalComponent} from './cart-modal.component';

import {ButtonModule} from 'primeng/button';
import {BadgeModule} from 'primeng/badge';
import {TooltipModule} from 'primeng/tooltip';

/**
 * Componente badge do carrinho para exibição na navbar.
 *
 * Mostra o ícone do carrinho com contador de itens.
 * Ao clicar, abre o modal/drawer do carrinho.
 *
 * @example
 * ```html
 * <app-cart-badge />
 * ```
 */
@Component({
  selector: 'app-cart-badge',
  templateUrl: './cart-badge.component.html',
  imports: [
    CommonModule,
    CartModalComponent,
    ButtonModule,
    BadgeModule,
    TooltipModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CartBadgeComponent {
  protected readonly cartService = inject(CartService);

  /**
   * Controla a visibilidade do modal do carrinho.
   */
  protected readonly cartVisible = signal(false);

  /**
   * Abre o modal do carrinho.
   */
  openCart(): void {
    this.cartVisible.set(true);
  }
}
