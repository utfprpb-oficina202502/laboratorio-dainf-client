import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { CrudService } from '../framework/service/crud.service';

export interface Configuracoes {
  nadaConstaEmail: string;
}

@Injectable({ providedIn: 'root' })
export class ConfiguracoesService extends CrudService<Configuracoes, number> {
  constructor() {
    const http = inject(HttpClient);
    super(`${environment.api_url}config/`, http);
  }

  getConfiguracoes() {
    return this.http.get<Configuracoes>(this.url);
  }

  salvarConfiguracoes(config: Configuracoes) {
    return this.http.post(this.url, config);
  }
}
