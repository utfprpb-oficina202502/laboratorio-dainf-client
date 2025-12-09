import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal
} from '@angular/core';


import {Item} from '../../../item';
import {CartService} from '../../../../framework/service/cart.service';
import {environment} from '../../../../../environments/environment';

import {ButtonModule} from 'primeng/button';
import {CardModule} from 'primeng/card';
import {TagModule} from 'primeng/tag';
import {TooltipModule} from 'primeng/tooltip';
import {InputNumberModule} from 'primeng/inputnumber';
import {FormsModule} from '@angular/forms';

/**
 * Card reutilizável para exibição de item no catálogo.
 *
 * Exibe informações do item (imagem, nome, grupo, localização, disponibilidade)
 * e permite adicionar ao carrinho com controle de quantidade.
 *
 * @example
 * ```html
 * <app-item-card
 *   [item]="item"
 *   (viewDetails)="onViewDetails($event)" />
 * ```
 */
@Component({
  selector: 'app-item-card',
  templateUrl: './item-card.component.html',
  styleUrl: './item-card.component.css',
  imports: [
    FormsModule,
    ButtonModule,
    CardModule,
    TagModule,
    TooltipModule,
    InputNumberModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ItemCardComponent {
  /**
   * Item a ser exibido no card.
   */
  readonly item = input.required<Item>();
  /**
   * Evento emitido ao clicar para ver detalhes do item.
   */
  readonly viewDetails = output<Item>();
  protected readonly cartService = inject(CartService);
  /**
   * Quantidade selecionada para adicionar ao carrinho.
   */
  protected readonly quantidade = signal(1);

  /**
   * Indica se o item está no carrinho.
   */
  protected readonly isInCart = computed(() =>
    this.cartService.isInCart(this.item().id)
  );

  /**
   * Quantidade do item já no carrinho.
   */
  protected readonly cartQuantity = computed(() =>
    this.cartService.getItemQuantity(this.item().id)
  );

  /**
   * Disponibilidade do item para empréstimo.
   */
  protected readonly disponibilidade = computed(() => {
    const item = this.item();
    return item.disponivelEmprestimoCalculado ?? item.saldo ?? 0;
  });

  /**
   * Indica se há disponibilidade para adicionar mais itens.
   */
  protected readonly hasAvailability = computed(() => {
    const disponivel = this.disponibilidade();
    const inCart = this.cartQuantity();
    return disponivel - inCart > 0;
  });

  /**
   * Máximo que pode ser adicionado (disponível - já no carrinho).
   */
  protected readonly maxToAdd = computed(() => {
    const disponivel = this.disponibilidade();
    const inCart = this.cartQuantity();
    return Math.max(0, disponivel - inCart);
  });

  /**
   * Severity do tag de disponibilidade.
   */
  protected readonly availabilitySeverity = computed(() => {
    const disponivel = this.disponibilidade();
    if (disponivel === 0) return 'danger';
    if (disponivel <= 2) return 'warn';
    return 'success';
  });

  /**
   * URL da imagem do item ou placeholder.
   * Constrói a URL completa para o MinIO quando necessário.
   */
  protected readonly imageUrl = computed(() => {
    const item = this.item();

    // Prioriza imagemUrl (DTO do backend)
    if (item.imagemUrl) {
      return this.buildImageUrl(item.imagemUrl);
    }

    // Fallback para base64 da primeira imagem
    if (item.imageItem?.length > 0) {
      const cover = item.imageItem.find(img => img.isCover) || item.imageItem[0];
      if (cover.base64) {
        return `data:${cover.contentType};base64,${cover.base64}`;
      }
    }

    // Placeholder (mesmo usado na tabela)
    return 'no-image.svg';
  });

  /**
   * Adiciona o item ao carrinho com a quantidade selecionada.
   */
  addToCart(): void {
    const item = this.item();
    const qtde = this.quantidade();

    if (qtde > 0 && qtde <= this.maxToAdd()) {
      this.cartService.addItem(item, qtde);
      // Reset quantidade para 1 após adicionar
      this.quantidade.set(1);
    }
  }

  /**
   * Remove o item do carrinho.
   */
  removeFromCart(): void {
    this.cartService.removeItem(this.item().id);
  }

  /**
   * Emite evento para visualizar detalhes do item.
   */
  onViewDetails(): void {
    this.viewDetails.emit(this.item());
  }

  /**
   * Incrementa a quantidade.
   */
  incrementQuantity(): void {
    const current = this.quantidade();
    const max = this.maxToAdd();
    if (current < max) {
      this.quantidade.set(current + 1);
    }
  }

  /**
   * Decrementa a quantidade.
   */
  decrementQuantity(): void {
    const current = this.quantidade();
    if (current > 1) {
      this.quantidade.set(current - 1);
    }
  }

  /**
   * Constrói a URL completa para uma imagem do MinIO.
   * @param imageName Nome do arquivo ou URL da imagem
   * @returns URL completa para o MinIO ou a URL original se já for absoluta
   */
  private buildImageUrl(imageName: string): string {
    if (!imageName) {
      return 'no-image.svg';
    }
    // Se já for URL absoluta, retorna como está
    if (imageName.startsWith('http://') || imageName.startsWith('https://')) {
      return imageName;
    }
    // Adiciona prefixo do MinIO
    return `${environment.minio_url}${imageName}`;
  }
}
