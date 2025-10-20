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
  displayedColumns = [
    'id',
    'usuarioUsername',
    'status',
    'sendAt',
    'createdAt',
    'updatedAt',
    'createdBy',
    'updatedBy',
    'acoes'
  ];
  dataSource: NadaConsta[] = [];
  carregando = false;
  totalElements = 0;
  page = 0;
  size = 10;
  pageSizeOptions = [5, 10, 25, 50, 100];
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
    this.nadaConstaService.listarTodosPageable(this.page, this.size)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.dataSource = res.content;
          this.totalElements = res.totalElements;
          this.carregando = false;
        },
        error: () => {
          this.carregando = false;
        }
      });
  }

  onPageChange(event: { first: number; rows: number; page: number; }) {
    this.page = event.page;
    this.size = event.rows;
    this.carregarLista();
  }

  adicionar() {
    this.router.navigate(['/nada-consta/adicionar']);
  }
}
