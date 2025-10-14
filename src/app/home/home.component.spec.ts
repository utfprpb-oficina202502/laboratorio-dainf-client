import {ComponentFixture, TestBed} from '@angular/core/testing';
import {HomeComponent} from './home.component';
import {HomeService} from './home.service';
import {LoginService} from '../login/login.service';
import {ChartService} from '../framework/charts/chart.service';
import {LoggerService} from '../framework/services/logger.service';
import {DatePipe} from '@angular/common';
import {of} from 'rxjs';
import {DashboardEmprestimoCountRange} from './dashboard/dashboardEmprestimoCountRange';
import {provideAnimationsAsync} from '@angular/platform-browser/animations/async';
import {provideRouter} from '@angular/router';
import {MessageService} from 'primeng/api';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let mockHomeService: jest.Mocked<HomeService>;
  let mockLoginService: jest.Mocked<LoginService>;
  let mockChartService: jest.Mocked<ChartService>;
  let mockLoggerService: jest.Mocked<LoggerService>;
  let mockMessageService: jest.Mocked<MessageService>;

  beforeEach(async () => {
    // Criar mocks dos serviços
    mockHomeService = {
      findDadosEmprestimoCountInRange: jest.fn(),
      findDadosEmprestimoByDayInRange: jest.fn(),
      findItensMaisEmprestados: jest.fn(),
      findItensMaisAdquiridos: jest.fn(),
      findItensMaisSaidas: jest.fn()
    } as any;

    mockLoginService = {
      userLoggedIsAlunoOrProfessor: jest.fn()
    } as any;

    mockChartService = {
      createLineChart: jest.fn(),
      createBarChart: jest.fn(),
      createPieChart: jest.fn(),
      disposeAll: jest.fn()
    } as any;

    mockLoggerService = {
      error: jest.fn()
    } as any;

    mockMessageService = {
      add: jest.fn()
    } as any;

    // Configurar retornos padrão
    mockLoginService.userLoggedIsAlunoOrProfessor.mockResolvedValue(false);
    mockHomeService.findDadosEmprestimoCountInRange.mockReturnValue(of(new DashboardEmprestimoCountRange()));

    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        DatePipe,
        provideAnimationsAsync(),
        provideRouter([]),
        {provide: HomeService, useValue: mockHomeService},
        {provide: LoginService, useValue: mockLoginService},
        {provide: ChartService, useValue: mockChartService},
        {provide: LoggerService, useValue: mockLoggerService},
        {provide: MessageService, useValue: mockMessageService}
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
  });

  describe('Fullscreen Functionality', () => {
    let mockWrapper: HTMLElement;

    beforeEach(() => {
      // Criar elemento mock para testes de fullscreen
      mockWrapper = document.createElement('div');
      mockWrapper.id = 'chart-wrapper-test';
      mockWrapper.requestFullscreen = jest.fn().mockResolvedValue(undefined);
      document.body.appendChild(mockWrapper);
    });

    afterEach(() => {
      // Verificar se o elemento está no DOM antes de remover
      if (mockWrapper && mockWrapper.parentNode) {
        document.body.removeChild(mockWrapper);
      }
    });

    it('deve colocar o wrapper em fullscreen quando não está em fullscreen', async () => {
      // Arrange
      Object.defineProperty(document, 'fullscreenElement', {
        writable: true,
        configurable: true,
        value: null
      });

      // Act
      (component as any).toggleFullscreen('chart-wrapper-test');
      await fixture.whenStable();

      // Assert
      expect(mockWrapper.requestFullscreen).toHaveBeenCalled();
    });

    it('deve sair do fullscreen quando já está em fullscreen', async () => {
      // Arrange
      Object.defineProperty(document, 'fullscreenElement', {
        writable: true,
        configurable: true,
        value: mockWrapper
      });
      document.exitFullscreen = jest.fn().mockResolvedValue(undefined);

      // Act
      (component as any).toggleFullscreen('chart-wrapper-test');
      await fixture.whenStable();

      // Assert
      expect(document.exitFullscreen).toHaveBeenCalled();
    });

    it('não deve fazer nada se o wrapper não existir', () => {
      // Arrange
      const consoleErrorSpy = jest.spyOn(console, 'error');

      // Act
      (component as any).toggleFullscreen('wrapper-inexistente');

      // Assert
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('deve logar erro se requestFullscreen falhar', async () => {
      // Arrange
      const error = new Error('Fullscreen não suportado');
      mockWrapper.requestFullscreen = jest.fn().mockRejectedValue(error);
      Object.defineProperty(document, 'fullscreenElement', {
        writable: true,
        configurable: true,
        value: null
      });

      // Act
      (component as any).toggleFullscreen('chart-wrapper-test');
      await fixture.whenStable();

      // Assert
      expect(mockLoggerService.error).toHaveBeenCalledWith(
        expect.stringContaining('Erro ao entrar em tela cheia'),
        error
      );
    });
  });

  describe('Chart Data Signals', () => {
    it('deve inicializar todos os signals de dados dos gráficos como false', () => {
      // Assert
      expect(component['hasLineChartData']()).toBe(false);
      expect(component['hasBarChartData']()).toBe(false);
      expect(component['hasPie1ChartData']()).toBe(false);
      expect(component['hasPie2ChartData']()).toBe(false);
    });

    it('deve atualizar hasLineChartData quando há dados no gráfico de linha', (done) => {
      // Arrange
      const mockData = [{dtEmprestimo: '01/01/2024', qtde: 5}];
      mockHomeService.findDadosEmprestimoByDayInRange.mockReturnValue(of(mockData));
      mockHomeService.findItensMaisEmprestados.mockReturnValue(of([]));
      mockHomeService.findItensMaisAdquiridos.mockReturnValue(of([]));
      mockHomeService.findItensMaisSaidas.mockReturnValue(of([]));

      const countData = new DashboardEmprestimoCountRange();
      countData.total = 5;
      mockHomeService.findDadosEmprestimoCountInRange.mockReturnValue(of(countData));

      // Act
      component.ngOnInit();
      fixture.detectChanges();

      // Assert
      setTimeout(() => {
        expect(component['hasLineChartData']()).toBe(true);
        expect(component['hasBarChartData']()).toBe(false);
        done();
      }, 100);
    });

    it('deve atualizar hasBarChartData quando há dados no gráfico de barras', (done) => {
      // Arrange
      const mockBarData = [{item: 'Item 1', qtde: 10}];
      mockHomeService.findDadosEmprestimoByDayInRange.mockReturnValue(of([]));
      mockHomeService.findItensMaisEmprestados.mockReturnValue(of(mockBarData));
      mockHomeService.findItensMaisAdquiridos.mockReturnValue(of([]));
      mockHomeService.findItensMaisSaidas.mockReturnValue(of([]));

      const countData = new DashboardEmprestimoCountRange();
      countData.total = 5;
      mockHomeService.findDadosEmprestimoCountInRange.mockReturnValue(of(countData));

      // Act
      component.ngOnInit();
      fixture.detectChanges();

      // Assert
      setTimeout(() => {
        expect(component['hasLineChartData']()).toBe(false);
        expect(component['hasBarChartData']()).toBe(true);
        done();
      }, 100);
    });

    it('deve atualizar hasPie1ChartData quando há dados no primeiro gráfico de pizza', (done) => {
      // Arrange
      const mockPieData = [{item: 'Item 1', qtde: 10}];
      mockHomeService.findDadosEmprestimoByDayInRange.mockReturnValue(of([]));
      mockHomeService.findItensMaisEmprestados.mockReturnValue(of([]));
      mockHomeService.findItensMaisAdquiridos.mockReturnValue(of(mockPieData));
      mockHomeService.findItensMaisSaidas.mockReturnValue(of([]));

      const countData = new DashboardEmprestimoCountRange();
      countData.total = 5;
      mockHomeService.findDadosEmprestimoCountInRange.mockReturnValue(of(countData));

      // Act
      component.ngOnInit();
      fixture.detectChanges();

      // Assert
      setTimeout(() => {
        expect(component['hasPie1ChartData']()).toBe(true);
        expect(component['hasPie2ChartData']()).toBe(false);
        done();
      }, 100);
    });

    it('deve atualizar hasPie2ChartData quando há dados no segundo gráfico de pizza', (done) => {
      // Arrange
      const mockPieData = [{item: 'Item 1', qtde: 10}];
      mockHomeService.findDadosEmprestimoByDayInRange.mockReturnValue(of([]));
      mockHomeService.findItensMaisEmprestados.mockReturnValue(of([]));
      mockHomeService.findItensMaisAdquiridos.mockReturnValue(of([]));
      mockHomeService.findItensMaisSaidas.mockReturnValue(of(mockPieData));

      const countData = new DashboardEmprestimoCountRange();
      countData.total = 5;
      mockHomeService.findDadosEmprestimoCountInRange.mockReturnValue(of(countData));

      // Act
      component.ngOnInit();
      fixture.detectChanges();

      // Assert
      setTimeout(() => {
        expect(component['hasPie2ChartData']()).toBe(true);
        done();
      }, 100);
    });

    it('deve definir todos os signals como false quando não há dados', (done) => {
      // Arrange
      mockHomeService.findDadosEmprestimoByDayInRange.mockReturnValue(of([]));
      mockHomeService.findItensMaisEmprestados.mockReturnValue(of([]));
      mockHomeService.findItensMaisAdquiridos.mockReturnValue(of([]));
      mockHomeService.findItensMaisSaidas.mockReturnValue(of([]));

      const countData = new DashboardEmprestimoCountRange();
      mockHomeService.findDadosEmprestimoCountInRange.mockReturnValue(of(countData));

      // Act
      component.ngOnInit();
      fixture.detectChanges();

      // Assert
      setTimeout(() => {
        expect(component['hasLineChartData']()).toBe(false);
        expect(component['hasBarChartData']()).toBe(false);
        expect(component['hasPie1ChartData']()).toBe(false);
        expect(component['hasPie2ChartData']()).toBe(false);
        done();
      }, 100);
    });
  });

  describe('Chart Disposal on Destroy', () => {
    it('deve chamar disposeAll do ChartService ao destruir o componente', () => {
      // Act
      component.ngOnDestroy();

      // Assert
      expect(mockChartService.disposeAll).toHaveBeenCalled();
    });

    it('deve marcar o componente como destruído', () => {
      // Act
      component.ngOnDestroy();

      // Assert
      expect(component['destroyed']).toBe(true);
    });
  });

  describe('Dashboard Visibility', () => {
    it('deve mostrar dashboard de aluno quando usuário é aluno', async () => {
      // Arrange
      mockLoginService.userLoggedIsAlunoOrProfessor.mockResolvedValue(true);

      // Act
      component.ngOnInit();
      await fixture.whenStable();
      fixture.detectChanges();

      // Assert
      expect(component['showDashboardAluno']()).toBe(true);
    });

    it('não deve mostrar dashboard de aluno quando usuário não é aluno', async () => {
      // Arrange
      mockLoginService.userLoggedIsAlunoOrProfessor.mockResolvedValue(false);

      // Act
      component.ngOnInit();
      await fixture.whenStable();
      fixture.detectChanges();

      // Assert
      expect(component['showDashboardAluno']()).toBe(false);
    });
  });
});
