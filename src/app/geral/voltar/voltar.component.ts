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
  readonly backClick = output<void>();

  click(): void {
    this.backClick.emit();
  }
}
