import {effect, inject, Injectable} from '@angular/core';
import {ThemeService} from '../service/theme.service';
import {chartColorSchemes, ChartColorsConfig} from './chart-colors.config';
import {LoggerService} from '../service/logger.service';
import {BreakpointService} from '../service/breakpoint.service';

// Type imports para manter a tipagem sem forçar o bundling
import type * as am5Types from '@amcharts/amcharts5';
import type * as am5xyTypes from '@amcharts/amcharts5/xy';
import type * as am5percentTypes from '@amcharts/amcharts5/percent';
import type am5themes_AnimatedTypes from '@amcharts/amcharts5/themes/Animated';
import type am5locales_pt_BRTypes from '@amcharts/amcharts5/locales/pt_BR';

export interface ChartConfig {
  containerId: string;
  data: unknown[];
  noDataMessage?: string;
}

export interface LineChartConfig extends ChartConfig {
  dateField: string;
  valueField: string;
}

export interface BarChartConfig extends ChartConfig {
  categoryField: string;
  valueField: string;
}

export interface PieChartConfig extends ChartConfig {
  categoryField: string;
  valueField: string;
}

interface DeviceBreakpoints {
  isMobile: boolean;
  isDesktop: boolean;
}

/**
 * Serviço para criação e gerenciamento de gráficos amCharts5
 * Fornece métodos de fábrica para diferentes tipos de gráficos com gerenciamento automático de temas
 */
@Injectable({
  providedIn: 'root'
})
export class ChartService {
  // Animation durations
  private static readonly ANIMATION_DURATION_MS = 800;
  private static readonly ANIMATION_DELAY_MS = 100;

  // Chart padding
  private static readonly PADDING_TOP = 20;
  private static readonly PADDING_BOTTOM = 20;
  private static readonly PADDING_LEFT = 10;
  private static readonly PADDING_RIGHT = 10;
  private static readonly PADDING_BOTTOM_MOBILE = 50;

  // Grid distances
  private static readonly MIN_GRID_DISTANCE_MOBILE = 40;
  private static readonly MIN_GRID_DISTANCE_DESKTOP = 30;
  private static readonly MIN_GRID_DISTANCE_X_MOBILE = 100;
  private static readonly MIN_GRID_DISTANCE_X_DESKTOP = 50;
  private static readonly MIN_GRID_DISTANCE_X_BAR_MOBILE = 80;
  private static readonly MIN_GRID_DISTANCE_X_BAR_DESKTOP = 40;

  // Data thresholds
  private static readonly MAX_BAR_ITEMS = 10;
  private static readonly MAX_PIE_ITEMS = 10;

  // Visual settings
  private static readonly BULLET_RADIUS = 4;
  private static readonly BULLET_STROKE_WIDTH = 2;
  private static readonly CORNER_RADIUS = 5;
  private static readonly FILL_OPACITY = 0.9;
  private static readonly SCROLLBAR_HEIGHT = 50;
  private static readonly SCROLLBAR_FILL_OPACITY = 0.3;
  private static readonly LABEL_MAX_WIDTH = 120;
  private static readonly LABEL_MAX_WIDTH_MOBILE = 80;
  private static readonly LABEL_MAX_WIDTH_DESKTOP = 150;
  private static readonly LEGEND_MAX_HEIGHT = 150;
  private static readonly LABEL_FONT_SIZE = 13;
  private static readonly LABEL_FONT_SIZE_HEADER = 14;
  private static readonly LABEL_FONT_WEIGHT = '400';
  private static readonly LABEL_FONT_WEIGHT_BOLD = '600';
  private static readonly LABEL_MAX_WIDTH_LEGEND = 200;
  private static readonly MARKER_SIZE = 14;
  private static readonly MARKER_CORNER_RADIUS = 3;

