import {HttpClient} from '@angular/common/http';
import {inject, Injectable} from '@angular/core';
import {environment} from '../../environments/environment';
import {CrudService} from "../framework/service/crud.service";

export interface Usuario {
  id: number;
  nome: string;
  username: string;
  documento: string;
  email: string;
  telefone: string;
  permissoes: string[];
  fotoUrl: string | null;
  codigoVerificacao: string;
  ativo: boolean;
  authorities: string[];
  accountNonExpired: boolean;
  accountNonLocked: boolean;
  credentialsNonExpired: boolean;
  enabled: boolean;
}

export interface NadaConsta {
  id: number;
  usuario: Usuario;
  /** Email do usuário (campo do DTO simplificado do backend) */
  usuarioEmail?: string;
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
   * @returns Resultado da requisição
   * @example
   * this.nadaConstaService.consultarNadaConsta(123).subscribe(...)
   */
  consultarNadaConsta(id: number) {
    return this.http.get<NadaConsta>(`${this.url}${id}`);
  }

  /**
   * Solicita um Nada Consta pelo documento.
   * @param {string} documento Documento do usuário
   * @returns Resultado da requisição
   * @example
   * this.nadaConstaService.solicitar('12345678900').subscribe(...)
   */
  solicitar(documento: string) {
    return this.http.post(`${this.url}solicitar`, { documento });
  }

  /**
   * Verifica pendências do Nada Consta pelo id.
   * @param {number} id Identificador do registro
   * @returns Resultado da requisição
   * @example
   * this.nadaConstaService.verificarPendencias(123).subscribe(...)
   */
  verificarPendencias(id: number) {
    return this.http.put<NadaConsta>(`${this.url}verificar-pendencias/${id}`, {});
  }

  /**
   * Invalida o Nada Consta pelo id.
   * @param {number} id Identificador do registro
   * @returns Resultado da requisição
   * @example
   * this.nadaConstaService.invalidar(123).subscribe(...)
   */
  invalidar(id: number) {
    return this.http.put<NadaConsta>(`${this.url}invalidar/${id}`, {});
  }

  /**
   * Baixa o PDF do Nada Consta.
   * @param {number} id Identificador do registro
   * @returns Resultado da requisição com o PDF em formato arraybuffer
   * @example
   * this.nadaConstaService.downloadPdf(123).subscribe(...)
   */
  downloadPdf(id: number) {
    return this.http.get(`${this.url}${id}/pdf`, { responseType: 'arraybuffer' });
  }

  /**
   * Reenvia o email com o Nada Consta.
   * @param {number} id Identificador do registro
   * @returns Resultado da requisição
   * @example
   * this.nadaConstaService.reenviarEmail(123).subscribe(...)
   */
  reenviarEmail(id: number) {
    return this.http.post(`${this.url}${id}/reenvio`, {});
  }
}
