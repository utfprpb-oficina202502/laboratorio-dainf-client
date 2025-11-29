import {inject, Injectable} from '@angular/core';
import {HttpErrorResponse} from '@angular/common/http';
import {FormGroup} from '@angular/forms';
import {MessageService} from 'primeng/api';
import {hasFieldErrors, isProblemDetail, ProblemDetail} from '../model/problem-detail.interface';
import {LoggerService} from './logger.service';

/**
 * Resultado do processamento de erro.
 */
export interface ErrorHandlerResult {
  /** Mensagem principal do erro */
  message: string;
  /** Titulo do erro (se disponivel) */
  title?: string;
  /** TraceId para rastreamento */
  traceId?: string;
  /** Erros por campo (para validacao) */
  fieldErrors?: Record<string, string>;
  /** Codigo HTTP do erro */
  statusCode?: number;
}

/**
 * Servico responsavel pelo tratamento centralizado de erros HTTP.
 *
 * Converte respostas de erro do backend (RFC 9457 ProblemDetail) em:
 * - Mensagens de toast para o usuario
 * - Erros de validacao aplicados a formularios
 * - Logs estruturados para debugging
 *
 * @example
 * ```typescript
 * // Em um componente ou servico
 * this.http.post('/api/usuarios', data).subscribe({
 *   error: (err) => {
 *     const result = this.errorHandler.handleHttpError(err);
 *     if (result.fieldErrors) {
 *       this.errorHandler.applyFieldErrors(this.form, result.fieldErrors);
 *     }
 *   }
 * });
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {
  private readonly messageService = inject(MessageService);
  private readonly logger = inject(LoggerService);

  /**
   * Processa um erro HTTP e retorna informacoes estruturadas.
   *
   * @param error Erro HTTP recebido
   * @param showToast Se deve exibir toast automaticamente (default: true)
   * @returns Resultado estruturado do erro
   */
  handleHttpError(error: unknown, showToast = true): ErrorHandlerResult {
    const httpError = error as HttpErrorResponse;
    const result = this.parseError(httpError);

    // Log para debugging (inclui traceId se disponivel)
    if (result.traceId) {
      this.logger.error(`[${result.traceId}] ${result.message}`, error);
    } else {
      this.logger.error(result.message, error);
    }

    // Exibe toast se solicitado
    if (showToast) {
      this.showErrorToast(result);
    }

    return result;
  }

  /**
   * Aplica erros de campo a um FormGroup.
   *
   * Marca os campos como touched e define os erros de validacao
   * retornados pelo backend.
   *
   * @param form FormGroup para aplicar os erros
   * @param fieldErrors Mapa de erros por campo
   *
   * @example
   * ```typescript
   * // Erros vindos do backend
   * const fieldErrors = {
   *   'email': 'E-mail invalido',
   *   'nome': 'Nome e obrigatorio'
   * };
   *
   * this.errorHandler.applyFieldErrors(this.form, fieldErrors);
   * // Agora form.get('email').errors contém {serverError: 'E-mail invalido'}
   * ```
   */
  applyFieldErrors(form: FormGroup | null, fieldErrors: Record<string, string>): void {
    if (!form || !fieldErrors) {
      return;
    }

    for (const [fieldName, errorMessage] of Object.entries(fieldErrors)) {
      const control = form.get(fieldName);
      if (control) {
        control.setErrors({serverError: errorMessage});
        control.markAsTouched();
      } else {
        // Campo nao encontrado no form - log para debugging
        this.logger.warn(`Campo '${fieldName}' nao encontrado no formulario`);
      }
    }
  }

  /**
   * Limpa erros de servidor de um FormGroup.
   *
   * @param form FormGroup para limpar erros de servidor
   */
  clearServerErrors(form: FormGroup | null): void {
    if (!form) {
      return;
    }

    for (const key of Object.keys(form.controls)) {
      const control = form.get(key);
      if (control?.errors?.['serverError']) {
        const {serverError: _, ...remainingErrors} = control.errors;
        const hasRemainingErrors = Object.keys(remainingErrors).length > 0;
        control.setErrors(hasRemainingErrors ? remainingErrors : null);
      }
    }
  }

  /**
   * Extrai o ProblemDetail de um HttpErrorResponse.
   *
   * @param error HttpErrorResponse
   * @returns ProblemDetail se disponivel, null caso contrario
   */
  extractProblemDetail(error: unknown): ProblemDetail | null {
    const httpError = error as HttpErrorResponse;
    if (httpError?.error && isProblemDetail(httpError.error)) {
      return httpError.error;
    }
    return null;
  }

  /**
   * Processa erro HTTP e retorna estrutura padronizada.
   */
  private parseError(httpError: HttpErrorResponse): ErrorHandlerResult {
    // Verifica se e um ProblemDetail (RFC 9457)
    if (httpError.error && isProblemDetail(httpError.error)) {
      return this.parseProblemDetail(httpError.error, httpError.status);
    }

    // Fallback para formato antigo ou erro generico
    return this.parseLegacyError(httpError);
  }

  /**
   * Processa ProblemDetail (RFC 9457).
   */
  private parseProblemDetail(problemDetail: ProblemDetail, statusCode: number): ErrorHandlerResult {
    const result: ErrorHandlerResult = {
      message: problemDetail.detail || 'Ocorreu um erro na requisicao',
      title: problemDetail.title,
      traceId: problemDetail.traceId,
      statusCode: problemDetail.status || statusCode
    };

    // Adiciona erros de campo se existirem
    if (hasFieldErrors(problemDetail)) {
      result.fieldErrors = problemDetail.errors;
    }

    return result;
  }

  /**
   * Processa erro no formato antigo ou generico.
   */
  private parseLegacyError(httpError: HttpErrorResponse): ErrorHandlerResult {
    const statusCode = httpError.status;

    // Mensagens por status HTTP
    const statusMessages: Record<number, string> = {
      0: 'Nao foi possivel conectar ao servidor. Verifique sua conexao.',
      400: 'Requisicao invalida',
      401: 'Sessao expirada. Faca login novamente.',
      403: 'Voce nao tem permissao para acessar este recurso',
      404: 'Recurso nao encontrado',
      422: 'Dados invalidos',
      428: 'Precondicao requerida',
      500: 'Erro interno do servidor',
      502: 'Servidor indisponivel',
      503: 'Servico temporariamente indisponivel',
      504: 'Tempo de resposta excedido'
    };

    // Tenta extrair mensagem do erro antigo
    let message: string;
    if (httpError.error?.message) {
      message = this.processLegacyMessage(httpError.error.message);
    } else {
      message = statusMessages[statusCode] || 'Ocorreu um erro inesperado';
    }

    return {
      message,
      statusCode
    };
  }

  /**
   * Processa mensagens do formato antigo (constraint violations, etc).
   */
  private processLegacyMessage(message: string): string {
    const upperMessage = message.toUpperCase();

    if (upperMessage.includes('CONSTRAINTVIOLATIONEXCEPTION')) {
      return 'Erro ao processar: o registro possui vinculo com outros registros.';
    }

    if (upperMessage.includes('DATAINTEGRITYVIOLATIONEXCEPTION')) {
      return 'Erro de integridade de dados. Verifique os valores informados.';
    }

    return message;
  }

  /**
   * Exibe toast de erro.
   */
  private showErrorToast(result: ErrorHandlerResult): void {
    const summary = result.title || 'Erro';
    const detail = result.fieldErrors
      ? 'Verifique os campos destacados no formulario'
      : result.message;

    // Adiciona traceId ao detalhe para facilitar suporte
    const fullDetail = result.traceId
      ? `${detail} (Ref: ${result.traceId.substring(0, 8)})`
      : detail;

    this.messageService.add({
      severity: 'error',
      summary,
      detail: fullDetail,
      life: 5000
    });
  }
}