  // Grid renderer settings
  private static readonly SCROLLBAR_GRID_DISTANCE_LINE = 20;
  private static readonly SCROLLBAR_GRID_DISTANCE_BAR = 10;
  private static readonly CELL_START_LOCATION = 0.1;
  private static readonly CELL_END_LOCATION = 0.9;
  private static readonly LABEL_ROTATION_MOBILE = -45;
  private static readonly LABEL_PADDING_MOBILE = 10;
  private static readonly PIE_RADIUS_PERCENT = 80;
  private static readonly PIE_SLICE_STROKE_WIDTH = 2;
  private static readonly PIE_SLICE_STROKE_WIDTH_HOVER = 3;
  private static readonly PIE_SLICE_SCALE_HOVER = 1.05;
  private static readonly PIE_SLICE_STROKE_OPACITY = 0.5;

  private readonly themeService = inject(ThemeService);
  private readonly logger = inject(LoggerService);
  private readonly breakpointService = inject(BreakpointService);
  private readonly charts = new Map<string, am5Types.Root>();
  private chartColors: ChartColorsConfig = chartColorSchemes.light;

  // Cache para módulos carregados dinamicamente
  private _chartModules: {
    am5: typeof am5Types;
    am5xy: typeof am5xyTypes;
    am5percent: typeof am5percentTypes;
    am5themes_Animated: typeof am5themes_AnimatedTypes;
    am5locales_pt_BR: typeof am5locales_pt_BRTypes;
  } | null = null;

  /**
   * Acessa os módulos de gráficos com garantia de tipo
   * Lança erro se módulos não estiverem carregados
   */
  private get chartModules(): {
    am5: typeof am5Types;
    am5xy: typeof am5xyTypes;
    am5percent: typeof am5percentTypes;
    am5themes_Animated: typeof am5themes_AnimatedTypes;
    am5locales_pt_BR: typeof am5locales_pt_BRTypes;
  } {
    if (!this._chartModules) {
      this.logger.warn('Tentativa de acessar módulos de gráficos antes da inicialização');
      throw new Error('Módulos de gráficos não inicializados. Crie um gráfico primeiro.');
    }
    return this._chartModules;
  }

  constructor() {
    const themeMode = this.themeService.themeMode;
    if (themeMode) {
      this.chartColors = chartColorSchemes[themeMode()] ?? chartColorSchemes.light;

      effect(() => {
        const currentTheme = themeMode();
        this.chartColors = chartColorSchemes[currentTheme] ?? chartColorSchemes.light;
        this.updateAllChartsTheme();
      });
    }
  }

  async createLineChart(config: LineChartConfig): Promise<am5xyTypes.XYChart | null> {
    const {am5, am5xy} = await this.loadChartModules();
    const root = await this.createRoot(config.containerId);
    if (!root) return null;

    const breakpoints = this.getDeviceBreakpoints();

    const chart = root.container.children.push(
      am5xy.XYChart.new(root, {
        panX: true,
        panY: false,
        wheelY: 'zoomX',
        paddingTop: ChartService.PADDING_TOP,
        paddingBottom: ChartService.PADDING_BOTTOM,
        paddingLeft: ChartService.PADDING_LEFT,
        paddingRight: ChartService.PADDING_RIGHT
      })
    );

    const xAxis = chart.xAxes.push(
      am5xy.DateAxis.new(root, {
        baseInterval: {timeUnit: 'day', count: 1},
        renderer: am5xy.AxisRendererX.new(root, {
          minGridDistance: breakpoints.isMobile ? ChartService.MIN_GRID_DISTANCE_X_MOBILE : ChartService.MIN_GRID_DISTANCE_X_DESKTOP,
          minorGridEnabled: false
        }),
        tooltip: am5.Tooltip.new(root, {
          themeTags: ['axis'],
          pointerOrientation: 'down'
        })
      })
    );

    xAxis.get('renderer').labels.template.setAll({
      oversizedBehavior: 'fit',
      maxWidth: ChartService.LABEL_MAX_WIDTH,
      textAlign: 'center'
    });

    const yAxis = chart.yAxes.push(
      am5xy.ValueAxis.new(root, {
        renderer: am5xy.AxisRendererY.new(root, {
          minGridDistance: breakpoints.isMobile ? ChartService.MIN_GRID_DISTANCE_MOBILE : ChartService.MIN_GRID_DISTANCE_DESKTOP
        }),
        tooltip: am5.Tooltip.new(root, {
          themeTags: ['axis'],
          pointerOrientation: 'left'
        })
      })
    );

    this.addChartCursor(chart, xAxis, yAxis, 'zoomX');

    const series = chart.series.push(
      am5xy.LineSeries.new(root, {
        name: 'Empréstimos',
        xAxis: xAxis,
        yAxis: yAxis,
        valueYField: config.valueField,
        valueXField: config.dateField,
        stroke: am5.color(this.chartColors.line.stroke),
        fill: am5.color(this.chartColors.line.fill),
        tooltip: am5.Tooltip.new(root, {
          labelText: '{valueY}'
        })
      })
    );

    if (breakpoints.isDesktop) {
      series.bullets.push(() => {
        const circle = am5.Circle.new(root, {
          radius: ChartService.BULLET_RADIUS,
          fill: series.get('fill'),
          stroke: root.interfaceColors.get('background'),
          strokeWidth: ChartService.BULLET_STROKE_WIDTH
        });

        return am5.Bullet.new(root, {
          sprite: circle
        });
      });
    }

    const processedData = this.processDateData(config.data, config.dateField);
    series.data.setAll(processedData);

    // Sempre adiciona scrollbars para facilitar controle em mobile
    this.addXScrollbar(chart, root, breakpoints, {
      type: 'line',
      data: processedData,
      valueField: config.valueField,
      dateField: config.dateField
    });

    this.addYScrollbar(chart, root);

    if (config.data.length === 0) {
      this.addNoDataLabel(root, chart, config.noDataMessage || 'Nenhum empréstimo diário registrado no período.');
    }

    this.applyThemeToChart(root, chart);

    series.appear(ChartService.ANIMATION_DURATION_MS);
    chart.appear(ChartService.ANIMATION_DURATION_MS, ChartService.ANIMATION_DELAY_MS);

    return chart;
  }

