import {TestBed} from '@angular/core/testing';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import {provideHttpClient} from '@angular/common/http';
import {HomeService} from './home.service';
import {environment} from '../../environments/environment';
import {
  AtividadeUsuario,
  EstatisticasUsuario,
  EventoCalendario,
  HistoricoUsoMensal,
  ItemFrequenteUsuario
} from './models/dashboard.models';

describe('HomeService', () => {
  let service: HomeService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.api_url}dashboard/`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        HomeService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(HomeService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Dashboard Admin', () => {
    it('deve buscar contagem de empréstimos no período', () => {
      // Arrange
      const dtIni = '01/01/2025';
      const dtFim = '31/01/2025';
      const mockResponse = {total: 50, emAndamento: 10, emAtraso: 2, finalizado: 38};

      // Act
      service.findDadosEmprestimoCountInRange(dtIni, dtFim).subscribe(result => {
        expect(result).toEqual(mockResponse);
      });

      // Assert
      const req = httpMock.expectOne(`${baseUrl}emprestimo-count-range?dtIni=${dtIni}&dtFim=${dtFim}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('deve buscar empréstimos por dia no período', () => {
      // Arrange
      const dtIni = '01/01/2025';
      const dtFim = '07/01/2025';
      const mockResponse = [
        {dtEmprestimo: '01/01/2025', qtde: 5},
        {dtEmprestimo: '02/01/2025', qtde: 3}
      ];

      // Act
      service.findDadosEmprestimoByDayInRange(dtIni, dtFim).subscribe(result => {
        expect(result).toEqual(mockResponse);
      });

      // Assert
      const req = httpMock.expectOne(`${baseUrl}emprestimo-count-day-range?dtIni=${dtIni}&dtFim=${dtFim}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('deve buscar itens mais emprestados', () => {
      // Arrange
      const dtIni = '01/01/2025';
      const dtFim = '31/01/2025';
      const mockResponse = [
        {item: 'Multímetro', qtde: 20},
        {item: 'Osciloscópio', qtde: 15}
      ];

      // Act
      service.findItensMaisEmprestados(dtIni, dtFim).subscribe(result => {
        expect(result).toEqual(mockResponse);
      });

      // Assert
      const req = httpMock.expectOne(`${baseUrl}itens-mais-emprestados?dtIni=${dtIni}&dtFim=${dtFim}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('deve buscar itens mais adquiridos', () => {
      // Arrange
      const dtIni = '01/01/2025';
      const dtFim = '31/01/2025';
      const mockResponse = [
        {item: 'Resistor 10k', qtde: 100},
        {item: 'Capacitor 100uF', qtde: 50}
      ];

      // Act
      service.findItensMaisAdquiridos(dtIni, dtFim).subscribe(result => {
        expect(result).toEqual(mockResponse);
      });

      // Assert
      const req = httpMock.expectOne(`${baseUrl}itens-mais-adquiridos?dtIni=${dtIni}&dtFim=${dtFim}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('deve buscar itens mais saídas', () => {
      // Arrange
      const dtIni = '01/01/2025';
      const dtFim = '31/01/2025';
      const mockResponse = [
        {item: 'Arduino Uno', qtde: 10},
        {item: 'Protoboard', qtde: 8}
      ];

      // Act
      service.findItensMaisSaidas(dtIni, dtFim).subscribe(result => {
        expect(result).toEqual(mockResponse);
      });

      // Assert
      const req = httpMock.expectOne(`${baseUrl}itens-mais-saidas?dtIni=${dtIni}&dtFim=${dtFim}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('Dashboard Aluno/Professor - getMyStats', () => {
    it('deve buscar estatísticas do usuário logado', () => {
      // Arrange
      const mockResponse: EstatisticasUsuario = {
        emprestimosEmAberto: 3,
        emprestimosEmAtraso: 1,
        emprestimosTotal: 25,
        proximaDevolucao: '2025-01-20',
        diasParaProximaDevolucao: 5
      };

      // Act
      service.getMyStats().subscribe(result => {
        expect(result).toEqual(mockResponse);
      });

      // Assert
      const req = httpMock.expectOne(`${baseUrl}my-stats`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('deve retornar null para proximaDevolucao quando não há empréstimos', () => {
      // Arrange
      const mockResponse: EstatisticasUsuario = {
        emprestimosEmAberto: 0,
        emprestimosEmAtraso: 0,
        emprestimosTotal: 10,
        proximaDevolucao: null,
        diasParaProximaDevolucao: null
      };

      // Act
      service.getMyStats().subscribe(result => {
        expect(result.proximaDevolucao).toBeNull();
        expect(result.diasParaProximaDevolucao).toBeNull();
      });

      // Assert
      const req = httpMock.expectOne(`${baseUrl}my-stats`);
      req.flush(mockResponse);
    });
  });

  describe('Dashboard Aluno/Professor - getMyFrequentItems', () => {
    it('deve buscar itens frequentes com limit padrão', () => {
      // Arrange
      const mockResponse: ItemFrequenteUsuario[] = [
        {itemId: 1, itemNome: 'Multímetro Digital', qtde: 8, saldo: 3},
        {itemId: 2, itemNome: 'Osciloscópio', qtde: 5, saldo: 1}
      ];

      // Act
      service.getMyFrequentItems().subscribe(result => {
        expect(result).toEqual(mockResponse);
        expect(result.length).toBe(2);
      });

      // Assert
      const req = httpMock.expectOne(`${baseUrl}my-frequent-items?limit=5`);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('limit')).toBe('5');
      req.flush(mockResponse);
    });

    it('deve buscar itens frequentes com limit customizado', () => {
      // Arrange
      const mockResponse: ItemFrequenteUsuario[] = [
        {itemId: 1, itemNome: 'Multímetro Digital', qtde: 8, saldo: 3}
      ];

      // Act
      service.getMyFrequentItems(10).subscribe(result => {
        expect(result).toEqual(mockResponse);
      });

      // Assert
      const req = httpMock.expectOne(`${baseUrl}my-frequent-items?limit=10`);
      expect(req.request.params.get('limit')).toBe('10');
      req.flush(mockResponse);
    });

    it('deve retornar array vazio quando não há itens frequentes', () => {
      // Act
      service.getMyFrequentItems().subscribe(result => {
        expect(result).toEqual([]);
        expect(result.length).toBe(0);
      });

      // Assert
      const req = httpMock.expectOne(`${baseUrl}my-frequent-items?limit=5`);
      req.flush([]);
    });
  });

  describe('Dashboard Aluno/Professor - getMyUsageHistory', () => {
    it('deve buscar histórico de uso com meses padrão', () => {
      // Arrange
      const mockResponse: HistoricoUsoMensal[] = [
        {mes: '2024-10', mesLabel: 'Out/24', quantidade: 3},
        {mes: '2024-11', mesLabel: 'Nov/24', quantidade: 5},
        {mes: '2024-12', mesLabel: 'Dez/24', quantidade: 2}
      ];

      // Act
      service.getMyUsageHistory().subscribe(result => {
        expect(result).toEqual(mockResponse);
        expect(result.length).toBe(3);
      });

      // Assert
      const req = httpMock.expectOne(`${baseUrl}my-usage-history?meses=6`);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('meses')).toBe('6');
      req.flush(mockResponse);
    });

    it('deve buscar histórico de uso com meses customizado', () => {
      // Arrange
      const mockResponse: HistoricoUsoMensal[] = [];

      // Act
      service.getMyUsageHistory(12).subscribe(result => {
        expect(result).toEqual(mockResponse);
      });

      // Assert
      const req = httpMock.expectOne(`${baseUrl}my-usage-history?meses=12`);
      expect(req.request.params.get('meses')).toBe('12');
      req.flush(mockResponse);
    });
  });

  describe('Dashboard Aluno/Professor - getMyActivity', () => {
    it('deve buscar atividades com limit padrão', () => {
      // Arrange
      const mockResponse: AtividadeUsuario[] = [
        {
          dataHora: '2025-01-15T10:30:00',
          tipo: 'EMPRESTIMO_RETIRADA',
          titulo: 'Empréstimo realizado',
          descricao: 'Multímetro Digital',
          referenciaId: 123,
          referenciaTipo: 'EMPRESTIMO'
        }
      ];

      // Act
      service.getMyActivity().subscribe(result => {
        expect(result).toEqual(mockResponse);
        expect(result[0].tipo).toBe('EMPRESTIMO_RETIRADA');
      });

      // Assert
      const req = httpMock.expectOne(`${baseUrl}my-activity?limit=20`);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('limit')).toBe('20');
      req.flush(mockResponse);
    });

    it('deve buscar atividades com limit customizado', () => {
      // Arrange
      const mockResponse: AtividadeUsuario[] = [];

      // Act
      service.getMyActivity(50).subscribe(result => {
        expect(result).toEqual(mockResponse);
      });

      // Assert
      const req = httpMock.expectOne(`${baseUrl}my-activity?limit=50`);
      expect(req.request.params.get('limit')).toBe('50');
      req.flush(mockResponse);
    });

    it('deve incluir todos os tipos de atividade na resposta', () => {
      // Arrange
      const mockResponse: AtividadeUsuario[] = [
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
        },
        {
          dataHora: '2025-01-08T09:00:00',
          tipo: 'RESERVA_CRIADA',
          titulo: 'Reserva criada',
          descricao: 'Fonte de Alimentação',
          referenciaId: 45,
          referenciaTipo: 'RESERVA'
        }
      ];

      // Act
      service.getMyActivity().subscribe(result => {
        expect(result.length).toBe(3);
        expect(result.map(a => a.tipo)).toContain('EMPRESTIMO_RETIRADA');
        expect(result.map(a => a.tipo)).toContain('EMPRESTIMO_DEVOLUCAO');
        expect(result.map(a => a.tipo)).toContain('RESERVA_CRIADA');
      });

      // Assert
      const req = httpMock.expectOne(`${baseUrl}my-activity?limit=20`);
      req.flush(mockResponse);
    });
  });

  describe('Dashboard Aluno/Professor - getMyCalendarEvents', () => {
    it('deve buscar eventos do calendário com datas corretas', () => {
      // Arrange
      const dtIni = '01/01/2025';
      const dtFim = '28/02/2025';
      const mockResponse: EventoCalendario[] = [
        {data: '2025-01-15', tipo: 'RETIRADA', emprestimoId: 123, descricao: 'Multímetro Digital'},
        {
          data: '2025-01-20',
          tipo: 'DEVOLUCAO_PREVISTA',
          emprestimoId: 123,
          descricao: 'Multímetro Digital'
        }
      ];

      // Act
      service.getMyCalendarEvents(dtIni, dtFim).subscribe(result => {
        expect(result).toEqual(mockResponse);
        expect(result.length).toBe(2);
      });

      // Assert
      const req = httpMock.expectOne(
        `${baseUrl}my-calendar-events?dtIni=${dtIni}&dtFim=${dtFim}`
      );
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('dtIni')).toBe(dtIni);
      expect(req.request.params.get('dtFim')).toBe(dtFim);
      req.flush(mockResponse);
    });

    it('deve incluir todos os tipos de evento na resposta', () => {
      // Arrange
      const dtIni = '01/01/2025';
      const dtFim = '28/02/2025';
      const mockResponse: EventoCalendario[] = [
        {data: '2025-01-15', tipo: 'RETIRADA', emprestimoId: 123, descricao: 'Item A'},
        {data: '2025-01-20', tipo: 'DEVOLUCAO_PREVISTA', emprestimoId: 123, descricao: 'Item A'},
        {data: '2025-01-18', tipo: 'DEVOLUCAO_REALIZADA', emprestimoId: 120, descricao: 'Item B'},
        {data: '2025-01-10', tipo: 'ATRASADO', emprestimoId: 115, descricao: 'Item C'}
      ];

      // Act
      service.getMyCalendarEvents(dtIni, dtFim).subscribe(result => {
        expect(result.length).toBe(4);
        const tipos = result.map(e => e.tipo);
        expect(tipos).toContain('RETIRADA');
        expect(tipos).toContain('DEVOLUCAO_PREVISTA');
        expect(tipos).toContain('DEVOLUCAO_REALIZADA');
        expect(tipos).toContain('ATRASADO');
      });

      // Assert
      const req = httpMock.expectOne(
        `${baseUrl}my-calendar-events?dtIni=${dtIni}&dtFim=${dtFim}`
      );
      req.flush(mockResponse);
    });

    it('deve retornar array vazio quando não há eventos', () => {
      // Arrange
      const dtIni = '01/06/2025';
      const dtFim = '30/06/2025';

      // Act
      service.getMyCalendarEvents(dtIni, dtFim).subscribe(result => {
        expect(result).toEqual([]);
        expect(result.length).toBe(0);
      });

      // Assert
      const req = httpMock.expectOne(
        `${baseUrl}my-calendar-events?dtIni=${dtIni}&dtFim=${dtFim}`
      );
      req.flush([]);
    });
  });

  describe('URL Base', () => {
    it('deve usar a URL correta do ambiente', () => {
      expect(service['url']).toBe(`${environment.api_url}dashboard/`);
    });
  });
});
