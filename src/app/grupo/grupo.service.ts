import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {environment} from '../../environments/environment';
import {Grupo} from './grupo';
import {CrudService, PageResponse} from '../framework/service/crud.service';
import {Observable} from 'rxjs';
import {Item} from '../item/item';

@Injectable()
export class GrupoService extends CrudService<Grupo, number> {

  constructor() {
    const http = inject<HttpClient>(HttpClient);

    super(`${environment.api_url}grupo/`, http);
  }

  // Usa completePaged() herdado de CrudService

  findItensVinculados(
    id: number,
    page = 0,
    size = 25,
    filter = ''
  ): Observable<PageResponse<Item>> {
    const params = new HttpParams()
    .set('page', String(page))
    .set('size', String(size))
    .set('filter', filter);
    return this.http.get<PageResponse<Item>>(
      this.url + `itens-vinculados/${id}`,
      {params}
    );
  }
}
