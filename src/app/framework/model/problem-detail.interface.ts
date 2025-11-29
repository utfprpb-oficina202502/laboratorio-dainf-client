/**
 * Interface representando o formato RFC 9457 (Problem Details for HTTP APIs).
 *
 * Esta interface descreve a estrutura de erro padronizada retornada pelo backend Spring Boot.
 * Permite tratamento consistente de erros em toda a aplicacao Angular.
 *
 * @see https://www.rfc-editor.org/rfc/rfc9457.html
 *
 * @example
 * ```typescript
 * // Resposta de erro de validacao
 * {
 *   type: '/errors/validacao',
 *   title: 'Erro de validacao',
 *   status: 400,
 *   detail: 'Um ou mais campos possuem valores invalidos.',
 *   instance: '/api/usuarios',
 *   traceId: 'abc123-def456',
 *   timestamp: '2024-01-15T10:30:00Z',
 *   errors: {
 *     'email': 'E-mail invalido',
 *     'nome': 'Nome e obrigatorio'
 *   }
 * }
 * ```
 */
export interface ProblemDetail {
  /**
   * URI que identifica o tipo de problema.
   * Geralmente um caminho relativo como '/errors/validacao'.
   */
  type?: string;

  /**
   * Titulo curto e legivel do problema.
   * Nao muda entre ocorrencias do mesmo tipo de problema.
   */
  title?: string;

  /**
   * Codigo de status HTTP gerado pelo servidor para esta ocorrencia.
   */
  status?: number;

  /**
   * Explicacao detalhada especifica para esta ocorrencia do problema.
   */
  detail?: string;

  /**
   * URI que identifica a ocorrencia especifica do problema.
   * Geralmente o caminho da requisicao que gerou o erro.
   */
  instance?: string;

  /**
   * Identificador unico para rastreamento do erro.
   * Util para correlacionar logs entre frontend e backend.
   */
  traceId?: string;

  /**
   * Timestamp ISO 8601 de quando o erro ocorreu.
   */
  timestamp?: string;

  /**
   * Mapa de erros por campo para erros de validacao.
   * Chave: nome do campo, Valor: mensagem de erro.
   */
  errors?: Record<string, string>;
}

/**
 * Type guard para verificar se um objeto e um ProblemDetail valido.
 *
 * @param error Objeto a ser verificado
 * @returns true se o objeto segue a estrutura ProblemDetail
 *
 * @example
 * ```typescript
 * if (isProblemDetail(error.error)) {
 *   console.log('TraceId:', error.error.traceId);
 * }
 * ```
 */
export function isProblemDetail(error: unknown): error is ProblemDetail {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const obj = error as Record<string, unknown>;

  // ProblemDetail deve ter pelo menos status ou type
  return (
    (typeof obj['status'] === 'number' || typeof obj['type'] === 'string') &&
    (obj['title'] === undefined || typeof obj['title'] === 'string') &&
    (obj['detail'] === undefined || typeof obj['detail'] === 'string')
  );
}

/**
 * Verifica se o ProblemDetail contem erros de validacao por campo.
 *
 * @param problemDetail ProblemDetail a ser verificado
 * @returns true se contem erros de campo
 */
export function hasFieldErrors(problemDetail: ProblemDetail): boolean {
  return (
    problemDetail.errors !== undefined &&
    Object.keys(problemDetail.errors).length > 0
  );
}
