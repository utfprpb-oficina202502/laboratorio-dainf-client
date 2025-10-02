import { Component, output } from '@angular/core';

@Component({
  selector: 'app-cancelar',
  templateUrl: './cancelar.component.html',
  standalone: false
})
export class CancelarComponent {
  readonly onClick = output<void>();

  click(): void {
    this.onClick.emit();
  }
}
