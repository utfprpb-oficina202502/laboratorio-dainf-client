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
import {catchError, finalize, forkJoin, of} from 'rxjs';
import {Z_INDEX} from '../framework/constants';

import {DashboardEmprestimoCountRange} from "./dashboard/dashboardEmprestimoCountRange";
import {HomeService} from "./home.service";
import {LoginService} from "../login/login.service";
import {DateUtil} from "../framework/util/dateUtil";
import {ChartService} from "../framework/charts/chart.service";
import {LoggerService} from "../framework/services/logger.service";
import {BreakpointService} from "../framework/services/breakpoint.service";
import {MessageService} from 'primeng/api';

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

// Dashboard Aluno/Professor Components
import {
  ActivityTimelineComponent,
  AlertCenterComponent,
  FrequentItemsComponent,
  LoanCalendarComponent,
  LoanStatCardsComponent,
  UsageChartComponent
} from './components';
import {
  AtividadeUsuario,
  EstatisticasUsuario,
  EventoCalendario,
  HistoricoUsoMensal,
  ItemFrequenteUsuario
} from './models/dashboard.models';

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
    // Custom - Dashboard Admin
    StatCardComponent,
    SkeletonCardComponent,
    SkeletonChartComponent,
    // Custom - Dashboard Aluno/Professor
    AlertCenterComponent,
    LoanStatCardsComponent,
    LoanCalendarComponent,
    ActivityTimelineComponent,
    UsageChartComponent,
    FrequentItemsComponent
  ]
})
export class HomeComponent implements OnInit, OnDestroy, AfterViewInit {
  // Constants for template
  protected readonly Z_INDEX = Z_INDEX;

  // Constants
  private static readonly DEFAULT_DATE_RANGE_DAYS = 90;
  private static readonly STORAGE_KEY_DATE_INI = "dash_dt_ini";
  private static readonly STORAGE_KEY_DATE_FIM = "dash_dt_fim";
  // Signals - UI State
  protected dialogVisible = signal(false);
  private readonly loginService = inject(LoginService);
  private readonly chartService = inject(ChartService);
  protected readonly breakpointService = inject(BreakpointService);
  // Signals para controlar visibilidade dos botões de fullscreen
  protected readonly hasLineChartData = signal(false);
  protected dtIniFiltro = signal<string | null>(null);
  protected dtFimFiltro = signal<string | null>(null);
  protected readonly loadingStats = signal(false);
  protected readonly loadingCharts = signal(false);
  protected readonly showDashboardAluno = signal(false);
  protected readonly hasDashboardData = signal(false);
  protected readonly dashEmprestimoCount = signal(new DashboardEmprestimoCountRange());
  protected readonly hasBarChartData = signal(false);
  protected readonly hasPie1ChartData = signal(false);
  protected readonly hasPie2ChartData = signal(false);
  private readonly logger = inject(LoggerService);
  private readonly messageService = inject(MessageService);

  // =============================================
  // Signals - Dashboard Aluno/Professor
  // =============================================
  protected readonly userStats = signal<EstatisticasUsuario | null>(null);
  protected readonly userFrequentItems = signal<ItemFrequenteUsuario[]>([]);
  protected readonly userUsageHistory = signal<HistoricoUsoMensal[]>([]);
  protected readonly userActivities = signal<AtividadeUsuario[]>([]);
  protected readonly userCalendarEvents = signal<EventoCalendario[]>([]);
  protected readonly loadingUserStats = signal(false);
  protected readonly loadingUserItems = signal(false);
  protected readonly loadingUserHistory = signal(false);
  protected readonly loadingUserActivities = signal(false);
  protected readonly loadingUserCalendar = signal(false);
  protected readonly userName = signal<string>('');
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
      this.showDashboardAluno.set(value);

