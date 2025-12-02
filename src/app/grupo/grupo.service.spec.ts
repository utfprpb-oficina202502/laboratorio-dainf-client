import {TestBed} from '@angular/core/testing';
import {HttpClientTestingModule, HttpTestingController} from '@angular/common/http/testing';
import {GrupoService} from './grupo.service';
import {environment} from '../../environments/environment';
import {PageResponse} from '../framework/service/crud.service';
import {Item} from '../item/item';

describe('GrupoService', () => {
  let service: GrupoService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.api_url}grupo/`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [GrupoService]
    });

    service = TestBed.inject(GrupoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('findItensVinculados', () => {
    const mockItems: Item[] = [
      {id: 1, nome: 'Item A'} as Item,
      {id: 2, nome: 'Item B'} as Item
    ];

    const mockPageResponse: PageResponse<Item> = {
      content: mockItems,
      totalElements: 2,
      totalPages: 1,
      size: 25,
      number: 0
    };

    it('deve chamar endpoint com parâmetros padrão', () => {
      const grupoId = 1;

      service.findItensVinculados(grupoId).subscribe(response => {
        expect(response.content.length).toBe(2);
        expect(response.totalElements).toBe(2);
      });

      const req = httpMock.expectOne(
        `${baseUrl}itens-vinculados/${grupoId}?page=0&size=25&filter=`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockPageResponse);
    });

    it('deve passar parâmetros de paginação corretamente', () => {
      const grupoId = 1;
      const page = 2;
      const size = 10;

      service.findItensVinculados(grupoId, page, size).subscribe();

      const req = httpMock.expectOne(
        `${baseUrl}itens-vinculados/${grupoId}?page=2&size=10&filter=`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockPageResponse);
    });

    it('deve passar filtro corretamente', () => {
      const grupoId = 1;
      const filter = 'Notebook';

      service.findItensVinculados(grupoId, 0, 25, filter).subscribe();

      const req = httpMock.expectOne(
        `${baseUrl}itens-vinculados/${grupoId}?page=0&size=25&filter=Notebook`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockPageResponse);
    });

    it('deve retornar PageResponse com estrutura correta', () => {
      const grupoId = 1;

      service.findItensVinculados(grupoId).subscribe(response => {
        expect(response.content).toEqual(mockItems);
        expect(response.totalElements).toBe(2);
        expect(response.totalPages).toBe(1);
        expect(response.size).toBe(25);
        expect(response.number).toBe(0);
      });

      const req = httpMock.expectOne(
        `${baseUrl}itens-vinculados/${grupoId}?page=0&size=25&filter=`
      );
      req.flush(mockPageResponse);
    });

    it('deve retornar página vazia quando grupo não tem itens', () => {
      const grupoId = 999;
      const emptyResponse: PageResponse<Item> = {
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: 25,
        number: 0
      };

      service.findItensVinculados(grupoId).subscribe(response => {
        expect(response.content).toEqual([]);
        expect(response.totalElements).toBe(0);
      });

      const req = httpMock.expectOne(
        `${baseUrl}itens-vinculados/${grupoId}?page=0&size=25&filter=`
      );
      req.flush(emptyResponse);
    });
  });
});
