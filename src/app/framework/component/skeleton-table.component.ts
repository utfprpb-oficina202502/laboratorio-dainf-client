import {ChangeDetectionStrategy, Component, computed, input} from '@angular/core';

import {SkeletonModule} from 'primeng/skeleton';

@Component({
  selector: 'app-skeleton-table',
  imports: [SkeletonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="skeleton-table"
         role="status"
         aria-label="Carregando conteúdo da tabela"
         aria-live="polite">
      <!-- Screen reader announcement -->
      <span class="sr-only">Aguarde enquanto os dados são carregados</span>

      <!-- Table Header -->
      <div class="table-header">
        @for (col of columnArray(); track $index) {
          <div class="header-cell">
            <p-skeleton width="80%" height="1rem"></p-skeleton>
          </div>
        }
      </div>

      <!-- Table Body Rows -->
      @for (row of rowArray(); track $index) {
        <div class="table-row">
          @for (col of columnArray(); track $index) {
            <div class="body-cell">
              <p-skeleton width="90%" height="1rem"></p-skeleton>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .skeleton-table {
      background: var(--p-content-background, #ffffff);
      border: 1px solid var(--p-datatable-border-color, #e2e8f0);
      border-radius: var(--p-border-radius, 0.375rem);
      overflow: hidden;
    }

    .table-header {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 0.5rem;
      padding: 1rem;
      background: var(--p-datatable-header-background, #f8f9fa);
      border-bottom: 1px solid var(--p-datatable-border-color, #e2e8f0);
    }

    .header-cell {
      display: flex;
      align-items: center;
    }

    .table-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 0.5rem;
      padding: 1rem;
      border-bottom: 1px solid var(--p-datatable-border-color, #e2e8f0);
    }

    .table-row:last-child {
      border-bottom: none;
    }

    .table-row:nth-child(even) {
      background: var(--p-datatable-row-background, #f9fafb);
    }

    .body-cell {
      display: flex;
      align-items: center;
    }

    /* Screen reader only content - WCAG 2.1 AA compliance */
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
  `]
})
export class SkeletonTableComponent {
  /**
   * Number of columns to display in skeleton
   */
  columns = input<number>(5);

  /**
   * Number of rows to display in skeleton
   */
  rows = input<number>(5);

  /**
   * Create an array from the columns number for iteration
   */
  protected columnArray = computed(() => Array.from({length: this.columns()}, (_, i) => i));

  /**
   * Create an array from the rows number for iteration
   */
  protected rowArray = computed(() => Array.from({length: this.rows()}, (_, i) => i));
}
