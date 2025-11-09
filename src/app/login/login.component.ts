import {ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit} from "@angular/core";
import {LoginService} from "./login.service";
import {Usuario} from "../usuario/usuario";
import {FormsModule} from "@angular/forms";
import {Router} from "@angular/router";
import {MessageService} from "primeng/api";
import {catchError, finalize, switchMap} from "rxjs/operators";
import {of} from "rxjs";
import {ProgressBar} from "primeng/progressbar";
import {NgOptimizedImage} from "@angular/common";
import {StorageService} from "../framework/services/storage.service";

@Component({
  selector: "app-login",
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.css"],
  imports: [
    FormsModule,
    ProgressBar,
    NgOptimizedImage,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent implements OnInit {
  private readonly loginService = inject(LoginService);
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly storageService = inject(StorageService);

  usuario!: Usuario;
  showProgress = false;

  ngOnInit() {
    this.usuario = new Usuario();
  }

  login() {
    this.showProgress = true;
    this.cdr?.markForCheck();
    this.loginService.login(this.usuario).subscribe({
      next: (e: string) => {
        this.storageService.setItem("token", e);
        this.storageService.setItem("username", this.usuario.username);
        this.setUserInLocalStorage();
      },
      error: () => {
        this.showProgress = false;
        this.cdr?.markForCheck();
        this.messageService.add({
          severity: "error",
          summary: "Atenção",
          detail: "Usuário e/ou senha incorretos",
        });
      },
    });
  }

  cadastrar() {
    this.router.navigate(["/cadastrar-usuario"]);
  }

  reenviarEmailConfirmacao() {
    this.router.navigate(["/reenviar-email-confirmacao"]);
  }

  recuperarSenha() {
    this.router.navigate(["/recupear-senha"]);
  }

  setUserInLocalStorage() {
    this.loginService
      .refreshCurrentUser()
    .pipe(
      switchMap(() => this.loginService.getPermissoesUser().pipe(
        catchError(() => of(null)) // Handle permission errors gracefully
      )),
      finalize(() => {
        this.showProgress = false;
        this.cdr?.markForCheck();
      })
    )
      .subscribe({
        next: () => {
          this.loginService.setAuthenticated();
          this.router.navigate(["/"]);
        },
        error: () => {
          this.messageService.add({
            severity: "error",
            summary: "Atenção",
            detail: "Não foi possível carregar os dados do usuário. Tente novamente.",
          });
          this.loginService.logout();
        },
      });
  }

}
