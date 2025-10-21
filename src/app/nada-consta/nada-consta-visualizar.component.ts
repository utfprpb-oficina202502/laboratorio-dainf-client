import { Component, OnDestroy, inject, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
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
  id: number | null = null;
  resultado: NadaConsta | null = null;
  erro: string | null = null;
  carregando = false;
  liveRegionText = '';
  private destroyed$ = new Subject<void>();
  private nadaConstaService = inject(NadaConstaService);
  private cdr = inject(ChangeDetectorRef);

  // Getter público para facilitar testes
  getCdr() { return this.cdr; }

  consultar() {
    const id = this.id;
    if (id === null || id === undefined) {
      this.erro = 'Informe o ID do registro.';
      this.resultado = null;
      this.liveRegionText = this.erro ?? '';
      this.cdr.markForCheck();
      return;
    }
    this.carregando = true;
    this.liveRegionText = 'Consultando registro...';
    // id is narrowed, safe to use
    this.nadaConstaService.consultarNadaConsta(id)
      .pipe(takeUntil(this.destroyed$))
      .subscribe({
        next: (res: NadaConsta) => {
          this.resultado = res;
          this.erro = null;
          this.carregando = false;
          this.liveRegionText = `Consulta concluída. Registro ID ${res.id}, usuário ${res.usuario?.nome || ''}, status ${res.status}.`;
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.resultado = null;
          this.erro = err?.error?.message || 'Erro ao consultar registro.';
          this.carregando = false;
          this.liveRegionText = this.erro ?? '';
          this.cdr.markForCheck();
        }
      });
  }

  ngOnDestroy() {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
