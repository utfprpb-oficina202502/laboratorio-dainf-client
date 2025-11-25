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

  describe('downloadPdf', () => {
    it('deve baixar PDF como ArrayBuffer', () => {
      const id = 15;
      const mockArrayBuffer = new ArrayBuffer(1024);

      service.downloadPdf(id).subscribe(data => {
        expect(data).toEqual(mockArrayBuffer);
        expect(data.byteLength).toBe(1024);
      });

      const req = httpMock.expectOne(r => r.url.includes(`/nadaconsta/${id}/pdf`));
      expect(req.request.method).toBe('GET');
      expect(req.request.responseType).toBe('arraybuffer');
      req.flush(mockArrayBuffer);
    });

    it('deve construir URL correta para download de PDF', () => {
      const id = 42;
      const mockArrayBuffer = new ArrayBuffer(512);

      service.downloadPdf(id).subscribe();

      const req = httpMock.expectOne(r => {
        return r.url.includes('/nadaconsta/') && r.url.includes(`${id}/pdf`);
      });
      expect(req.request.url).toContain(`${id}/pdf`);
      req.flush(mockArrayBuffer);
    });

    it('deve tratar erro ao baixar PDF', () => {
      const id = 999;

      service.downloadPdf(id).subscribe({
        next: () => fail('Deveria falhar'),
        error: err => {
          expect(err.status).toBe(404);
          expect(err.statusText).toBe('Not Found');
        }
      });

      const req = httpMock.expectOne(r => r.url.includes(`/nadaconsta/${id}/pdf`));
      req.error(new ProgressEvent('error'), {status: 404, statusText: 'Not Found'});
    });

    it('deve tratar erro 403 (não autorizado) ao baixar PDF', () => {
      const id = 50;

      service.downloadPdf(id).subscribe({
        next: () => fail('Deveria falhar'),
        error: err => {
          expect(err.status).toBe(403);
          expect(err.statusText).toBe('Forbidden');
        }
      });

      const req = httpMock.expectOne(r => r.url.includes(`/nadaconsta/${id}/pdf`));
      req.error(new ProgressEvent('error'), {status: 403, statusText: 'Forbidden'});
    });

    it('deve baixar PDF de tamanho zero (edge case)', () => {
      const id = 20;
      const emptyArrayBuffer = new ArrayBuffer(0);

      service.downloadPdf(id).subscribe(data => {
        expect(data).toEqual(emptyArrayBuffer);
        expect(data.byteLength).toBe(0);
      });

      const req = httpMock.expectOne(r => r.url.includes(`/nadaconsta/${id}/pdf`));
      req.flush(emptyArrayBuffer);
    });
  });

  describe('reenviarEmail', () => {
    it('deve reenviar email com sucesso', () => {
      const id = 25;
      const mockResponse = {mensagem: 'Email reenviado com sucesso'};

      service.reenviarEmail(id).subscribe(resp => {
        expect(resp).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(r => r.url.includes(`/nadaconsta/${id}/reenvio`));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush(mockResponse);
    });

    it('deve construir URL correta para reenvio de email', () => {
      const id = 30;
      const mockResponse = {status: 'ok'};

      service.reenviarEmail(id).subscribe();

      const req = httpMock.expectOne(r => {
        return r.url.includes('/nadaconsta/') && r.url.includes(`${id}/reenvio`);
      });
      expect(req.request.url).toContain(`${id}/reenvio`);
      req.flush(mockResponse);
    });

    it('deve enviar corpo vazio na requisição POST', () => {
      const id = 35;

      service.reenviarEmail(id).subscribe();

      const req = httpMock.expectOne(r => r.url.includes(`/nadaconsta/${id}/reenvio`));
      expect(req.request.body).toEqual({});
      req.flush({});
    });

    it('deve tratar erro ao reenviar email', () => {
      const id = 999;

      service.reenviarEmail(id).subscribe({
        next: () => fail('Deveria falhar'),
        error: err => {
          expect(err.status).toBe(404);
          expect(err.statusText).toBe('Not Found');
        }
      });

      const req = httpMock.expectOne(r => r.url.includes(`/nadaconsta/${id}/reenvio`));
      req.flush('Nada Consta not found', {status: 404, statusText: 'Not Found'});
    });

    it('deve tratar erro 403 (não autorizado) ao reenviar email', () => {
      const id = 40;

      service.reenviarEmail(id).subscribe({
        next: () => fail('Deveria falhar'),
        error: err => {
          expect(err.status).toBe(403);
          expect(err.statusText).toBe('Forbidden');
        }
      });

      const req = httpMock.expectOne(r => r.url.includes(`/nadaconsta/${id}/reenvio`));
      req.flush('Forbidden', {status: 403, statusText: 'Forbidden'});
    });

    it('deve tratar erro 400 (email inválido) ao reenviar', () => {
      const id = 45;

      service.reenviarEmail(id).subscribe({
        next: () => fail('Deveria falhar'),
        error: err => {
          expect(err.status).toBe(400);
          expect(err.error).toEqual({message: 'Email do usuário inválido'});
        }
      });

      const req = httpMock.expectOne(r => r.url.includes(`/nadaconsta/${id}/reenvio`));
      req.flush(
        {message: 'Email do usuário inválido'},
        {status: 400, statusText: 'Bad Request'}
      );
    });

    it('deve tratar erro 500 (falha no servidor de email)', () => {
      const id = 50;

      service.reenviarEmail(id).subscribe({
        next: () => fail('Deveria falhar'),
        error: err => {
          expect(err.status).toBe(500);
          expect(err.error).toEqual({message: 'Erro ao enviar email'});
        }
      });

      const req = httpMock.expectOne(r => r.url.includes(`/nadaconsta/${id}/reenvio`));
      req.flush(
        {message: 'Erro ao enviar email'},
        {status: 500, statusText: 'Internal Server Error'}
      );
    });
  });

  describe('Integração entre métodos', () => {
    it('deve permitir múltiplas operações em sequência', () => {
      const id = 60;

      // Verificar pendências
      service.verificarPendencias(id).subscribe();
      const req1 = httpMock.expectOne(r => r.url.includes('verificar-pendencias'));
      req1.flush({id, status: 'COMPLETED'});

      // Baixar PDF
      service.downloadPdf(id).subscribe();
      const req2 = httpMock.expectOne(r => r.url.includes('/pdf'));
      req2.flush(new ArrayBuffer(100));

      // Reenviar email
      service.reenviarEmail(id).subscribe();
      const req3 = httpMock.expectOne(r => r.url.includes('/reenvio'));
      req3.flush({});

      expect(true).toBe(true); // Verifica que não houve erros
    });

    it('deve manter independência entre chamadas simultâneas', () => {
      const id1 = 70;
      const id2 = 71;

      service.downloadPdf(id1).subscribe();
      service.reenviarEmail(id2).subscribe();

      const reqs = httpMock.match(() => true);
      expect(reqs.length).toBe(2);

      const pdfReq = reqs.find(r => r.request.url.includes('/pdf'));
      const emailReq = reqs.find(r => r.request.url.includes('/reenvio'));

      expect(pdfReq).toBeDefined();
      expect(emailReq).toBeDefined();

      pdfReq?.flush(new ArrayBuffer(50));
      emailReq?.flush({});
    });
  });

  describe('Validação de URLs', () => {
    it('deve usar a mesma base URL para todos os endpoints', () => {
      service.consultarNadaConsta(1).subscribe();
      const req1 = httpMock.expectOne(() => true);
      const baseUrl1 = req1.request.url.split('/nadaconsta/')[0];
      req1.flush({});

      service.downloadPdf(2).subscribe();
      const req2 = httpMock.expectOne(() => true);
      const baseUrl2 = req2.request.url.split('/nadaconsta/')[0];
      req2.flush(new ArrayBuffer(0));

      service.reenviarEmail(3).subscribe();
      const req3 = httpMock.expectOne(() => true);
      const baseUrl3 = req3.request.url.split('/nadaconsta/')[0];
      req3.flush({});

      expect(baseUrl1).toBe(baseUrl2);
      expect(baseUrl2).toBe(baseUrl3);
    });
  });
});
