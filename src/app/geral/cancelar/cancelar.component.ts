import {Component, output} from '@angular/core';
import {ButtonModule} from 'primeng/button';

@Component({
  selector: 'app-cancelar',
  templateUrl: './cancelar.component.html',
  imports: [ButtonModule]
})
export class CancelarComponent {
  readonly cancelClick = output<void>();

  click(): void {
    this.cancelClick.emit();
  }
}