  async createBarChart(config: BarChartConfig): Promise<am5xyTypes.XYChart | null> {
    const {am5, am5xy} = await this.loadChartModules();
    const root = await this.createRoot(config.containerId);
    if (!root) return null;

    const breakpoints = this.getDeviceBreakpoints();

    const chart = root.container.children.push(
      am5xy.XYChart.new(root, {
        panX: false,
        panY: false,
        paddingTop: ChartService.PADDING_TOP,
        paddingBottom: breakpoints.isMobile ? ChartService.PADDING_BOTTOM_MOBILE : ChartService.PADDING_BOTTOM,
        paddingLeft: ChartService.PADDING_LEFT,
        paddingRight: ChartService.PADDING_RIGHT
      })
    );

    // Processa dados: ordena, limita e adiciona cores
    const dataWithColors = this.prepareBarChartData(config.data, config.valueField);

    const xAxis = chart.xAxes.push(
      am5xy.CategoryAxis.new(root, {
        categoryField: config.categoryField,
        renderer: am5xy.AxisRendererX.new(root, {
          minGridDistance: breakpoints.isMobile ? ChartService.MIN_GRID_DISTANCE_X_BAR_MOBILE : ChartService.MIN_GRID_DISTANCE_X_BAR_DESKTOP,
          cellStartLocation: ChartService.CELL_START_LOCATION,
          cellEndLocation: ChartService.CELL_END_LOCATION,
          minorGridEnabled: false
        }),
        tooltip: am5.Tooltip.new(root, {
          themeTags: ['axis'],
          pointerOrientation: 'down'
        })
      })
    );

    xAxis.get('renderer').labels.template.setAll({
      rotation: breakpoints.isMobile ? ChartService.LABEL_ROTATION_MOBILE : 0,
      centerY: breakpoints.isMobile ? am5.p50 : undefined,
      centerX: breakpoints.isMobile ? am5.p100 : undefined,
      paddingTop: breakpoints.isMobile ? ChartService.LABEL_PADDING_MOBILE : 0,
      oversizedBehavior: 'truncate',
      maxWidth: breakpoints.isMobile ? ChartService.LABEL_MAX_WIDTH_MOBILE : ChartService.LABEL_MAX_WIDTH_DESKTOP,
      ellipsis: '...'
    });

    xAxis.data.setAll(dataWithColors);

    const yAxis = chart.yAxes.push(
      am5xy.ValueAxis.new(root, {
        renderer: am5xy.AxisRendererY.new(root, {
          minGridDistance: breakpoints.isMobile ? ChartService.MIN_GRID_DISTANCE_MOBILE : ChartService.MIN_GRID_DISTANCE_DESKTOP
        }),
        tooltip: am5.Tooltip.new(root, {
          themeTags: ['axis'],
          pointerOrientation: 'left'
        })
      })
    );

    this.addChartCursor(chart, xAxis, yAxis, 'none');

    const series = chart.series.push(
      am5xy.ColumnSeries.new(root, {
        name: 'Itens',
        xAxis: xAxis,
        yAxis: yAxis,
        valueYField: config.valueField,
        categoryXField: config.categoryField,
        tooltip: am5.Tooltip.new(root, {
          labelText: '{categoryX}: {valueY}'
        })
      })
    );

    series.columns.template.setAll({
      cornerRadiusTL: ChartService.CORNER_RADIUS,
      cornerRadiusTR: ChartService.CORNER_RADIUS,
      strokeOpacity: 0,
      fillOpacity: ChartService.FILL_OPACITY,
      templateField: 'columnSettings'
    });

    series.data.setAll(dataWithColors);

    // Sempre adiciona scrollbars para facilitar controle em mobile
    this.addXScrollbar(chart, root, breakpoints, {
      type: 'bar',
      data: dataWithColors,
      categoryField: config.categoryField,
      valueField: config.valueField
    });

    this.addYScrollbar(chart, root);

    if (config.data.length === 0) {
      this.addNoDataLabel(root, chart, config.noDataMessage || 'Nenhum item emprestado no período.');
    }

    this.applyThemeToChart(root, chart);

    series.appear(ChartService.ANIMATION_DURATION_MS);
    chart.appear(ChartService.ANIMATION_DURATION_MS, ChartService.ANIMATION_DELAY_MS);

    return chart;
  }

