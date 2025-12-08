import {TestBed} from '@angular/core/testing';
import {HttpClientTestingModule, HttpTestingController} from '@angular/common/http/testing';
import {ItemService} from './item.service';
import {PageResponse} from '../framework/service/crud.service';
import {Item} from './item';

describe('ItemService', () => {
  let service: ItemService;
  let httpMock: HttpTestingController;

  const mockItem: Item = {
    id: 1,
    nome: 'Notebook Dell',
    grupo: {id: 5, descricao: 'Notebooks'}
  } as Item;

  const mockPageResponse: PageResponse<Item> = {
    content: [mockItem, {...mockItem, id: 2, nome: 'Notebook HP'}],
    totalElements: 2,
    totalPages: 1,
    size: 10,
    number: 0
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ItemService]
    });

    service = TestBed.inject(ItemService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // ============================================================================
  // findAllPagedByGrupo() - Testes de filtro por grupo server-side
  // ============================================================================
  describe('findAllPagedByGrupo()', () => {
    describe('Parâmetros básicos', () => {
      it('deve chamar endpoint com page e size', () => {
        service.findAllPagedByGrupo(0, 10).subscribe(response => {
          expect(response.content.length).toBe(2);
        });

        const req = httpMock.expectOne(r => r.url.includes('page'));
        expect(req.request.method).toBe('GET');
        expect(req.request.params.get('page')).toBe('0');
        expect(req.request.params.get('size')).toBe('10');
        req.flush(mockPageResponse);
      });

      it('deve incluir filtro quando fornecido', () => {
        service.findAllPagedByGrupo(0, 10, 'notebook').subscribe();

        const req = httpMock.expectOne(r => r.url.includes('page'));
        expect(req.request.params.get('filter')).toBe('notebook');
        req.flush(mockPageResponse);
      });

      it('deve usar filtro vazio como padrão', () => {
        service.findAllPagedByGrupo(0, 10).subscribe();

        const req = httpMock.expectOne(r => r.url.includes('page'));
        expect(req.request.params.get('filter')).toBe('');
        req.flush(mockPageResponse);
      });
    });

    describe('Parâmetro grupoId (filtro server-side)', () => {
      it('deve incluir grupoId quando fornecido', () => {
        service.findAllPagedByGrupo(0, 10, '', 5).subscribe();

        const req = httpMock.expectOne(r => r.url.includes('page'));
        expect(req.request.params.get('grupoId')).toBe('5');
        req.flush(mockPageResponse);
      });

      it('não deve incluir grupoId quando undefined', () => {
        service.findAllPagedByGrupo(0, 10, '', undefined).subscribe();

        const req = httpMock.expectOne(r => r.url.includes('page'));
        expect(req.request.params.has('grupoId')).toBe(false);
        req.flush(mockPageResponse);
      });

      it('não deve incluir grupoId quando não fornecido', () => {
        service.findAllPagedByGrupo(0, 10).subscribe();

        const req = httpMock.expectOne(r => r.url.includes('page'));
        expect(req.request.params.has('grupoId')).toBe(false);
        req.flush(mockPageResponse);
      });

      it('não deve incluir grupoId quando for 0 (falsy)', () => {
        service.findAllPagedByGrupo(0, 10, '', 0).subscribe();

        const req = httpMock.expectOne(r => r.url.includes('page'));
        expect(req.request.params.has('grupoId')).toBe(false);
        req.flush(mockPageResponse);
      });
    });

    describe('Parâmetro sort', () => {
      it('deve incluir sort quando fornecido', () => {
        service.findAllPagedByGrupo(0, 10, '', 5, 'nome,asc').subscribe();

        const req = httpMock.expectOne(r => r.url.includes('page'));
        expect(req.request.params.get('sort')).toBe('nome,asc');
        req.flush(mockPageResponse);
      });

      it('não deve incluir sort quando undefined', () => {
        service.findAllPagedByGrupo(0, 10, '', 5, undefined).subscribe();

        const req = httpMock.expectOne(r => r.url.includes('page'));
        expect(req.request.params.has('sort')).toBe(false);
        req.flush(mockPageResponse);
      });
    });

    describe('Combinação de parâmetros', () => {
      it('deve combinar filter, grupoId e sort corretamente', () => {
        service.findAllPagedByGrupo(1, 25, 'dell', 5, 'nome,desc').subscribe();

        const req = httpMock.expectOne(r => r.url.includes('page'));
        expect(req.request.params.get('page')).toBe('1');
        expect(req.request.params.get('size')).toBe('25');
        expect(req.request.params.get('filter')).toBe('dell');
        expect(req.request.params.get('grupoId')).toBe('5');
        expect(req.request.params.get('sort')).toBe('nome,desc');
        req.flush(mockPageResponse);
      });

      it('deve funcionar apenas com grupoId sem filter e sort', () => {
        service.findAllPagedByGrupo(0, 100, '', 3).subscribe();

        const req = httpMock.expectOne(r => r.url.includes('page'));
        expect(req.request.params.get('grupoId')).toBe('3');
        expect(req.request.params.get('filter')).toBe('');
        expect(req.request.params.has('sort')).toBe(false);
        req.flush(mockPageResponse);
      });
    });

    describe('Validação de parâmetros', () => {
      it('deve converter page negativo para 0', () => {
        service.findAllPagedByGrupo(-1, 10, '', 5).subscribe();

        const req = httpMock.expectOne(r => r.url.includes('page'));
        expect(req.request.params.get('page')).toBe('0');
        req.flush(mockPageResponse);
      });

      it('deve converter size menor que 1 para 1', () => {
        service.findAllPagedByGrupo(0, 0, '', 5).subscribe();

        const req = httpMock.expectOne(r => r.url.includes('page'));
        expect(req.request.params.get('size')).toBe('1');
        req.flush(mockPageResponse);
      });

      it('deve converter size negativo para 1', () => {
        service.findAllPagedByGrupo(0, -5, '', 5).subscribe();

        const req = httpMock.expectOne(r => r.url.includes('page'));
        expect(req.request.params.get('size')).toBe('1');
        req.flush(mockPageResponse);
      });
    });

    describe('Resposta', () => {
      it('deve retornar PageResponse corretamente', () => {
        service.findAllPagedByGrupo(0, 10, '', 5).subscribe(response => {
          expect(response).toEqual(mockPageResponse);
          expect(response.content.length).toBe(2);
          expect(response.totalElements).toBe(2);
        });

        const req = httpMock.expectOne(r => r.url.includes('page'));
        req.flush(mockPageResponse);
      });

      it('deve retornar página vazia quando grupo não tem itens', () => {
        const emptyResponse: PageResponse<Item> = {
          content: [],
          totalElements: 0,
          totalPages: 0,
          size: 10,
          number: 0
        };

        service.findAllPagedByGrupo(0, 10, '', 999).subscribe(response => {
          expect(response.content).toEqual([]);
          expect(response.totalElements).toBe(0);
        });

        const req = httpMock.expectOne(r => r.url.includes('page'));
        req.flush(emptyResponse);
      });
    });
  });
});
