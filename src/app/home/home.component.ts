import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
  OnInit
} from "@angular/core";
import {CommonModule, DatePipe} from '@angular/common';
import {RouterLink} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {finalize, forkJoin} from 'rxjs';

import {DashboardEmprestimoCountRange} from "./dashboard/dashboardEmprestimoCountRange";
import {HomeService} from "./home.service";
import {LoginService} from "../login/login.service";
import {DateUtil} from "../framework/util/dateUtil";
import {pt} from "../framework/constantes/calendarPt";
import {LoaderService} from "../framework/loader/loader.service";
import {ChartService} from "../framework/charts/chart.service";

// PrimeNG
import {DialogModule} from 'primeng/dialog';
import {TooltipModule} from 'primeng/tooltip';
import {DatePickerModule} from 'primeng/datepicker';
import {PanelModule} from 'primeng/panel';
import {ButtonModule} from 'primeng/button';

// Custom Components
import {StatCardComponent} from '../components/stat-card/stat-card.component';
import {SkeletonCardComponent} from '../framework/component/skeleton-card.component';
import {SkeletonChartComponent} from '../framework/component/skeleton-chart.component';

@Component({
  selector: "app-home",
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.css"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    // PrimeNG
    DialogModule,
    TooltipModule,
    DatePickerModule,
    PanelModule,
    ButtonModule,
    // Custom
    StatCardComponent,
    SkeletonCardComponent,
    SkeletonChartComponent,
  ]
})
export class HomeComponent implements OnInit, OnDestroy, AfterViewInit {
  private readonly homeService = inject(HomeService);
  private readonly loginService = inject(LoginService);
  private readonly loaderService = inject(LoaderService);
  private readonly chartService = inject(ChartService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly datepipe: DatePipe = inject(DatePipe);

  dashEmprestimoCount: DashboardEmprestimoCountRange;
  dialodFiltroData = false;
  dtIniFiltro: string;
  dtFimFiltro: string;
  localePt: any;
  private viewInitialized = false;
  private pendingDashboardBuild = false;
  showDashboardAluno = false;
  hasDashboardData = false;
  private latestRequestToken = 0;
  private destroyed = false;
  loadingStats = false;
  loadingCharts = false;

  constructor() {
    this.dashEmprestimoCount = new DashboardEmprestimoCountRange();
    this.localePt = pt;
  }

  ngOnInit() {
    this.loaderService.show();

    this.loginService.userLoggedIsAlunoOrProfessor().then((value) => {
      if (this.destroyed) {
        this.loaderService.hide();
        return;
      }
      this.showDashboardAluno = !!value;
      this.cdr.markForCheck();

      if (this.showDashboardAluno) {
        this.loaderService.hide();
      } else if (this.viewInitialized) {
        this.buildDashboards();
      } else {
        this.pendingDashboardBuild = true;
      }
    }).catch(() => {
      this.loaderService.hide();
      this.cdr.markForCheck();
    });
  }

  ngAfterViewInit() {
    this.viewInitialized = true;
    if (this.pendingDashboardBuild && !this.showDashboardAluno) {
      this.pendingDashboardBuild = false;
      this.buildDashboards();
    }
  }

  ngOnDestroy() {
    this.destroyed = true;
    this.chartService.disposeAll();
  }

  buildDashboards() {
    if (this.destroyed || !this.viewInitialized) {
      this.pendingDashboardBuild = !this.viewInitialized;
      return;
    }
    this.pendingDashboardBuild = false;

    // Dispose existing charts before rebuilding to prevent memory leaks
    this.chartService.disposeAll();

    const ini = this.getDateIni();
    const fim = this.getDateFim();
    const requestToken = ++this.latestRequestToken;

    this.loadingStats = true;
    this.loaderService.show();
    this.cdr.markForCheck();

    this.homeService.findDadosEmprestimoCountInRange(ini, fim)
      .pipe(finalize(() => {
        this.loadingStats = false;
        this.loaderService.hide(); // Hide loader immediately after stats load
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (count) => {
          if (this.destroyed || requestToken !== this.latestRequestToken) {
            return;
          }
          this.dashEmprestimoCount = count;

          const hasStatData = (
            (this.dashEmprestimoCount?.total ?? 0) > 0 ||
            (this.dashEmprestimoCount?.emAndamento ?? 0) > 0 ||
            (this.dashEmprestimoCount?.emAtraso ?? 0) > 0 ||
            (this.dashEmprestimoCount?.finalizado ?? 0) > 0
          );

          this.cdr.markForCheck();

          if (hasStatData) {
            this.loadCharts(ini, fim, requestToken);
          } else {
            this.hasDashboardData = false;
            this.cdr.markForCheck();
          }
        },
        error: () => {
          this.hasDashboardData = false;
          this.cdr.markForCheck();
        }
      });
  }

  private loadCharts(ini: string, fim: string, requestToken: number) {
    this.loadingCharts = true;
    const chartBatch = forkJoin({
      byDay: this.homeService.findDadosEmprestimoByDayInRange(ini, fim),
      emprestados: this.homeService.findItensMaisEmprestados(ini, fim),
      adquiridos: this.homeService.findItensMaisAdquiridos(ini, fim),
      saidas: this.homeService.findItensMaisSaidas(ini, fim)
    });

    chartBatch.pipe(finalize(() => {
      this.loadingCharts = false;
      this.cdr.markForCheck();
    })).subscribe({
      next: ({ byDay, emprestados, adquiridos, saidas }) => {
        if (this.destroyed || requestToken !== this.latestRequestToken) {
          return;
        }

        const byDayProcessed = this.processByDay(byDay, 'dtEmprestimo');
        // ChartService now handles top 10 limiting for all charts
        const emprestadosTop = Array.isArray(emprestados) ? emprestados : [];
        const adquiridosList = Array.isArray(adquiridos) ? adquiridos : [];
        const saidasList = Array.isArray(saidas) ? saidas : [];

        this.hasDashboardData = (
          (this.dashEmprestimoCount?.total ?? 0) > 0 ||
          (this.dashEmprestimoCount?.emAndamento ?? 0) > 0 ||
          (this.dashEmprestimoCount?.emAtraso ?? 0) > 0 ||
          (this.dashEmprestimoCount?.finalizado ?? 0) > 0 ||
          byDayProcessed.length > 0 ||
          emprestadosTop.length > 0 ||
          adquiridosList.length > 0 ||
          saidasList.length > 0
        );

        if (!this.hasDashboardData) {
          this.chartService.disposeAll();
          this.cdr.markForCheck();
          return;
        }

        this.cdr.markForCheck();

        setTimeout(() => {
          if (this.destroyed || !this.hasDashboardData) {
            return;
          }
          // Create charts using the new chart service
          this.chartService.createLineChart({
            containerId: 'chartdiv2',
            data: byDayProcessed,
            dateField: '_dtParsed',
            valueField: 'qtde',
            noDataMessage: 'Nenhum empréstimo diário registrado no período.'
          });

          this.chartService.createBarChart({
            containerId: 'chartdiv4',
            data: emprestadosTop,
            categoryField: 'item',
            valueField: 'qtde',
            noDataMessage: 'Nenhum item emprestado no período.'
          });

          this.chartService.createPieChart({
            containerId: 'chartdivPie1',
            data: adquiridosList,
            categoryField: 'item',
            valueField: 'qtde',
            noDataMessage: 'Nenhum item adquirido no período.'
          });

          this.chartService.createPieChart({
            containerId: 'chartdivPie2',
            data: saidasList,
            categoryField: 'item',
            valueField: 'qtde',
            noDataMessage: 'Nenhum item com saídas no período.'
          });
        }, 0);
      },
      error: () => {
        this.hasDashboardData = (this.dashEmprestimoCount?.total ?? 0) > 0;
        this.cdr.markForCheck();
      }
    });
  }

  private processByDay(data: any[], dateField: string) {
    if (!Array.isArray(data)) {
      return [];
    }
    return data
      .map(d => {
        const raw = d[dateField];
        if (raw && typeof raw === 'string') {
          const parts = raw.split('/');
          if (parts.length === 3) {
            const [dd, mm, yyyy] = parts;
            const parsed = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
            return {...d, _dtParsed: parsed};
          }
        }
        return {...d, _dtParsed: new Date(d[dateField])};
      })
      .filter(d => !Number.isNaN(d._dtParsed?.getTime?.()))
      .sort((a, b) => a._dtParsed.getTime() - b._dtParsed.getTime());
  }

  openFilterDialog(): void {
    this.dialodFiltroData = true;
  }

  filtrar() {
    this.dialodFiltroData = false;
    localStorage.setItem("dash_dt_ini", this.dtIniFiltro);
    localStorage.setItem("dash_dt_fim", this.dtFimFiltro);
    this.dtIniFiltro = null;
    this.dtFimFiltro = null;
    this.buildDashboards();
  }

  getDateIni() {
    let dtIni = localStorage.getItem("dash_dt_ini");
    if (!dtIni) {
      dtIni = this.datepipe.transform(
        DateUtil.removeDays(new Date(), 90),
        "dd/MM/yyyy"
      );
      localStorage.setItem("dash_dt_ini", dtIni);
    }
    return dtIni;
  }

  getDateFim() {
    let dtFim = localStorage.getItem("dash_dt_fim");
    if (!dtFim) {
      dtFim = this.datepipe.transform(new Date(), "dd/MM/yyyy");
      localStorage.setItem("dash_dt_fim", dtFim);
    }
    return dtFim;
  }

  disableBtnFiltrar() {
    return (
      this.dtIniFiltro == null ||
      this.dtIniFiltro === "" ||
      this.dtFimFiltro == null ||
      this.dtFimFiltro === ""
    );
  }
}

