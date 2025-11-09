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

  /**
   * Consulta um Nada Consta pelo id.
   * @param {number} id Identificador do registro
   * @returns {Observable<NadaConsta>} Observable do resultado da requisição
   * @example
   * this.nadaConstaService.consultarNadaConsta(123).subscribe(...)
   */
  consultarNadaConsta(id: number) {
    return this.http.get<NadaConsta>(`${this.url}${id}`);
  }

  /**
   * Solicita um Nada Consta pelo documento.
   * @param {string} documento Documento do usuário
   * @returns {Observable<any>} Observable do resultado da requisição
   * @example
   * this.nadaConstaService.solicitar('12345678900').subscribe(...)
   */
  solicitar(documento: string) {
    return this.http.post(`${this.url}solicitar`, { documento });
  }

  /**
   * Verifica pendências do Nada Consta pelo id.
   * @param {number} id Identificador do registro
   * @returns {Observable<NadaConsta>} Observable do resultado da requisição
   * @example
   * this.nadaConstaService.verificarPendencias(123).subscribe(...)
   */
  verificarPendencias(id: number) {
    return this.http.put<NadaConsta>(`${this.url}verificar-pendencias/${id}`, {});
  }

  /**
   * Invalida o Nada Consta pelo id.
   * @param {number} id Identificador do registro
   * @returns {Observable<NadaConsta>} Observable do resultado da requisição
   * @example
   * this.nadaConstaService.invalidar(123).subscribe(...)
   */
  invalidar(id: number) {
    return this.http.put<NadaConsta>(`${this.url}invalidar/${id}`, {});
  }
}
