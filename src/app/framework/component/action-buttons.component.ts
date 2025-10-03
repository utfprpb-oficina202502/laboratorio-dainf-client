import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';

/**
 * Unified action buttons component for list tables
 * Provides consistent edit/delete/view button styling across the application
 */
@Component({
  selector: 'app-action-buttons',
  standalone: true,
  imports: [CommonModule, ButtonModule, TooltipModule],
  template: `
    <div class="flex items-center gap-1 justify-center">
      @if (showEdit()) {
        <p-button
          icon="pi pi-pencil"
          [outlined]="true"
          severity="secondary"
          size="small"
          [pTooltip]="editTooltip()"
          tooltipPosition="top"
          (onClick)="edit.emit()"
          [attr.aria-label]="editAriaLabel() || editTooltip()">
        </p-button>
      }

      @if (showView()) {
        <p-button
          icon="pi pi-eye"
          [outlined]="true"
          severity="secondary"
          size="small"
          [pTooltip]="viewTooltip()"
          tooltipPosition="top"
          (onClick)="view.emit()"
          [attr.aria-label]="viewAriaLabel() || viewTooltip()">
        </p-button>
      }

      @if (showDelete()) {
        <p-button
          icon="pi pi-trash"
          [outlined]="true"
          severity="danger"
          size="small"
          [pTooltip]="deleteTooltip()"
          tooltipPosition="top"
          (onClick)="delete.emit()"
          [attr.aria-label]="deleteAriaLabel() || deleteTooltip()">
        </p-button>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ActionButtonsComponent {
  // Control button visibility
  readonly showEdit = input<boolean>(false);
  readonly showView = input<boolean>(false);
  readonly showDelete = input<boolean>(false);

  // Tooltips
  readonly editTooltip = input<string>('Editar');
  readonly viewTooltip = input<string>('Visualizar');
  readonly deleteTooltip = input<string>('Remover');

  // Aria labels for accessibility
  readonly editAriaLabel = input<string>('');
  readonly viewAriaLabel = input<string>('');
  readonly deleteAriaLabel = input<string>('');

  // Events
  readonly edit = output<void>();
  readonly view = output<void>();
  readonly delete = output<void>();
}
