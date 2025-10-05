import {Component, inject, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {RelatorioService} from './relatorio.service';
import {LoaderService} from '../framework/loader/loader.service';
import {DomSanitizer} from '@angular/platform-browser';
import {Relatorio} from './relatorio';
import {pt} from '../framework/constantes/calendarPt';
import {RelatorioParamsValue} from './relatorioParamsValue';
import {StringUtils} from '../framework/util/string.utils';

// PrimeNG
import {CardModule} from 'primeng/card';
import {ButtonModule} from 'primeng/button';
import {InputTextModule} from 'primeng/inputtext';
import {DialogModule} from 'primeng/dialog';
import {DatePickerModule} from 'primeng/datepicker';

// Custom modules
import {VoltarComponent} from '../geral/voltar/voltar.component';

@Component({
    selector: 'app-viewer-relatorio',
    templateUrl: './relatorio.viewer.component.html',
    styleUrls: ['./relatorio.viewer.component.css'],
  imports: [
    CommonModule,
    FormsModule,
    // PrimeNG
    CardModule,
    ButtonModule,
    InputTextModule,
    DialogModule,
    DatePickerModule,
    // Custom
    VoltarComponent,
  ]
})
export class RelatorioViewerComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly loaderService = inject(LoaderService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly relatorioService = inject(RelatorioService);

  reportHTML: any;
  relatorioCurrent: Relatorio;
  dialogFiltroRelatorio = false;
  localePt: any;
  relatorioParamValue: RelatorioParamsValue[];

  ngOnInit(): void {
    this.localePt = pt;
    this.route.params.subscribe(params => {
      if (params.id) {
        this.findDadosRelatorio(params.id);
      }
    });
  }

  back() {
    this.router.navigate(['relatorio']);
  }

  findDadosRelatorio(id: number) {
    this.relatorioService.findOne(id)
      .subscribe(e => {
        this.relatorioCurrent = e;
        if (this.relatorioCurrent.paramsList.length > 0) {
          this.openFiltro();
        } else {
          this.generateReport(id, null);
        }
      });
  }

  openFiltro() {
    this.dialogFiltroRelatorio = true;
    this.initValueDefaultFiltro();
  }

  generateReport(id: number, params: RelatorioParamsValue[]) {
    this.loaderService.show();
    const mapToSend: Map<string, any> = new Map<string, any>();
    mapToSend.set("idRel", id);
    mapToSend.set("params", params);

    const convMap = {};
    mapToSend.forEach((val: string, key: string) => {
      convMap[key] = val;
    });

    this.relatorioService.generateReport(convMap)
      .subscribe(e => {
        let file = new Blob([e], {type: 'application/pdf'});
        let fileURL = URL.createObjectURL(file);
        this.reportHTML = this.getSafeUrl(fileURL);
        this.loaderService.hide();
      });
  }

  getSafeUrl(url) {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  filtroIsValid() {
    let isValid = true;
    this.relatorioParamValue.forEach(value => {
      if (StringUtils.isBlank(value.valueParam)) {
        isValid = false;
      }
    });
    return isValid;
  }

  updateParamsValue(tipoFiltro: string, nameFiltro: string, valueFiltro: any) {
    this.relatorioParamValue.forEach(param => {
      if (param.nameParam === nameFiltro) {
        if (tipoFiltro === 'D') {
          param.valueParam = valueFiltro;
        } else if (tipoFiltro === 'S') {
          param.valueParam = valueFiltro;
        } else if (tipoFiltro === 'N') {
          if (valueFiltro === '') {
            param.valueParam = null;
          } else {
            param.valueParam = Number(valueFiltro);
          }
        }
      }
    });
  }

  onChangeValueParam($event: any, tipoFiltro: string, nameFiltro: string) {
    if (tipoFiltro === 'D') {
      this.updateParamsValue(tipoFiltro, nameFiltro, new Date($event).toLocaleDateString());
    } else {
      this.updateParamsValue(tipoFiltro, nameFiltro, $event.target.value);
    }
  }

  initValueDefaultFiltro() {
    this.relatorioParamValue = new Array();
    this.relatorioCurrent.paramsList.forEach(param => {
      let valueParamFiltro = new RelatorioParamsValue();
      valueParamFiltro.nameParam = param.nameParam;
      this.relatorioParamValue.push(valueParamFiltro);
    });
  }

  filtrar() {
    this.generateReport(this.relatorioCurrent.id, this.relatorioParamValue);
    this.dialogFiltroRelatorio = false;
  }
}
