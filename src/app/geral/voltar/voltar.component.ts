import {Component, output} from '@angular/core';
import {ButtonModule} from 'primeng/button';
import {TooltipModule} from 'primeng/tooltip';

@Component({
  selector: 'app-voltar',
  templateUrl: './voltar.component.html',
  imports: [
    ButtonModule,
    TooltipModule
  ]
})
export class VoltarComponent {
  readonly onClick = output<void>();

  click(): void {
    this.onClick.emit();
  }
}
