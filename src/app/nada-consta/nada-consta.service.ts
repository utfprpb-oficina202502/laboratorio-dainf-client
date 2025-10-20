import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';

export interface Pendencia {
  tipo: string;
  descricao: string;
}

export interface NadaConsta {
  id: number;
  usuarioUsername: string;
  status: string;
  sendAt: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export interface PageableResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

@Injectable({ providedIn: 'root' })
export class NadaConstaService {
  private readonly http = inject(HttpClient);


  consultarNadaConsta(id: number): Observable<NadaConsta> {
    return this.http.get<NadaConsta>(`/nadaconsta/${id}`);
  }

  listarTodos(): Observable<NadaConsta[]> {
    return this.http.get<NadaConsta[]>(`/nadaconsta`);
  }

  listarTodosPageable(page: number = 0, size: number = 10, sort: string = 'id,desc'): Observable<PageableResponse<NadaConsta>> {
    return this.http.get<PageableResponse<NadaConsta>>(`/nadaconsta?page=${page}&size=${size}&sort=${sort}`);
  }
}
