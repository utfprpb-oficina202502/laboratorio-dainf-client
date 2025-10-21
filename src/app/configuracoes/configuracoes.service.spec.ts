import {TestBed} from '@angular/core/testing';
import {HttpClientTestingModule, HttpTestingController} from '@angular/common/http/testing';
import {ConfiguracoesService, Configuracoes} from './configuracoes.service';

describe('ConfiguracoesService', () => {
  let service: ConfiguracoesService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ConfiguracoesService]
    });
    service = TestBed.inject(ConfiguracoesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('deve ser criado', () => {
    expect(service).toBeTruthy();
  });

  it('deve obter configuracoes', () => {
    const mockConfig: Configuracoes = { nadaConstaEmail: 'admin@utfpr.edu.br' };
    service.getConfiguracoes().subscribe(resp => {
      expect(resp).toEqual(mockConfig);
    });
    const req = httpMock.expectOne(r => r.url.includes('/config/'));
    expect(req.request.method).toBe('GET');
    req.flush(mockConfig);
  });

  it('deve salvar configuracoes', () => {
    const config: Configuracoes = { nadaConstaEmail: 'admin@utfpr.edu.br' };
    const mockResponse = { sucesso: true };
    service.salvarConfiguracoes(config).subscribe(resp => {
      expect(resp).toEqual(mockResponse);
    });
    const req = httpMock.expectOne(r => r.url.includes('/config/'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(config);
    req.flush(mockResponse);
  });

  it('deve tratar erro ao obter configuracoes', () => {
    service.getConfiguracoes().subscribe({
      next: () => fail('Deveria falhar'),
      error: err => {
        expect(err.status).toBe(404);
      }
    });
    const req = httpMock.expectOne(r => r.url.includes('/config/'));
    req.flush('Not found', {status: 404, statusText: 'Not Found'});
  });

  it('deve tratar erro ao salvar configuracoes', () => {
    const config: Configuracoes = { nadaConstaEmail: 'admin@utfpr.edu.br' };
    service.salvarConfiguracoes(config).subscribe({
      next: () => fail('Deveria falhar'),
      error: err => {
        expect(err.status).toBe(400);
      }
    });
    const req = httpMock.expectOne(r => r.url.includes('/config/'));
    req.flush('Bad request', {status: 400, statusText: 'Bad Request'});
  });
});

