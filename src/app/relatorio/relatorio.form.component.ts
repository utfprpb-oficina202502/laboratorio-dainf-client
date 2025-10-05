import {ChangeDetectorRef, Component, ElementRef, inject, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {CrudFormComponent} from '../framework/component/crud.form.component';
import {Relatorio} from './relatorio';
import {RelatorioService} from './relatorio.service';
import {FileUpload, FileUploadModule} from 'primeng/fileupload';
import {SelectItem} from 'primeng/api';
import {environment} from '../../environments/environment';
import {RelatorioParams} from './relatorioParams';
import {StringUtils} from '../framework/util/string.utils';
import {Table, TableModule} from 'primeng/table';

// PrimeNG Components
import {CardModule} from 'primeng/card';
import {ButtonModule} from 'primeng/button';
import {InputTextModule} from 'primeng/inputtext';
import {TooltipModule} from 'primeng/tooltip';
import {DialogModule} from 'primeng/dialog';
import {FieldsetModule} from 'primeng/fieldset';
import {DatePickerModule} from "primeng/datepicker";
import {SelectModule} from "primeng/select";

// Custom modules
import {VoltarComponent} from '../geral/voltar/voltar.component';
import {SalvarComponent} from '../geral/salvar/salvar.component';
import {CancelarComponent} from '../geral/cancelar/cancelar.component';

// Framework components
// Validation

@Component({
    selector: 'app-form-relatorio',
    templateUrl: './relatorio.form.component.html',
    styleUrls: ['./relatorio.form.component.css'],
  imports: [
    CommonModule,
    FormsModule,
    // PrimeNG
    CardModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    TooltipModule,
    DialogModule,
    FieldsetModule,
    FileUploadModule,
    DatePickerModule,
    SelectModule,
    // Custom
    VoltarComponent,
    SalvarComponent,
    CancelarComponent,
    // Framework
    // Validation

  ]
})
export class RelatorioFormComponent extends CrudFormComponent<Relatorio, number> {
  protected override service = inject(RelatorioService);
  protected override urlList = '/relatorio';
  protected override type = undefined;
  protected cdr = inject(ChangeDetectorRef);

  @ViewChild('table') table: Table;
  @ViewChild('fileUpload') fileUpload: FileUpload;
  @ViewChild('nomeParam') nomeParam: ElementRef;
  uploadedFiles: any[] = [];
  callback: Function;
  tipoParamDropdown: SelectItem[];
  relatorioParams: RelatorioParams;

  constructor() {
    super();

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
    this.validExtra = false;
    if (this.editando || this.fileUpload.files.length > 0) {
      this.validExtra = true;
    }
    this.save();
  }
}
