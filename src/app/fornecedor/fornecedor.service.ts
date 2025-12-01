import {inject, Injectable} from '@angular/core';
import {CrudService} from '../framework/service/crud.service';
import {Fornecedor} from './fornecedor';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../environments/environment';

@Injectable()
export class FornecedorService extends CrudService<Fornecedor, number> {

  constructor() {
    const http = inject<HttpClient>(HttpClient);

    super(`${environment.api_url}fornecedor/`, http);
  }
}
