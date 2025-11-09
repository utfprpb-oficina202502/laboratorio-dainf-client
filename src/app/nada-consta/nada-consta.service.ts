import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {environment} from '../../environments/environment';
import {CrudService} from "../framework/service/crud.service";

export interface Usuario {
  id: number;
  nome: string;
  username: string;
  documento: string;
  email: string;
  telefone: string;
  permissoes: any[];
  fotoUrl: string | null;
  codigoVerificacao: string;
  ativo: boolean;
  authorities: any[];
  accountNonExpired: boolean;
  accountNonLocked: boolean;
  credentialsNonExpired: boolean;
  enabled: boolean;
}

export interface NadaConsta {
  id: number;
  usuario: Usuario;
  status: string;
  sendAt: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}


@Injectable({ providedIn: 'root' })
export class NadaConstaService extends CrudService<NadaConsta, number> {
  constructor() {
    const http = inject(HttpClient);
    super(`${environment.api_url}nadaconsta/`, http);
  }

  consultarNadaConsta(id: number) {
    return this.http.get<NadaConsta>(`${this.url}${id}`);
  }

  solicitar(documento: string) {
    return this.http.post(`${this.url}solicitar`, { documento });
  }
}
