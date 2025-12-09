import {ChangeDetectionStrategy, Component, input, output} from '@angular/core';

import {ButtonModule} from 'primeng/button';
import {InputTextModule} from 'primeng/inputtext';
import {IconFieldModule} from 'primeng/iconfield';
import {InputIconModule} from 'primeng/inputicon';

/**
 * Reusable table filter caption component
 * Provides consistent search input and clear button across all list tables
 */
@Component({
  selector: 'app-table-filter-caption',
  imports: [ButtonModule, InputTextModule, IconFieldModule, InputIconModule],
  template: `
    <div class="flex items-center justify-end gap-2 flex-wrap">
      <p-iconField iconPosition="left" class="flex-grow-0 flex-shrink min-w-[200px] max-w-[300px]">
        <p-inputIcon class="pi pi-search" aria-hidden="true"></p-inputIcon>
        <input
          #filterInput
          pInputText
          type="text"
          (input)="onFilterChange($any($event.target).value)"
          [value]="filterValue()"
          [placeholder]="placeholder()"
          [attr.aria-label]="ariaLabel()"
          autocomplete="off"
          class="w-full"/>
      </p-iconField>
      <p-button
        type="button"
        severity="secondary"
        [outlined]="true"
        (onClick)="clear.emit()"
        [attr.aria-label]="'Limpar filtro global'">
        <span pButtonIcon class="pi pi-filter-slash"></span>
        <span pButtonLabel class="hidden sm:inline">Limpar</span>
      </p-button>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TableFilterCaptionComponent {
  // Inputs
  readonly filterValue = input<string>('');
  readonly placeholder = input<string>('Buscar...');
  readonly ariaLabel = input<string>('Campo de busca');

  // Outputs
  readonly filter = output<string>();
  readonly clear = output<void>();

  onFilterChange(value: string): void {
    this.filter.emit(value);
  }
}
