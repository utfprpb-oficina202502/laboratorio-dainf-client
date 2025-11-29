import {hasFieldErrors, isProblemDetail, ProblemDetail} from './problem-detail.interface';

describe('ProblemDetail Interface', () => {
  describe('isProblemDetail', () => {
    it('deve retornar true para ProblemDetail com status', () => {
      const error: ProblemDetail = {
        status: 400,
        title: 'Erro de validacao',
        detail: 'Campo invalido'
      };

      expect(isProblemDetail(error)).toBe(true);
    });

    it('deve retornar true para ProblemDetail com type', () => {
      const error: ProblemDetail = {
        type: '/errors/validacao',
        title: 'Erro de validacao'
      };

      expect(isProblemDetail(error)).toBe(true);
    });

    it('deve retornar true para ProblemDetail completo RFC 9457', () => {
      const error: ProblemDetail = {
        type: '/errors/validacao',
        title: 'Erro de validacao',
        status: 400,
        detail: 'Um ou mais campos possuem valores invalidos.',
        instance: '/api/usuarios',
        traceId: 'abc123-def456',
        timestamp: '2024-01-15T10:30:00Z',
        errors: {
          email: 'E-mail invalido',
          nome: 'Nome e obrigatorio'
        }
      };

      expect(isProblemDetail(error)).toBe(true);
    });

    it('deve retornar false para null', () => {
      expect(isProblemDetail(null)).toBe(false);
    });

    it('deve retornar false para undefined', () => {
      expect(isProblemDetail(undefined)).toBe(false);
    });

    it('deve retornar false para string', () => {
      expect(isProblemDetail('error message')).toBe(false);
    });

    it('deve retornar false para numero', () => {
      expect(isProblemDetail(500)).toBe(false);
    });

    it('deve retornar false para objeto vazio', () => {
      expect(isProblemDetail({})).toBe(false);
    });

    it('deve retornar false para objeto sem status ou type', () => {
      const error = {
        title: 'Erro',
        detail: 'Mensagem de erro'
      };

      expect(isProblemDetail(error)).toBe(false);
    });

    it('deve retornar false para objeto com title nao-string', () => {
      const error = {
        status: 400,
        title: 123
      };

      expect(isProblemDetail(error)).toBe(false);
    });

    it('deve retornar false para objeto com detail nao-string', () => {
      const error = {
        status: 400,
        detail: {message: 'erro'}
      };

      expect(isProblemDetail(error)).toBe(false);
    });

    it('deve retornar true para ProblemDetail minimo com apenas status', () => {
      const error = {status: 500};

      expect(isProblemDetail(error)).toBe(true);
    });

    it('deve retornar true para ProblemDetail minimo com apenas type', () => {
      const error = {type: '/errors/internal'};

      expect(isProblemDetail(error)).toBe(true);
    });

    it('deve retornar false para array', () => {
      expect(isProblemDetail([{status: 400}])).toBe(false);
    });

    it('deve retornar true para erro de autenticacao 401', () => {
      const error: ProblemDetail = {
        type: '/errors/autenticacao-falhou',
        title: 'Falha na autenticacao',
        status: 401,
        detail: 'Autenticacao necessaria para acessar este recurso.',
        traceId: 'trace-123'
      };

      expect(isProblemDetail(error)).toBe(true);
    });

    it('deve retornar true para erro de acesso negado 403', () => {
      const error: ProblemDetail = {
        type: '/errors/acesso-negado',
        title: 'Acesso negado',
        status: 403,
        detail: 'Voce nao tem permissao para acessar este recurso.',
        traceId: 'trace-456'
      };

      expect(isProblemDetail(error)).toBe(true);
    });
  });

  describe('hasFieldErrors', () => {
    it('deve retornar true quando existem erros de campo', () => {
      const problemDetail: ProblemDetail = {
        status: 400,
        errors: {
          email: 'E-mail invalido',
          nome: 'Nome e obrigatorio'
        }
      };

      expect(hasFieldErrors(problemDetail)).toBe(true);
    });

    it('deve retornar false quando errors e undefined', () => {
      const problemDetail: ProblemDetail = {
        status: 400,
        detail: 'Erro generico'
      };

      expect(hasFieldErrors(problemDetail)).toBe(false);
    });

    it('deve retornar false quando errors e objeto vazio', () => {
      const problemDetail: ProblemDetail = {
        status: 400,
        errors: {}
      };

      expect(hasFieldErrors(problemDetail)).toBe(false);
    });

    it('deve retornar true para um unico erro de campo', () => {
      const problemDetail: ProblemDetail = {
        status: 422,
        errors: {
          documento: 'CPF invalido'
        }
      };

      expect(hasFieldErrors(problemDetail)).toBe(true);
    });

    it('deve retornar true para multiplos erros de campo', () => {
      const problemDetail: ProblemDetail = {
        status: 400,
        title: 'Erro de validacao',
        errors: {
          nome: 'Nome e obrigatorio',
          email: 'E-mail invalido',
          telefone: 'Telefone deve ter 11 digitos',
          documento: 'CPF invalido'
        }
      };

      expect(hasFieldErrors(problemDetail)).toBe(true);
    });
  });
});
