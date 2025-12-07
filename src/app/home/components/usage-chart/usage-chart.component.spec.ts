import {ComponentFixture, fakeAsync, flush, TestBed} from '@angular/core/testing';
import {UsageChartComponent} from './usage-chart.component';
import {ChartService} from '../../../framework/charts/chart.service';
import {LoggerService} from '../../../framework/services/logger.service';
import {HistoricoUsoMensal} from '../../models/dashboard.models';

/**
 * Factory para criar histórico de uso de teste.
 */
function createMockHistory(count = 6): HistoricoUsoMensal[] {
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
  return months.slice(0, count).map((month, index) => ({
    mes: `2025-0${index + 1}`,
    mesLabel: `${month}/25`,
    quantidade: index + 1
  }));
}

describe('UsageChartComponent', () => {
  let component: UsageChartComponent;
  let fixture: ComponentFixture<UsageChartComponent>;
  let chartServiceMock: jest.Mocked<ChartService>;
  let loggerServiceMock: jest.Mocked<LoggerService>;

  beforeEach(async () => {
    chartServiceMock = {
      createBarChart: jest.fn().mockResolvedValue(undefined),
      disposeChart: jest.fn()
    } as unknown as jest.Mocked<ChartService>;

    loggerServiceMock = {
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      debug: jest.fn()
    } as unknown as jest.Mocked<LoggerService>;

    await TestBed.configureTestingModule({
      imports: [UsageChartComponent],
      providers: [
        {provide: ChartService, useValue: chartServiceMock},
        {provide: LoggerService, useValue: loggerServiceMock}
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UsageChartComponent);
    component = fixture.componentInstance;
  });

  describe('Inicialização', () => {
    it('deve criar o componente', () => {
      expect(component).toBeTruthy();
    });

    it('deve ter history como array vazio por padrão', () => {
      expect(component.history()).toEqual([]);
    });

    it('deve ter loading como false por padrão', () => {
      expect(component.loading()).toBe(false);
    });

    it('deve ter hasData como false por padrão', () => {
      expect(component['hasData']()).toBe(false);
    });

    it('deve ter host class "block"', () => {
      expect(fixture.nativeElement.classList.contains('block')).toBe(true);
    });
  });

  describe('Estado de Loading', () => {
    it('deve mostrar skeleton quando loading é true', () => {
      fixture.componentRef.setInput('loading', true);
      fixture.detectChanges();

      const skeleton = fixture.nativeElement.querySelector('p-skeleton');
      expect(skeleton).toBeTruthy();
    });

    it('não deve mostrar container do gráfico quando loading é true', () => {
      fixture.componentRef.setInput('loading', true);
      fixture.detectChanges();

      const chartContainer = fixture.nativeElement.querySelector('#usage-chart-container');
      expect(chartContainer).toBeFalsy();
    });

    it('não deve mostrar mensagem de vazio quando loading é true', () => {
      fixture.componentRef.setInput('loading', true);
      fixture.detectChanges();

      const content = fixture.nativeElement.textContent;
      expect(content).not.toContain('Nenhum empréstimo nos últimos 6 meses');
    });
  });

  describe('Estado Vazio', () => {
    it('deve mostrar mensagem de vazio quando não há dados e não está carregando', () => {
      fixture.componentRef.setInput('loading', false);
      fixture.componentRef.setInput('history', []);
      fixture.detectChanges();

      const content = fixture.nativeElement.textContent;
      expect(content).toContain('Nenhum empréstimo nos últimos 6 meses');
    });

    it('deve mostrar ícone de gráfico na mensagem de vazio', () => {
      fixture.componentRef.setInput('loading', false);
      fixture.componentRef.setInput('history', []);
      fixture.detectChanges();

      const icons = fixture.nativeElement.querySelectorAll('.pi-chart-bar');
      // Deve ter pelo menos um ícone (no empty state)
      expect(icons.length).toBeGreaterThan(0);
    });
  });

  describe('Criação do Gráfico', () => {
    it('deve chamar createBarChart quando há dados após ngAfterViewInit', fakeAsync(() => {
      const mockHistory = createMockHistory();
      fixture.componentRef.setInput('loading', false);
      fixture.componentRef.setInput('history', mockHistory);

      fixture.detectChanges();
      flush();

      expect(chartServiceMock.createBarChart).toHaveBeenCalledWith({
        containerId: 'usage-chart-container',
        data: mockHistory,
        categoryField: 'mesLabel',
        valueField: 'quantidade',
        noDataMessage: 'Nenhum empréstimo no período.'
      });
    }));

    it('não deve chamar createBarChart quando loading é true', fakeAsync(() => {
      fixture.componentRef.setInput('loading', true);
      fixture.componentRef.setInput('history', createMockHistory());

      fixture.detectChanges();
      flush();

      expect(chartServiceMock.createBarChart).not.toHaveBeenCalled();
    }));

    it('não deve chamar createBarChart quando não há dados', fakeAsync(() => {
      fixture.componentRef.setInput('loading', false);
      fixture.componentRef.setInput('history', []);

      fixture.detectChanges();
      flush();

      expect(chartServiceMock.createBarChart).not.toHaveBeenCalled();
    }));

    it('deve definir hasData como false quando não há dados', fakeAsync(() => {
      fixture.componentRef.setInput('loading', false);
      fixture.componentRef.setInput('history', []);

      fixture.detectChanges();
      flush();

      expect(component['hasData']()).toBe(false);
    }));
  });

  describe('Renderização do Header', () => {
    it('deve exibir título "Meu Histórico"', () => {
      fixture.detectChanges();

      const content = fixture.nativeElement.textContent;
      expect(content).toContain('Meu Histórico');
    });

    it('deve exibir ícone de gráfico no header', () => {
      fixture.detectChanges();

      const headerIcon = fixture.nativeElement.querySelector('.card-custom-header .pi-chart-bar');
      expect(headerIcon).toBeTruthy();
    });

    it('deve sempre exibir o header independente do estado de loading', () => {
      fixture.componentRef.setInput('loading', true);
      fixture.detectChanges();

      const content = fixture.nativeElement.textContent;
      expect(content).toContain('Meu Histórico');
    });

    it('deve sempre exibir o header quando não há dados', () => {
      fixture.componentRef.setInput('loading', false);
      fixture.componentRef.setInput('history', []);
      fixture.detectChanges();

      const content = fixture.nativeElement.textContent;
      expect(content).toContain('Meu Histórico');
    });
  });

  describe('ngOnDestroy', () => {
    it('deve ter método ngOnDestroy definido', () => {
      expect(component.ngOnDestroy).toBeDefined();
    });
  });

  describe('Inputs', () => {
    it('deve aceitar history como input', () => {
      const mockHistory = createMockHistory();
      fixture.componentRef.setInput('history', mockHistory);
      fixture.detectChanges();

      expect(component.history()).toEqual(mockHistory);
    });

    it('deve aceitar loading como input', () => {
      fixture.componentRef.setInput('loading', true);
      fixture.detectChanges();

      expect(component.loading()).toBe(true);
    });
  });
});
