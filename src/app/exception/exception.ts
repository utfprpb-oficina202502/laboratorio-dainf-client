import {inject, Injectable} from '@angular/core';
import {HttpErrorResponse} from '@angular/common/http';
import {MessageService} from 'primeng/api';
import {isProblemDetail} from '../framework/model/problem-detail.interface';

/**
 * Servico para tratamento de excecoes HTTP.
 *
 * @deprecated Use ErrorHandlerService para novas implementacoes.
 * Este servico e mantido para compatibilidade com codigo existente.
 */
@Injectable({
  providedIn: 'root'
})
export class Exception {
  private readonly messageService = inject(MessageService);

  /**
   * Exibe mensagem de erro para o usuario.
   *
   * Suporta tanto o formato RFC 9457 (ProblemDetail) quanto o formato legado.
   *
   * @param error Erro HTTP recebido
   */
  addMessage(error: unknown): void {
    const httpError = error as HttpErrorResponse;
    let detail: string;
    let summary = 'Atenção!';

    // Verifica se e ProblemDetail (RFC 9457)
    if (httpError.error && isProblemDetail(httpError.error)) {
      const problemDetail = httpError.error;
      detail = problemDetail.detail || 'Ocorreu um erro na operacao';
      summary = problemDetail.title || summary;

      // Adiciona referencia do traceId para suporte
      if (problemDetail.traceId) {
        detail = `${detail} (Ref: ${problemDetail.traceId.substring(0, 8)})`;
      }
    } else if (httpError.status === 403) {
      detail = 'Acesso negado';
    } else if (httpError.error?.message) {
      detail = this.getMessage(httpError);
    } else {
      detail = 'Ocorreu um erro ao remover o registro';
    }

    this.messageService.add({
      severity: 'error',
      summary,
      detail,
      life: 5000
    });
  }

  private getMessage(error: HttpErrorResponse): string {
    const message = (error.error?.message || '').toString().toUpperCase();
    if (message.includes('ConstraintViolationException'.toUpperCase())) {
      return 'Erro ao remover o registro, o mesmo possui vínculo com outros registros.';
    } else {
      return 'Ocorreu um erro ao remover o registro';
    }
  }
}
