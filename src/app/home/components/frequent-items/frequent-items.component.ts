import {ChangeDetectionStrategy, Component, computed, inject, input} from '@angular/core';
import {RouterLink} from '@angular/router';
import {Card} from 'primeng/card';
import {ButtonModule} from 'primeng/button';
import {Skeleton} from 'primeng/skeleton';
import {Tag} from 'primeng/tag';
import {TooltipModule} from 'primeng/tooltip';
import {CartService} from '../../../framework/services/cart.service';
import {Item} from '../../../item/item';
import {ItemFrequenteUsuario} from '../../models/dashboard.models';

/**
 * Componente que exibe os itens mais emprestados pelo usuário.
 *
 * @description Mostra uma lista com os top 5 itens frequentes e permite
 * adicionar diretamente ao carrinho de reservas.
 *
 * @example
 * <app-frequent-items [items]="items()" [loading]="loading()" />
 */
@Component({
  selector: 'app-frequent-items',
  templateUrl: './frequent-items.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    Card,
    ButtonModule,
    Skeleton,
    Tag,
    TooltipModule,
    RouterLink
  ],
  host: {
    class: 'block'
  },
  styles: [`
    :host ::ng-deep .p-card {
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    :host ::ng-deep .p-card-body {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    :host ::ng-deep .p-card-content {
      flex: 1;
      overflow-y: auto;
      max-height: 280px;
    }
  `]
})
export class FrequentItemsComponent {
  /** Lista de itens frequentes vindos do backend */
  readonly items = input<ItemFrequenteUsuario[]>([]);
  /** Indica se os dados estão carregando */
  readonly loading = input<boolean>(false);
  /** Indica se há itens para exibir */
  protected readonly hasItems = computed(() => this.items().length > 0);
  private readonly cartService = inject(CartService);

  /**
   * Adiciona um item ao carrinho de reservas.
   */
  addToCart(item: ItemFrequenteUsuario): void {
    // Converte ItemFrequenteUsuario para Item (mínimo necessário para o CartService)
    const cartItem: Item = {
      id: item.itemId,
      nome: item.itemNome,
      saldo: item.saldo
    } as Item;

    this.cartService.addItem(cartItem, 1);
  }

  /**
   * Verifica se o item está disponível para adicionar ao carrinho.
   */
  isAvailable(item: ItemFrequenteUsuario): boolean {
    return item.saldo > 0;
  }

  /**
   * Verifica se o item já está no carrinho.
   */
  isInCart(item: ItemFrequenteUsuario): boolean {
    return this.cartService.isInCart(item.itemId);
  }

  /**
   * Retorna a severidade do badge de disponibilidade.
   */
  getAvailabilitySeverity(item: ItemFrequenteUsuario): 'success' | 'warn' | 'danger' {
    if (item.saldo === 0) {
      return 'danger';
    }
    if (item.saldo <= 2) {
      return 'warn';
    }
    return 'success';
  }

  /**
   * Retorna o texto de disponibilidade.
   */
  getAvailabilityText(item: ItemFrequenteUsuario): string {
    if (item.saldo === 0) {
      return 'Indisponível';
    }
    return `${item.saldo} disp.`;
  }
}
