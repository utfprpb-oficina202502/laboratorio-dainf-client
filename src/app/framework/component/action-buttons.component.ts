import {ChangeDetectionStrategy, Component, input, output} from '@angular/core';

import {ButtonModule} from 'primeng/button';
import {TooltipModule} from 'primeng/tooltip';

/**
 * Unified action buttons component for list tables
 * Provides consistent edit/delete/view button styling across the application
 */
@Component({
  selector: 'app-action-buttons',
  imports: [ButtonModule, TooltipModule],
  templateUrl: './action-buttons.component.html',
  styleUrls: ['./action-buttons.component.css'],
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
