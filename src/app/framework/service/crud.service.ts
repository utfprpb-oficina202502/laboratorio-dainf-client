import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';

/**
 * Spring Data Page response structure
 */
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  numberOfElements?: number;
  first?: boolean;
  last?: boolean;
  empty?: boolean;
}

export abstract class CrudService<T, ID> {

  constructor(protected url: string, protected http: HttpClient) {
  }

  protected getUrl(): string {
    return this.url;
  }

  findAll(): Observable<T[]> {
    return this.http.get<T[]>(this.getUrl());
  }

  findAllByUsername(username: string): Observable<T[]> {
    return this.http.get<T[]>(this.getUrl() + `find-all-by-username/${username}`);
  }

  findOne(id: ID): Observable<T> {
    return this.http.get<T>(this.getUrl() + id);
  }

  findAllPaged(page: number, size: number, filter = ''): Observable<PageResponse<T>> {
    page = Math.max(0, Number(page));
    size = Math.max(1, Number(size));
    const params = new HttpParams()
      .set('page', String(page))
      .set('size', String(size))
      .set('filter', filter);
    return this.http.get<PageResponse<T>>(`${this.url}page`, {params});
  }

  save(t: T): Observable<T> {
    return this.http.post<T>(this.getUrl(), t);
  }

  delete(id: ID): Observable<void> {
    return this.http.delete<void>(`${this.url + id}`);
  }

  /**
   * Busca simples para autocomplete (extrai content da resposta paginada)
   * Para datasets pequenos onde virtualScroll não é necessário.
   * @param query Texto para filtro
   * @param size Quantidade máxima de resultados (default: 20)
   * @returns Observable de T[]
   */
  complete(query: string, size = 20): Observable<T[]> {
    return this.completePaged(query, 0, size).pipe(
      map((page: PageResponse<T>) => page?.content ?? [])
    );
  }

  /**
   * Busca paginada para autocomplete
   * @param query Texto para filtro
   * @param page Numero da pagina (0-indexed)
   * @param size Tamanho da pagina (default: 10)
   * @returns Observable de PageResponse<T>
   */
  completePaged(query: string, page = 0, size = 10): Observable<PageResponse<T>> {
    const params = new HttpParams()
    .set('query', query || '')
    .set('page', String(page))
    .set('size', String(size));
    return this.http.get<PageResponse<T>>(`${this.url}complete`, {params});
  }
}
