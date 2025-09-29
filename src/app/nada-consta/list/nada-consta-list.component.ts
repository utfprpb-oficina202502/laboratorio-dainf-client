import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NadaConstaService, NadaConsta } from '../nada-consta.service';
import { Subject, takeUntil } from 'rxjs';
// PrimeNG modules
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';

@Component({
  selector: 'app-nada-consta-list',
  templateUrl: './nada-consta-list.component.html',
  styleUrls: ['./nada-consta-list.component.css'],
  standalone: true,
  imports: [CommonModule, TableModule, ButtonModule, ProgressBarModule]
})
export class NadaConstaListComponent implements OnInit, OnDestroy {
  displayedColumns = ['alunoId', 'nome', 'nadaConsta', 'acoes'];
  dataSource: NadaConsta[] = [];
  carregando = false;
  private destroy$ = new Subject<void>();

  constructor(private nadaConstaService: NadaConstaService, private router: Router) {}

  ngOnInit() {
    this.carregarLista();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  carregarLista() {
    this.carregando = true;
    this.nadaConstaService.listarTodos()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (dados) => {
          this.dataSource = dados;
          this.carregando = false;
        },
        error: () => {
          this.dataSource = [];
          this.carregando = false;
        }
      });
  }

  adicionar() {
    this.router.navigate(['/nada-consta/adicionar']);
  }
}
