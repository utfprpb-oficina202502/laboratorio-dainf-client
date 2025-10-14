import {HttpEvent, HttpHandler, HttpInterceptor, HttpRequest,} from "@angular/common/http";
import {LoginService} from "./login/login.service";
import {MessageService} from "primeng/api";
import {Observable} from "rxjs";
import {tap} from "rxjs/operators";
import {inject, Injectable} from "@angular/core";
import {StorageService} from "./framework/services/storage.service";
import {JwtUtil} from "./framework/utils/jwt.util";

@Injectable()
export class HttpClientInterceptor implements HttpInterceptor {
  private readonly messageService = inject(MessageService);
  private readonly loginService = inject(LoginService);
  private readonly storageService = inject(StorageService);

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
        tap({
          error: (err: unknown) => {
            const error = err as { status?: number };
            if (error.status === 403) {
              this.messageService.add({
                severity: "info",
                detail: "Você não tem permissão para acessar este recurso",
              });
            } else if (error.status === 401) {
              // Token inválido ou expirado detectado pelo servidor
              this.loginService.logout();
            }
          }
        })
      );
    }
    return next.handle(req);
  }
}
