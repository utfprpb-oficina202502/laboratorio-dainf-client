import {ChangeDetectionStrategy, Component, input} from '@angular/core';

/**
 * Componente reutilizável para exibir estado vazio em tabelas PrimeNG
 *
 * Fornece mensagem centralizada com ícone quando não há dados para exibir.
 * Usado dentro de ng-template pTemplate="emptymessage".
 *
 * @example
 * <ng-template pTemplate="emptymessage">
 *   <app-table-empty-state
 *     [colspan]="getColumnCount()"
 *     [message]="tableConfig.emptyMessage">
 *   </app-table-empty-state>
 * </ng-template>
 */
@Component({
  selector: 'app-table-empty-state',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tr>
      <td [attr.colspan]="colspan()">
        <div class="text-center py-4">
          <i [class]="'pi ' + icon() + ' text-muted text-3xl'"></i>
          <p class="text-muted mt-2 mb-0">{{ message() }}</p>
          @if (showAction() && actionLabel()) {
            <button
              type="button"
              class="mt-3"
              [class]="actionButtonClass()"
              (click)="onActionClick()">
              {{ actionLabel() }}
            </button>
          }
        </div>
      </td>
    </tr>
  `,
  styles: [`
    :host {
      display: contents;
    }
  `]
})
export class TableEmptyStateComponent {
  /**
   * Número de colunas da tabela para colspan
   */
  readonly colspan = input.required<number>();

  /**
   * Mensagem a ser exibida
   */
  readonly message = input.required<string>();

  /**
   * Ícone PrimeIcons a ser exibido (sem prefixo 'pi')
   * @default 'pi-info-circle'
   */
  readonly icon = input<string>('pi-info-circle');

  /**
   * Se deve exibir botão de ação
   * @default false
   */
  readonly showAction = input<boolean>(false);

  /**
   * Label do botão de ação
   */
  readonly actionLabel = input<string>('');

  /**
   * Classes CSS do botão de ação
   * @default 'p-button p-button-primary'
   */
  readonly actionButtonClass = input<string>('p-button p-button-primary');

  /**
   * Callback quando botão de ação é clicado
   */
  onActionClick(): void {
    // Parent component can listen via output if needed
    // For now, this is a placeholder
  }
}
