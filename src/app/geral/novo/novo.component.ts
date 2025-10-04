import {Component, output} from '@angular/core';
import {ButtonModule} from 'primeng/button';

@Component({
    selector: 'app-novo',
    templateUrl: './novo.component.html',
    styleUrls: ['./novo.component.css'],
  imports: [ButtonModule]
})
export class NovoComponent {
  readonly onClick = output<void>();

  click(): void {
    this.onClick.emit();
  }
}