  async createPieChart(config: PieChartConfig): Promise<am5percentTypes.PieChart | null> {
    const {am5, am5percent} = await this.loadChartModules();
    const root = await this.createRoot(config.containerId);
    if (!root) return null;

    const chart = root.container.children.push(
      am5percent.PieChart.new(root, {
        layout: root.verticalLayout,
        paddingTop: ChartService.PADDING_TOP,
        paddingBottom: ChartService.PADDING_BOTTOM,
        paddingLeft: ChartService.PADDING_LEFT,
        paddingRight: ChartService.PADDING_RIGHT
      })
    );

    const series = chart.series.push(
      am5percent.PieSeries.new(root, {
        valueField: config.valueField,
        categoryField: config.categoryField,
        alignLabels: false,
        radius: am5.percent(ChartService.PIE_RADIUS_PERCENT)
      })
    );

    series.labels.template.setAll({
      visible: false,
      forceHidden: true
    });
    series.ticks.template.setAll({
      visible: false,
      forceHidden: true
    });

    // Processa dados: limita quantidade e adiciona cores
    const dataWithColors = this.preparePieChartData(config.data, config.valueField);

    series.slices.template.setAll({
      strokeWidth: ChartService.PIE_SLICE_STROKE_WIDTH,
      stroke: am5.color('#FFFFFF'),
      strokeOpacity: ChartService.PIE_SLICE_STROKE_OPACITY,
      tooltipText: '{category}: {value}',
      templateField: 'sliceSettings'
    });

    series.slices.template.states.create('hover', {
      scale: ChartService.PIE_SLICE_SCALE_HOVER,
      strokeWidth: ChartService.PIE_SLICE_STROKE_WIDTH_HOVER
    });

    series.data.setAll(dataWithColors);

    const legend = chart.children.push(
      am5.Legend.new(root, {
        centerX: am5.percent(50),
        x: am5.percent(50),
        layout: root.gridLayout,
        maxHeight: ChartService.LEGEND_MAX_HEIGHT,
        verticalScrollbar: am5.Scrollbar.new(root, {
          orientation: 'vertical'
        })
      })
    );

    legend.appear(1000, ChartService.ANIMATION_DELAY_MS);

    legend.markerRectangles.template.setAll({
      width: ChartService.MARKER_SIZE,
      height: ChartService.MARKER_SIZE,
      cornerRadiusTL: ChartService.MARKER_CORNER_RADIUS,
      cornerRadiusTR: ChartService.MARKER_CORNER_RADIUS,
      cornerRadiusBL: ChartService.MARKER_CORNER_RADIUS,
      cornerRadiusBR: ChartService.MARKER_CORNER_RADIUS
    });

    legend.labels.template.setAll({
      fontSize: ChartService.LABEL_FONT_SIZE,
      fontWeight: ChartService.LABEL_FONT_WEIGHT,
      fill: am5.color(this.chartColors.text),
      oversizedBehavior: 'truncate',
      maxWidth: ChartService.LABEL_MAX_WIDTH_LEGEND
    });

    legend.labels.template.states.create('disabled', {
      fill: am5.color(this.chartColors.text),
      fillOpacity: 0.5
    });

    legend.valueLabels.template.setAll({
      fontSize: ChartService.LABEL_FONT_SIZE,
      fontWeight: ChartService.LABEL_FONT_WEIGHT_BOLD,
      fill: am5.color(this.chartColors.text)
    });

    legend.valueLabels.template.states.create('disabled', {
      fill: am5.color(this.chartColors.text),
      fillOpacity: 0.5
    });

    legend.data.setAll(series.dataItems);

    if (config.data.length === 0) {
      this.addNoDataLabel(root, chart, config.noDataMessage || 'Sem dados disponíveis.');
    }

    this.applyThemeToChart(root, chart);

    series.appear(ChartService.ANIMATION_DURATION_MS, ChartService.ANIMATION_DELAY_MS);
    chart.appear(ChartService.ANIMATION_DURATION_MS, ChartService.ANIMATION_DELAY_MS);

    return chart;
  }

