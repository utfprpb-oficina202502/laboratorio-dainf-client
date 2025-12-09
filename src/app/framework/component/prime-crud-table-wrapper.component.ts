import {ChangeDetectionStrategy, Component, input} from '@angular/core';

import {SkeletonTableComponent} from './skeleton-table.component';
import {CrudListAriaAnnouncerComponent} from './crud-list-aria-announcer.component';

/**
 * Wrapper component for PrimeNG tables with skeleton loading state and ARIA announcements
 *
 * Encapsulates the @if/@else pattern for loading states and ARIA live region
 * to eliminate template duplication across 10+ list components.
 *
 * Os filtros são projetados em um slot separado ([tableFilter]) que permanece
 * sempre visível durante o carregamento, permitindo interação contínua do usuário.
 *
 * @example
 * <app-prime-crud-table-wrapper
 *   [loading]="loading()"
 *   [totalElements]="totalElements"
 *   [entityName]="getEntityName().toLowerCase()"
 *   [entityPluralName]="getEntityPluralName().toLowerCase()"
 *   [skeletonRows]="rows"
 *   [skeletonColumns]="displayedColumns.length">
 *
 *   <!-- Filtros ficam sempre visíveis durante loading -->
 *   <ng-container tableFilter>
 *     <app-table-filter-caption
 *       (clear)="clearGlobalFilter()"
 *       (filter)="onGlobalFilter($event)"
 *       [filterValue]="filterValue"
 *       [placeholder]="getGlobalFilterPlaceholder()">
 *     </app-table-filter-caption>
 *   </ng-container>
 *
 *   <p-table #dt [value]="objects" ...>
 *     <ng-template pTemplate="header">...</ng-template>
 *     <ng-template pTemplate="body">...</ng-template>
 *
 *     <!-- Templates de estado vazio e loading (devem ser filhos diretos do p-table) -->
 *     <ng-template pTemplate="emptymessage">
 *       <app-table-empty-state
 *         [colspan]="getColumnCount()"
 *         [message]="tableConfig.emptyMessage || 'Nenhum registro encontrado'">
 *       </app-table-empty-state>
 *     </ng-template>
 *
 *     <ng-template pTemplate="loadingbody">
 *       <app-table-loading-state
 *         [colspan]="getColumnCount()"
 *         [message]="tableConfig.loadingMessage || 'Carregando...'">
 *       </app-table-loading-state>
 *     </ng-template>
 *   </p-table>
 * </app-prime-crud-table-wrapper>
 */
@Component({
  selector: 'app-prime-crud-table-wrapper',
  imports: [SkeletonTableComponent, CrudListAriaAnnouncerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- ARIA live region integrado automaticamente -->
    <app-crud-list-aria-announcer
      [loading]="loading()"
      [totalElements]="totalElements()"
      [entityName]="entityName()"
      [entityPluralName]="entityPluralName()">
    </app-crud-list-aria-announcer>

    <!-- Filtros sempre visíveis (não bloqueados pelo skeleton) -->
    <div class="mb-3">
      <ng-content select="[tableFilter]"></ng-content>
    </div>

    <!-- Skeleton vs Content with responsive wrapper -->
    @if (loading()) {
      <app-skeleton-table
        [rows]="skeletonRows()"
        [columns]="skeletonColumns()">
      </app-skeleton-table>
    } @else {
      <div class="overflow-x-auto">
        <ng-content></ng-content>
      </div>
    }
  `
})
export class PrimeCrudTableWrapperComponent {
  /**
   * Loading state signal from parent list component
   */
  readonly loading = input.required<boolean>();

  /**
   * Total de elementos na lista (para ARIA announcements)
   * @default 0
   */
  readonly totalElements = input<number>(0);

  /**
   * Nome da entidade no singular (para ARIA announcements)
   * Ex: 'empréstimo', 'item', 'usuário'
   * @default 'registro'
   */
  readonly entityName = input<string>('registro');

  /**
   * Nome da entidade no plural (para ARIA announcements)
   * Ex: 'empréstimos', 'itens', 'usuários'
   * @default 'registros'
   */
  readonly entityPluralName = input<string>('registros');

  /**
   * Number of skeleton rows to display during loading
   * Should match table page size
   */
  readonly skeletonRows = input<number>(10);

  /**
   * Number of skeleton columns to display during loading
   * Should match visible column count (displayedColumns.length)
   */
  readonly skeletonColumns = input<number>(5);
}
