import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { CrudService } from '../framework/service/crud.service';

export interface Configuracoes {
  nadaConstaEmail: string;
}

@Injectable({ providedIn: 'root' })
export class ConfiguracoesService extends CrudService<Configuracoes, number> {
  constructor(http: HttpClient) {
    super(`${environment.api_url}config`, http);
  }

  getConfiguracoes() {
    return this.http.get<Configuracoes>(this.url);
  }

  salvarConfiguracoes(config: Configuracoes) {
    return this.http.post(this.url, config);
  }
}
