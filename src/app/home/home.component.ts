import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
  signal
} from "@angular/core";
import {CommonModule, DatePipe} from '@angular/common';
import {RouterLink} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {finalize, forkJoin} from 'rxjs';

import {DashboardEmprestimoCountRange} from "./dashboard/dashboardEmprestimoCountRange";
import {HomeService} from "./home.service";
import {LoginService} from "../login/login.service";
import {DateUtil} from "../framework/util/dateUtil";
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
  // Constants
  private static readonly DEFAULT_DATE_RANGE_DAYS = 90;
  private static readonly STORAGE_KEY_DATE_INI = "dash_dt_ini";
  private static readonly STORAGE_KEY_DATE_FIM = "dash_dt_fim";
  // Signals - UI State
  protected readonly dialogVisible = signal(false);
  private readonly loginService = inject(LoginService);
  private readonly chartService = inject(ChartService);
  protected readonly dtIniFiltro = signal<string | null>(null);
  protected readonly dtFimFiltro = signal<string | null>(null);
  protected readonly loadingStats = signal(false);
  protected readonly loadingCharts = signal(false);
  protected readonly showDashboardAluno = signal(false);
  protected readonly hasDashboardData = signal(false);
  protected readonly dashEmprestimoCount = signal(new DashboardEmprestimoCountRange());
  // Computed - Derived State
  protected readonly disableBtnFiltrar = computed(() =>
    !this.dtIniFiltro() || !this.dtFimFiltro()
  );
  // Services
  private readonly homeService = inject(HomeService);
  private readonly datepipe = inject(DatePipe);
  // Private State
  private viewInitialized = false;
  private pendingDashboardBuild = false;
  private latestRequestToken = 0;
  private destroyed = false;

  ngOnInit(): void {
    // Don't show blocking loader - let skeletons handle visual feedback
    this.loginService.userLoggedIsAlunoOrProfessor().then((value) => {
      if (this.destroyed) {
        return;
      }
      this.showDashboardAluno.set(!!value);

      if (!this.showDashboardAluno()) {
        if (this.viewInitialized) {
          this.buildDashboards();
        } else {
          this.pendingDashboardBuild = true;
        }
      }
    }).catch(() => {
      // Error handled, signal update is automatic
    });
  }

  ngAfterViewInit(): void {
    this.viewInitialized = true;
    if (this.pendingDashboardBuild && !this.showDashboardAluno()) {
      this.pendingDashboardBuild = false;
      this.buildDashboards();
    }
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.chartService.disposeAll();
  }

  protected buildDashboards(): void {
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

    this.loadingStats.set(true);

    this.homeService.findDadosEmprestimoCountInRange(ini, fim)
      .pipe(finalize(() => {
        this.loadingStats.set(false);
      }))
      .subscribe({
        next: (count) => {
          if (this.destroyed || requestToken !== this.latestRequestToken) {
            return;
          }
          this.dashEmprestimoCount.set(count);

          if (this.hasStatData()) {
            this.loadCharts(ini, fim, requestToken);
          } else {
            this.hasDashboardData.set(false);
          }
        },
        error: () => {
          this.hasDashboardData.set(false);
        }
      });
  }

  protected openFilterDialog(): void {
    this.dialogVisible.set(true);
  }

  protected filtrar(): void {
    const ini = this.dtIniFiltro();
    const fim = this.dtFimFiltro();

    if (!ini || !fim) {
      return;
    }

    localStorage.setItem(HomeComponent.STORAGE_KEY_DATE_INI, ini);
    localStorage.setItem(HomeComponent.STORAGE_KEY_DATE_FIM, fim);

    this.dialogVisible.set(false);
    this.dtIniFiltro.set(null);
    this.dtFimFiltro.set(null);
    this.buildDashboards();
  }

  protected getDateIni(): string {
    let dtIni = localStorage.getItem(HomeComponent.STORAGE_KEY_DATE_INI);
    if (!dtIni) {
      dtIni = this.datepipe.transform(
        DateUtil.removeDays(new Date(), HomeComponent.DEFAULT_DATE_RANGE_DAYS),
        "dd/MM/yyyy"
      ) ?? '';
      localStorage.setItem(HomeComponent.STORAGE_KEY_DATE_INI, dtIni);
    }
    return dtIni;
  }

  protected getDateFim(): string {
    let dtFim = localStorage.getItem(HomeComponent.STORAGE_KEY_DATE_FIM);
    if (!dtFim) {
      dtFim = this.datepipe.transform(new Date(), "dd/MM/yyyy") ?? '';
      localStorage.setItem(HomeComponent.STORAGE_KEY_DATE_FIM, dtFim);
    }
    return dtFim;
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

  private loadCharts(ini: string, fim: string, requestToken: number): void {
    this.loadingCharts.set(true);

    const chartBatch = forkJoin({
      byDay: this.homeService.findDadosEmprestimoByDayInRange(ini, fim),
      emprestados: this.homeService.findItensMaisEmprestados(ini, fim),
      adquiridos: this.homeService.findItensMaisAdquiridos(ini, fim),
      saidas: this.homeService.findItensMaisSaidas(ini, fim)
    });

    chartBatch.pipe(finalize(() => {
      this.loadingCharts.set(false);
    })).subscribe({
      next: ({ byDay, emprestados, adquiridos, saidas }) => {
        if (this.destroyed || requestToken !== this.latestRequestToken) {
          return;
        }

        const byDayProcessed = this.processByDay(byDay, 'dtEmprestimo');
        const emprestadosTop = Array.isArray(emprestados) ? emprestados : [];
        const adquiridosList = Array.isArray(adquiridos) ? adquiridos : [];
        const saidasList = Array.isArray(saidas) ? saidas : [];

        const hasData = this.hasAnyData(byDayProcessed, emprestadosTop, adquiridosList, saidasList);
        this.hasDashboardData.set(hasData);

        if (!hasData) {
          this.chartService.disposeAll();
          return;
        }

        setTimeout(() => {
          if (this.destroyed || !this.hasDashboardData()) {
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
        const count = this.dashEmprestimoCount();
        this.hasDashboardData.set((count?.total ?? 0) > 0);
      }
    });
  }

  /**
   * Check if stat cards have any data to display
   */
  private hasStatData(): boolean {
    const count = this.dashEmprestimoCount();
    return (
      (count?.total ?? 0) > 0 ||
      (count?.emAndamento ?? 0) > 0 ||
      (count?.emAtraso ?? 0) > 0 ||
      (count?.finalizado ?? 0) > 0
    );
  }

  /**
   * Check if dashboard has any data including stats and charts
   */
  private hasAnyData(byDay: unknown[], emprestados: unknown[], adquiridos: unknown[], saidas: unknown[]): boolean {
    return (
      this.hasStatData() ||
      byDay.length > 0 ||
      emprestados.length > 0 ||
      adquiridos.length > 0 ||
      saidas.length > 0
    );
  }
}

