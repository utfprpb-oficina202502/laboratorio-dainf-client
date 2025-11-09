import {TestBed} from '@angular/core/testing';
import {HttpClientTestingModule, HttpTestingController} from '@angular/common/http/testing';
import {NadaConstaService, NadaConsta} from './nada-consta.service';

describe('NadaConstaService', () => {
  let service: NadaConstaService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [NadaConstaService]
    });
    service = TestBed.inject(NadaConstaService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('deve ser criado', () => {
    expect(service).toBeTruthy();
  });

  it('deve consultar nada consta por id', () => {
    const mockNadaConsta: NadaConsta = {
      id: 1,
      usuario: {
        id: 1,
        nome: 'Teste',
        username: 'teste',
        documento: '123',
        email: 'teste@teste.com',
        telefone: '999',
        permissoes: [],
        fotoUrl: null,
        codigoVerificacao: '',
        ativo: true,
        authorities: [],
        accountNonExpired: true,
        accountNonLocked: true,
        credentialsNonExpired: true,
        enabled: true
      },
      status: 'ATIVO',
      sendAt: '2025-10-21',
      createdAt: '2025-10-21',
      updatedAt: '2025-10-21',
      createdBy: 'admin',
      updatedBy: 'admin'
    };
    service.consultarNadaConsta(1).subscribe(resp => {
      expect(resp).toEqual(mockNadaConsta);
    });
    const req = httpMock.expectOne(r => r.url.includes('/nadaconsta/1'));
    expect(req.request.method).toBe('GET');
    req.flush(mockNadaConsta);
  });

  it('deve solicitar nada consta por documento', () => {
    const documento = '12345678900';
    const mockResponse = {sucesso: true};
    service.solicitar(documento).subscribe(resp => {
      expect(resp).toEqual(mockResponse);
    });
    const req = httpMock.expectOne(r => r.url.includes('/nadaconsta/solicitar'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({documento});
    req.flush(mockResponse);
  });

  it('deve tratar erro ao consultar nada consta', () => {
    service.consultarNadaConsta(999).subscribe({
      next: () => fail('Deveria falhar'),
      error: err => {
        expect(err.status).toBe(404);
      }
    });
    const req = httpMock.expectOne(r => r.url.includes('/nadaconsta/999'));
    req.flush('Not found', {status: 404, statusText: 'Not Found'});
  });

  it('deve tratar erro ao solicitar nada consta', () => {
    service.solicitar('000').subscribe({
      next: () => fail('Deveria falhar'),
      error: err => {
        expect(err.status).toBe(400);
      }
    });
    const req = httpMock.expectOne(r => r.url.includes('/nadaconsta/solicitar'));
    req.flush('Bad request', {status: 400, statusText: 'Bad Request'});
  });

  it('deve verificar pendências do nada consta', () => {
    const id = 42;
    const mockResponse: NadaConsta = {
      id,
      usuario: {
        id: 1,
        nome: 'Teste',
        username: 'teste',
        documento: '123',
        email: 'teste@teste.com',
        telefone: '999',
        permissoes: [],
        fotoUrl: null,
        codigoVerificacao: '',
        ativo: true,
        authorities: [],
        accountNonExpired: true,
        accountNonLocked: true,
        credentialsNonExpired: true,
        enabled: true
      },
      status: 'PENDENTE',
      sendAt: '2025-10-21',
      createdAt: '2025-10-21',
      updatedAt: '2025-10-21',
      createdBy: 'admin',
      updatedBy: 'admin'
    };
    service.verificarPendencias(id).subscribe(resp => {
      expect(resp).toEqual(mockResponse);
    });
    const req = httpMock.expectOne(r => r.url.includes(`/nadaconsta/verificar-pendencias/${id}`));
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({});
    req.flush(mockResponse);
  });

  it('deve tratar erro ao verificar pendências', () => {
    service.verificarPendencias(999).subscribe({
      next: () => fail('Deveria falhar'),
      error: err => {
        expect(err.status).toBe(404);
      }
    });
    const req = httpMock.expectOne(r => r.url.includes('/nadaconsta/verificar-pendencias/999'));
    req.flush('Not found', {status: 404, statusText: 'Not Found'});
  });

  it('deve invalidar nada consta', () => {
    const id = 42;
    const mockResponse: NadaConsta = {
      id,
      usuario: {
        id: 1,
        nome: 'Teste',
        username: 'teste',
        documento: '123',
        email: 'teste@teste.com',
        telefone: '999',
        permissoes: [],
        fotoUrl: null,
        codigoVerificacao: '',
        ativo: true,
        authorities: [],
        accountNonExpired: true,
        accountNonLocked: true,
        credentialsNonExpired: true,
        enabled: true
      },
      status: 'INVALIDADO',
      sendAt: '2025-10-21',
      createdAt: '2025-10-21',
      updatedAt: '2025-10-21',
      createdBy: 'admin',
      updatedBy: 'admin'
    };
    service.invalidar(id).subscribe(resp => {
      expect(resp).toEqual(mockResponse);
    });
    const req = httpMock.expectOne(r => r.url.includes(`/nadaconsta/invalidar/${id}`));
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({});
    req.flush(mockResponse);
  });

  it('deve tratar erro ao invalidar nada consta', () => {
    service.invalidar(999).subscribe({
      next: () => fail('Deveria falhar'),
      error: err => {
        expect(err.status).toBe(404);
      }
    });
    const req = httpMock.expectOne(r => r.url.includes('/nadaconsta/invalidar/999'));
    req.flush('Not found', {status: 404, statusText: 'Not Found'});
  });
});
