import {effect, inject, Injectable} from '@angular/core';
import * as am5 from '@amcharts/amcharts5';
import * as am5xy from '@amcharts/amcharts5/xy';
import * as am5percent from '@amcharts/amcharts5/percent';
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated';
import {ThemeService} from '../services/theme.service';
import {chartColorSchemes, ChartColorsConfig} from './chart-colors.config';

export interface ChartConfig {
  containerId: string;
  data: any[];
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
  private static readonly SCROLLBAR_THRESHOLD_LINE = 15;
  private static readonly SCROLLBAR_THRESHOLD_BAR = 6;
  private static readonly Y_SCROLLBAR_THRESHOLD = 10;
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
  private readonly charts = new Map<string, am5.Root>();
  private chartColors: ChartColorsConfig = chartColorSchemes.light;

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

  createLineChart(config: LineChartConfig): am5xy.XYChart | null {
    const root = this.createRoot(config.containerId);
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

    if (config.data.length > ChartService.SCROLLBAR_THRESHOLD_LINE) {
      this.addXScrollbar(chart, root, breakpoints, {
        type: 'line',
        data: processedData,
        valueField: config.valueField,
        dateField: config.dateField
      });
    }

    if (config.data.length > ChartService.Y_SCROLLBAR_THRESHOLD) {
      this.addYScrollbar(chart, root);
    }

    if (config.data.length === 0) {
      this.addNoDataLabel(root, chart, config.noDataMessage || 'Nenhum empréstimo diário registrado no período.');
    }

    this.applyThemeToChart(root, chart);

    series.appear(ChartService.ANIMATION_DURATION_MS);
    chart.appear(ChartService.ANIMATION_DURATION_MS, ChartService.ANIMATION_DELAY_MS);

    return chart;
  }

  createBarChart(config: BarChartConfig): am5xy.XYChart | null {
    const root = this.createRoot(config.containerId);
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

    const sortedData = [...config.data]
    .sort((a, b) => (b?.[config.valueField] || 0) - (a?.[config.valueField] || 0))
    .slice(0, ChartService.MAX_BAR_ITEMS);

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

    xAxis.data.setAll(sortedData);

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

    const dataWithColors = sortedData.map((item, index) => ({
      ...item,
      columnSettings: {
        fill: am5.color(this.chartColors.bar.palette[index % this.chartColors.bar.palette.length])
      }
    }));

    series.columns.template.setAll({
      cornerRadiusTL: ChartService.CORNER_RADIUS,
      cornerRadiusTR: ChartService.CORNER_RADIUS,
      strokeOpacity: 0,
      fillOpacity: ChartService.FILL_OPACITY,
      templateField: 'columnSettings'
    });

    series.data.setAll(dataWithColors);

    if (sortedData.length > ChartService.SCROLLBAR_THRESHOLD_BAR) {
      this.addXScrollbar(chart, root, breakpoints, {
        type: 'bar',
        data: dataWithColors,
        categoryField: config.categoryField,
        valueField: config.valueField
      });
    }

    if (sortedData.length > ChartService.SCROLLBAR_THRESHOLD_BAR) {
      this.addYScrollbar(chart, root);
    }

    if (config.data.length === 0) {
      this.addNoDataLabel(root, chart, config.noDataMessage || 'Nenhum item emprestado no período.');
    }

    this.applyThemeToChart(root, chart);

    series.appear(ChartService.ANIMATION_DURATION_MS);
    chart.appear(ChartService.ANIMATION_DURATION_MS, ChartService.ANIMATION_DELAY_MS);

    return chart;
  }

