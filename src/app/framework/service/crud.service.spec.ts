import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

// NOTE: Testing library/framework: Angular TestBed with Jasmine-style APIs (describe/it/expect).
// If this repo uses Jest, these tests are still compatible since Jest supports Jasmine-style globals.
// Import the service under test from the sibling file (common Angular layout).

import { CrudService } from './crud.service';

interface Thing {
  id: number;
  name: string;
}

// Minimal concrete subclass for testing the abstract CrudService.
class TestCrudService extends CrudService<Thing, number> {}

describe('CrudService', () => {
  const BASE_URL = '/api/things/';

  let http: HttpClient;
  let httpMock: HttpTestingController;
  let service: TestCrudService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    service = new TestCrudService(BASE_URL, http);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('findAll', () => {
    it('should issue a GET to the base URL and return the array of items (happy path)', () => {
      const mock: Thing[] = [
        { id: 1, name: 'Alpha' },
        { id: 2, name: 'Beta' },
      ];

      let actual: Thing[] | undefined;
      service.findAll().subscribe(res => (actual = res));

      const req = httpMock.expectOne(BASE_URL);
      expect(req.request.method).toBe('GET');
      req.flush(mock);

      expect(actual).toEqual(mock);
    });
  });

  describe('findAllByUsername', () => {
    it('should GET using find-all-by-username path segment', () => {
      const username = 'john.doe';
      const expectedUrl = `${BASE_URL}find-all-by-username/${username}`;

      let actual: Thing[] | undefined;
      service.findAllByUsername(username).subscribe(res => (actual = res));

      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('GET');

      const mock: Thing[] = [{ id: 1, name: 'Owned' }];
      req.flush(mock);

      expect(actual).toEqual(mock);
    });

    it('should work with usernames containing special but URL-safe characters (e.g., plus sign)', () => {
      const username = 'john+doe';
      const expectedUrl = `${BASE_URL}find-all-by-username/${username}`;

      service.findAllByUsername(username).subscribe();
      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });

    it('should document behavior when base URL lacks trailing slash (concatenation is literal)', () => {
      // This test documents current behavior; if BASE_URL lacks trailing slash,
      // the path is concatenated verbatim. If the intended behavior is to always
      // include a slash, consider updating CrudService to normalize the base URL.
      const noSlashBase = '/api/things';

      const local = new TestCrudService(noSlashBase, http);
      const username = 'john';

      const expectedUrl = `${noSlashBase}find-all-by-username/${username}`; // note missing slash
      local.findAllByUsername(username).subscribe();
      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });
  });

  describe('findOne', () => {
    it('should GET by id appended to base URL', () => {
      const id = 123;
      const expectedUrl = `${BASE_URL}${id}`;

      let actual: Thing | undefined;
      service.findOne(id).subscribe(res => (actual = res));

      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('GET');
      const mock: Thing = { id, name: 'Gamma' };
      req.flush(mock);

      expect(actual).toEqual(mock);
    });

    it('should propagate HTTP errors (e.g., 404)', () => {
      const id = 999;
      const expectedUrl = `${BASE_URL}${id}`;

      let error: HttpErrorResponse | undefined;
      service.findOne(id).subscribe({
        next: () => fail('expected an error'),
        error: (e: HttpErrorResponse) => (error = e),
      });

      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('GET');
      req.flush(
        { message: 'Not found' },
        { status: 404, statusText: 'Not Found' },
      );
      expect(error).toBeTruthy();
      expect(error!.status).toBe(404);
    });
  });

  describe('findAllPaged', () => {
    it('should GET page endpoint with page, size and filter query params', () => {
      const page = 2;
      const size = 50;
      const filter = 'active';
      const expectedUrl = `${BASE_URL}page?page=${page}&size=${size}&filter=${filter}`;

      let body: any;
      service.findAllPaged(page, size, filter).subscribe(res => (body = res));

      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('GET');

      const mock = { content: [{ id: 3, name: 'Delta' }], totalElements: 1 };
      req.flush(mock);
      expect(body).toEqual(mock);
    });

    it('should preserve raw filter content including spaces (no auto-encoding by service)', () => {
      const filter = 'open issues';
      const expectedUrl = `${BASE_URL}page?page=1&size=10&filter=${filter}`;

      service.findAllPaged(1, 10, filter).subscribe();
      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('GET');
      req.flush({ content: [], totalElements: 0 });
    });
  });

  describe('save', () => {
    it('should POST to base URL with the entity as body', () => {
      const payload: Thing = { id: 0, name: 'New' };

      let created: Thing | undefined;
      service.save(payload).subscribe(res => (created = res));

      const req = httpMock.expectOne(BASE_URL);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);

      const mockResponse: Thing = { id: 42, name: 'New' };
      req.flush(mockResponse);

      expect(created).toEqual(mockResponse);
    });
  });

  describe('delete', () => {
    it('should DELETE at base URL + id', () => {
      const id = 12;
      const expectedUrl = `${BASE_URL}${id}`;

      let completed = false;
      service.delete(id).subscribe(() => (completed = true));

      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);

      expect(completed).toBeTrue();
    });
  });

  describe('complete', () => {
    it('should GET complete endpoint with query parameter', () => {
      const query = 'alp';
      const expectedUrl = `${BASE_URL}complete?query=${query}`;

      let suggestions: Thing[] | undefined;
      service.complete(query).subscribe(res => (suggestions = res));

      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('GET');

      const mock: Thing[] = [
        { id: 1, name: 'Alpha' },
        { id: 11, name: 'Alpine' },
      ];
      req.flush(mock);

      expect(suggestions).toEqual(mock);
    });

    it('should preserve raw query including spaces (no auto-encoding by service)', () => {
      const query = 'gamma ray';
      const expectedUrl = `${BASE_URL}complete?query=${query}`;

      service.complete(query).subscribe();
      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });
  });
});