import {TestBed} from '@angular/core/testing';
import {HttpErrorResponse} from '@angular/common/http';
import {FormControl, FormGroup} from '@angular/forms';
import {MessageService} from 'primeng/api';
import {ErrorHandlerService} from './error-handler.service';
import {LoggerService} from './logger.service';
import {ProblemDetail} from '../model/problem-detail.interface';

describe('ErrorHandlerService', () => {
  let service: ErrorHandlerService;
  let messageService: { add: jest.Mock };
  let loggerService: { error: jest.Mock; warn: jest.Mock };

  beforeEach(() => {
    messageService = {add: jest.fn()};
    loggerService = {error: jest.fn(), warn: jest.fn()};

    TestBed.configureTestingModule({
      providers: [
        ErrorHandlerService,
        {provide: MessageService, useValue: messageService},
        {provide: LoggerService, useValue: loggerService}
      ]
    });

    service = TestBed.inject(ErrorHandlerService);
  });

  describe('handleHttpError', () => {
    describe('RFC 9457 ProblemDetail', () => {
      it('deve processar ProblemDetail corretamente', () => {
        const problemDetail: ProblemDetail = {
          type: '/errors/validacao',
          title: 'Erro de validacao',
          status: 400,
          detail: 'Campo email invalido',
          traceId: 'trace-123'
        };

        const httpError = new HttpErrorResponse({
          error: problemDetail,
          status: 400
        });

        const result = service.handleHttpError(httpError);

        expect(result.message).toBe('Campo email invalido');
        expect(result.title).toBe('Erro de validacao');
        expect(result.traceId).toBe('trace-123');
        expect(result.statusCode).toBe(400);
      });

      it('deve extrair erros de campo do ProblemDetail', () => {
        const problemDetail: ProblemDetail = {
          status: 400,
          detail: 'Dados invalidos',
          errors: {
            email: 'E-mail invalido',
            nome: 'Nome e obrigatorio'
          }
        };

        const httpError = new HttpErrorResponse({
          error: problemDetail,
          status: 400
        });

        const result = service.handleHttpError(httpError);

        expect(result.fieldErrors).toBeDefined();
        expect(result.fieldErrors?.['email']).toBe('E-mail invalido');
        expect(result.fieldErrors?.['nome']).toBe('Nome e obrigatorio');
      });

      it('deve tratar erro 401 Unauthorized', () => {
        const problemDetail: ProblemDetail = {
          type: '/errors/autenticacao-falhou',
          title: 'Falha na autenticacao',
          status: 401,
          detail: 'Autenticacao necessaria para acessar este recurso.',
          traceId: 'trace-401'
        };

        const httpError = new HttpErrorResponse({
          error: problemDetail,
          status: 401
        });

        const result = service.handleHttpError(httpError);

        expect(result.message).toBe('Autenticacao necessaria para acessar este recurso.');
        expect(result.title).toBe('Falha na autenticacao');
        expect(result.statusCode).toBe(401);
      });

      it('deve tratar erro 403 Forbidden', () => {
        const problemDetail: ProblemDetail = {
          type: '/errors/acesso-negado',
          title: 'Acesso negado',
          status: 403,
          detail: 'Voce nao tem permissao para acessar este recurso.',
          traceId: 'trace-403'
        };

        const httpError = new HttpErrorResponse({
          error: problemDetail,
          status: 403
        });

        const result = service.handleHttpError(httpError);

        expect(result.message).toBe('Voce nao tem permissao para acessar este recurso.');
        expect(result.title).toBe('Acesso negado');
        expect(result.statusCode).toBe(403);
      });

      it('deve tratar erro 428 Precondition Required', () => {
        const problemDetail: ProblemDetail = {
          type: '/errors/precondicao-requerida',
          title: 'Precondicao requerida',
          status: 428,
          detail: 'Foi realizado uma solicitação de nada consta para o usuário.',
          traceId: 'trace-428'
        };

        const httpError = new HttpErrorResponse({
          error: problemDetail,
          status: 428
        });

        const result = service.handleHttpError(httpError);

        expect(result.message).toBe('Foi realizado uma solicitação de nada consta para o usuário.');
        expect(result.statusCode).toBe(428);
      });

      it('deve logar com traceId quando disponivel', () => {
        const problemDetail: ProblemDetail = {
          status: 500,
          detail: 'Erro interno',
          traceId: 'trace-xyz'
        };

        const httpError = new HttpErrorResponse({
          error: problemDetail,
          status: 500
        });

        service.handleHttpError(httpError);

        expect(loggerService.error).toHaveBeenCalledWith(
          '[trace-xyz] Erro interno',
          httpError
        );
      });

      it('deve exibir toast por padrao', () => {
        const problemDetail: ProblemDetail = {
          status: 400,
          title: 'Erro',
          detail: 'Mensagem de erro'
        };

        const httpError = new HttpErrorResponse({
          error: problemDetail,
          status: 400
        });

        service.handleHttpError(httpError);

        expect(messageService.add).toHaveBeenCalledWith(
          expect.objectContaining({
            severity: 'error',
            summary: 'Erro',
            life: 5000
          })
        );
      });

      it('nao deve exibir toast quando showToast=false', () => {
        const problemDetail: ProblemDetail = {
          status: 400,
          detail: 'Erro silencioso'
        };

        const httpError = new HttpErrorResponse({
          error: problemDetail,
          status: 400
        });

        service.handleHttpError(httpError, false);

        expect(messageService.add).not.toHaveBeenCalled();
      });

      it('deve exibir toast com referencia ao traceId', () => {
        const problemDetail: ProblemDetail = {
          status: 500,
          title: 'Erro interno',
          detail: 'Falha no servidor',
          traceId: 'abcd1234-5678-efgh'
        };

        const httpError = new HttpErrorResponse({
          error: problemDetail,
          status: 500
        });

        service.handleHttpError(httpError);

        expect(messageService.add).toHaveBeenCalledWith(
          expect.objectContaining({
            detail: expect.stringMatching(/Ref: abcd1234/)
          })
        );
      });

      it('deve exibir mensagem especial para erros de validacao com fieldErrors', () => {
        const problemDetail: ProblemDetail = {
          status: 400,
          title: 'Validacao',
          detail: 'Campos invalidos',
          errors: {email: 'Invalido'}
        };

        const httpError = new HttpErrorResponse({
          error: problemDetail,
          status: 400
        });

        service.handleHttpError(httpError);

        expect(messageService.add).toHaveBeenCalledWith(
          expect.objectContaining({
            detail: expect.stringMatching(/Verifique os campos destacados/)
          })
        );
      });
    });

    describe('Erros legados', () => {
      it('deve tratar erro com message no formato antigo', () => {
        const httpError = new HttpErrorResponse({
          error: {message: 'Erro do servidor antigo'},
          status: 500
        });

        const result = service.handleHttpError(httpError);

        expect(result.message).toBe('Erro do servidor antigo');
        expect(result.statusCode).toBe(500);
      });

      it('deve tratar ConstraintViolationException', () => {
        const httpError = new HttpErrorResponse({
          error: {message: 'ConstraintViolationException: FK_USUARIO'},
          status: 500
        });

        const result = service.handleHttpError(httpError);

        expect(result.message).toContain('registro possui vinculo');
      });

      it('deve tratar DataIntegrityViolationException', () => {
        const httpError = new HttpErrorResponse({
          error: {message: 'DataIntegrityViolationException'},
          status: 500
        });

        const result = service.handleHttpError(httpError);

        expect(result.message).toContain('integridade de dados');
      });

      it('deve retornar mensagem padrao para status 0 (sem conexao)', () => {
        const httpError = new HttpErrorResponse({
          error: null,
          status: 0
        });

        const result = service.handleHttpError(httpError);

        expect(result.message).toContain('conectar ao servidor');
        expect(result.statusCode).toBe(0);
      });

      it('deve retornar mensagem padrao para status 404', () => {
        const httpError = new HttpErrorResponse({
          error: null,
          status: 404
        });

        const result = service.handleHttpError(httpError);

        expect(result.message).toBe('Recurso nao encontrado');
      });

      it('deve retornar mensagem padrao para status 500', () => {
        const httpError = new HttpErrorResponse({
          error: null,
          status: 500
        });

        const result = service.handleHttpError(httpError);

        expect(result.message).toBe('Erro interno do servidor');
      });

      it('deve retornar mensagem padrao para status desconhecido', () => {
        const httpError = new HttpErrorResponse({
          error: null,
          status: 999
        });

        const result = service.handleHttpError(httpError);

        expect(result.message).toBe('Ocorreu um erro inesperado');
      });
    });
  });

  describe('applyFieldErrors', () => {
    it('deve aplicar erros aos campos do formulario', () => {
      const form = new FormGroup({
        email: new FormControl(''),
        nome: new FormControl('')
      });

      const fieldErrors = {
        email: 'E-mail invalido',
        nome: 'Nome obrigatorio'
      };

      service.applyFieldErrors(form, fieldErrors);

      expect(form.get('email')?.errors).toEqual({serverError: 'E-mail invalido'});
      expect(form.get('nome')?.errors).toEqual({serverError: 'Nome obrigatorio'});
    });

    it('deve marcar campos como touched', () => {
      const form = new FormGroup({
        email: new FormControl('')
      });

      service.applyFieldErrors(form, {email: 'Erro'});

      expect(form.get('email')?.touched).toBe(true);
    });

    it('deve logar warning para campo inexistente', () => {
      const form = new FormGroup({
        email: new FormControl('')
      });

      service.applyFieldErrors(form, {campoInexistente: 'Erro'});

      expect(loggerService.warn).toHaveBeenCalledWith(
        "Campo 'campoInexistente' nao encontrado no formulario"
      );
    });

    it('nao deve fazer nada para form null', () => {
      expect(() => service.applyFieldErrors(null, {email: 'Erro'})).not.toThrow();
    });

    it('nao deve fazer nada para fieldErrors null', () => {
      const form = new FormGroup({email: new FormControl('')});

      expect(() => service.applyFieldErrors(form, null as unknown as Record<string, string>)).not.toThrow();
    });
  });

  describe('clearServerErrors', () => {
    it('deve limpar erros de servidor dos campos', () => {
      const form = new FormGroup({
        email: new FormControl(''),
        nome: new FormControl('')
      });

      form.get('email')?.setErrors({serverError: 'Erro do servidor'});
      form.get('nome')?.setErrors({serverError: 'Outro erro'});

      service.clearServerErrors(form);

      expect(form.get('email')?.errors).toBeNull();
      expect(form.get('nome')?.errors).toBeNull();
    });

    it('deve manter outros erros alem do serverError', () => {
      const form = new FormGroup({
        email: new FormControl('')
      });

      form.get('email')?.setErrors({
        serverError: 'Erro do servidor',
        required: true,
        pattern: true
      });

      service.clearServerErrors(form);

      expect(form.get('email')?.errors).toEqual({required: true, pattern: true});
    });

    it('nao deve fazer nada para form null', () => {
      expect(() => service.clearServerErrors(null)).not.toThrow();
    });

    it('nao deve afetar campos sem serverError', () => {
      const form = new FormGroup({
        email: new FormControl('')
      });

      form.get('email')?.setErrors({required: true});

      service.clearServerErrors(form);

      expect(form.get('email')?.errors).toEqual({required: true});
    });
  });

  describe('extractProblemDetail', () => {
    it('deve extrair ProblemDetail de HttpErrorResponse', () => {
      const problemDetail: ProblemDetail = {
        status: 400,
        title: 'Erro',
        detail: 'Detalhe do erro'
      };

      const httpError = new HttpErrorResponse({
        error: problemDetail,
        status: 400
      });

      const result = service.extractProblemDetail(httpError);

      expect(result).toEqual(problemDetail);
    });

    it('deve retornar null para erro nao-ProblemDetail', () => {
      const httpError = new HttpErrorResponse({
        error: {message: 'Erro antigo'},
        status: 500
      });

      const result = service.extractProblemDetail(httpError);

      expect(result).toBeNull();
    });

    it('deve retornar null para erro null', () => {
      const result = service.extractProblemDetail(null);

      expect(result).toBeNull();
    });

    it('deve retornar null para erro sem body', () => {
      const httpError = new HttpErrorResponse({
        error: null,
        status: 500
      });

      const result = service.extractProblemDetail(httpError);

      expect(result).toBeNull();
    });
  });
});
