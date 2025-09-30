import {Component, Injector, OnInit} from '@angular/core';
import {Item} from './item';
import {ItemService} from './item.service';
import {Reserva} from '../reserva/reserva';
import { environment } from 'src/environments/environment';
import { LoginService } from '../login/login.service';

@Component({
    selector: 'app-view-item',
    templateUrl: './item.view.component.html',
    styleUrls: ['./item.view.component.css'],
    standalone: false
})
export class ItemViewComponent implements OnInit {
  isAlunoOrProfessor = false;
  reservasItem: Reserva[];
  dialogReservaitem = false;
  displayedColumnsReserva = ['dataRetirada', 'qtde'];
  layout: 'grid' | 'list' = 'grid';
  minioUrl: string;
  itens: Item[];

  constructor(protected itemService: ItemService,
              protected injector: Injector,
              private readonly loginService: LoginService,) {
    this.minioUrl = environment.minio_url;
  }

  ngOnInit() {
    this.itemService.findAll().subscribe(value => this.itens = value);
  }

  postFindAll(): void {
    this.loginService.userLoggedIsAlunoOrProfessor().then(value => this.isAlunoOrProfessor = value);
  }

  applyFilter(valor: string) {
    //todo ver pq isso aqui tá vazio
  }
}
