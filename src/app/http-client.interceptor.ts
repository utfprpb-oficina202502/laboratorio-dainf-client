import {HttpEvent, HttpHandler, HttpInterceptor, HttpRequest,} from "@angular/common/http";
import {LoginService} from "./login/login.service";
import {MessageService} from "primeng/api";
import {Observable} from "rxjs";
import {tap} from "rxjs/operators";
import {inject, Injectable} from "@angular/core";

@Injectable()
export class HttpClientInterceptor implements HttpInterceptor {
  private readonly messageService = inject(MessageService);
  private readonly loginService = inject(LoginService);

  intercept(
    req: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    const token = localStorage.getItem("token");

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
              this.loginService.logout();
            }
          }
        })
      );
    }
    return next.handle(req);
  }
}
