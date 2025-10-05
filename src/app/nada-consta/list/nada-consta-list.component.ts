import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
  OnInit
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Router} from '@angular/router';
import {NadaConsta, NadaConstaService} from '../nada-consta.service';
import {Subject, takeUntil} from 'rxjs';
// PrimeNG modules
import {TableModule} from 'primeng/table';
import {ButtonModule} from 'primeng/button';

@Component({
  selector: 'app-nada-consta-list',
  templateUrl: './nada-consta-list.component.html',
  styleUrls: ['./nada-consta-list.component.css'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TableModule, ButtonModule]
})
export class NadaConstaListComponent implements OnInit, OnDestroy {
  private readonly nadaConstaService = inject(NadaConstaService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  displayedColumns = ['alunoId', 'nome', 'nadaConsta', 'acoes'];
  dataSource: NadaConsta[] = [];
  carregando = false;
  private readonly destroy$ = new Subject<void>();

  ngOnInit() {
    this.carregarLista();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  carregarLista() {
    this.carregando = true;
    this.cdr.markForCheck();
    this.nadaConstaService.listarTodos()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (dados) => {
          this.dataSource = dados;
          this.carregando = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.dataSource = [];
          this.carregando = false;
          this.cdr.markForCheck();
        }
      });
  }

  adicionar() {
    this.router.navigate(['/nada-consta/consultar']);
  }
}
