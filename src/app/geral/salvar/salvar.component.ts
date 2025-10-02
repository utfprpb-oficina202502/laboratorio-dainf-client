import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-salvar',
  templateUrl: './salvar.component.html',
  standalone: false
})
export class SalvarComponent {
  readonly typeButton = input<string>('button');
  readonly disabled = input(false);
  readonly onClick = output<void>();

  click(): void {
    this.onClick.emit();
  }
}
