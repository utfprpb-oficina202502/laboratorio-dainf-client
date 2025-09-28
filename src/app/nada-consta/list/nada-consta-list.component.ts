import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { NadaConstaService, NadaConsta } from '../nada-consta.service';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'app-nada-consta-list',
  templateUrl: './nada-consta-list.component.html',
  styleUrls: ['./nada-consta-list.component.css'],
  standalone: true,
  imports: [CommonModule, MatTableModule, MatButtonModule, MatProgressBarModule]
})
export class NadaConstaListComponent {
  displayedColumns = ['alunoId', 'nome', 'nadaConsta', 'acoes'];
  dataSource: NadaConsta[] = [];
  carregando = false;

  constructor(private nadaConstaService: NadaConstaService, private router: Router) {
    this.carregarLista();
  }

  carregarLista() {
    this.carregando = true;
    this.nadaConstaService.listarTodos().subscribe({
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
