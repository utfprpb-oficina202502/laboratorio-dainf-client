import {
  afterNextRender,
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  Injector,
  input,
  OnDestroy,
  signal
} from '@angular/core';
import {Card} from 'primeng/card';
import {Skeleton} from 'primeng/skeleton';
import {ChartService} from '../../../framework/charts/chart.service';
import {LoggerService} from '../../../framework/service/logger.service';
import {HistoricoUsoMensal} from '../../models/dashboard.models';

/**
 * Componente que exibe um gráfico de barras com o histórico de uso mensal.
 *
 * @description Usa o ChartService existente para criar um gráfico de barras
 * mostrando a quantidade de empréstimos por mês nos últimos 6 meses.
 *
 * @example
 * <app-usage-chart [history]="history()" [loading]="loading()" />
 */
@Component({
  selector: 'app-usage-chart',
  templateUrl: './usage-chart.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    Card,
    Skeleton
  ],
  host: {
    class: 'block'
  },
  styles: [`

    .card-custom-header {
      flex-shrink: 0;
    }
  `]
})
export class UsageChartComponent implements AfterViewInit, OnDestroy {
  /** Histórico de uso mensal vindo do backend */
  readonly history = input<HistoricoUsoMensal[]>([]);
  /** Indica se os dados estão carregando */
  readonly loading = input<boolean>(false);
  /** Indica se há dados para exibir */
  protected readonly hasData = signal(false);
  private readonly chartService = inject(ChartService);
  private readonly logger = inject(LoggerService);
  private readonly injector = inject(Injector);
  private readonly containerId = 'usage-chart-container';
  private viewInitialized = false;
  private chartCreated = false;

  constructor() {
    // Effect para reagir a mudanças nos dados
    effect(() => {
      const data = this.history();
      const isLoading = this.loading();

      if (!isLoading && data.length > 0) {
        // Setar hasData ANTES para que o container seja renderizado no DOM
        this.hasData.set(true);

        if (this.viewInitialized) {
          // Aguardar o próximo render para garantir que o container exista no DOM
          this.scheduleChartCreation(data);
        }
      } else if (!isLoading && data.length === 0) {
        this.hasData.set(false);
      }
    });
  }

  ngAfterViewInit(): void {
    this.viewInitialized = true;
    const data = this.history();
    if (!this.loading() && data.length > 0) {
      this.hasData.set(true);
      // Aguardar o próximo render para garantir que o container exista no DOM
      this.scheduleChartCreation(data);
    }
  }

  /**
   * Agenda a criação do gráfico após o próximo ciclo de renderização.
   * Usa afterNextRender do Angular para garantir sincronização com o DOM.
   * @param data Dados do histórico de uso
   */
  private scheduleChartCreation(data: HistoricoUsoMensal[]): void {
    afterNextRender(() => {
      this.createChart(data);
    }, {injector: this.injector});
  }

  ngOnDestroy(): void {
    // Dispose do gráfico ao destruir o componente
    if (this.chartCreated) {
      this.chartService.disposeChart(this.containerId);
    }
  }

  /**
   * Cria o gráfico de barras usando o ChartService.
   */
  private async createChart(data: HistoricoUsoMensal[]): Promise<void> {
    if (this.chartCreated) {
      this.chartService.disposeChart(this.containerId);
    }

    try {
      await this.chartService.createBarChart({
        containerId: this.containerId,
        data,
        categoryField: 'mesLabel',
        valueField: 'quantidade',
        noDataMessage: 'Nenhum empréstimo no período.'
      });

      this.chartCreated = true;
    } catch (error) {
      this.logger.error('Erro ao criar gráfico de uso', error);
      this.hasData.set(false);
    }
  }
}
