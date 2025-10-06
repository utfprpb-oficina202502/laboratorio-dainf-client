import {Component, input, model, output, ViewEncapsulation} from '@angular/core';
import {ButtonModule} from 'primeng/button';
import {DialogModule} from 'primeng/dialog';
import {Z_INDEX} from '../../framework/constants';

@Component({
    selector: 'app-help',
    templateUrl: './help.component.html',
    styleUrls: ['./help.component.css'],
    encapsulation: ViewEncapsulation.None,
  imports: [
    ButtonModule,
    DialogModule
  ]
})
export class HelpComponent {
  readonly dialogHelp = model<boolean>(false);
  readonly messageHelp = input<string>('');
  readonly helpClick = output<void>();

  // Constants for template
  protected readonly Z_INDEX = Z_INDEX;

  click() {
    this.dialogHelp.set(true);
    this.helpClick.emit();
  }
}
