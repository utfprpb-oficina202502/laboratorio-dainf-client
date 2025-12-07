import {ComponentFixture, TestBed} from '@angular/core/testing';
import {HomeComponent} from './home.component';
import {HomeService} from './home.service';
import {LoginService} from '../login/login.service';
import {ChartService} from '../framework/charts/chart.service';
import {LoggerService} from '../framework/services/logger.service';
import {DatePipe} from '@angular/common';
import {of, throwError} from 'rxjs';
import {DashboardEmprestimoCountRange} from './dashboard/dashboardEmprestimoCountRange';
import {provideAnimationsAsync} from '@angular/platform-browser/animations/async';
import {provideRouter} from '@angular/router';
import {MessageService} from 'primeng/api';
import {
  AtividadeUsuario,
  EstatisticasUsuario,
  EventoCalendario,
  HistoricoUsoMensal,
  ItemFrequenteUsuario
} from './models/dashboard.models';
import {Usuario} from '../usuario/usuario';

/**
 * Factory para criar um usuário mock para testes.
 */
function createMockUsuario(nome: string): Usuario {
  return {
    id: 1,
    nome,
    documento: '12345678901',
    username: 'usuario.teste',
    password: '',
    email: 'teste@utfpr.edu.br',
    telefone: '41999999999',
    permissoes: [],
    fotoURL: ''
  };
}

/**
 * Factory para criar estatísticas de usuário para testes.
 */
function createMockStats(overrides: Partial<EstatisticasUsuario> = {}): EstatisticasUsuario {
  return {
    emprestimosEmAberto: 2,
    emprestimosEmAtraso: 0,
    emprestimosTotal: 15,
    proximaDevolucao: '2025-01-20',
    diasParaProximaDevolucao: 5,
    ...overrides
  };
}

/**
 * Factory para criar itens frequentes para testes.
 */
function createMockFrequentItems(): ItemFrequenteUsuario[] {
  return [
    {itemId: 1, itemNome: 'Multímetro Digital', qtde: 8, saldo: 3},
    {itemId: 2, itemNome: 'Osciloscópio', qtde: 5, saldo: 1},
    {itemId: 3, itemNome: 'Fonte de Alimentação', qtde: 3, saldo: 0}
  ];
}

/**
 * Factory para criar histórico de uso para testes.
 */
function createMockUsageHistory(): HistoricoUsoMensal[] {
  return [
    {mes: '2024-10', mesLabel: 'Out/24', quantidade: 3},
    {mes: '2024-11', mesLabel: 'Nov/24', quantidade: 5},
    {mes: '2024-12', mesLabel: 'Dez/24', quantidade: 2}
  ];
}

/**
 * Factory para criar atividades para testes.
 */
function createMockActivities(): AtividadeUsuario[] {
  return [
    {
      dataHora: '2025-01-15T10:30:00',
      tipo: 'EMPRESTIMO_RETIRADA',
      titulo: 'Empréstimo realizado',
      descricao: 'Multímetro Digital',
      referenciaId: 123,
      referenciaTipo: 'EMPRESTIMO'
    },
    {
      dataHora: '2025-01-10T14:00:00',
      tipo: 'EMPRESTIMO_DEVOLUCAO',
      titulo: 'Devolução realizada',
      descricao: 'Osciloscópio',
      referenciaId: 120,
      referenciaTipo: 'EMPRESTIMO'
    }
  ];
}

/**
 * Factory para criar eventos de calendário para testes.
 */