  /**
   * Carrega dinamicamente os módulos amCharts5 apenas quando necessário
   * Cacheia os módulos após o primeiro carregamento
   */
  private async loadChartModules(): Promise<{
    am5: typeof am5Types;
    am5xy: typeof am5xyTypes;
    am5percent: typeof am5percentTypes;
    am5themes_Animated: typeof am5themes_AnimatedTypes;
    am5locales_pt_BR: typeof am5locales_pt_BRTypes;
  }> {
    if (this._chartModules) {
      return this._chartModules;
    }

    try {
      const [am5, am5xy, am5percent, am5themes_Animated, am5locales_pt_BR] = await Promise.all([
        import('@amcharts/amcharts5'),
        import('@amcharts/amcharts5/xy'),
        import('@amcharts/amcharts5/percent'),
        import('@amcharts/amcharts5/themes/Animated').then(m => m.default),
        import('@amcharts/amcharts5/locales/pt_BR').then(m => m.default)
      ]);

      this._chartModules = {
        am5: am5 as typeof am5Types,
        am5xy: am5xy as typeof am5xyTypes,
        am5percent: am5percent as typeof am5percentTypes,
        am5themes_Animated: am5themes_Animated,
        am5locales_pt_BR: am5locales_pt_BR
      };

      return this._chartModules;
    } catch (error) {
      this.logger.error('Falha ao carregar módulos amCharts5', error);
      throw error;
    }
  }

  disposeChart(containerId: string): void {
    const root = this.charts.get(containerId);
    if (root) {
      root.dispose();
      this.charts.delete(containerId);
    }
  }

  disposeAll(): void {
    this.charts.forEach(root => root.dispose());
    this.charts.clear();
  }

  private getDeviceBreakpoints(): DeviceBreakpoints {
    return {
      isMobile: this.breakpointService.isMobile(),
      isDesktop: this.breakpointService.isDesktop()
    };
  }

