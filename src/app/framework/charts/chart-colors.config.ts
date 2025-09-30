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
 * Paleta de cores padrão para todos os gráficos
 * Separada em tons de amarelo/dourado e tons de azul
 */
export const lightChartColors: ChartColorsConfig = {
  primary: '#FCBC00',
  secondary: '#00468C',
  accent: '#F59E0B',
  background: '#FFFFFF',
  text: '#374151',
  gridLines: '#E5E7EB',
  tooltip: {
    background: '#1F2937',
    text: '#F9FAFB'
  },
  line: {
    stroke: '#00468C',
    fill: '#00468C'
  },
  bar: {
    palette: [
      // Tons de amarelo/dourado (primeiras 5 cores)
      '#B8860B', '#DAA520', '#FCBC00', '#FFD700', '#FFFF99',
      // Tons de azul (últimas 5 cores)
      '#003366', '#004080', '#00468C', '#0066CC', '#99CCFF'
    ]
  },
  pie: {
    palette: [
      // Tons de amarelo/dourado (primeiras 5 cores)
      '#B8860B', '#DAA520', '#FCBC00', '#FFD700', '#FFFF99',
      // Tons de azul (últimas 5 cores)
      '#003366', '#004080', '#00468C', '#0066CC', '#99CCFF'
    ]
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
    background: '#111827',
    text: '#F9FAFB'
  },
  line: {
    stroke: '#60A5FA',
    fill: '#1D4ED8'
  },
  bar: {
    palette: [
      '#F59E0B', '#F3C400', '#FBBF24', '#FACC15', '#FDE68A',
      '#2563EB', '#3B82F6', '#60A5FA', '#1D4ED8', '#93C5FD'
    ]
  },
  pie: {
    palette: [
      '#F59E0B', '#F3C400', '#FBBF24', '#FACC15', '#FDE68A',
      '#2563EB', '#3B82F6', '#60A5FA', '#1D4ED8', '#93C5FD'
    ]
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
