import {Z_INDEX} from '../framework/constants';
import {Component, inject, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {RelatorioService} from './relatorio.service';
import {LoaderService} from '../framework/loader/loader.service';
import {Relatorio} from './relatorio';
import {pt} from '../framework/constantes/calendarPt';
import {RelatorioParamsValue} from './relatorioParamsValue';
import {StringUtils} from '../framework/util/string.utils';
import {BreakpointService} from '../framework/services/breakpoint.service';
import {extractRouteParam, parseNumericId} from '../framework/utils/route-params.operators';

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
  reportURL: string | null = null;
  reportBlob: Blob | null = null;

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly loaderService = inject(LoaderService);
  private readonly relatorioService = inject(RelatorioService);
  protected readonly breakpointService = inject(BreakpointService);
  localePt: unknown;
  relatorioCurrent: Relatorio | null = null;
  dialogFiltroRelatorio = false;
  // Constants for template
  protected readonly Z_INDEX = Z_INDEX;
  relatorioParamValue!: RelatorioParamsValue[];

  ngOnInit(): void {
    this.localePt = pt;
    // Extração e validação de parâmetro ID com operator utilitário
    this.route.params.pipe(
      extractRouteParam({
        paramName: 'id',
        converter: parseNumericId,
        onError: () => {
          this.back();
        }
      })
    ).subscribe({
      next: (id) => {
        if (id !== null) {
          this.findDadosRelatorio(id);
        }
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
        if (this.relatorioCurrent?.paramsList && this.relatorioCurrent.paramsList.length > 0) {
          this.openFiltro();
        } else {
          this.generateReport(id, []);
        }
      });
  }

  openFiltro() {
    this.dialogFiltroRelatorio = true;
    this.initValueDefaultFiltro();
  }

  generateReport(id: number, params: RelatorioParamsValue[]) {
    this.loaderService.show();
    const mapToSend = new Map<string, unknown>();
    mapToSend.set("idRel", id);
    mapToSend.set("params", params);

    const convMap: Record<string, unknown> = {};
    mapToSend.forEach((val: unknown, key: string) => {
      convMap[key] = val;
    });

    this.relatorioService.generateReport(convMap)
      .subscribe(e => {
        this.reportBlob = new Blob([e], {type: 'application/pdf'});
        this.reportURL = URL.createObjectURL(this.reportBlob);
        this.loaderService.hide();
      });
  }

  downloadReport() {
    if (this.reportURL && this.relatorioCurrent) {
      const link = document.createElement('a');
      link.href = this.reportURL;
      link.download = `${this.relatorioCurrent.nome}.pdf`;
      link.click();
    }
  }

  filtroIsValid() {
    let isValid = true;
    this.relatorioParamValue.forEach(value => {
      if (StringUtils.isBlank(value.valueParam as string)) {
        isValid = false;
      }
    });
    return isValid;
  }

  updateParamsValue(tipoFiltro: string, nameFiltro: string, valueFiltro: unknown) {
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

  onChangeValueParam($event: unknown, tipoFiltro: string, nameFiltro: string) {
    if (tipoFiltro === 'D') {
      this.updateParamsValue(tipoFiltro, nameFiltro, new Date($event as string | number | Date).toLocaleDateString());
    } else {
      this.updateParamsValue(tipoFiltro, nameFiltro, ($event as {
        target: { value: unknown }
      }).target.value);
    }
  }

  initValueDefaultFiltro() {
    this.relatorioParamValue = [];
    this.relatorioCurrent?.paramsList?.forEach(param => {
      const valueParamFiltro = new RelatorioParamsValue();
      valueParamFiltro.nameParam = param.nameParam;
      this.relatorioParamValue.push(valueParamFiltro);
    });
  }

  filtrar() {
    if (this.relatorioCurrent?.id) {
      this.generateReport(this.relatorioCurrent.id, this.relatorioParamValue);
      this.dialogFiltroRelatorio = false;
    }
  }
}
