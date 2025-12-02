import {inject, Injectable} from '@angular/core';
import {CrudService, PageResponse} from '../framework/service/crud.service';
import {Emprestimo} from './emprestimo';
import {HttpClient, HttpParams} from '@angular/common/http';
import {environment} from '../../environments/environment';
import {Observable} from 'rxjs';
import {EmprestimoFilter} from './emprestimo.filter';

@Injectable()
export class EmprestimoService extends CrudService<Emprestimo, number> {

  constructor() {
    const http = inject<HttpClient>(HttpClient);

    super(`${environment.api_url}emprestimo/`, http);
  }

  saveEmprestimo(emprestimo: Emprestimo, idReserva: number): Observable<Emprestimo> {
    return this.http.post<Emprestimo>(this.getUrl() + `save-emprestimo?idReserva=${idReserva}`, emprestimo);
  }

  saveDevolucao(emprestimo: Emprestimo): Observable<Emprestimo> {
    return this.http.post<Emprestimo>(this.getUrl() + 'save-devolucao', emprestimo);
  }

  filter(filter: EmprestimoFilter): Observable<Emprestimo[]> {
    return this.http.post<Emprestimo[]>(this.getUrl() + 'filter', filter);
  }

  changePrazoDevolucao(id: number, novaData: string): Observable<void> {
    return this.http.get<void>(this.getUrl() + `change-prazo-devolucao?id=${id}&novaData=${novaData}`);
  }

  findByItem(itemId: number): Observable<Emprestimo[]> {
    return this.http.get<Emprestimo[]>(this.getUrl() + `find-by-item/${itemId}`);
  }

  /**
   * Busca empréstimos de um item com paginação
   * @param itemId ID do item
   * @param page Número da página (0-indexed)
   * @param size Tamanho da página
   * @param order Campo para ordenação (default: 'id')
   * @param asc Ordem ascendente (default: true)
   * @returns Observable de PageResponse<Emprestimo>
   */
  findByItemPaged(itemId: number, page = 0, size = 10, order = 'id', asc = true): Observable<PageResponse<Emprestimo>> {
    const params = new HttpParams()
      .set('page', String(page))
      .set('size', String(size))
      .set('order', order)
      .set('asc', String(asc));
    return this.http.get<PageResponse<Emprestimo>>(this.getUrl() + `find-by-item/${itemId}`, { params });
  }
}
