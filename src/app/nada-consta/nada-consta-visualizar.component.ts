import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { NadaConstaService, NadaConsta } from './nada-consta.service';

@Component({
  selector: 'app-nada-consta-visualizar',
  templateUrl: './nada-consta-visualizar.component.html',
  styleUrls: ['./nada-consta-visualizar.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressBarModule
  ]
})
export class NadaConstaVisualizarComponent {
  alunoId: number | null = null;
  resultado: NadaConsta | null = null;
  erro: string | null = null;
  carregando = false;

  constructor(private nadaConstaService: NadaConstaService) {}

  consultar() {
    if (!this.alunoId) {
      this.erro = 'Informe o ID do aluno.';
      this.resultado = null;
      return;
    }
    this.carregando = true;
    this.erro = null;
    this.resultado = null;
    this.nadaConstaService.consultarNadaConsta(this.alunoId).subscribe({
      next: (res) => {
        this.resultado = res;
        this.carregando = false;
      },
      error: () => {
        this.erro = 'Erro ao consultar Nada Consta.';
        this.carregando = false;
      }
    });
  }
}
