import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  effect,
  inject,
  OnDestroy,
  OnInit
} from "@angular/core";
import * as am4core from "@amcharts/amcharts4/core";
import * as am4charts from "@amcharts/amcharts4/charts";
import {DatePipe} from '@angular/common';
import {finalize, forkJoin} from 'rxjs';

import {DashboardEmprestimoCountRange} from "./dashboard/dashboardEmprestimoCountRange";
import {HomeService} from "./home.service";
import {LoginService} from "../login/login.service";
import {DateUtil} from "../framework/util/dateUtil";
import {pt} from "../framework/constantes/calendarPt";
import {LoaderService} from "../framework/loader/loader.service";
import {ThemeService} from "../framework/services/theme.service";
import {
  chartColorSchemes,
  ChartColorsConfig,
  getAlternatingColor
} from "../framework/charts/chart-colors.config";

@Component({
  selector: "app-home",
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.css"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false
})
export class HomeComponent implements OnInit, OnDestroy, AfterViewInit {
  private readonly homeService = inject(HomeService);
  private readonly loginService = inject(LoginService);
  private readonly loaderService = inject(LoaderService);
  private readonly cdr = inject(ChangeDetectorRef);

  datepipe: DatePipe = inject(DatePipe);
  dashEmprestimoCount: DashboardEmprestimoCountRange;
  dialodFiltroData = false;
  dtIniFiltro: string;
  dtFimFiltro: string;
  localePt: any;
  private readonly themeService = inject(ThemeService);
  private chartColors: ChartColorsConfig = chartColorSchemes.light;
  private chartLineRef: am4charts.XYChart;
  private chartBarRef: am4charts.XYChart;
  private chartPie1Ref: am4charts.PieChart;
  private chartPie2Ref: am4charts.PieChart;
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
    effect(() => {
      const mode = this.themeService.themeMode();
      this.chartColors = chartColorSchemes[mode] ?? chartColorSchemes.light;
      if (!this.destroyed) {
        this.applyThemeToExistingCharts();
      }
    });
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
      } else {
        if (this.viewInitialized) {
          this.buildDashboards();
        } else {
          this.pendingDashboardBuild = true;
        }
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
    this.disposeChart(this.chartLineRef);
    this.chartLineRef = null;
    this.disposeChart(this.chartBarRef);
    this.chartBarRef = null;
    this.disposeChart(this.chartPie1Ref);
    this.chartPie1Ref = null;
    this.disposeChart(this.chartPie2Ref);
    this.chartPie2Ref = null;
  }

  buildDashboards() {
    if (this.destroyed || !this.viewInitialized) {
      this.pendingDashboardBuild = !this.viewInitialized;
      return;
    }
    this.pendingDashboardBuild = false;

    // Dispose existing charts before rebuilding to prevent memory leaks
    this.disposeAllCharts();

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
        const emprestadosTop = Array.isArray(emprestados)
          ? [...emprestados].sort((a, b) => (b?.qtde || 0) - (a?.qtde || 0)).slice(0, 10)
          : [];
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
          this.disposeAllCharts();
          this.cdr.markForCheck();
          return;
        }

        this.cdr.markForCheck();

        setTimeout(() => {
          if (this.destroyed || !this.hasDashboardData) {
            return;
          }
          this.updateXYChartLine("chartdiv2", byDayProcessed, "_dtParsed", "qtde");
          this.updateXYChartBar("chartdiv4", emprestadosTop, "item", "qtde");
          this.updatePieChart("chartdivPie1", adquiridosList, "item", "qtde");
          this.updatePieChart("chartdivPie2", saidasList, "item", "qtde");
        }, 0);
      },
      error: () => {
        this.hasDashboardData = (this.dashEmprestimoCount?.total ?? 0) > 0;
        this.cdr.markForCheck();
      }
    });
  }

  private disposeChart(ref: am4core.BaseObject | null | undefined) {
    try {
      if (ref) {
        ref.dispose();
      }
    } catch { /* ignore */
    }
  }

  private disposeAllCharts(): void {
    this.disposeChart(this.chartLineRef);
    this.chartLineRef = null;
    this.disposeChart(this.chartBarRef);
    this.chartBarRef = null;
    this.disposeChart(this.chartPie1Ref);
    this.chartPie1Ref = null;
    this.disposeChart(this.chartPie2Ref);
    this.chartPie2Ref = null;
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

  private updatePieChart(elementId: string, data: any[], nameField: string, nameValue: string) {
    let pieChart = elementId === 'chartdivPie1' ? this.chartPie1Ref : this.chartPie2Ref;

    if (!pieChart || pieChart.isDisposed()) {
      pieChart = am4core.create(elementId, am4charts.PieChart);
      pieChart.background.fill = am4core.color(this.chartColors.background);
      pieChart.hiddenState.properties.opacity = 0;

      const series = pieChart.series.push(new am4charts.PieSeries());
      series.dataFields.value = nameValue;
      series.dataFields.category = nameField;
      series.labels.template.disabled = true;
      series.ticks.template.disabled = true;
      series.slices.template.tooltipText = `{${nameField}}: {${nameValue}}`;
      series.slices.template.strokeWidth = 1;
      series.slices.template.strokeOpacity = 1;
      series.slices.template.adapter.add("fill", (fill, target) => {
        if (target?.dataItem?.index !== undefined) {
          const color = getAlternatingColor(target.dataItem.index, this.chartColors.pie.palette);
          return am4core.color(color);
        }
        return fill;
      });

      const sliceHover = series.slices.template.states.getKey('hover') ?? series.slices.template.states.create('hover');
      sliceHover.properties.scale = 1.05;
      sliceHover.properties.shiftRadius = 0.04;

      pieChart.legend = new am4charts.Legend();
      pieChart.legend.position = 'bottom';
      pieChart.legend.useDefaultMarker = true;
      pieChart.legend.labels.template.maxWidth = 160;
      pieChart.legend.labels.template.truncate = false;
      pieChart.legend.labels.template.wrap = true;
      pieChart.legend.valueLabels.template.disabled = true;
      pieChart.legend.itemContainers.template.tooltipText = '';
      pieChart.legend.itemContainers.template.clickable = false;
      pieChart.legend.itemContainers.template.focusable = false;
      pieChart.legend.itemContainers.template.cursorOverStyle = am4core.MouseCursorStyle.default;
      pieChart.legend.markers.template.adapter.add("fill", (fill, target) => {
        if (target?.dataItem?.index !== undefined) {
          const color = getAlternatingColor(target.dataItem.index, this.chartColors.pie.palette);
          return am4core.color(color);
        }
        return fill;
      });

      const setLegendHover = (ev: any, flag: boolean) => {
        const legendDataItem = ev.target.dataItem;
        if (!legendDataItem) {
          return;
        }
        const idx = legendDataItem.index;
        if (idx != null) {
          const slice = series.slices.getIndex(idx);
          if (slice) {
            slice.isHover = flag;
          }
        }
      };

      pieChart.legend.itemContainers.template.events.on('over', ev => setLegendHover(ev, true));
      pieChart.legend.itemContainers.template.events.on('out', ev => setLegendHover(ev, false));

      if (elementId === 'chartdivPie1') {
        this.chartPie1Ref = pieChart;
      } else {
        this.chartPie2Ref = pieChart;
      }
    }

    const safeData = Array.isArray(data) ? data : [];
    pieChart.data = safeData;

    const pieSeries = pieChart.series.getIndex(0);
    if (pieSeries) {
      pieSeries.dataFields.value = nameValue;
      pieSeries.dataFields.category = nameField;
      pieSeries.tooltip.background.fill = am4core.color(this.chartColors.tooltip.background);
      pieSeries.tooltip.label.fill = am4core.color(this.chartColors.tooltip.text);
      pieSeries.slices.template.stroke = am4core.color(this.chartColors.background);
    }

    const noDataMessage = elementId === 'chartdivPie1'
      ? 'Nenhum item adquirido no periodo.'
      : elementId === 'chartdivPie2'
        ? 'Nenhum item com saidas no periodo.'
        : 'Sem dados disponiveis.';
    this.updateNoDataLabel(pieChart, safeData.length > 0, noDataMessage);
    this.applyThemeToPieChart(pieChart);
    pieChart.invalidateRawData();
  }
  private updateXYChartBar(elementId: string, data: any[], nameField: string, nameValue: string) {
    let chart = this.chartBarRef;

    if (!chart || chart.isDisposed()) {
      chart = am4core.create(elementId, am4charts.XYChart);
      chart.background.fill = am4core.color(this.chartColors.background);

      const categoryAxis = chart.xAxes.push(new am4charts.CategoryAxis());
      categoryAxis.dataFields.category = nameField;
      categoryAxis.renderer.grid.template.location = 0;
      categoryAxis.renderer.minGridDistance = 30;
      categoryAxis.renderer.labels.template.horizontalCenter = "middle";
      categoryAxis.renderer.labels.template.verticalCenter = "middle";
      categoryAxis.tooltip.disabled = true;
      categoryAxis.renderer.labels.template.truncate = true;
      categoryAxis.renderer.labels.template.maxWidth = 120;

      const valueAxis = chart.yAxes.push(new am4charts.ValueAxis());
      valueAxis.renderer.minWidth = 50;

      const series = chart.series.push(new am4charts.ColumnSeries());
      series.sequencedInterpolation = true;
      series.dataFields.valueY = nameValue;
      series.dataFields.categoryX = nameField;
      series.tooltip.pointerOrientation = "vertical";
      series.columns.template.strokeWidth = 0;
      series.columns.template.column.cornerRadiusTopLeft = 10;
      series.columns.template.column.cornerRadiusTopRight = 10;
      series.columns.template.column.fillOpacity = 0.8;

      const hoverState = series.columns.template.column.states.create("hover");
      hoverState.properties.cornerRadiusTopLeft = 0;
      hoverState.properties.cornerRadiusTopRight = 0;
      hoverState.properties.fillOpacity = 1;

      series.columns.template.adapter.add("fill", (fill, target) => {
        if (target?.dataItem?.index !== undefined) {
          const color = getAlternatingColor(target.dataItem.index, this.chartColors.bar.palette);
          return am4core.color(color);
        }
        return fill;
      });

      this.chartBarRef = chart;
    }

    const sortedData = Array.isArray(data) ? [...data].sort((a, b) => (b?.[nameValue] || 0) - (a?.[nameValue] || 0)) : [];
    chart.data = sortedData;

    const hasData = sortedData.length > 0;
    const isSmallScreen = this.isSmallScreen();
    const needsInteraction = hasData && sortedData.length > 8;

    const categoryAxis = chart.xAxes.getIndex(0) as am4charts.CategoryAxis;
    if (categoryAxis) {
      categoryAxis.renderer.labels.template.fill = am4core.color(this.chartColors.text);
      categoryAxis.renderer.grid.template.stroke = am4core.color(this.chartColors.gridLines);
      categoryAxis.renderer.labels.template.truncate = isSmallScreen;
      categoryAxis.renderer.labels.template.wrap = !isSmallScreen;
      categoryAxis.renderer.labels.template.maxWidth = isSmallScreen ? 120 : 160;
      categoryAxis.renderer.labels.template.disabled = isSmallScreen;
      categoryAxis.renderer.minGridDistance = isSmallScreen ? 30 : 20;
      categoryAxis.renderer.labels.template.tooltipText = isSmallScreen ? undefined : `{${nameField}}`;
      chart.paddingBottom = isSmallScreen ? 10 : 30;
    }

    const valueAxis = chart.yAxes.getIndex(0) as am4charts.ValueAxis;
    if (valueAxis) {
      valueAxis.renderer.labels.template.fill = am4core.color(this.chartColors.text);
      valueAxis.renderer.grid.template.stroke = am4core.color(this.chartColors.gridLines);
    }

    const series = chart.series.getIndex(0) as am4charts.ColumnSeries;
    if (series) {
      series.dataFields.valueY = nameValue;
      series.dataFields.categoryX = nameField;
      series.tooltipText = isSmallScreen ? "{categoryX}: {valueY}" : "[{categoryX}: bold]{categoryX}: {valueY}[/]";
      series.tooltip.background.fill = am4core.color(this.chartColors.tooltip.background);
      series.tooltip.label.fill = am4core.color(this.chartColors.tooltip.text);
      if (series.columns) {
        series.columns.template.stroke = am4core.color(this.chartColors.background);
      }
    }

    this.updateNoDataLabel(chart, hasData, 'Nenhum item emprestado no periodo.');

    if (needsInteraction) {
      if (!chart.scrollbarX) {
        chart.scrollbarX = new am4core.Scrollbar();
      }
      chart.scrollbarX.disabled = false;
      if (chart.cursor) {
        chart.cursor.lineY.disabled = true;
      } else {
        const cursor = new am4charts.XYCursor();
        cursor.lineY.disabled = true;
        chart.cursor = cursor;
      }
      chart.cursor.behavior = "panX";
    } else {
      if (chart.scrollbarX) {
        chart.scrollbarX = null;
      }
      if (chart.cursor) {
        chart.cursor = null;
      }
    }

    this.applyThemeToBarChart(chart);
    chart.invalidateRawData();
  }
  private updateXYChartLine(elementId: string, data: any[], dateField: string, valueField: string) {
    let chartLine = this.chartLineRef;

    if (!chartLine || chartLine.isDisposed()) {
      chartLine = am4core.create(elementId, am4charts.XYChart);
      chartLine.background.fill = am4core.color(this.chartColors.background);

      const dateAxis = chartLine.xAxes.push(new am4charts.DateAxis());
      dateAxis.baseInterval = {timeUnit: 'day', count: 1};
      dateAxis.skipEmptyPeriods = true;

      chartLine.yAxes.push(new am4charts.ValueAxis());

      const series = chartLine.series.push(new am4charts.LineSeries());
      series.dataFields.valueY = valueField;
      series.dataFields.dateX = dateField;
      series.tooltipText = "{valueY}";
      series.strokeWidth = 2;
      series.minBulletDistance = 15;
      series.tooltip.background.cornerRadius = 20;
      series.tooltip.background.strokeOpacity = 0;
      series.tooltip.pointerOrientation = "vertical";
      series.tooltip.label.minWidth = 40;
      series.tooltip.label.minHeight = 40;
      series.tooltip.label.textAlign = "middle";
      series.tooltip.label.textValign = "middle";

      const bullet = series.bullets.push(new am4charts.CircleBullet());
      bullet.circle.strokeWidth = 2;
      bullet.circle.radius = 4;

      const bullethover = bullet.states.create("hover");
      bullethover.properties.scale = 1.3;

      this.chartLineRef = chartLine;
    }

    const safeData = Array.isArray(data) ? data : [];
    chartLine.data = safeData;

    const dateAxis = chartLine.xAxes.getIndex(0) as am4charts.DateAxis;
    if (dateAxis) {
      dateAxis.renderer.labels.template.fill = am4core.color(this.chartColors.text);
      dateAxis.renderer.grid.template.stroke = am4core.color(this.chartColors.gridLines);
    }

    const valueAxis = chartLine.yAxes.getIndex(0) as am4charts.ValueAxis;
    if (valueAxis) {
      valueAxis.renderer.labels.template.fill = am4core.color(this.chartColors.text);
      valueAxis.renderer.grid.template.stroke = am4core.color(this.chartColors.gridLines);
    }

    const series = chartLine.series.getIndex(0) as am4charts.LineSeries;
    if (series) {
      series.dataFields.valueY = valueField;
      series.dataFields.dateX = dateField;
      series.stroke = am4core.color(this.chartColors.line.stroke);
      series.fill = am4core.color(this.chartColors.line.fill);
      series.tooltip.background.fill = am4core.color(this.chartColors.tooltip.background);
      series.tooltip.label.fill = am4core.color(this.chartColors.tooltip.text);
      series.bullets.each(bullet => {
        if (bullet instanceof am4charts.CircleBullet) {
          bullet.circle.fill = am4core.color(this.chartColors.background);
          bullet.circle.stroke = am4core.color(this.chartColors.line.stroke);
        }
      });
    }

    const hasData = safeData.length > 0;
    this.updateNoDataLabel(chartLine, hasData, 'Nenhum emprestimo diario registrado no periodo.');

    const needsPan = hasData && safeData.length > 30 && !!series;
    if (needsPan && series) {
      if (chartLine.cursor) {
        chartLine.cursor.xAxis = dateAxis;
        chartLine.cursor.snapToSeries = series;
        chartLine.cursor.lineY.disabled = true;
      } else {
        const cursor = new am4charts.XYCursor();
        cursor.xAxis = dateAxis;
        cursor.snapToSeries = series;
        cursor.lineY.disabled = true;
        chartLine.cursor = cursor;
      }
      chartLine.cursor.visible = true;

      if (!chartLine.scrollbarX) {
        const scrollbarX = new am4charts.XYChartScrollbar();
        scrollbarX.series.push(series);
        chartLine.scrollbarX = scrollbarX;
      }
      if (chartLine.scrollbarX) {
        chartLine.scrollbarX.parent = chartLine.bottomAxesContainer;
        chartLine.scrollbarX.disabled = false;
      }

      if (chartLine.scrollbarY) {
        chartLine.scrollbarY.parent = chartLine.leftAxesContainer;
        chartLine.scrollbarY.toBack();
        chartLine.scrollbarY.disabled = false;
      } else {
        const scrollbarY = new am4core.Scrollbar();
        scrollbarY.parent = chartLine.leftAxesContainer;
        scrollbarY.toBack();
        chartLine.scrollbarY = scrollbarY;
      }
    } else {
      if (chartLine.cursor) {
        chartLine.cursor = null;
      }
      if (chartLine.scrollbarX) {
        chartLine.scrollbarX = null;
      }
      if (chartLine.scrollbarY) {
        chartLine.scrollbarY = null;
      }
    }

    this.applyThemeToLineChart(chartLine);
    chartLine.invalidateRawData();
  }
  private updateNoDataLabel(chart: am4charts.Chart, hasData: boolean, message = 'Sem dados'): void {
    if (!chart) {
      return;
    }

    const existingLabel = (chart as any).noDataLabel as am4core.Label | undefined;

    if (hasData) {
      if (existingLabel && !existingLabel.isDisposed?.()) {
        existingLabel.visible = false;
      }
      const plotContainer = (chart as any).plotContainer as am4core.Container | undefined;
      if (plotContainer) {
        plotContainer.disabled = false;
        plotContainer.visible = true;
        plotContainer.opacity = 1;
      }
      const seriesContainer = (chart as any).seriesContainer as am4core.Container | undefined;
      if (seriesContainer) {
        seriesContainer.disabled = false;
        seriesContainer.visible = true;
        seriesContainer.opacity = 1;
      }
      if (chart.legend) {
        chart.legend.disabled = false;
        chart.legend.visible = true;
      }
      return;
    }

    const plotContainer = (chart as any).plotContainer as am4core.Container | undefined;
    if (plotContainer) {
      plotContainer.disabled = true;
      plotContainer.visible = false;
    }
    const seriesContainer = (chart as any).seriesContainer as am4core.Container | undefined;
    if (seriesContainer) {
      seriesContainer.disabled = true;
      seriesContainer.visible = false;
    }

    let label = existingLabel;
    if (!label || label.isDisposed?.()) {
      const container: am4core.Container = (chart as any).chartContainer ?? (chart as any).seriesContainer ?? (chart as any);
      label = container.createChild(am4core.Label);
      label.horizontalCenter = 'middle';
      label.verticalCenter = 'middle';
      label.align = 'center';
      label.valign = 'middle';
      label.textAlign = 'middle';
      label.textValign = 'middle';
      label.wrap = true;
      label.maxWidth = 320;
      label.width = am4core.percent(80);
      label.height = am4core.percent(100);
      label.x = am4core.percent(50);
      label.y = am4core.percent(50);
      label.isMeasured = false;
      label.interactionsEnabled = false;
      label.fontSize = 14;
      label.fontWeight = '600';
      label.zIndex = 1000;
      (chart as any).noDataLabel = label;
    }

    label.text = message;
    label.fill = am4core.color(this.chartColors.text);
    label.visible = true;

    if (chart.legend) {
      chart.legend.disabled = true;
      chart.legend.visible = false;
    }
  }

  private isSmallScreen(): boolean {
    return typeof window !== 'undefined' && window.innerWidth < 640;
  }
  disableBtnFiltrar() {
    return (
      this.dtIniFiltro == null ||
      this.dtIniFiltro === "" ||
      this.dtFimFiltro == null ||
      this.dtFimFiltro === ""
    );
  }

  private applyThemeToExistingCharts(): void {
    if (this.destroyed) {
      return;
    }
    if (this.chartPie1Ref) {
      this.applyThemeToPieChart(this.chartPie1Ref);
    }
    if (this.chartPie2Ref) {
      this.applyThemeToPieChart(this.chartPie2Ref);
    }
    if (this.chartBarRef) {
      this.applyThemeToBarChart(this.chartBarRef);
    }
    if (this.chartLineRef) {
      this.applyThemeToLineChart(this.chartLineRef);
    }
  }

  private applyThemeToPieChart(pieChart: am4charts.PieChart): void {
    const colors = this.chartColors;
    pieChart.background.fill = am4core.color(colors.background);
    if (pieChart.legend) {
      pieChart.legend.labels.template.fill = am4core.color(colors.text);
      pieChart.legend.valueLabels.template.fill = am4core.color(colors.text);
    }
    pieChart.series.each(series => {
      series.labels.template.fill = am4core.color(colors.text);
      series.ticks.template.stroke = am4core.color(colors.gridLines);
      series.slices.template.stroke = am4core.color(colors.background);
      if (series.tooltip) {
        series.tooltip.background.fill = am4core.color(colors.tooltip.background);
        series.tooltip.label.fill = am4core.color(colors.tooltip.text);
      }
    });
    const noDataLabel: am4core.Label | undefined = (pieChart as any).noDataLabel;
    if (noDataLabel) {
      noDataLabel.fill = am4core.color(colors.text);
    }
  }

  private applyThemeToBarChart(chart: am4charts.XYChart): void {
    const colors = this.chartColors;
    chart.background.fill = am4core.color(colors.background);
    chart.xAxes.each(axis => {
      axis.renderer.labels.template.fill = am4core.color(colors.text);
      axis.renderer.grid.template.stroke = am4core.color(colors.gridLines);
    });
    chart.yAxes.each(axis => {
      axis.renderer.labels.template.fill = am4core.color(colors.text);
      axis.renderer.grid.template.stroke = am4core.color(colors.gridLines);
    });
    chart.series.each(series => {
      if (series.tooltip) {
        series.tooltip.background.fill = am4core.color(colors.tooltip.background);
        series.tooltip.label.fill = am4core.color(colors.tooltip.text);
      }
      if (series instanceof am4charts.ColumnSeries) {
        series.columns.template.stroke = am4core.color(colors.background);
      }
    });
    const noDataLabel: am4core.Label | undefined = (chart as any).noDataLabel;
    if (noDataLabel) {
      noDataLabel.fill = am4core.color(colors.text);
    }
    if (chart.cursor instanceof am4charts.XYCursor) {
      chart.cursor.lineX.stroke = am4core.color(colors.text);
      chart.cursor.lineY.stroke = am4core.color(colors.text);
    }
  }
  private applyThemeToLineChart(chart: am4charts.XYChart): void {
    const colors = this.chartColors;
    chart.background.fill = am4core.color(colors.background);
    chart.xAxes.each(axis => {
      axis.renderer.labels.template.fill = am4core.color(colors.text);
      axis.renderer.grid.template.stroke = am4core.color(colors.gridLines);
    });
    chart.yAxes.each(axis => {
      axis.renderer.labels.template.fill = am4core.color(colors.text);
      axis.renderer.grid.template.stroke = am4core.color(colors.gridLines);
    });
    chart.series.each(series => {
      if (series instanceof am4charts.LineSeries) {
        const lineSeries = series;
        lineSeries.stroke = am4core.color(colors.line.stroke);
        lineSeries.fill = am4core.color(colors.line.fill);
        if (lineSeries.tooltip) {
          lineSeries.tooltip.background.fill = am4core.color(colors.tooltip.background);
          lineSeries.tooltip.label.fill = am4core.color(colors.tooltip.text);
        }
        lineSeries.bullets.each(bullet => {
          if (bullet instanceof am4charts.CircleBullet) {
            bullet.circle.fill = am4core.color(colors.background);
            bullet.circle.stroke = am4core.color(colors.line.stroke);
          }
        });
      }
    });
    const noDataLabel = (chart as any).noDataLabel as am4core.Label | undefined;
    if (noDataLabel) {
      noDataLabel.fill = am4core.color(colors.text);
    }
    if (chart.cursor instanceof am4charts.XYCursor) {
      chart.cursor.lineX.stroke = am4core.color(colors.text);
      chart.cursor.lineY.stroke = am4core.color(colors.text);
    }
  }

}









