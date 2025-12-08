import {TestBed} from '@angular/core/testing';
import {HttpClientTestingModule, HttpTestingController} from '@angular/common/http/testing';
import {RelatorioApiService} from './relatorio-api.service';
import {environment} from '../../../environments/environment';

/**
 * Testes para RelatorioApiService
 * Cobre os 6 endpoints de geração de relatórios
 */
describe('RelatorioApiService', () => {
  let service: RelatorioApiService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.api_url}relatorio`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [RelatorioApiService]
    });

    service = TestBed.inject(RelatorioApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('gerarHistoricoEmprestimo', () => {
    it('should call endpoint with correct parameters for PDF', () => {
      const mockBlob = new Blob(['test'], {type: 'application/pdf'});
      const documento = '12345678';

      service.gerarHistoricoEmprestimo(documento, 'PDF').subscribe(blob => {
        expect(blob).toEqual(mockBlob);
      });

      const req = httpMock.expectOne(
        r => r.url === `${baseUrl}/historico-emprestimo` &&
          r.params.get('documento') === '12345678' &&
          r.params.get('formato') === 'PDF'
      );

      expect(req.request.method).toBe('GET');
      expect(req.request.responseType).toBe('blob');
      req.flush(mockBlob);
    });

    it('should call endpoint with correct parameters for EXCEL', () => {
      const mockBlob = new Blob(['test'], {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
      const documento = '87654321';

      service.gerarHistoricoEmprestimo(documento, 'EXCEL').subscribe(blob => {
        expect(blob).toEqual(mockBlob);
      });

      const req = httpMock.expectOne(
        r => r.url === `${baseUrl}/historico-emprestimo` &&
          r.params.get('documento') === '87654321' &&
          r.params.get('formato') === 'EXCEL'
      );

      expect(req.request.method).toBe('GET');
      req.flush(mockBlob);
    });

    it('should use PDF as default format', () => {
      const mockBlob = new Blob(['test']);
      const documento = '12345678';

      service.gerarHistoricoEmprestimo(documento).subscribe();

      const req = httpMock.expectOne(
        r => r.params.get('formato') === 'PDF'
      );

      req.flush(mockBlob);
    });

    it('should handle 400 error for invalid documento', () => {
      service.gerarHistoricoEmprestimo('123').subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(400);
        }
      });

      const req = httpMock.expectOne(r => r.url.includes('historico-emprestimo'));
      req.flush(new Blob(), {status: 400, statusText: 'Bad Request'});
    });

    it('should handle 404 error when no records found', () => {
      service.gerarHistoricoEmprestimo('99999999').subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(r => r.url.includes('historico-emprestimo'));
      req.flush(new Blob(), {status: 404, statusText: 'Not Found'});
    });
  });

  describe('gerarItensSemEstoque', () => {
    it('should call endpoint with PDF format', () => {
      const mockBlob = new Blob(['test']);

      service.gerarItensSemEstoque('PDF').subscribe(blob => {
        expect(blob).toEqual(mockBlob);
      });

      const req = httpMock.expectOne(
        r => r.url === `${baseUrl}/itens-sem-estoque` &&
          r.params.get('formato') === 'PDF'
      );

      expect(req.request.method).toBe('GET');
      req.flush(mockBlob);
    });

    it('should call endpoint with EXCEL format', () => {
      const mockBlob = new Blob(['test']);

      service.gerarItensSemEstoque('EXCEL').subscribe(blob => {
        expect(blob).toEqual(mockBlob);
      });

      const req = httpMock.expectOne(
        r => r.params.get('formato') === 'EXCEL'
      );

      req.flush(mockBlob);
    });

    it('should use PDF as default format', () => {
      const mockBlob = new Blob(['test']);

      service.gerarItensSemEstoque().subscribe();

      const req = httpMock.expectOne(
        r => r.params.get('formato') === 'PDF'
      );

      req.flush(mockBlob);
    });
  });

  describe('gerarEmprestimosRealizados', () => {
    it('should call endpoint with date range and PDF format', () => {
      const mockBlob = new Blob(['test']);

      service.gerarEmprestimosRealizados('01/01/2025', '31/01/2025', 'PDF').subscribe(blob => {
        expect(blob).toEqual(mockBlob);
      });

      const req = httpMock.expectOne(
        r => r.url === `${baseUrl}/emprestimos-realizados` &&
          r.params.get('dataInicio') === '01/01/2025' &&
          r.params.get('dataFim') === '31/01/2025' &&
          r.params.get('formato') === 'PDF'
      );

      expect(req.request.method).toBe('GET');
      req.flush(mockBlob);
    });

    it('should call endpoint with EXCEL format', () => {
      const mockBlob = new Blob(['test']);

      service.gerarEmprestimosRealizados('01/01/2025', '31/01/2025', 'EXCEL').subscribe();

      const req = httpMock.expectOne(
        r => r.params.get('formato') === 'EXCEL'
      );

      req.flush(mockBlob);
    });

    it('should handle 400 error for invalid date range', () => {
      service.gerarEmprestimosRealizados('31/01/2025', '01/01/2025').subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(400);
        }
      });

      const req = httpMock.expectOne(r => r.url.includes('emprestimos-realizados'));
      req.flush(new Blob(), {status: 400, statusText: 'Bad Request'});
    });
  });

  describe('gerarReservasDoItem', () => {
    it('should call endpoint with itemId and PDF format', () => {
      const mockBlob = new Blob(['test']);

      service.gerarReservasDoItem(123, 'PDF').subscribe(blob => {
        expect(blob).toEqual(mockBlob);
      });

      const req = httpMock.expectOne(
        r => r.url === `${baseUrl}/reservas-item` &&
          r.params.get('itemId') === '123' &&
          r.params.get('formato') === 'PDF'
      );

      expect(req.request.method).toBe('GET');
      req.flush(mockBlob);
    });

    it('should include nomeItem when provided', () => {
      const mockBlob = new Blob(['test']);

      service.gerarReservasDoItem(123, 'PDF', 'Arduino Uno').subscribe();

      const req = httpMock.expectOne(
        r => r.params.get('itemId') === '123' &&
          r.params.get('nomeItem') === 'Arduino Uno'
      );

      req.flush(mockBlob);
    });

    it('should not include nomeItem when not provided', () => {
      const mockBlob = new Blob(['test']);

      service.gerarReservasDoItem(123, 'PDF').subscribe();

      const req = httpMock.expectOne(
        r => r.params.get('itemId') === '123' &&
          !r.params.has('nomeItem')
      );

      req.flush(mockBlob);
    });

    it('should use PDF as default format', () => {
      const mockBlob = new Blob(['test']);

      service.gerarReservasDoItem(123).subscribe();

      const req = httpMock.expectOne(
        r => r.params.get('formato') === 'PDF'
      );

      req.flush(mockBlob);
    });
  });

  describe('gerarSolicitacoesDoItem', () => {
    it('should call endpoint with itemId and PDF format', () => {
      const mockBlob = new Blob(['test']);

      service.gerarSolicitacoesDoItem(456, 'PDF').subscribe(blob => {
        expect(blob).toEqual(mockBlob);
      });

      const req = httpMock.expectOne(
        r => r.url === `${baseUrl}/solicitacoes-item` &&
          r.params.get('itemId') === '456' &&
          r.params.get('formato') === 'PDF'
      );

      expect(req.request.method).toBe('GET');
      req.flush(mockBlob);
    });

    it('should include nomeItem when provided', () => {
      const mockBlob = new Blob(['test']);

      service.gerarSolicitacoesDoItem(456, 'EXCEL', 'Resistor 10k').subscribe();

      const req = httpMock.expectOne(
        r => r.params.get('itemId') === '456' &&
          r.params.get('nomeItem') === 'Resistor 10k' &&
          r.params.get('formato') === 'EXCEL'
      );

      req.flush(mockBlob);
    });
  });

  describe('gerarItensQtdeMinima', () => {
    it('should call endpoint with PDF format', () => {
      const mockBlob = new Blob(['test']);

      service.gerarItensQtdeMinima('PDF').subscribe(blob => {
        expect(blob).toEqual(mockBlob);
      });

      const req = httpMock.expectOne(
        r => r.url === `${baseUrl}/itens-qtde-minima` &&
          r.params.get('formato') === 'PDF'
      );

      expect(req.request.method).toBe('GET');
      req.flush(mockBlob);
    });

    it('should call endpoint with EXCEL format', () => {
      const mockBlob = new Blob(['test']);

      service.gerarItensQtdeMinima('EXCEL').subscribe();

      const req = httpMock.expectOne(
        r => r.params.get('formato') === 'EXCEL'
      );

      req.flush(mockBlob);
    });

    it('should use PDF as default format', () => {
      const mockBlob = new Blob(['test']);

      service.gerarItensQtdeMinima().subscribe();

      const req = httpMock.expectOne(
        r => r.params.get('formato') === 'PDF'
      );

      req.flush(mockBlob);
    });

    it('should handle server error', () => {
      service.gerarItensQtdeMinima().subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(r => r.url.includes('itens-qtde-minima'));
      req.flush(new Blob(), {status: 500, statusText: 'Server Error'});
    });
  });
});
