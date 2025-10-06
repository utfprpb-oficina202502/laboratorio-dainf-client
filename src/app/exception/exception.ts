import Swal from 'sweetalert2';

interface HttpErrorResponse {
  error?: {
    message?: string;
  };
  status?: number;
}

export class Exception {

  static addMessage(error: unknown): void {
    const httpError = error as HttpErrorResponse;
    if (httpError.error?.message) {
      Swal.fire('Atenção!', this.getMessage(httpError), 'error');
    } else if (httpError.status === 403) {
      Swal.fire('Atenção!', 'Acesso negado', 'error');
    } else {
      Swal.fire('Atenção!', 'Ocorreu um erro ao remover o registro', 'error');
    }
  }

  static getMessage(error: HttpErrorResponse): string {
    const message = (error.error?.message || '').toString().toUpperCase();
    if (message.includes('ConstraintViolationException'.toUpperCase())) {
      return 'Erro ao remover o registro, o mesmo possui vínculo com outros registros.';
    } else {
      return 'Ocorreu um erro ao remover o registro';
    }
  }
}