  private addChartCursor(
    chart: am5xyTypes.XYChart,
    xAxis: am5xyTypes.Axis<am5xyTypes.AxisRenderer>,
    yAxis: am5xyTypes.Axis<am5xyTypes.AxisRenderer>,
    behavior: 'none' | 'zoomX' | 'zoomY' | 'zoomXY' | 'selectX' | 'selectY' | 'selectXY'
  ): void {
    const {am5xy} = this.chartModules;
    const cursor = chart.set('cursor', am5xy.XYCursor.new(chart.root, {
      behavior: behavior,
      xAxis: xAxis,
      yAxis: yAxis,
      snapToSeries: []
    }));

    cursor.lineX.setAll({
      strokeDasharray: [4, 4],
      strokeOpacity: 0.6
    });

    cursor.lineY.setAll({
      strokeDasharray: [4, 4],
      strokeOpacity: 0.6
    });
  }

  private createScrollbarAxisRenderer(
    root: am5Types.Root,
    minGridDistance: number
  ): { xRenderer: am5xyTypes.AxisRendererX; yRenderer: am5xyTypes.AxisRendererY } {
    const {am5xy} = this.chartModules;

    const xRenderer = am5xy.AxisRendererX.new(root, {minGridDistance});
    xRenderer.labels.template.set('visible', false);

    const yRenderer = am5xy.AxisRendererY.new(root, {});
    yRenderer.labels.template.set('visible', false);

    return {xRenderer, yRenderer};
  }

  private addXScrollbar(
    chart: am5xyTypes.XYChart,
    root: am5Types.Root,
    breakpoints: DeviceBreakpoints,
    config: {
      type: 'line' | 'bar';
      data: unknown[];
      valueField: string;
      dateField?: string;
      categoryField?: string;
    }
  ): void {
    const {am5, am5xy} = this.chartModules;

    if (breakpoints.isDesktop) {
      const scrollbarX = am5xy.XYChartScrollbar.new(root, {
        orientation: 'horizontal',
        height: ChartService.SCROLLBAR_HEIGHT
      });

      const {xRenderer, yRenderer} = this.createScrollbarAxisRenderer(
        root,
        config.type === 'line' ? ChartService.SCROLLBAR_GRID_DISTANCE_LINE : ChartService.SCROLLBAR_GRID_DISTANCE_BAR
      );

      const sbyAxis = scrollbarX.chart.yAxes.push(
        am5xy.ValueAxis.new(root, {
          renderer: yRenderer
        })
      );

      if (config.type === 'line') {
        const sbxAxis = scrollbarX.chart.xAxes.push(
          am5xy.DateAxis.new(root, {
            baseInterval: {timeUnit: 'day', count: 1},
            renderer: xRenderer
          })
        );

        const sbseries = scrollbarX.chart.series.push(
          am5xy.LineSeries.new(root, {
            xAxis: sbxAxis,
            yAxis: sbyAxis,
            valueYField: config.valueField,
            valueXField: config.dateField,
            stroke: am5.color(this.chartColors.line.stroke),
            fill: am5.color(this.chartColors.line.fill)
          })
        );

        sbseries.fills.template.setAll({
          fillOpacity: ChartService.SCROLLBAR_FILL_OPACITY,
          visible: true
        });

        sbseries.data.setAll(config.data);
      } else {
        // For bar charts, categoryField is required
        if (!config.categoryField) {
          return;
        }
        const sbxAxis = scrollbarX.chart.xAxes.push(
          am5xy.CategoryAxis.new(root, {
            categoryField: config.categoryField,
            renderer: xRenderer
          })
        );

        sbxAxis.data.setAll(config.data);

        const sbseries = scrollbarX.chart.series.push(
          am5xy.ColumnSeries.new(root, {
            xAxis: sbxAxis,
            yAxis: sbyAxis,
            valueYField: config.valueField,
            categoryXField: config.categoryField
          })
        );

        sbseries.data.setAll(config.data);
      }

      chart.set('scrollbarX', scrollbarX);
      chart.bottomAxesContainer.children.push(scrollbarX);
    } else {
      const scrollbarX = am5.Scrollbar.new(root, {
        orientation: 'horizontal'
      });
      chart.set('scrollbarX', scrollbarX);
      chart.bottomAxesContainer.children.push(scrollbarX);
    }
  }

