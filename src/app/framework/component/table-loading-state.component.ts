import {ChangeDetectionStrategy, Component, input} from '@angular/core';

/**
 * Componente reutilizável para exibir estado de carregamento em tabelas PrimeNG
 *
 * Fornece mensagem centralizada durante carregamento de dados.
 * Usado dentro de ng-template pTemplate="loadingbody".
 *
 * @example
 * <ng-template pTemplate="loadingbody">
 *   <app-table-loading-state
 *     [colspan]="getColumnCount()"
 *     [message]="tableConfig.loadingMessage">
 *   </app-table-loading-state>
 * </ng-template>
 */
@Component({
  selector: 'app-table-loading-state',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tr>
      <td [attr.colspan]="colspan()">
        <div class="text-center py-4">
          @if (showSpinner()) {
            <i class="pi pi-spin pi-spinner text-gray-500 text-3xl"></i>
          }
          <p [class]="messageClass()">{{ message() }}</p>
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
export class TableLoadingStateComponent {
  /**
   * Número de colunas da tabela para colspan
   */
  readonly colspan = input.required<number>();

  /**
   * Mensagem a ser exibida
   */
  readonly message = input.required<string>();

  /**
   * Se deve exibir spinner animado
   * @default false
   */
  readonly showSpinner = input<boolean>(false);

  /**
   * Classes CSS para a mensagem
   * @default 'text-gray-500 mt-2 mb-0'
   */
  readonly messageClass = input<string>('text-gray-500 mt-2 mb-0');
}
