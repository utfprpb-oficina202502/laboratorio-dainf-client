import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';

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

  complete(query: string): Observable<T[]> {
    return this.http.get<T[]>(`${this.url}complete?query=${query}`);
  }
}
