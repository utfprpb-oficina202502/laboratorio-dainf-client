import { Component, OnInit, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef } from "@angular/core";
import { LoginService } from "./login.service";
import { Usuario } from "../usuario/usuario";
import {FormsModule, NgForm} from "@angular/forms";
import { Router } from "@angular/router";
import { MessageService } from "primeng/api";
import { finalize } from "rxjs/operators";
import {ProgressBar} from "primeng/progressbar";
import {NgOptimizedImage} from "@angular/common";
@Component({
  selector: "app-login",
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.css"],
  imports: [
    FormsModule,
    ProgressBar,
    NgOptimizedImage
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent implements OnInit {
  usuario: Usuario;
  showProgress = false;
  @ViewChild("form", { static: true }) form: NgForm;

  constructor(
    private readonly loginService: LoginService,
    private readonly router: Router,
    private readonly messageService: MessageService,
    private readonly cdr: ChangeDetectorRef
  ) {
    // private socialAuthService: SocialAuthService
  }

  ngOnInit() {
    this.usuario = new Usuario();
  }

  login() {
    this.showProgress = true;
    this.cdr.markForCheck();
    this.loginService.login(this.usuario).subscribe({
      next: (e) => {
        localStorage.setItem("token", e);
        localStorage.setItem("username", this.usuario.username);
        this.setUserInLocalStorage();
      },
      error: (error) => {
        this.showProgress = false;
        this.cdr.markForCheck();
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
      .pipe(finalize(() => {
        this.showProgress = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: () => {
          this.loginService.getPermissoesUser().subscribe({
            next: () => {
              this.loginService.setAuthenticated();
              this.router.navigate(["/"]);
            },
            error: () => {
              this.loginService.setAuthenticated();
              this.router.navigate(["/"]);
            }
          });
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
