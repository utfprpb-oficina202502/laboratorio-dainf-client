import {Component, input, model, output, ViewEncapsulation} from '@angular/core';
import {ButtonModule} from 'primeng/button';
import {DialogModule} from 'primeng/dialog';

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
  readonly onClick = output<void>();

  click() {
    this.dialogHelp.set(true);
    this.onClick.emit();
  }
}