      if (this.showDashboardAluno()) {
        // Dashboard do Aluno/Professor
        this.loadUserName();
        this.loadUserDashboard();
      } else if (this.viewInitialized) {
        // Dashboard do Admin - view já inicializada
        this.buildDashboards();
      } else {
        // Dashboard do Admin - aguarda ngAfterViewInit
        this.pendingDashboardBuild = true;
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

  protected toggleFullscreen(wrapperId: string): void {
    const wrapper = document.getElementById(wrapperId);
    if (!wrapper) {
      return;
    }

    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      // Coloca o wrapper (header + gráfico) em fullscreen
      wrapper.requestFullscreen().catch(err => {
        this.logger.error(`Erro ao entrar em tela cheia: ${err.message}`, err);
      });
    }
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

  private processByDay(data: unknown[], dateField: string): (Record<string, unknown> & {
    _dtParsed: Date
  })[] {
    if (!Array.isArray(data)) {
      return [];
    }
    return data
    .map(d => {
      const record = d as Record<string, unknown>;
      const raw = record[dateField];
      if (raw && typeof raw === 'string') {
        const parts = raw.split('/');
        if (parts.length === 3) {
          const [dd, mm, yyyy] = parts;
          const parsed = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
          return {...record, _dtParsed: parsed};
        }
      }
      return {...record, _dtParsed: new Date(record[dateField] as string | number | Date)};
    })
    .filter((d): d is Record<string, unknown> & { _dtParsed: Date } => {
      return !Number.isNaN(d._dtParsed.getTime());
    });
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

        // Atualiza signals de dados por gráfico
        this.hasLineChartData.set(byDayProcessed.length > 0);
        this.hasBarChartData.set(emprestadosTop.length > 0);
        this.hasPie1ChartData.set(adquiridosList.length > 0);
        this.hasPie2ChartData.set(saidasList.length > 0);

        if (!hasData) {
          this.chartService.disposeAll();
          return;
        }

        setTimeout(async () => {
          if (this.destroyed || !this.hasDashboardData()) {
            return;
          }
          // Create charts using the new chart service (agora com carregamento dinâmico)
          try {
            await Promise.all([
              this.chartService.createLineChart({
                containerId: 'chartdiv2',
                data: byDayProcessed,
                dateField: '_dtParsed',
                valueField: 'qtde',
                noDataMessage: 'Nenhum empréstimo diário registrado no período.'
              }),

              this.chartService.createBarChart({
                containerId: 'chartdiv4',
                data: emprestadosTop,
                categoryField: 'item',
                valueField: 'qtde',
                noDataMessage: 'Nenhum item emprestado no período.'
              }),

              this.chartService.createPieChart({
                containerId: 'chartdivPie1',
                data: adquiridosList,
                categoryField: 'item',
                valueField: 'qtde',
                noDataMessage: 'Nenhum item adquirido no período.'
              }),

              this.chartService.createPieChart({
                containerId: 'chartdivPie2',
                data: saidasList,
                categoryField: 'item',
                valueField: 'qtde',
                noDataMessage: 'Nenhum item com saídas no período.'
              })
            ]);
          } catch (error) {
            this.logger.error('Erro ao carregar gráficos', error);
            this.hasDashboardData.set(false);
            this.messageService.add({
              severity: 'warn',
              summary: 'Gráficos indisponíveis',
              detail: 'Não foi possível carregar os gráficos. Tente recarregar a página.',
              life: 5000
            });
          }
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

  // =============================================
  // Dashboard Aluno/Professor - Métodos
  // =============================================

  /**
   * Carrega o nome do usuário logado.
   */
  private loadUserName(): void {
    this.loginService.getCurrentUser().subscribe({
      next: (user) => {
        if (user?.nome) {
          // Pega apenas o primeiro nome
          const firstName = user.nome.split(' ')[0];
          this.userName.set(firstName);
        }
      }
    });
  }

  /**
   * Manipula o evento de mudança de mês do calendário.
   * Busca novos eventos para o período selecionado.
   *
   * @param event Evento contendo month (0-11) e year
   */
  protected onCalendarMonthChange(event: { month: number; year: number }): void {
    this.loadCalendarEvents(event.month, event.year);
  }

  /**
   * Carrega todos os dados do dashboard do aluno/professor.
   * Usa forkJoin para paralelizar as chamadas HTTP.
   * Cada chamada tem tratamento de erro individual para resiliência.
   */
  private loadUserDashboard(): void {
    // Ativa todos os loading states
    this.loadingUserStats.set(true);
    this.loadingUserItems.set(true);
    this.loadingUserHistory.set(true);
    this.loadingUserActivities.set(true);

    // Paraleliza todas as chamadas HTTP com tratamento de erro individual
    forkJoin({
      stats: this.homeService.getMyStats().pipe(
        catchError(err => {
          this.logger.error('Erro ao carregar estatísticas do usuário', err);
          return of(null);
        })
      ),
      items: this.homeService.getMyFrequentItems().pipe(
        catchError(err => {
          this.logger.error('Erro ao carregar itens frequentes', err);
          return of([]);
        })
      ),
      history: this.homeService.getMyUsageHistory().pipe(
        catchError(err => {
          this.logger.error('Erro ao carregar histórico de uso', err);
          return of([]);
        })
      ),
      activities: this.homeService.getMyActivity().pipe(
        catchError(err => {
          this.logger.error('Erro ao carregar atividades', err);
          return of([]);
        })
      )
    }).pipe(
      finalize(() => {
        // Desativa todos os loading states ao finalizar
        this.loadingUserStats.set(false);
        this.loadingUserItems.set(false);
        this.loadingUserHistory.set(false);
        this.loadingUserActivities.set(false);
      })
    ).subscribe({
      next: ({stats, items, history, activities}) => {
        if (this.destroyed) {
          return;
        }
        this.userStats.set(stats);
        this.userFrequentItems.set(items);
        this.userUsageHistory.set(history);
        this.userActivities.set(activities);
      }
    });

    // Carrega eventos do calendário separadamente (usa período diferente)
    this.loadCalendarEvents();
  }

  /**
   * Carrega os eventos do calendário para um mês específico (ou mês atual por padrão).
   *
   * @param month Mês (0-11), padrão: mês atual
   * @param year Ano, padrão: ano atual
   */
  private loadCalendarEvents(month?: number, year?: number): void {
    const now = new Date();
    const targetMonth = month ?? now.getMonth();
    const targetYear = year ?? now.getFullYear();

    // Carrega o mês anterior, atual e próximo para ter contexto nas transições
    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth + 2, 0); // Último dia do mês seguinte

    const dtIni = this.datepipe.transform(startDate, 'dd/MM/yyyy') ?? '';
    const dtFim = this.datepipe.transform(endDate, 'dd/MM/yyyy') ?? '';

    this.loadingUserCalendar.set(true);
    this.homeService.getMyCalendarEvents(dtIni, dtFim)
    .pipe(finalize(() => this.loadingUserCalendar.set(false)))
    .subscribe({
      next: (events) => this.userCalendarEvents.set(events),
      error: (err) => this.logger.error('Erro ao carregar eventos do calendário', err)
    });
  }
}

