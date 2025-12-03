import {ChangeDetectionStrategy, Component, computed, inject, input, output} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {Router} from '@angular/router';

import {CartService} from '../../framework/services/cart.service';
import {BreakpointService} from '../../framework/services/breakpoint.service';

import {SelectButtonModule} from 'primeng/selectbutton';
import {ButtonModule} from 'primeng/button';
import {TooltipModule} from 'primeng/tooltip';

/**
 * Opção de modo de visualização.
 */
interface ViewModeOption {
  label: string;
  value: string;
  icon: string;
}

/**
 * Componente reutilizável para alternância entre modos de visualização de itens.
 *
 * Exibe um toggle com três opções (Tabela, Catálogo, Árvore) e botão do carrinho.
 * Padroniza a navegação entre as diferentes visualizações do módulo de itens.
 *
 * @example
 * ```html
 * <app-item-view-mode-toggle
 *   [currentMode]="'table'"
 *   (modeChange)="onModeChange($event)"
 *   (goToReserva)="navigateToReserva()" />
 * ```
 */
@Component({
  selector: 'app-item-view-mode-toggle',
  template: `
    <div class="flex items-center gap-3">
      <!-- Toggle de modos de visualização -->
      <p-selectButton
        [options]="viewModeOptions"
        [ngModel]="currentMode()"
        (ngModelChange)="onModeChange($event)"
        optionLabel="label"
        optionValue="value"
        [allowEmpty]="false"
        size="small"
        aria-label="Modo de visualização">
        <ng-template let-item pTemplate="item">
          <i [class]="item.icon" [pTooltip]="item.label" tooltipPosition="top"></i>
        </ng-template>
      </p-selectButton>

      <!-- Botão do carrinho (desktop) -->
      @if (showCartButton() && cartItemCount() > 0) {
        <p-button
          label="Ir para Reserva"
          icon="pi pi-shopping-cart"
          [badge]="cartItemCount().toString()"
          badgeSeverity="danger"
          (onClick)="onGoToReserva()"
          size="small"
          class="hidden md:inline-flex"/>
        <p-button
          icon="pi pi-shopping-cart"
          [badge]="cartItemCount().toString()"
          badgeSeverity="danger"
          (onClick)="onGoToReserva()"
          size="small"
          [rounded]="true"
          pTooltip="Ir para Reserva"
          tooltipPosition="left"
          class="md:hidden"
          aria-label="Ir para reserva com itens do carrinho"/>
      }
    </div>
  `,
  imports: [
    FormsModule,
    SelectButtonModule,
    ButtonModule,
    TooltipModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ItemViewModeToggleComponent {
  /**
   * Modo de visualização atual.
   */
  readonly currentMode = input.required<string>();
  /**
   * Exibe botão do carrinho (opcional).
   */
  readonly showCartButton = input<boolean>(true);
  /**
   * Evento emitido ao mudar modo (para uso sem navegação automática).
   */
  readonly modeChange = output<string>();
  /**
   * Evento emitido ao clicar em ir para reserva.
   */
  readonly goToReserva = output<void>();
  protected readonly breakpointService = inject(BreakpointService);
  /**
   * Opções de modo de visualização.
   */
  protected readonly viewModeOptions: ViewModeOption[] = [
    {label: 'Tabela', value: 'table', icon: 'pi pi-table'},
    {label: 'Catálogo', value: 'catalog', icon: 'pi pi-th-large'},
    {label: 'Árvore', value: 'tree', icon: 'pi pi-sitemap'}
  ];
  private readonly router = inject(Router);
  private readonly cartService = inject(CartService);
  /**
   * Quantidade de itens no carrinho.
   */
  protected readonly cartItemCount = computed(() => this.cartService.totalItems());

  /**
   * Handler de mudança de modo - navega automaticamente.
   */
  protected onModeChange(mode: string): void {
    this.modeChange.emit(mode);

    switch (mode) {
      case 'table':
        this.router.navigate(['/item']);
        break;
      case 'catalog':
        this.router.navigate(['/item/catalogo']);
        break;
      case 'tree':
        this.router.navigate(['/item/arvore']);
        break;
    }
  }

  /**
   * Handler do botão de ir para reserva.
   */
  protected onGoToReserva(): void {
    this.goToReserva.emit();
    this.router.navigate(['/reserva/new'], {
      state: {cartItems: this.cartService.items()}
    });
  }
}