  private addYScrollbar(chart: am5xyTypes.XYChart, root: am5Types.Root): void {
    const {am5} = this.chartModules;

    const scrollbarY = am5.Scrollbar.new(root, {
      orientation: 'vertical'
    });
    chart.set('scrollbarY', scrollbarY);
  }

  private async createRoot(containerId: string): Promise<am5Types.Root | null> {
    const {am5, am5themes_Animated, am5locales_pt_BR} = await this.loadChartModules();

    this.disposeChart(containerId);

    try {
      // Pre-apply background color to prevent white flash in dark mode
      const container = document.getElementById(containerId);
      if (container) {
        container.style.backgroundColor = this.chartColors.background;
      }

      const root = am5.Root.new(containerId);

      root.setThemes([am5themes_Animated.new(root)]);

      // Set pt-BR locale for date and number formatting
      root.locale = am5locales_pt_BR;

      root.numberFormatter.set('numberFormat', '#,###');
      root.utc = true;
      root.autoResize = true;

      const tooltipTheme = am5.Theme.new(root);

      tooltipTheme.rule('Tooltip').setup = (tooltip) => {
        const bg = am5.RoundedRectangle.new(root, {
          fill: am5.color(this.chartColors.tooltip.background),
          fillOpacity: 1,
          strokeOpacity: 0,
          shadowColor: am5.color('#000000'),
          shadowBlur: 4,
          shadowOffsetX: 0,
          shadowOffsetY: 2,
          shadowOpacity: 0.2
        });

        tooltip.setAll({
          background: bg,
          getFillFromSprite: false,
          paddingTop: 8,
          paddingBottom: 8,
          paddingLeft: 12,
          paddingRight: 12
        });

        tooltip.label.setAll({
          fill: am5.color(this.chartColors.tooltip.text),
          fontSize: 13
        });
      };

      root.setThemes([tooltipTheme, am5themes_Animated.new(root)]);

      if (this.breakpointService.isMobile()) {
        root.numberFormatter.set('numberFormat', '#.#a');
      }

      this.charts.set(containerId, root);

      return root;
    } catch (error) {
      this.logger.error(`Falha ao criar root do gráfico para ${containerId}`, error);
      return null;
    }
  }

  private processDateData(data: unknown[], dateField: string): unknown[] {
    return data.map(item => {
      const itemRecord = item as Record<string, unknown>;
      const dateValue = itemRecord[dateField];
      if (typeof dateValue === 'string' && dateValue.includes('/')) {
        const [dd, mm, yyyy] = dateValue.split('/');
        return {
          ...itemRecord,
          [dateField]: new Date(Number(yyyy), Number(mm) - 1, Number(dd)).getTime()
        };
      }
      return {
        ...itemRecord,
        [dateField]: new Date(dateValue as string | number | Date).getTime()
      };
    }).filter(item => !Number.isNaN((item as Record<string, unknown>)[dateField] as number));
  }

  private addNoDataLabel(root: am5Types.Root, chart: am5Types.Chart, message: string): void {
    const {am5} = this.chartModules;

    chart.children.push(
      am5.Label.new(root, {
        text: message,
        fontSize: ChartService.LABEL_FONT_SIZE_HEADER,
        fontWeight: ChartService.LABEL_FONT_WEIGHT_BOLD,
        textAlign: 'center',
        x: am5.percent(50),
        y: am5.percent(50),
        centerX: am5.percent(50),
        centerY: am5.percent(50),
        fill: am5.color(this.chartColors.text)
      })
    );
  }

  private applyThemeToChart(root: am5Types.Root, chart: am5Types.Chart): void {
    const {am5, am5xy} = this.chartModules;

    chart.set('background', am5.Rectangle.new(root, {
      fill: am5.color(this.chartColors.background),
      fillOpacity: 1
    }));

    if (chart instanceof am5xy.XYChart) {
      chart.xAxes.each((axis) => {
        axis.get('renderer').labels.template.setAll({
          fill: am5.color(this.chartColors.text)
        });
      });

      chart.yAxes.each((axis) => {
        axis.get('renderer').labels.template.setAll({
          fill: am5.color(this.chartColors.text)
        });
      });
    }
  }

