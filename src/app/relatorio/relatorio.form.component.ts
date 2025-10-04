import { Component, ElementRef, Injector, ViewChild, inject, ChangeDetectorRef } from '@angular/core';
import {CrudFormComponent} from '../framework/component/crud.form.component';
import {Relatorio} from './relatorio';
import {RelatorioService} from './relatorio.service';
import {FileUpload} from 'primeng/fileupload';
import {SelectItem} from 'primeng/api';
import {environment} from '../../environments/environment';
import {RelatorioParams} from './relatorioParams';
import {StringUtils} from '../framework/util/string.utils';
import {Table} from 'primeng/table';

@Component({
    selector: 'app-form-relatorio',
    templateUrl: './relatorio.form.component.html',
    styleUrls: ['./relatorio.form.component.css'],
    standalone: false
})
export class RelatorioFormComponent extends CrudFormComponent<Relatorio, number> {
  protected relatorioService: RelatorioService;
  protected injector: Injector;
  protected cdr: ChangeDetectorRef;

  @ViewChild('table') table: Table;
  @ViewChild('fileUpload') fileUpload: FileUpload;
  @ViewChild('nomeParam') nomeParam: ElementRef;
  uploadedFiles: any[] = [];
  callback: Function;
  tipoParamDropdown: SelectItem[];
  relatorioParams: RelatorioParams;

  constructor() {
    const relatorioService = inject(RelatorioService);
    const injector = inject(Injector);
    const cdr = inject(ChangeDetectorRef);

    super(relatorioService, injector, '/relatorio');
    this.relatorioService = relatorioService;
    this.injector = injector;
    this.cdr = cdr;

    this.tipoParamDropdown = [
      {label: 'String', value: 'S'},
      {label: 'Number', value: 'N'},
      {label: 'Date', value: 'D'},
    ];

    this.relatorioParams = new RelatorioParams();
    this.relatorioParams.tipoParam = this.tipoParamDropdown[0].value;
  }

  onUpload($event: any) {
    this.callback();
  }

  getUrlUploadImages(): string {
    return `${environment.api_url}relatorio/upload-file-report?idRelatorio=${this.object.id}`;
  }

  insertParam() {
    if (StringUtils.isNotBlank(this.relatorioParams.tipoParam)
      && StringUtils.isNotBlank(this.relatorioParams.nameParam)
      && StringUtils.isNotBlank(this.relatorioParams.aliasParam)) {

      this.object.paramsList ??= new Array();
      this.object.paramsList.push(this.relatorioParams);
      this.postInsertParam();
    } else {
      this.messageService.add({severity: 'info', summary: 'Atenção', detail: 'Necessário preencher todos os campos corretamente!'});
    }
  }

  postInsertParam() {
    this.relatorioParams = new RelatorioParams();
    this.relatorioParams.tipoParam = this.tipoParamDropdown[0].value;
    this.cdr.markForCheck();
    this.nomeParam.nativeElement.focus();
  }

  postSave(callback: Function) {
    this.fileUpload.url = this.getUrlUploadImages();
    this.fileUpload.upload();
    this.callback = callback;
  }

  removeParam(nameParam: string) {
    let index: number;
    for (const param of this.object.paramsList) {
      if (param.nameParam === nameParam) {
        index = this.object.paramsList.indexOf(param);
      }
    }
    this.object.paramsList.splice(index, 1);
    this.cdr.markForCheck();
  }

  preSave() {
    if (this.editando) {
      this.validExtra = true;
    } else {
      this.fileUpload.files.length > 0 ? this.validExtra = true : this.validExtra = false;
    }
    this.save();
  }
}
