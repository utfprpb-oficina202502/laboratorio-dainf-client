import {JwtUtil} from './jwt.util';

/**
 * Testes unitários para JwtUtil - Utilitário de validação de tokens JWT
 * Estes testes não dependem do Angular, apenas validam lógica JavaScript pura
 */
describe('JwtUtil', () => {
  // Token válido com expiração no futuro (exp: 2099-01-01)
  const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0dXNlciIsImV4cCI6NDA3MDkwODgwMCwiaWF0IjoxNTE2MjM5MDIyfQ.4Adcj0vfLwz_5extraKxKu4sM5xLU7OlZEcmKnVJKnU';

  // Token expirado (exp: 2020-01-01)
  const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0dXNlciIsImV4cCI6MTU3NzcxMDAwMCwiaWF0IjoxNTE2MjM5MDIyfQ.X6vFCHFRNUZBNYmQNJzG8RKzUvZZNfhMdQ0JBHqY5aQ';

  // Token sem campo 'exp'
  const noExpToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0dXNlciIsImlhdCI6MTUxNjIzOTAyMn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

  describe('decodeToken', () => {
    it('deve decodificar token válido corretamente', () => {
      const payload = JwtUtil.decodeToken(validToken);

      expect(payload).not.toBeNull();
      expect(payload?.sub).toBe('testuser');
      expect(payload?.exp).toBe(4070908800);
      expect(payload?.iat).toBe(1516239022);
    });

    it('deve retornar null para token inválido', () => {
      const payload = JwtUtil.decodeToken('invalid.token.here');

      expect(payload).toBeNull();
    });

    it('deve retornar null para token com formato incorreto', () => {
      const payload = JwtUtil.decodeToken('not-a-jwt-token');

      expect(payload).toBeNull();
    });

    it('deve retornar null para string vazia', () => {
      const payload = JwtUtil.decodeToken('');

      expect(payload).toBeNull();
    });

    it('deve retornar null para token null', () => {
      const payload = JwtUtil.decodeToken(null as unknown as string);

      expect(payload).toBeNull();
    });

    it('deve decodificar token sem campo exp', () => {
      const payload = JwtUtil.decodeToken(noExpToken);

      expect(payload).not.toBeNull();
      expect(payload?.sub).toBe('testuser');
      expect(payload?.exp).toBeUndefined();
    });
  });

  describe('isTokenExpired', () => {
    it('deve retornar false para token válido no futuro', () => {
      const isExpired = JwtUtil.isTokenExpired(validToken);

      expect(isExpired).toBe(false);
    });

    it('deve retornar true para token expirado', () => {
      const isExpired = JwtUtil.isTokenExpired(expiredToken);

      expect(isExpired).toBe(true);
    });

    it('deve retornar true para token sem campo exp', () => {
      const isExpired = JwtUtil.isTokenExpired(noExpToken);

      expect(isExpired).toBe(true);
    });

    it('deve retornar true para token null', () => {
      const isExpired = JwtUtil.isTokenExpired(null);

      expect(isExpired).toBe(true);
    });

    it('deve retornar true para token inválido', () => {
      const isExpired = JwtUtil.isTokenExpired('invalid-token');

      expect(isExpired).toBe(true);
    });

    it('deve considerar buffer de segundos na expiração', () => {
      // Token expira em 2099, mas com buffer de 100 anos ainda é válido
      const isExpired = JwtUtil.isTokenExpired(validToken, 60);

      expect(isExpired).toBe(false);
    });

    it('deve tratar token expirado mesmo com buffer', () => {
      const isExpired = JwtUtil.isTokenExpired(expiredToken, 60);

      expect(isExpired).toBe(true);
    });
  });

  describe('getTimeUntilExpiration', () => {
    it('deve retornar tempo positivo para token válido', () => {
      const timeLeft = JwtUtil.getTimeUntilExpiration(validToken);

      // Token expira em 2099, então deve ter muito tempo restante
      expect(timeLeft).toBeGreaterThan(0);
      expect(timeLeft).toBeGreaterThan(365 * 24 * 60 * 60); // Mais de 1 ano
    });

    it('deve retornar 0 para token expirado', () => {
      const timeLeft = JwtUtil.getTimeUntilExpiration(expiredToken);

      expect(timeLeft).toBe(0);
    });

    it('deve retornar 0 para token sem exp', () => {
      const timeLeft = JwtUtil.getTimeUntilExpiration(noExpToken);

      expect(timeLeft).toBe(0);
    });

    it('deve retornar 0 para token null', () => {
      const timeLeft = JwtUtil.getTimeUntilExpiration(null);

      expect(timeLeft).toBe(0);
    });

    it('deve retornar 0 para token inválido', () => {
      const timeLeft = JwtUtil.getTimeUntilExpiration('invalid-token');

      expect(timeLeft).toBe(0);
    });
  });

  describe('getTokenSubject', () => {
    it('deve extrair subject do token válido', () => {
      const subject = JwtUtil.getTokenSubject(validToken);

      expect(subject).toBe('testuser');
    });

    it('deve retornar null para token sem subject', () => {
      // Token sem campo 'sub'
      const tokenNoSub = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjQwNzA5MDg4MDAsImlhdCI6MTUxNjIzOTAyMn0.VZF-8nqzqJqBqZ5Mw5hfIkQvYhVXqQz5vY5cZqz5vY5';

      const subject = JwtUtil.getTokenSubject(tokenNoSub);

      expect(subject).toBeNull();
    });

    it('deve retornar null para token null', () => {
      const subject = JwtUtil.getTokenSubject(null);

      expect(subject).toBeNull();
    });

    it('deve retornar null para token inválido', () => {
      const subject = JwtUtil.getTokenSubject('invalid-token');

      expect(subject).toBeNull();
    });
  });

  describe('isValidJwtFormat', () => {
    it('deve retornar true para token com formato válido', () => {
      const isValid = JwtUtil.isValidJwtFormat(validToken);

      expect(isValid).toBe(true);
    });

    it('deve retornar true para token expirado mas formato válido', () => {
      const isValid = JwtUtil.isValidJwtFormat(expiredToken);

      expect(isValid).toBe(true);
    });

    it('deve retornar false para token com formato inválido', () => {
      const isValid = JwtUtil.isValidJwtFormat('not.a.valid.jwt.format');

      expect(isValid).toBe(false);
    });

    it('deve retornar false para token com apenas duas partes', () => {
      const isValid = JwtUtil.isValidJwtFormat('header.payload');

      expect(isValid).toBe(false);
    });

    it('deve retornar false para string vazia', () => {
      const isValid = JwtUtil.isValidJwtFormat('');

      expect(isValid).toBe(false);
    });

    it('deve retornar false para token null', () => {
      const isValid = JwtUtil.isValidJwtFormat(null);

      expect(isValid).toBe(false);
    });

    it('deve retornar false para token com partes vazias', () => {
      const isValid = JwtUtil.isValidJwtFormat('...');

      expect(isValid).toBe(false);
    });
  });
});
