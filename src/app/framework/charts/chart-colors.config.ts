/**
 * Configuração centralizada de cores para gráficos
 * Este arquivo evita duplicação de código entre os diferentes environments
 */
export interface ChartColorsConfig {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  gridLines: string;
  tooltip: {
    background: string;
    text: string;
  };
  line: {
    stroke: string;
    fill: string;
  };
  bar: {
    palette: string[];
  };
  pie: {
    palette: string[];
  };
}

/**
 * Shared color palette constants - single source of truth
 */
const LIGHT_PALETTE = [
  '#00468C', // Blue UTFPR
  '#FCBC00', // Yellow UTFPR
  '#E63946', // Red
  '#06A77D', // Green
  '#8338EC', // Purple
  '#FB8500', // Orange
  '#219EBC', // Cyan
  '#D62828', // Dark Red
  '#2A9D8F', // Teal
  '#F77F00'  // Dark Orange
] as const;

const DARK_PALETTE = [
  '#3B82F6', // Blue
  '#F3C400', // Yellow
  '#EF4444', // Red
  '#10B981', // Green
  '#A78BFA', // Purple
  '#F97316', // Orange
  '#06B6D4', // Cyan
  '#DC2626', // Dark Red
  '#14B8A6', // Teal
  '#EA580C'  // Dark Orange
] as const;

/**
 * Paleta de cores padrão para todos os gráficos
 * Expandida com mais variedade de cores para melhor visualização
 */
export const lightChartColors: ChartColorsConfig = {
  primary: '#FCBC00',
  secondary: '#00468C',
  accent: '#F59E0B',
  background: '#FFFFFF',
  text: '#374151',
  gridLines: '#E5E7EB',
  tooltip: {
    background: '#00468C', // UTFPR Blue - better contrast and brand consistency
    text: '#FFFFFF'
  },
  line: {
    stroke: '#00468C',
    fill: '#00468C'
  },
  bar: {
    palette: [...LIGHT_PALETTE]
  },
  pie: {
    palette: [...LIGHT_PALETTE]
  }
};

export const darkChartColors: ChartColorsConfig = {
  primary: '#F3C400',
  secondary: '#3B82F6',
  accent: '#F59E0B',
  background: '#1A1D20',
  text: '#E5E7EB',
  gridLines: '#2F3439',
  tooltip: {
    background: '#3B82F6', // Bright blue - readable on dark background, not pure black
    text: '#FFFFFF'
  },
  line: {
    stroke: '#60A5FA',
    fill: '#1D4ED8'
  },
  bar: {
    palette: [...DARK_PALETTE]
  },
  pie: {
    palette: [...DARK_PALETTE]
  }
};

export const chartColorSchemes: Record<'light' | 'dark', ChartColorsConfig> = {
  light: lightChartColors,
  dark: darkChartColors
};

export const defaultChartColors: ChartColorsConfig = lightChartColors;

/**
 * Utilitário para obter cores alternadas (amarelo/azul)
 * @param index Índice do item
 * @param palette Paleta de cores a usar
 * @returns Cor correspondente ao índice
 */
export function getAlternatingColor(index: number, palette: string[]): string {
  const yellowColors = palette.slice(0, 5); // Primeiras 5 cores (amarelos)
  const blueColors = palette.slice(5, 10); // Últimas 5 cores (azuis)

  const isYellow = index % 2 === 0; // Números pares = amarelo, ímpares = azul
  const colorArrayIndex = Math.floor(index / 2) % 5; // Cicla através dos 5 tons

  if (isYellow) {
    return yellowColors[colorArrayIndex];
  } else {
    return blueColors[colorArrayIndex];
  }
}
