import {HttpClient, HttpParams} from '@angular/common/http';
import {of} from 'rxjs';
import {CrudService, PageResponse} from './crud.service';

/**
 * Implementação concreta para testes
 * CrudService é abstrato, então precisamos de uma implementação concreta
 */
class TestEntity {
  id?: number;
  nome?: string;
}

class TestCrudService extends CrudService<TestEntity, number> {
  constructor(http: HttpClient) {
    super('http://api/test/', http);
  }
}

describe('CrudService', () => {
  let service: TestCrudService;
  let httpClientSpy: jest.Mocked<HttpClient>;

  const mockPageResponse: PageResponse<TestEntity> = {
    content: [{id: 1, nome: 'Item 1'}, {id: 2, nome: 'Item 2'}],
    totalElements: 2,
    totalPages: 1,
    size: 10,
    number: 0
  };

  beforeEach(() => {
    httpClientSpy = {
      get: jest.fn(),
      post: jest.fn(),
      delete: jest.fn()
    } as unknown as jest.Mocked<HttpClient>;

    service = new TestCrudService(httpClientSpy);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================================
  // findAllPaged() - Testes de ordenação server-side
  // ============================================================================
  describe('findAllPaged()', () => {
    describe('Parâmetros básicos', () => {
      it('deve chamar endpoint com page e size', () => {
        httpClientSpy.get.mockReturnValue(of(mockPageResponse));

        service.findAllPaged(0, 10).subscribe();

        expect(httpClientSpy.get).toHaveBeenCalledWith(
          'http://api/test/page',
          expect.objectContaining({
            params: expect.any(HttpParams)
          })
        );

        const params = httpClientSpy.get.mock.calls[0][1]?.params as HttpParams;
        expect(params.get('page')).toBe('0');
        expect(params.get('size')).toBe('10');
      });

      it('deve incluir filtro quando fornecido', () => {
        httpClientSpy.get.mockReturnValue(of(mockPageResponse));

        service.findAllPaged(0, 10, 'teste').subscribe();

        const params = httpClientSpy.get.mock.calls[0][1]?.params as HttpParams;
        expect(params.get('filter')).toBe('teste');
      });

      it('deve usar filtro vazio como padrão', () => {
        httpClientSpy.get.mockReturnValue(of(mockPageResponse));

        service.findAllPaged(0, 10).subscribe();

        const params = httpClientSpy.get.mock.calls[0][1]?.params as HttpParams;
        expect(params.get('filter')).toBe('');
      });
    });

    describe('Parâmetro sort (ordenação server-side)', () => {
      it('deve incluir parâmetro sort quando fornecido', () => {
        httpClientSpy.get.mockReturnValue(of(mockPageResponse));

        service.findAllPaged(0, 10, '', 'dataCompra,desc').subscribe();

        const params = httpClientSpy.get.mock.calls[0][1]?.params as HttpParams;
        expect(params.get('sort')).toBe('dataCompra,desc');
      });

      it('deve aceitar ordenação ascendente', () => {
        httpClientSpy.get.mockReturnValue(of(mockPageResponse));

        service.findAllPaged(0, 10, '', 'nome,asc').subscribe();

        const params = httpClientSpy.get.mock.calls[0][1]?.params as HttpParams;
        expect(params.get('sort')).toBe('nome,asc');
      });

      it('deve aceitar ordenação descendente', () => {
        httpClientSpy.get.mockReturnValue(of(mockPageResponse));

        service.findAllPaged(0, 10, '', 'id,desc').subscribe();

        const params = httpClientSpy.get.mock.calls[0][1]?.params as HttpParams;
        expect(params.get('sort')).toBe('id,desc');
      });

      it('não deve incluir sort quando undefined', () => {
        httpClientSpy.get.mockReturnValue(of(mockPageResponse));

        service.findAllPaged(0, 10, '', undefined).subscribe();

        const params = httpClientSpy.get.mock.calls[0][1]?.params as HttpParams;
        expect(params.has('sort')).toBe(false);
      });

      it('não deve incluir sort quando não fornecido', () => {
        httpClientSpy.get.mockReturnValue(of(mockPageResponse));

        service.findAllPaged(0, 10).subscribe();

        const params = httpClientSpy.get.mock.calls[0][1]?.params as HttpParams;
        expect(params.has('sort')).toBe(false);
      });

      it('deve combinar filtro e sort corretamente', () => {
        httpClientSpy.get.mockReturnValue(of(mockPageResponse));

        service.findAllPaged(0, 10, 'busca', 'nome,asc').subscribe();

        const params = httpClientSpy.get.mock.calls[0][1]?.params as HttpParams;
        expect(params.get('filter')).toBe('busca');
        expect(params.get('sort')).toBe('nome,asc');
      });
    });

    describe('Validação de parâmetros', () => {
      it('deve converter page negativo para 0', () => {
        httpClientSpy.get.mockReturnValue(of(mockPageResponse));

        service.findAllPaged(-1, 10).subscribe();

        const params = httpClientSpy.get.mock.calls[0][1]?.params as HttpParams;
        expect(params.get('page')).toBe('0');
      });

      it('deve converter size menor que 1 para 1', () => {
        httpClientSpy.get.mockReturnValue(of(mockPageResponse));

        service.findAllPaged(0, 0).subscribe();

        const params = httpClientSpy.get.mock.calls[0][1]?.params as HttpParams;
        expect(params.get('size')).toBe('1');
      });

      it('deve converter size negativo para 1', () => {
        httpClientSpy.get.mockReturnValue(of(mockPageResponse));

        service.findAllPaged(0, -5).subscribe();

        const params = httpClientSpy.get.mock.calls[0][1]?.params as HttpParams;
        expect(params.get('size')).toBe('1');
      });
    });

    describe('Resposta', () => {
      it('deve retornar PageResponse corretamente', (done) => {
        httpClientSpy.get.mockReturnValue(of(mockPageResponse));

        service.findAllPaged(0, 10).subscribe(response => {
          expect(response).toEqual(mockPageResponse);
          expect(response.content.length).toBe(2);
          expect(response.totalElements).toBe(2);
          done();
        });
      });
    });
  });

  // ============================================================================
  // Outros métodos (testes básicos para cobertura)
  // ============================================================================
  describe('findAll()', () => {
    it('deve chamar endpoint GET sem paginação', () => {
      const mockData = [{id: 1, nome: 'Item 1'}];
      httpClientSpy.get.mockReturnValue(of(mockData));

      service.findAll().subscribe(result => {
        expect(result).toEqual(mockData);
      });

      expect(httpClientSpy.get).toHaveBeenCalledWith('http://api/test/');
    });
  });

  describe('findOne()', () => {
    it('deve chamar endpoint GET com ID', () => {
      const mockItem = {id: 1, nome: 'Item 1'};
      httpClientSpy.get.mockReturnValue(of(mockItem));

      service.findOne(1).subscribe(result => {
        expect(result).toEqual(mockItem);
      });

      expect(httpClientSpy.get).toHaveBeenCalledWith('http://api/test/1');
    });
  });

  describe('save()', () => {
    it('deve chamar endpoint POST com entidade', () => {
      const newItem = {nome: 'Novo Item'};
      const savedItem = {id: 1, nome: 'Novo Item'};
      httpClientSpy.post.mockReturnValue(of(savedItem));

      service.save(newItem).subscribe(result => {
        expect(result).toEqual(savedItem);
      });

      expect(httpClientSpy.post).toHaveBeenCalledWith('http://api/test/', newItem);
    });
  });

  describe('delete()', () => {
    it('deve chamar endpoint DELETE com ID', () => {
      httpClientSpy.delete.mockReturnValue(of(undefined));

      service.delete(1).subscribe();

      expect(httpClientSpy.delete).toHaveBeenCalledWith('http://api/test/1');
    });
  });

  describe('complete()', () => {
    it('deve extrair content da resposta paginada', (done) => {
      const mockContent = [{id: 1, nome: 'Item 1'}];
      httpClientSpy.get.mockReturnValue(of({
        content: mockContent,
        totalElements: 1,
        totalPages: 1,
        size: 20,
        number: 0
      }));

      service.complete('busca').subscribe(result => {
        expect(result).toEqual(mockContent);
        done();
      });
    });

    it('deve retornar array vazio quando content é null', (done) => {
      httpClientSpy.get.mockReturnValue(of({
        content: null,
        totalElements: 0,
        totalPages: 0,
        size: 20,
        number: 0
      }));

      service.complete('busca').subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });
  });

  describe('completePaged()', () => {
    it('deve chamar endpoint complete com parâmetros', () => {
      httpClientSpy.get.mockReturnValue(of(mockPageResponse));

      service.completePaged('busca', 0, 10).subscribe();

      expect(httpClientSpy.get).toHaveBeenCalledWith(
        'http://api/test/complete',
        expect.objectContaining({
          params: expect.any(HttpParams)
        })
      );

      const params = httpClientSpy.get.mock.calls[0][1]?.params as HttpParams;
      expect(params.get('query')).toBe('busca');
      expect(params.get('page')).toBe('0');
      expect(params.get('size')).toBe('10');
    });
  });
});
