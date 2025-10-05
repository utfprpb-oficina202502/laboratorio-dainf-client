import {Component, output} from '@angular/core';
import {ButtonModule} from 'primeng/button';

@Component({
    selector: 'app-novo',
    templateUrl: './novo.component.html',
    styleUrls: ['./novo.component.css'],
  imports: [ButtonModule]
})
export class NovoComponent {
  readonly novoClick = output<void>();

  click(): void {
    this.novoClick.emit();
  }
}
