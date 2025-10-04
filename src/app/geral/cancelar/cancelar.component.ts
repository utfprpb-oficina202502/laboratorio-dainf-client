import {Component, output} from '@angular/core';
import {ButtonModule} from 'primeng/button';

@Component({
  selector: 'app-cancelar',
  templateUrl: './cancelar.component.html',
  imports: [ButtonModule]
})
export class CancelarComponent {
  readonly onClick = output<void>();

  click(): void {
    this.onClick.emit();
  }
}
