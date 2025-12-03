import {ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit} from "@angular/core";
import {CommonModule, NgOptimizedImage} from "@angular/common";
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {Router} from "@angular/router";
import {MessageService} from "primeng/api";
import {ProgressBar} from "primeng/progressbar";
import {InputTextModule} from "primeng/inputtext";
import {CadastrarUsuarioService} from "./cadastrarUsuario.service";
import {ErrorHandlerService} from "../framework/services/error-handler.service";
import {FormValidationService} from "../framework/services/form-validation.service";

@Component({
    selector: "app-reenviar-email-confirmacao-usuario",
    templateUrl: "./reenviarEmailConfirmacaoUsuario.component.html",
    styleUrls: ["./reenviarEmailConfirmacaoUsuario.component.css"],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NgOptimizedImage,
    ProgressBar,
    InputTextModule
  ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReenviarEmailConfirmacaoUsuarioComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);
  private readonly cadastrarUsuarioService = inject(CadastrarUsuarioService);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly errorHandler = inject(ErrorHandlerService);
  private readonly formValidation = inject(FormValidationService);

  form!: FormGroup;
  showProgress = false;

  ngOnInit() {
    this.buildForm();
  }

  buildForm() {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.messageService.add({
        severity: "error",
        summary: "Atenção",
        detail: "Por favor, insira um email válido.",
      });
      return;
    }

    this.showProgress = true;
    this.cdr.markForCheck();

    const emailConfirmacao = { email: this.form.value.email };

    this.cadastrarUsuarioService.resendConfirmEmail(emailConfirmacao).subscribe({
      next: () => {
        this.showProgress = false;
        this.cdr.markForCheck();
        this.messageService.add({
          severity: "success",
          summary: "Sucesso",
          detail: "Um email foi enviado contendo o link para confirmação do email.",
        });
        this.router.navigate(["/login"]);
      },
      error: (error) => {
        this.showProgress = false;
        this.cdr.markForCheck();

        // Processa erro RFC 9457 e aplica erros de campo ao formulário
        const result = this.errorHandler.handleHttpError(error, false);

        if (result.fieldErrors) {
          this.errorHandler.applyFieldErrors(this.form, result.fieldErrors);
          this.messageService.add({
            severity: "warn",
            summary: result.title || "Erro de validação",
            detail: "Verifique os campos destacados no formulário",
            life: 5000
          });
        } else {
          this.messageService.add({
            severity: "error",
            summary: result.title || "Atenção",
            detail: result.message || "O email informado não está cadastrado no sistema ou já foi confirmado.",
            life: 5000
          });
        }
      },
    });
  }

  goToLogin() {
    this.router.navigate(["/login"]);
  }

  /**
   * Retorna a mensagem de erro apropriada para um campo do formulário.
   * Delega para FormValidationService centralizado.
   */
  getErrorMessage(fieldName: string): string {
    return this.formValidation.getErrorMessage(this.form.get(fieldName));
  }
}
