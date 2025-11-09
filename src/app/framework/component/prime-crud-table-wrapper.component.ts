import {ChangeDetectionStrategy, Component, input} from '@angular/core';
import {CommonModule} from '@angular/common';
import {SkeletonTableComponent} from './skeleton-table.component';
import {CrudListAriaAnnouncerComponent} from './crud-list-aria-announcer.component';

/**
 * Wrapper component for PrimeNG tables with skeleton loading state and ARIA announcements
 *
 * Encapsulates the @if/@else pattern for loading states and ARIA live region
 * to eliminate template duplication across 10+ list components.
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
 *   <p-table #dt [value]="objects" ...>
 *     <ng-template pTemplate="header">...</ng-template>
 *     <ng-template pTemplate="body">...</ng-template>
 *
 *     <!-- Single helper component for empty/loading templates -->
 *     <app-table-default-templates
 *       [colspan]="getColumnCount()"
 *       [emptyMessage]="tableConfig.emptyMessage"
 *       [loadingMessage]="tableConfig.loadingMessage">
 *     </app-table-default-templates>
 *   </p-table>
 * </app-prime-crud-table-wrapper>
 */
@Component({
  selector: 'app-prime-crud-table-wrapper',
  imports: [CommonModule, SkeletonTableComponent, CrudListAriaAnnouncerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- ARIA live region integrado automaticamente -->
    <app-crud-list-aria-announcer
      [loading]="loading()"
      [totalElements]="totalElements()"
      [entityName]="entityName()"
      [entityPluralName]="entityPluralName()">
    </app-crud-list-aria-announcer>

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
