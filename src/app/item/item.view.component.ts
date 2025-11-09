import {Component, inject, Injector, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Item} from './item';
import {ItemService} from './item.service';
import {Reserva} from '../reserva/reserva';
import {environment} from 'src/environments/environment';
import {LoginService} from '../login/login.service';

// PrimeNG
import {DataViewModule} from 'primeng/dataview';
import {TagModule} from 'primeng/tag';
import {ButtonModule} from 'primeng/button';
import {CardModule} from 'primeng/card';

@Component({
    selector: 'app-view-item',
    templateUrl: './item.view.component.html',
  imports: [
    CommonModule,
    // PrimeNG
    DataViewModule,
    TagModule,
    ButtonModule,
    CardModule
  ]
})
export class ItemViewComponent implements OnInit {
  protected itemService = inject(ItemService);
  protected injector = inject(Injector);
  private readonly loginService = inject(LoginService);

  isAlunoOrProfessor = false;
  reservasItem: Reserva[] = [];
  dialogReservaitem = false;
  displayedColumnsReserva = ['dataRetirada', 'qtde'];
  layout: 'grid' | 'list' = 'grid';
  minioUrl: string;
  itens: Item[] = [];

  constructor() {
    this.minioUrl = environment.minio_url;
  }

  ngOnInit() {
    this.itemService.findAll().subscribe({
      next: (value) => this.itens = value
    });
  }

  postFindAll(): void {
    this.loginService.userLoggedIsAlunoOrProfessor().then(value => this.isAlunoOrProfessor = value);
  }

  applyFilter() {
    //todo ver pq isso aqui tá vazio
  }
}
