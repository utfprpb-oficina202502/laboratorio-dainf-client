import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';

export interface Pendencia {
  tipo: string;
  descricao: string;
}

export interface NadaConsta {
  alunoId: number;
  nome: string;
  nadaConsta: boolean;
  pendencias: Pendencia[];
}

@Injectable({ providedIn: 'root' })
export class NadaConstaService {
  private readonly http = inject(HttpClient);


  consultarNadaConsta(alunoId: number): Observable<NadaConsta> {
    return this.http.get<NadaConsta>(`/api/alunos/${alunoId}/nada-consta`);
  }

  listarTodos(): Observable<NadaConsta[]> {
    return this.http.get<NadaConsta[]>(`/api/nada-consta`);
  }
}