  createPieChart(config: PieChartConfig): am5percent.PieChart | null {
    const root = this.createRoot(config.containerId);
    if (!root) return null;

    const chart = root.container.children.push(
      am5percent.PieChart.new(root, {
        layout: root.verticalLayout,
        paddingTop: ChartService.PADDING_LEFT,
        paddingBottom: ChartService.PADDING_RIGHT,
        paddingLeft: ChartService.PADDING_TOP,
        paddingRight: ChartService.PADDING_TOP
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

    const limitedData = this.limitPieChartData(config.data, config.valueField, ChartService.MAX_PIE_ITEMS);

    const dataWithColors = limitedData.map((item, index) => ({
      ...item,
      sliceSettings: {
        fill: am5.color(this.chartColors.pie.palette[index % this.chartColors.pie.palette.length])
      }
    }));

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

  updateChartData(containerId: string, data: any[]): void {
    const root = this.charts.get(containerId);
    if (!root) return;

    const chart = root.container.children.getIndex(0);
    if (!chart) return;

    if (chart instanceof am5xy.XYChart || chart instanceof am5percent.PieChart) {
      const series = chart.series.getIndex(0);
      if (series) {
        series.data.setAll(data);
      }
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
      isMobile: window.innerWidth < 768,
      isDesktop: window.innerWidth >= 1200
    };
  }

  private addChartCursor(
    chart: am5xy.XYChart,
    xAxis: am5xy.Axis<any>,
    yAxis: am5xy.Axis<any>,
    behavior: 'none' | 'zoomX' | 'zoomY' | 'zoomXY' | 'selectX' | 'selectY' | 'selectXY'
  ): void {
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
    root: am5.Root,
    minGridDistance: number
  ): { xRenderer: am5xy.AxisRendererX; yRenderer: am5xy.AxisRendererY } {
    const xRenderer = am5xy.AxisRendererX.new(root, {minGridDistance});
    xRenderer.labels.template.set('visible', false);

    const yRenderer = am5xy.AxisRendererY.new(root, {});
    yRenderer.labels.template.set('visible', false);

    return {xRenderer, yRenderer};
  }

  private addXScrollbar(
    chart: am5xy.XYChart,
    root: am5.Root,
    breakpoints: DeviceBreakpoints,
    config: {
      type: 'line' | 'bar';
      data: any[];
      valueField: string;
      dateField?: string;
      categoryField?: string
    }
  ): void {
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

  private addYScrollbar(chart: am5xy.XYChart, root: am5.Root): void {
    const scrollbarY = am5.Scrollbar.new(root, {
      orientation: 'vertical'
    });
    chart.set('scrollbarY', scrollbarY);
  }

  private createRoot(containerId: string): am5.Root | null {
    this.disposeChart(containerId);

    try {
      const root = am5.Root.new(containerId);

      root.setThemes([am5themes_Animated.new(root)]);

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

      const isMobile = window.innerWidth < 768;
      if (isMobile) {
        root.numberFormatter.set('numberFormat', '#.#a');
      }

      this.charts.set(containerId, root);

      return root;
    } catch (error) {
      console.error(`Falha ao criar root do gráfico para ${containerId}:`, error);
      return null;
    }
  }

  private processDateData(data: any[], dateField: string): any[] {
    return data.map(item => {
      const dateValue = item[dateField];
      if (typeof dateValue === 'string' && dateValue.includes('/')) {
        const [dd, mm, yyyy] = dateValue.split('/');
        return {
          ...item,
          [dateField]: new Date(Number(yyyy), Number(mm) - 1, Number(dd)).getTime()
        };
      }
      return {
        ...item,
        [dateField]: new Date(dateValue).getTime()
      };
    }).filter(item => !Number.isNaN(item[dateField]));
  }

  private addNoDataLabel(root: am5.Root, chart: am5.Chart, message: string): void {
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

  private applyThemeToChart(root: am5.Root, chart: am5.Chart): void {
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
    this.charts.forEach((root, containerId) => {
      const chart = root.container.children.getIndex(0);
      if (chart instanceof am5.Chart) {
        this.applyThemeToChart(root, chart);

        if (chart instanceof am5xy.XYChart) {
          chart.series.each((series) => {
            if (series instanceof am5xy.LineSeries) {
              series.set('stroke', am5.color(this.chartColors.line.stroke));
              series.set('fill', am5.color(this.chartColors.line.fill));
            }
          });
        } else if (chart instanceof am5percent.PieChart) {
          chart.series.each((series) => {
            if (series instanceof am5percent.PieSeries) {
              series.slices.each((slice, index) => {
                const color = this.chartColors.pie.palette[index % this.chartColors.pie.palette.length];
                slice.set('fill', am5.color(color));
              });
            }
          });
        }

        chart.children.each((child) => {
          if (child instanceof am5.Legend) {
            child.labels.template.set('fill', am5.color(this.chartColors.text));
            child.valueLabels.template.set('fill', am5.color(this.chartColors.text));
          }
        });
      }
    });
  }

  private limitPieChartData(data: any[], valueField: string, maxEntries: number = 10): any[] {
    if (!Array.isArray(data) || data.length <= maxEntries) {
      return data;
    }

    return [...data]
    .sort((a, b) => (b?.[valueField] || 0) - (a?.[valueField] || 0))
    .slice(0, maxEntries);
  }
}
