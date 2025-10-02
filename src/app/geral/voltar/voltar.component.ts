import { Component, output } from '@angular/core';

@Component({
  selector: 'app-voltar',
  templateUrl: './voltar.component.html',
  standalone: false
})
export class VoltarComponent {
  readonly onClick = output<void>();

  click(): void {
    this.onClick.emit();
  }
}
