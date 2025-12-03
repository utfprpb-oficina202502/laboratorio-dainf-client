import {ChangeDetectionStrategy, Component, inject, model} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Router} from '@angular/router';

import {CartService} from '../../framework/services/cart.service';
import {BreakpointService} from '../../framework/services/breakpoint.service';
import {CartItemComponent} from './cart-item.component';

import {DrawerModule} from 'primeng/drawer';
import {DialogModule} from 'primeng/dialog';
import {ButtonModule} from 'primeng/button';
import {TooltipModule} from 'primeng/tooltip';
import {MessageService} from 'primeng/api';

/**
 * Componente modal/drawer do carrinho de reserva.
 *
 * Exibe drawer lateral em desktop e dialog fullscreen em mobile.
 * Permite visualizar itens, ajustar quantidades e navegar para reserva.
 *
 * @example
 * ```html
 * <app-cart-modal [(visible)]="cartVisible" />
 * ```
 */
@Component({
  selector: 'app-cart-modal',
  templateUrl: './cart-modal.component.html',
  imports: [
    CommonModule,
    CartItemComponent,
    DrawerModule,
    DialogModule,
    ButtonModule,
    TooltipModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CartModalComponent {
  /**
   * Controla a visibilidade do modal/drawer.
   */
  readonly visible = model<boolean>(false);
  protected readonly cartService = inject(CartService);
  protected readonly breakpointService = inject(BreakpointService);
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);

  /**
   * Manipula mudança de quantidade de um item.
   */
  onQuantityChange(event: { itemId: number; qtde: number }): void {
    const success = this.cartService.updateQuantity(event.itemId, event.qtde);

    if (!success) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Quantidade indisponível',
        detail: 'A quantidade solicitada excede a disponibilidade.',
        life: 3000
      });
    }
  }

  /**
   * Remove um item do carrinho.
   */
  onRemove(itemId: number): void {
    this.cartService.removeItem(itemId);
  }

  /**
   * Limpa todos os itens do carrinho.
   */
  clearCart(): void {
    this.cartService.clear();
    this.messageService.add({
      severity: 'info',
      summary: 'Carrinho limpo',
      detail: 'Todos os itens foram removidos.',
      life: 2000
    });
  }

  /**
   * Navega para o formulário de reserva com os itens do carrinho.
   */
  goToReserva(): void {
    const items = this.cartService.items();

    if (items.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Carrinho vazio',
        detail: 'Adicione itens antes de criar uma reserva.',
        life: 3000
      });
      return;
    }

    // Fecha o modal
    this.visible.set(false);

    // Navega para reserva com os itens via state
    this.router.navigate(['/reserva/new'], {
      state: {cartItems: items}
    });
  }

  /**
   * Fecha o modal/drawer.
   */
  close(): void {
    this.visible.set(false);
  }

  /**
   * Navega para o catálogo e fecha o modal.
   */
  goToCatalog(): void {
    this.visible.set(false);
    this.router.navigate(['/item/catalogo']);
  }
}
