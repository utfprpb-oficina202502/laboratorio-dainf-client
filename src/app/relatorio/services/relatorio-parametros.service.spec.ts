import {TestBed} from '@angular/core/testing';
import {RelatorioParametrosService} from './relatorio-parametros.service';

/**
 * Testes para RelatorioParametrosService
 * Cobre atalhos de período e persistência de parâmetros
 */
describe('RelatorioParametrosService', () => {
  let service: RelatorioParametrosService;
  const STORAGE_KEY = 'laboratorio-relatorio-parametros';

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [RelatorioParametrosService]
    });

    service = TestBed.inject(RelatorioParametrosService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('ATALHOS_LABELS', () => {
    it('should have labels for all shortcuts', () => {
      expect(service.ATALHOS_LABELS.ultimos30dias).toBe('Últimos 30 dias');
      expect(service.ATALHOS_LABELS.esteMes).toBe('Este mês');
      expect(service.ATALHOS_LABELS.ultimoMes).toBe('Último mês');
      expect(service.ATALHOS_LABELS.ultimoTrimestre).toBe('Último trimestre');
      expect(service.ATALHOS_LABELS.esteAno).toBe('Este ano');
    });
  });

  describe('aplicarAtalhoPeriodo', () => {
    it('should return dates in dd/MM/yyyy format', () => {
      const result = service.aplicarAtalhoPeriodo('ultimos30dias');

      expect(result.dataInicio).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
      expect(result.dataFim).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
    });

    it('should calculate ultimos30dias correctly', () => {
      const result = service.aplicarAtalhoPeriodo('ultimos30dias');
      const hoje = new Date();
      const trintaDiasAtras = new Date(hoje);
      trintaDiasAtras.setDate(hoje.getDate() - 30);

      // Verifica que dataFim é hoje
      const [diaFim, mesFim, anoFim] = result.dataFim.split('/').map(Number);
      expect(anoFim).toBe(hoje.getFullYear());
      expect(mesFim).toBe(hoje.getMonth() + 1);
      expect(diaFim).toBe(hoje.getDate());
    });

    it('should calculate esteMes correctly', () => {
      const result = service.aplicarAtalhoPeriodo('esteMes');
      const hoje = new Date();

      // dataInicio deve ser o primeiro dia do mês
      const [diaInicio] = result.dataInicio.split('/').map(Number);
      expect(diaInicio).toBe(1);

      // dataFim deve ser hoje
      const [diaFim, mesFim, anoFim] = result.dataFim.split('/').map(Number);
      expect(anoFim).toBe(hoje.getFullYear());
      expect(mesFim).toBe(hoje.getMonth() + 1);
      expect(diaFim).toBe(hoje.getDate());
    });

    it('should calculate ultimoMes correctly', () => {
      const result = service.aplicarAtalhoPeriodo('ultimoMes');
      const hoje = new Date();
      const mesAnterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);

      // dataInicio deve ser o primeiro dia do mês anterior
      const [diaInicio, mesInicio] = result.dataInicio.split('/').map(Number);
      expect(diaInicio).toBe(1);
      expect(mesInicio).toBe(mesAnterior.getMonth() + 1);

      // dataFim deve ser o último dia do mês anterior
      const ultimoDiaMesAnterior = new Date(hoje.getFullYear(), hoje.getMonth(), 0);
      const [diaFim] = result.dataFim.split('/').map(Number);
      expect(diaFim).toBe(ultimoDiaMesAnterior.getDate());
    });

    it('should calculate ultimoTrimestre correctly', () => {
      const result = service.aplicarAtalhoPeriodo('ultimoTrimestre');
      const hoje = new Date();
      const noventaDiasAtras = new Date(hoje);
      noventaDiasAtras.setDate(hoje.getDate() - 90);

      // Verifica que dataFim é hoje
      const [diaFim, mesFim, anoFim] = result.dataFim.split('/').map(Number);
      expect(anoFim).toBe(hoje.getFullYear());
      expect(mesFim).toBe(hoje.getMonth() + 1);
      expect(diaFim).toBe(hoje.getDate());
    });

    it('should calculate esteAno correctly', () => {
      const result = service.aplicarAtalhoPeriodo('esteAno');
      const hoje = new Date();

      // dataInicio deve ser 01/01 do ano atual
      const [diaInicio, mesInicio, anoInicio] = result.dataInicio.split('/').map(Number);
      expect(diaInicio).toBe(1);
      expect(mesInicio).toBe(1);
      expect(anoInicio).toBe(hoje.getFullYear());

      // dataFim deve ser hoje
      const [diaFim, mesFim, anoFim] = result.dataFim.split('/').map(Number);
      expect(anoFim).toBe(hoje.getFullYear());
      expect(mesFim).toBe(hoje.getMonth() + 1);
      expect(diaFim).toBe(hoje.getDate());
    });

    it('should return default (ultimos30dias) for unknown shortcut', () => {
      const result = service.aplicarAtalhoPeriodo('unknown' as any);
      const defaultResult = service.aplicarAtalhoPeriodo('ultimos30dias');

      expect(result.dataInicio).toBe(defaultResult.dataInicio);
      expect(result.dataFim).toBe(defaultResult.dataFim);
    });
  });

  describe('getPeriodoPadrao', () => {
    it('should return ultimos30dias as default', () => {
      const result = service.getPeriodoPadrao();
      const expected = service.aplicarAtalhoPeriodo('ultimos30dias');

      expect(result.dataInicio).toBe(expected.dataInicio);
      expect(result.dataFim).toBe(expected.dataFim);
    });
  });

  describe('salvarParametros', () => {
    it('should save parameters to localStorage', () => {
      const params = {documento: '12345678'};

      service.salvarParametros('historico-emprestimo', params);

      const stored = localStorage.getItem(STORAGE_KEY);
      expect(stored).not.toBeNull();

      const parsed = JSON.parse(stored ?? '{}');
      expect(parsed['historico-emprestimo'].parametros).toEqual(params);
      expect(parsed['historico-emprestimo'].ultimoUso).toBeDefined();
    });

    it('should preserve existing parameters for other reports', () => {
      service.salvarParametros('report-1', {param1: 'value1'});
      service.salvarParametros('report-2', {param2: 'value2'});

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');

      expect(stored['report-1'].parametros).toEqual({param1: 'value1'});
      expect(stored['report-2'].parametros).toEqual({param2: 'value2'});
    });

    it('should update existing parameters', () => {
      service.salvarParametros('test', {old: 'value'});
      service.salvarParametros('test', {new: 'value'});

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');

      expect(stored['test'].parametros).toEqual({new: 'value'});
    });
  });

  describe('getParametros', () => {
    it('should return saved parameters', () => {
      const params = {documento: '12345678'};
      service.salvarParametros('historico-emprestimo', params);

      const result = service.getParametros('historico-emprestimo');

      expect(result).toEqual(params);
    });

    it('should return undefined for non-existent report', () => {
      const result = service.getParametros('non-existent');

      expect(result).toBeUndefined();
    });

    it('should return undefined for expired parameters (> 7 days)', () => {
      // Salva com data antiga
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 8);

      const mockData = {
        'test-report': {
          parametros: {test: 'value'},
          ultimoUso: oldDate.toISOString()
        }
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mockData));

      const result = service.getParametros('test-report');

      expect(result).toBeUndefined();
    });

    it('should return parameters within 7 days', () => {
      // Salva com data de 6 dias atrás
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 6);

      const mockData = {
        'test-report': {
          parametros: {test: 'value'},
          ultimoUso: recentDate.toISOString()
        }
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mockData));

      const result = service.getParametros('test-report');

      expect(result).toEqual({test: 'value'});
    });
  });

  describe('limparParametros', () => {
    it('should clear parameters for specific report', () => {
      service.salvarParametros('report-1', {param1: 'value1'});
      service.salvarParametros('report-2', {param2: 'value2'});

      service.limparParametros('report-1');

      expect(service.getParametros('report-1')).toBeUndefined();
      expect(service.getParametros('report-2')).toEqual({param2: 'value2'});
    });

    it('should handle clearing non-existent report gracefully', () => {
      service.salvarParametros('test', {test: 'value'});

      expect(() => service.limparParametros('non-existent')).not.toThrow();
      expect(service.getParametros('test')).toEqual({test: 'value'});
    });
  });

  describe('limparTodos', () => {
    it('should clear all saved parameters', () => {
      service.salvarParametros('report-1', {param1: 'value1'});
      service.salvarParametros('report-2', {param2: 'value2'});

      service.limparTodos();

      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
      expect(service.getParametros('report-1')).toBeUndefined();
      expect(service.getParametros('report-2')).toBeUndefined();
    });
  });

  describe('date formatting edge cases', () => {
    it('should pad single digit days with zero', () => {
      const result = service.aplicarAtalhoPeriodo('esteAno');
      const [diaInicio] = result.dataInicio.split('/');

      expect(diaInicio).toBe('01');
    });

    it('should pad single digit months with zero', () => {
      const result = service.aplicarAtalhoPeriodo('esteAno');
      const [, mesInicio] = result.dataInicio.split('/');

      expect(mesInicio).toBe('01');
    });
  });
});
