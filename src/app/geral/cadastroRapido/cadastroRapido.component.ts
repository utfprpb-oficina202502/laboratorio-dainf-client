import {Component, input} from '@angular/core';
import {RouterLink} from '@angular/router';

@Component({
    selector: 'app-cadastroRapido',
    templateUrl: './cadastroRapido.component.html',
    styleUrls: ['./cadastroRapido.component.css'],
  imports: [RouterLink]
})
export class CadastroRapidoComponent {
  readonly href = input<string>();
  readonly id = input<number>();
}
