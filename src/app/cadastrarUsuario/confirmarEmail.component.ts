import {ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit} from "@angular/core";
import {CommonModule, NgOptimizedImage} from "@angular/common";
import {ActivatedRoute, Router} from "@angular/router";
import {MessageService} from "primeng/api";
import {ProgressBar} from "primeng/progressbar";
import {CadastrarUsuarioService} from "./cadastrarUsuario.service";

@Component({
    selector: "app-confirmarvalidar-email",
    templateUrl: "./confirmarEmail.component.html",
    styleUrls: ["./confirmarEmail.component.css"],
  imports: [
    CommonModule,
    NgOptimizedImage,
    ProgressBar
  ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConfirmarEmailComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);
  private readonly cadastrarUsuarioService = inject(CadastrarUsuarioService);
  private readonly route = inject(ActivatedRoute);
  private readonly cdr = inject(ChangeDetectorRef);

  showProgress = false;
  code = '';

  ngOnInit() {
    this.route.params.subscribe((params) => {
      if (params.code) {
        this.code = params.code;
        this.cdr.markForCheck();
      }
    });
  }

  submit() {
    this.showProgress = true;
    this.cdr.markForCheck();

    const emailConfirmacao = { code: this.code };

    this.cadastrarUsuarioService.confirmarEmail(emailConfirmacao).subscribe({
      next: () => {
        this.showProgress = false;
        this.cdr.markForCheck();
        this.messageService.add({
          severity: "success",
          summary: "Sucesso",
          detail: "Email validado com sucesso, agora será possível realizar autenticação no sistema.",
        });
        this.router.navigate(["/login"]);
      },
      error: () => {
        this.showProgress = false;
        this.cdr.markForCheck();
        this.messageService.add({
          severity: "error",
          summary: "Atenção",
          detail: "Falha ao confirmar o email, entre em contato com os responsáveis pelos laboratórios.",
        });
      },
    });
  }

  goToLogin() {
    this.router.navigate(["/login"]);
  }
}
