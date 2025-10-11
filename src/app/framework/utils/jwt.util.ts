/**
 * Interface para o payload decodificado do JWT
 */
interface JwtPayload {
  exp?: number; // Expiration time (segundos desde epoch)
  iat?: number; // Issued at (segundos desde epoch)
  sub?: string; // Subject (normalmente o username)
  [key: string]: unknown; // Outros campos customizados
}

/**
 * Utilidades para trabalhar com tokens JWT sem dependências externas
 */
export class JwtUtil {
  /**
   * Decodifica o payload de um token JWT sem validar a assinatura.
   * IMPORTANTE: Esta função NÃO valida a assinatura do token.
   * A validação de assinatura deve ser feita no backend.
   */
  static decodeToken(token: string): JwtPayload | null {
    if (!token) {
      return null;
    }

    try {
      // JWT tem formato: header.payload.signature
      const parts = token.split('.');
      if (parts.length !== 3) {
        // Token inválido: formato incorreto - retorna null silenciosamente
        return null;
      }

      // O payload é a segunda parte, codificado em base64url
      const payload = parts[1];

      // Decodifica base64url para string JSON
      const decodedPayload = this.base64UrlDecode(payload);

      return JSON.parse(decodedPayload) as JwtPayload;
    } catch {
      // Erro ao decodificar token - retorna null silenciosamente
      // Validação de token deve ser feita no backend
      return null;
    }
  }

  /**
   * Verifica se o token está expirado
   * @param token Token JWT a ser verificado
   * @param bufferSeconds Segundos de margem antes da expiração (padrão: 0)
   * @returns true se o token está expirado ou inválido
   */
  static isTokenExpired(token: string | null, bufferSeconds = 0): boolean {
    if (!token) {
      return true;
    }

    const payload = this.decodeToken(token);
    if (!payload?.exp) {
      // Se não conseguir decodificar ou não tiver 'exp', considera expirado
      return true;
    }

    // exp está em segundos, Date.now() está em milissegundos
    const expirationTime = payload.exp * 1000;
    const currentTime = Date.now();
    const bufferTime = bufferSeconds * 1000;

    return currentTime >= (expirationTime - bufferTime);
  }

  /**
   * Retorna o tempo restante até a expiração em segundos
   * @returns Segundos até expiração, ou 0 se já expirado/inválido
   */
  static getTimeUntilExpiration(token: string | null): number {
    if (!token) {
      return 0;
    }

    const payload = this.decodeToken(token);
    if (!payload?.exp) {
      return 0;
    }

    const expirationTime = payload.exp * 1000;
    const currentTime = Date.now();
    const remainingTime = Math.floor((expirationTime - currentTime) / 1000);

    return Math.max(0, remainingTime);
  }

  /**
   * Extrai o subject (username) do token
   */
  static getTokenSubject(token: string | null): string | null {
    if (!token) {
      return null;
    }

    const payload = this.decodeToken(token);
    return payload?.sub ?? null;
  }

  /**
   * Verifica se uma string parece ser um JWT válido (formato básico)
   */
  static isValidJwtFormat(token: string | null): boolean {
    if (!token) {
      return false;
    }

    const parts = token.split('.');
    return parts.length === 3 && parts.every((part) => part.length > 0);
  }

  /**
   * Decodifica uma string base64url para string normal
   * Base64url é como base64, mas usa - e _ no lugar de + e /
   */
  private static base64UrlDecode(base64Url: string): string {
    // Converte base64url para base64 padrão
    let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');

    // Adiciona padding se necessário
    const pad = base64.length % 4;
    if (pad) {
      if (pad === 1) {
        throw new Error('String base64url inválida');
      }
      base64 += '='.repeat(4 - pad);
    }

    try {
      // Tipos mínimos para evitar any e manter compatibilidade
      interface MinimalBuffer {
        from(input: string, encoding: 'base64'): { toString(encoding: 'binary'): string };
      }

      type MinimalTextDecoder = new (label?: string) => { decode(input?: BufferSource): string };
      const g = globalThis as unknown as {
        Buffer?: MinimalBuffer;
        TextDecoder?: MinimalTextDecoder
      };

      // Decodifica base64 para bytes
      let binary: string;
      if (typeof atob === 'function') {
        binary = atob(base64);
      } else if (g.Buffer) {
        // Ambiente Node/teste sem atob
        binary = g.Buffer.from(base64, 'base64').toString('binary');
      } else {
        throw new Error('Decodificador base64 indisponível no ambiente');
      }

      // Preferir TextDecoder para conversão UTF-8 moderna
      if (g.TextDecoder) {
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        const decoder = new g.TextDecoder('utf-8');
        return decoder.decode(bytes);
      }

      // Fallback: técnica com decodeURIComponent (compatibilidade ampla)
      return decodeURIComponent(
        binary
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
      );
    } catch (error) {
      throw new Error('Erro ao decodificar base64: ' + (error as Error).message);
    }
  }
}
