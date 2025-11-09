import {TestBed} from '@angular/core/testing';
import {HttpClientTestingModule, HttpTestingController} from '@angular/common/http/testing';
import {UsuarioService} from './usuario.service';
import {Usuario} from './usuario';
import {PageResponse} from '../framework/service/crud.service';
import {environment} from '../../environments/environment';

describe('UsuarioService', () => {
  let service: UsuarioService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.api_url}usuario/`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [UsuarioService]
    });
    service = TestBed.inject(UsuarioService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('completeCustom - Paginated Response Handling', () => {
    it('should extract content array from PageResponse', (done) => {
      const mockUsuarios: Usuario[] = [
        {id: 1, nome: 'Rodrigo', documento: '1756842'} as Usuario,
        {id: 2, nome: 'Rodrigo Silva', documento: '2342570'} as Usuario
      ];

      const mockPageResponse: PageResponse<Usuario> = {
        content: mockUsuarios,
        totalElements: 2,
        totalPages: 1,
        size: 10,
        number: 0
      };

      service.completeCustom('rodrigo').subscribe({
        next: (usuarios) => {
          expect(usuarios).toEqual(mockUsuarios);
          expect(Array.isArray(usuarios)).toBe(true);
          expect(usuarios.length).toBe(2);
          expect(usuarios[0].nome).toBe('Rodrigo');
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}complete-custom?query=rodrigo`);
      expect(req.request.method).toBe('GET');
      req.flush(mockPageResponse);
    });

    it('should return empty array when content is null', (done) => {
      const mockPageResponse = {
        content: null,
        totalElements: 0,
        totalPages: 0,
        size: 10,
        number: 0
      } as any;

      service.completeCustom('nonexistent').subscribe({
        next: (usuarios) => {
          expect(usuarios).toEqual([]);
          expect(Array.isArray(usuarios)).toBe(true);
          expect(usuarios.length).toBe(0);
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}complete-custom?query=nonexistent`);
      req.flush(mockPageResponse);
    });

    it('should return empty array when content is undefined', (done) => {
      const mockPageResponse = {
        totalElements: 0,
        totalPages: 0,
        size: 10,
        number: 0
      } as any;

      service.completeCustom('test').subscribe({
        next: (usuarios) => {
          expect(usuarios).toEqual([]);
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}complete-custom?query=test`);
      req.flush(mockPageResponse);
    });

    it('should handle empty content array', (done) => {
      const mockPageResponse: PageResponse<Usuario> = {
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: 10,
        number: 0
      };

      service.completeCustom('xyz').subscribe({
        next: (usuarios) => {
          expect(usuarios).toEqual([]);
          expect(usuarios.length).toBe(0);
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}complete-custom?query=xyz`);
      req.flush(mockPageResponse);
    });
  });

  describe('completeCustomUsersLab - Paginated Response Handling', () => {
    it('should extract content array from PageResponse', (done) => {
      const mockUsuarios: Usuario[] = [
        {id: 10, nome: 'Admin User', documento: '12345'} as Usuario
      ];

      const mockPageResponse: PageResponse<Usuario> = {
        content: mockUsuarios,
        totalElements: 1,
        totalPages: 1,
        size: 10,
        number: 0
      };

      service.completeCustomUsersLab('admin').subscribe({
        next: (usuarios) => {
          expect(usuarios).toEqual(mockUsuarios);
          expect(usuarios[0].nome).toBe('Admin User');
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}complete-users-lab?query=admin`);
      expect(req.request.method).toBe('GET');
      req.flush(mockPageResponse);
    });

    it('should return empty array when content is null or undefined', (done) => {
      const mockPageResponse = {
        totalElements: 0,
        totalPages: 0
      } as any;

      service.completeCustomUsersLab('test').subscribe({
        next: (usuarios) => {
          expect(usuarios).toEqual([]);
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}complete-users-lab?query=test`);
      req.flush(mockPageResponse);
    });
  });
});
