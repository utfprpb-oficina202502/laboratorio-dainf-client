import {Component, input, output} from '@angular/core';
import {ButtonModule} from 'primeng/button';

@Component({
  selector: 'app-salvar',
  templateUrl: './salvar.component.html',
  imports: [ButtonModule]
})
export class SalvarComponent {
  readonly typeButton = input<string>('button');
  readonly disabled = input(false);
  readonly saveClick = output<void>();

  click(): void {
    this.saveClick.emit();
  }
}
