import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NadaConstaService, NadaConsta } from './nada-consta.service';
import { Subject, takeUntil } from 'rxjs';
// PrimeNG modules
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';

@Component({
  selector: 'app-nada-consta-visualizar',
  templateUrl: './nada-consta-visualizar.component.html',
  styleUrls: ['./nada-consta-visualizar.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    InputTextModule,
    ButtonModule,
    ProgressBarModule
  ]
})
export class NadaConstaVisualizarComponent implements OnDestroy {
  alunoId: number | null = null;
  resultado: NadaConsta | null = null;
  erro: string | null = null;
  carregando = false;
  private destroyed$ = new Subject<void>();

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
    this.nadaConstaService.consultarNadaConsta(this.alunoId)
      .pipe(takeUntil(this.destroyed$))
      .subscribe({
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

  ngOnDestroy() {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