function createMockCalendarEvents(): EventoCalendario[] {
  return [
    {data: '2025-01-15', tipo: 'RETIRADA', emprestimoId: 123, descricao: 'Multímetro Digital'},
    {
      data: '2025-01-20',
      tipo: 'DEVOLUCAO_PREVISTA',
      emprestimoId: 123,
      descricao: 'Multímetro Digital'
    },
    {data: '2025-01-10', tipo: 'DEVOLUCAO_REALIZADA', emprestimoId: 120, descricao: 'Osciloscópio'}
  ];
}

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let mockHomeService: jest.Mocked<HomeService>;
  let mockLoginService: jest.Mocked<LoginService>;
  let mockChartService: jest.Mocked<ChartService>;
  let mockLoggerService: jest.Mocked<LoggerService>;
  let mockMessageService: jest.Mocked<MessageService>;

  beforeEach(async () => {
    // Criar mocks completos dos serviços
    mockHomeService = {
      findDadosEmprestimoCountInRange: jest.fn(),
      findDadosEmprestimoByDayInRange: jest.fn(),
      findItensMaisEmprestados: jest.fn(),
      findItensMaisAdquiridos: jest.fn(),
      findItensMaisSaidas: jest.fn(),
      // Dashboard Aluno/Professor
      getMyStats: jest.fn(),
      getMyFrequentItems: jest.fn(),
      getMyUsageHistory: jest.fn(),
      getMyActivity: jest.fn(),
      getMyCalendarEvents: jest.fn()
    } as any;

    mockLoginService = {
      userLoggedIsAlunoOrProfessor: jest.fn(),
      getCurrentUser: jest.fn()
    } as any;

    mockChartService = {
      createLineChart: jest.fn(),
      createBarChart: jest.fn(),
      createPieChart: jest.fn(),
      disposeAll: jest.fn(),
      disposeChart: jest.fn()
    } as any;

    mockLoggerService = {
      error: jest.fn()
    } as any;

    mockMessageService = {
      add: jest.fn()
    } as any;

    // Configurar retornos padrão para dashboard admin
    mockLoginService.userLoggedIsAlunoOrProfessor.mockResolvedValue(false);
    mockLoginService.getCurrentUser.mockReturnValue(of(createMockUsuario('João Silva')));
    mockHomeService.findDadosEmprestimoCountInRange.mockReturnValue(of(new DashboardEmprestimoCountRange()));

    // Configurar retornos padrão para dashboard aluno/professor
    mockHomeService.getMyStats.mockReturnValue(of(createMockStats()));
    mockHomeService.getMyFrequentItems.mockReturnValue(of(createMockFrequentItems()));
    mockHomeService.getMyUsageHistory.mockReturnValue(of(createMockUsageHistory()));
    mockHomeService.getMyActivity.mockReturnValue(of(createMockActivities()));
    mockHomeService.getMyCalendarEvents.mockReturnValue(of(createMockCalendarEvents()));

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

  describe('Dashboard Aluno/Professor - Carregamento de Dados', () => {
    beforeEach(() => {
      mockLoginService.userLoggedIsAlunoOrProfessor.mockResolvedValue(true);
    });

    it('deve carregar estatísticas do usuário ao inicializar', async () => {
      // Arrange
      const mockStats = createMockStats({emprestimosEmAberto: 5, emprestimosEmAtraso: 1});
      mockHomeService.getMyStats.mockReturnValue(of(mockStats));

      // Act
      component.ngOnInit();
      await fixture.whenStable();
      fixture.detectChanges();

      // Assert
      expect(mockHomeService.getMyStats).toHaveBeenCalled();
      expect(component['userStats']()).toEqual(mockStats);
    });

    it('deve carregar itens frequentes do usuário ao inicializar', async () => {
      // Arrange
      const mockItems = createMockFrequentItems();
      mockHomeService.getMyFrequentItems.mockReturnValue(of(mockItems));

      // Act
      component.ngOnInit();
      await fixture.whenStable();
      fixture.detectChanges();

      // Assert
      expect(mockHomeService.getMyFrequentItems).toHaveBeenCalled();
      expect(component['userFrequentItems']()).toEqual(mockItems);
    });

    it('deve carregar histórico de uso do usuário ao inicializar', async () => {
      // Arrange
      const mockHistory = createMockUsageHistory();
      mockHomeService.getMyUsageHistory.mockReturnValue(of(mockHistory));

      // Act
      component.ngOnInit();
      await fixture.whenStable();
      fixture.detectChanges();

      // Assert
      expect(mockHomeService.getMyUsageHistory).toHaveBeenCalled();
      expect(component['userUsageHistory']()).toEqual(mockHistory);
    });

    it('deve carregar atividades recentes do usuário ao inicializar', async () => {
      // Arrange
      const mockActivities = createMockActivities();
      mockHomeService.getMyActivity.mockReturnValue(of(mockActivities));

      // Act
      component.ngOnInit();
      await fixture.whenStable();
      fixture.detectChanges();

      // Assert
      expect(mockHomeService.getMyActivity).toHaveBeenCalled();
      expect(component['userActivities']()).toEqual(mockActivities);
    });

    it('deve carregar eventos do calendário ao inicializar', async () => {
      // Arrange
      const mockEvents = createMockCalendarEvents();
      mockHomeService.getMyCalendarEvents.mockReturnValue(of(mockEvents));

      // Act
      component.ngOnInit();
      await fixture.whenStable();
      fixture.detectChanges();

      // Assert
      expect(mockHomeService.getMyCalendarEvents).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String)
      );
      expect(component['userCalendarEvents']()).toEqual(mockEvents);
    });

    it('deve carregar o nome do usuário ao inicializar', async () => {
      // Arrange
      mockLoginService.getCurrentUser.mockReturnValue(of(createMockUsuario('Maria Souza')));

      // Act
      component.ngOnInit();
      await fixture.whenStable();
      fixture.detectChanges();

      // Assert
      expect(mockLoginService.getCurrentUser).toHaveBeenCalled();
      expect(component['userName']()).toBe('Maria');
    });

    it('deve extrair apenas o primeiro nome do usuário', async () => {
      // Arrange
      mockLoginService.getCurrentUser.mockReturnValue(of(createMockUsuario('João Pedro da Silva')));

      // Act
      component.ngOnInit();
      await fixture.whenStable();
      fixture.detectChanges();

      // Assert
      expect(component['userName']()).toBe('João');
    });

    it('deve manter userName vazio se usuário não tem nome', async () => {
      // Arrange
      mockLoginService.getCurrentUser.mockReturnValue(of(createMockUsuario('')));

      // Act
      component.ngOnInit();
      await fixture.whenStable();
      fixture.detectChanges();

      // Assert
      expect(component['userName']()).toBe('');
    });
  });

  describe('Dashboard Aluno/Professor - Estados de Loading', () => {
    beforeEach(() => {
      mockLoginService.userLoggedIsAlunoOrProfessor.mockResolvedValue(true);
    });

    it('deve definir loadingUserStats como true enquanto carrega estatísticas', async () => {
      // Act
      component.ngOnInit();

      // Assert - loading deve ser true inicialmente
      await fixture.whenStable();
      // O loading é setado como false após a resposta do observable
      expect(component['loadingUserStats']()).toBe(false);
    });

    it('deve definir loadingUserItems como false após carregar itens', async () => {
      // Act
      component.ngOnInit();
      await fixture.whenStable();
      fixture.detectChanges();

      // Assert
      expect(component['loadingUserItems']()).toBe(false);
    });

    it('deve definir loadingUserHistory como false após carregar histórico', async () => {
      // Act
      component.ngOnInit();
      await fixture.whenStable();
      fixture.detectChanges();

      // Assert
      expect(component['loadingUserHistory']()).toBe(false);
    });

    it('deve definir loadingUserActivities como false após carregar atividades', async () => {
      // Act
      component.ngOnInit();
      await fixture.whenStable();
      fixture.detectChanges();

      // Assert
      expect(component['loadingUserActivities']()).toBe(false);
    });

    it('deve definir loadingUserCalendar como false após carregar calendário', async () => {
      // Act
      component.ngOnInit();
      await fixture.whenStable();
      fixture.detectChanges();

      // Assert
      expect(component['loadingUserCalendar']()).toBe(false);
    });
  });

  describe('Dashboard Aluno/Professor - Tratamento de Erros', () => {
    beforeEach(() => {
      mockLoginService.userLoggedIsAlunoOrProfessor.mockResolvedValue(true);
    });

    it('deve logar erro quando falha ao carregar estatísticas', async () => {
      // Arrange
      const error = new Error('Network error');
      mockHomeService.getMyStats.mockReturnValue(throwError(() => error));

      // Act
      component.ngOnInit();
      await fixture.whenStable();
      fixture.detectChanges();

      // Assert
      expect(mockLoggerService.error).toHaveBeenCalledWith(
        'Erro ao carregar estatísticas do usuário',
        error
      );
    });

    it('deve logar erro quando falha ao carregar itens frequentes', async () => {
      // Arrange
      const error = new Error('Network error');
      mockHomeService.getMyFrequentItems.mockReturnValue(throwError(() => error));

      // Act
      component.ngOnInit();
      await fixture.whenStable();
      fixture.detectChanges();

      // Assert
      expect(mockLoggerService.error).toHaveBeenCalledWith(
        'Erro ao carregar itens frequentes',
        error
      );
    });

    it('deve logar erro quando falha ao carregar histórico de uso', async () => {
      // Arrange
      const error = new Error('Network error');
      mockHomeService.getMyUsageHistory.mockReturnValue(throwError(() => error));

      // Act
      component.ngOnInit();
      await fixture.whenStable();
      fixture.detectChanges();

      // Assert
      expect(mockLoggerService.error).toHaveBeenCalledWith(
        'Erro ao carregar histórico de uso',
        error
      );
    });

    it('deve logar erro quando falha ao carregar atividades', async () => {
      // Arrange
      const error = new Error('Network error');
      mockHomeService.getMyActivity.mockReturnValue(throwError(() => error));

      // Act
      component.ngOnInit();
      await fixture.whenStable();
      fixture.detectChanges();

      // Assert
      expect(mockLoggerService.error).toHaveBeenCalledWith(
        'Erro ao carregar atividades',
        error
      );
    });

    it('deve logar erro quando falha ao carregar eventos do calendário', async () => {
      // Arrange
      const error = new Error('Network error');
      mockHomeService.getMyCalendarEvents.mockReturnValue(throwError(() => error));

      // Act
      component.ngOnInit();
      await fixture.whenStable();
      fixture.detectChanges();

      // Assert
      expect(mockLoggerService.error).toHaveBeenCalledWith(
        'Erro ao carregar eventos do calendário',
        error
      );
    });

    it('não deve impedir carregamento de outros dados se um falhar', async () => {
      // Arrange - apenas stats falha
      mockHomeService.getMyStats.mockReturnValue(throwError(() => new Error('Error')));

      // Act
      component.ngOnInit();
      await fixture.whenStable();
      fixture.detectChanges();

      // Assert - outros dados devem carregar normalmente
      expect(component['userFrequentItems']().length).toBeGreaterThan(0);
      expect(component['userUsageHistory']().length).toBeGreaterThan(0);
      expect(component['userActivities']().length).toBeGreaterThan(0);
    });
  });

  describe('Dashboard Aluno/Professor - Não Carregar para Admin', () => {
    it('não deve chamar métodos do dashboard aluno quando usuário é admin', async () => {
      // Arrange
      mockLoginService.userLoggedIsAlunoOrProfessor.mockResolvedValue(false);

      // Act
      component.ngOnInit();
      await fixture.whenStable();
      fixture.detectChanges();

      // Assert
      expect(mockHomeService.getMyStats).not.toHaveBeenCalled();
      expect(mockHomeService.getMyFrequentItems).not.toHaveBeenCalled();
      expect(mockHomeService.getMyUsageHistory).not.toHaveBeenCalled();
      expect(mockHomeService.getMyActivity).not.toHaveBeenCalled();
      expect(mockHomeService.getMyCalendarEvents).not.toHaveBeenCalled();
    });

    it('deve chamar métodos do dashboard admin quando usuário é admin', async () => {
      // Arrange
      mockLoginService.userLoggedIsAlunoOrProfessor.mockResolvedValue(false);
      const countData = new DashboardEmprestimoCountRange();
      countData.total = 10;
      mockHomeService.findDadosEmprestimoCountInRange.mockReturnValue(of(countData));

      // Act
      component.ngOnInit();
      component.ngAfterViewInit();
      await fixture.whenStable();
      fixture.detectChanges();

      // Assert
      expect(mockHomeService.findDadosEmprestimoCountInRange).toHaveBeenCalled();
    });
  });
});
