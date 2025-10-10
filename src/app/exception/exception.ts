import {inject, Injectable} from '@angular/core';
import {MessageService} from 'primeng/api';

interface HttpErrorResponse {
  error?: {
    message?: string;
  };
  status?: number;
}

@Injectable({
  providedIn: 'root'
})
export class Exception {
  private readonly messageService = inject(MessageService);

  addMessage(error: unknown): void {
    const httpError = error as HttpErrorResponse;
    let detail: string;

    if (httpError.error?.message) {
      detail = this.getMessage(httpError);
    } else if (httpError.status === 403) {
      detail = 'Acesso negado';
    } else {
      detail = 'Ocorreu um erro ao remover o registro';
    }

    this.messageService.add({
      severity: 'error',
      summary: 'Atenção!',
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
