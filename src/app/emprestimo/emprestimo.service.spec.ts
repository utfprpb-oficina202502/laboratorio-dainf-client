import {TestBed} from '@angular/core/testing';
import {HttpClientTestingModule, HttpTestingController} from '@angular/common/http/testing';
import {EmprestimoService} from './emprestimo.service';
import {Emprestimo} from './emprestimo';
import {Usuario} from '../usuario/usuario';
import {PageResponse} from '../framework/service/crud.service';

/**
 * Testes para EmprestimoService
 * Cobre métodos de busca paginada e outras funcionalidades
 */
describe('EmprestimoService', () => {
  let service: EmprestimoService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [EmprestimoService]
    });

    service = TestBed.inject(EmprestimoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('findByItemPaged', () => {
    it('should call findByItemPaged with correct parameters and return PageResponse', () => {
      const mockResponse: PageResponse<Emprestimo> = {
        content: [
          {
            id: 1,
            dataEmprestimo: '10/01/2023',
            prazoDevolucao: '20/01/2023',
            dataDevolucao: '20/01/2023',
            usuarioResponsavel: { id: 1, nome: 'Responsável' } as Usuario,
            usuarioEmprestimo: { id: 2, nome: 'Usuário' } as Usuario,
            emprestimoItem: [],
            emprestimoDevolucaoItem: [],
            observacao: 'Teste'
          }
        ],
        totalElements: 1,
        totalPages: 1,
        size: 10,
        number: 0
      };

      const itemId = 123;
      const page = 1;
      const size = 5;
      const order = 'dataEmprestimo';
      const asc = false;

      service.findByItemPaged(itemId, page, size, order, asc).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(req =>
        req.url.includes(`emprestimo/find-by-item/${itemId}`) &&
        req.params.get('page') === '1' &&
        req.params.get('size') === '5' &&
        req.params.get('order') === 'dataEmprestimo' &&
        req.params.get('asc') === 'false'
      );

      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should use default parameters when not provided', () => {
      const mockResponse: PageResponse<Emprestimo> = {
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: 10,
        number: 0
      };

      const itemId = 456;

      service.findByItemPaged(itemId).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(req =>
        req.url.includes(`emprestimo/find-by-item/${itemId}`) &&
        req.params.get('page') === '0' &&
        req.params.get('size') === '10' &&
        req.params.get('order') === 'id' &&
        req.params.get('asc') === 'true'
      );

      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle error responses', () => {
      const itemId = 789;
      const errorMessage = 'Server error';

      service.findByItemPaged(itemId).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(req => req.url.includes(`emprestimo/find-by-item/${itemId}`));
      req.flush(errorMessage, { status: 500, statusText: 'Server Error' });
    });
  });

  describe('findByItemPaged edge cases', () => {
    it('should handle itemId undefined', () => {
      const spy = jest.spyOn((service as any).http, 'get');
      service.findByItemPaged(undefined as any).subscribe({
        next: () => fail('Should not succeed'),
        error: (error) => {
          expect(error).toBeTruthy();
        }
      });
      expect(spy).not.toHaveBeenCalled();
    });

    it('should handle itemId as string', () => {
      const spy = jest.spyOn((service as any).http, 'get');
      service.findByItemPaged('abc' as any).subscribe({
        next: () => fail('Should not succeed'),
        error: (error) => {
          expect(error).toBeTruthy();
        }
      });
      expect(spy).not.toHaveBeenCalled();
    });

    it('should handle backend response with missing fields', () => {
      const mockResponse = {
        content: [],
        totalElements: 0
        // totalPages, size, number faltando
      };
      service.findByItemPaged(1).subscribe(response => {
        expect(response.content).toEqual([]);
        expect(response.totalElements).toBe(0);
        expect(response.totalPages).toBeUndefined();
        expect(response.size).toBeUndefined();
        expect(response.number).toBeUndefined();
      });
      const req = httpMock.expectOne(req => req.url.includes('emprestimo/find-by-item/1'));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle backend response with empty array and totalElements > 0', () => {
      const mockResponse: PageResponse<Emprestimo> = {
        content: [],
        totalElements: 5,
        totalPages: 1,
        size: 10,
        number: 0
      };
      service.findByItemPaged(2).subscribe(response => {
        expect(response.content).toEqual([]);
        expect(response.totalElements).toBe(5);
      });
      const req = httpMock.expectOne(req => req.url.includes('emprestimo/find-by-item/2'));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle 404 error', () => {
      service.findByItemPaged(999).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });
      const req = httpMock.expectOne(req => req.url.includes('emprestimo/find-by-item/999'));
      req.flush('Not found', { status: 404, statusText: 'Not Found' });
    });

    it('should handle timeout error', () => {
      service.findByItemPaged(888).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.name).toBe('TimeoutError');
        }
      });
      const req = httpMock.expectOne(req => req.url.includes('emprestimo/find-by-item/888'));
      req.error(new ErrorEvent('timeout'), { status: 0, statusText: 'Timeout' });
    });

    it('should complete observable after response', (done) => {
      const mockResponse: PageResponse<Emprestimo> = {
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: 10,
        number: 0
      };
      let completed = false;
      service.findByItemPaged(3).subscribe({
        next: (response) => {
          expect(response).toEqual(mockResponse);
        },
        complete: () => {
          completed = true;
          expect(completed).toBe(true);
          done();
        }
      });
      const req = httpMock.expectOne(req => req.url.includes('emprestimo/find-by-item/3'));
      req.flush(mockResponse);
    });
  });
});