  private updateAllChartsTheme(): void {
    // Retornar cedo se módulos não estão carregados ainda
    if (!this._chartModules) {
      return;
    }
    const {am5, am5xy, am5percent} = this._chartModules;

    this.charts.forEach((root, containerId) => {
      // Update container background immediately to prevent flash
      const container = document.getElementById(containerId);
      if (container) {
        container.style.backgroundColor = this.chartColors.background;
      }

      const chart = root.container.children.getIndex(0);
      if (!chart || !(chart instanceof am5.Chart)) {
        return;
      }

      this.applyThemeToChart(root, chart);

      if (chart instanceof am5xy.XYChart) {
        chart.series.each((series: am5xyTypes.XYSeries) => {
          if (series instanceof am5xy.LineSeries) {
            series.set('stroke', am5.color(this.chartColors.line.stroke));
            series.set('fill', am5.color(this.chartColors.line.fill));
          }
        });
      } else if (chart instanceof am5percent.PieChart) {
        chart.series.each((series: am5percentTypes.PercentSeries) => {
          if ('slices' in series) {
            // Slice type not exported by am5percent, using any with runtime type safety
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            series.slices.each((slice: any, index: number) => {
              const color = this.chartColors.pie.palette[index % this.chartColors.pie.palette.length];
              slice.set('fill', am5.color(color));
            });
          }
        });
      }

      chart.children.each((child: am5Types.Sprite) => {
        if (child instanceof am5.Legend) {
          child.labels.template.set('fill', am5.color(this.chartColors.text));
          child.valueLabels.template.set('fill', am5.color(this.chartColors.text));
        }
      });
    });
  }

  private limitPieChartData(data: unknown[], valueField: string, maxEntries = 10): unknown[] {
    if (!Array.isArray(data) || data.length <= maxEntries) {
      return data;
    }

    return [...data]
    .sort((a, b) => {
      const aValue = (a as Record<string, unknown>)?.[valueField];
      const bValue = (b as Record<string, unknown>)?.[valueField];
      return (typeof bValue === 'number' ? bValue : 0) - (typeof aValue === 'number' ? aValue : 0);
    })
    .slice(0, maxEntries);
  }

  /**
   * Processa dados para gráfico de barras: ordena por valor, limita quantidade e adiciona cores
   */
  private prepareBarChartData(data: unknown[], valueField: string, maxEntries = ChartService.MAX_BAR_ITEMS): unknown[] {
    if (!Array.isArray(data) || data.length === 0) {
      return data;
    }

    const {am5} = this.chartModules;

    // Ordena por valor descendente e limita ao máximo
    const sortedData = [...data]
    .sort((a, b) => {
      const aValue = (a as Record<string, unknown>)?.[valueField];
      const bValue = (b as Record<string, unknown>)?.[valueField];
      return (typeof bValue === 'number' ? bValue : 0) - (typeof aValue === 'number' ? aValue : 0);
    })
    .slice(0, maxEntries);

    // Adiciona configurações de cor para cada barra
    return sortedData.map((item, index) => ({
      ...(item as Record<string, unknown>),
      columnSettings: {
        fill: am5.color(this.chartColors.bar.palette[index % this.chartColors.bar.palette.length])
      }
    }));
  }

  /**
   * Processa dados para gráfico de pizza: limita quantidade e adiciona cores
   */
  private preparePieChartData(data: unknown[], valueField: string, maxEntries = ChartService.MAX_PIE_ITEMS): unknown[] {
    if (!Array.isArray(data) || data.length === 0) {
      return data;
    }

    const {am5} = this.chartModules;

    // Limita e ordena os dados
    const limitedData = this.limitPieChartData(data, valueField, maxEntries);

    // Adiciona configurações de cor para cada fatia
    return limitedData.map((item, index) => ({
      ...(item as Record<string, unknown>),
      sliceSettings: {
        fill: am5.color(this.chartColors.pie.palette[index % this.chartColors.pie.palette.length])
      }
    }));
  }
}
