import {ChangeDetectionStrategy, Component, input} from '@angular/core';
import {TableEmptyStateComponent} from './table-empty-state.component';
import {TableLoadingStateComponent} from './table-loading-state.component';

/**
 * Componente helper que fornece templates padrão para emptymessage e loadingbody
 *
 * Uso: coloque dentro do p-table para obter ambos os templates automaticamente
 *
 * @example
 * <p-table [value]="objects">
 *   <ng-template pTemplate="header">...</ng-template>
 *   <ng-template pTemplate="body">...</ng-template>
 *
 *   <!-- Um único componente fornece ambos os templates -->
 *   <app-table-default-templates
 *     [colspan]="getColumnCount()"
 *     [emptyMessage]="tableConfig.emptyMessage"
 *     [loadingMessage]="tableConfig.loadingMessage">
 *   </app-table-default-templates>
 * </p-table>
 */
@Component({
  selector: 'app-table-default-templates',
  standalone: true,
  imports: [TableEmptyStateComponent, TableLoadingStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Empty Message Template -->
    <ng-template pTemplate="emptymessage">
      <app-table-empty-state
        [colspan]="colspan()"
        [message]="emptyMessage()"
        [icon]="emptyIcon()">
      </app-table-empty-state>
    </ng-template>

    <!-- Loading Body Template -->
    <ng-template pTemplate="loadingbody">
      <app-table-loading-state
        [colspan]="colspan()"
        [message]="loadingMessage()"
        [showSpinner]="showSpinner()">
      </app-table-loading-state>
    </ng-template>
  `
})
export class TableDefaultTemplatesComponent {
  /**
   * Número de colunas para colspan
   */
  readonly colspan = input.required<number>();

  /**
   * Mensagem de estado vazio
   */
  readonly emptyMessage = input<string>('Nenhum registro encontrado');

  /**
   * Mensagem de carregamento
   */
  readonly loadingMessage = input<string>('Carregando...');

  /**
   * Ícone para mensagem vazia
   * @default 'pi-info-circle'
   */
  readonly emptyIcon = input<string>('pi-info-circle');

  /**
   * Se deve exibir spinner no loading
   * @default false
   */
  readonly showSpinner = input<boolean>(false);
}
