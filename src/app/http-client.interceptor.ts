import {HttpEvent, HttpHandler, HttpInterceptor, HttpRequest,} from "@angular/common/http";
import {LoginService} from "./login/login.service";
import {MessageService} from "primeng/api";
import {Observable, throwError, TimeoutError} from "rxjs";
import {catchError, tap, timeout} from "rxjs/operators";
import {inject, Injectable} from "@angular/core";
import {StorageService} from "./framework/service/storage.service";
import {JwtUtil} from "./framework/utils/jwt.util";
import {isProblemDetail, ProblemDetail} from "./framework/model/problem-detail.interface";
import {TIMEOUT} from "./framework/constants/app.constants";

@Injectable()
export class HttpClientInterceptor implements HttpInterceptor {
  private readonly messageService = inject(MessageService);
  private readonly loginService = inject(LoginService);
  private readonly storageService = inject(StorageService);

  // Timeout para requisições HTTP (2 minutos)
  private readonly REQUEST_TIMEOUT_MS = TIMEOUT.DEFAULT;

  intercept(
    req: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    const token = this.storageService.getItem("token");

    // Validação proativa: verifica se o token está expirado ANTES de fazer a requisição
    if (token && JwtUtil.isTokenExpired(token)) {
      // Token expirado, faz logout imediatamente sem tentar a requisição
      this.loginService.logout();
      // Retorna um observable vazio para não propagar a requisição
      return next.handle(req);
    }

    if (token && !req.headers.has("Authorization")) {
      const authReq = req.clone({
        headers: req.headers,
      });

      const authReqWithBearer = authReq.clone({
        headers: authReq.headers.set("Authorization", "Bearer " + token),
      });
      return next.handle(authReqWithBearer).pipe(
        timeout(this.REQUEST_TIMEOUT_MS),
        catchError(err => {
          if (err instanceof TimeoutError) {
            this.messageService.add({
              severity: 'warn',
              summary: 'Timeout',
              detail: 'Requisição excedeu tempo limite de 2 minutos'
            });
          }
          return throwError(() => err);
        }),
        tap({
          error: (err: unknown) => {
            this.handleHttpError(err);
          }
        })
      );
    }
    return next.handle(req);
  }

  /**
   * Processa erros HTTP, incluindo formato RFC 9457 (ProblemDetail).
   */
  private handleHttpError(err: unknown): void {
    const error = err as { status?: number; error?: unknown };
    const status = error.status;

    // Verifica se e um ProblemDetail (RFC 9457)
    if (error.error && isProblemDetail(error.error)) {
      this.handleProblemDetailError(error.error, status);
      return;
    }

    // Tratamento padrao para erros sem ProblemDetail
    if (status === 403) {
      this.messageService.add({
        severity: "info",
        detail: "Você não tem permissão para acessar este recurso",
      });
    } else if (status === 401) {
      // Token inválido ou expirado detectado pelo servidor
      this.loginService.logout();
    }
  }

  /**
   * Processa erros no formato RFC 9457 (ProblemDetail).
   */
  private handleProblemDetailError(problemDetail: ProblemDetail, status?: number): void {
    const httpStatus = problemDetail.status || status;

    // Token expirado ou invalido
    if (httpStatus === 401) {
      // Verifica tipo especifico do erro
      if (problemDetail.type?.includes('token-expirado')) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Sessão expirada',
          detail: 'Sua sessão expirou. Por favor, faça login novamente.',
          life: 5000
        });
      }
      this.loginService.logout();
      return;
    }

    // Acesso negado
    if (httpStatus === 403) {
      this.messageService.add({
        severity: 'info',
        summary: problemDetail.title || 'Acesso negado',
        detail: problemDetail.detail || 'Você não tem permissão para acessar este recurso',
        life: 5000
      });
      return;
    }

    // Precondicao requerida (nada consta, etc)
    if (httpStatus === 428) {
      this.messageService.add({
        severity: 'warn',
        summary: problemDetail.title || 'Precondição requerida',
        detail: problemDetail.detail || 'Uma precondição deve ser atendida para continuar.',
        life: 8000
      });
    }

    // Erros de servidor (5xx) - nao tratados aqui, deixa para componentes
    // Erros de validacao (400, 422) - tratados pelos componentes via ErrorHandlerService
  }
}
