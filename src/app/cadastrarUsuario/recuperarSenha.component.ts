import {ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit} from "@angular/core";
import {NgOptimizedImage} from "@angular/common";
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from "@angular/forms";
import {ActivatedRoute, Router} from "@angular/router";
import {MessageService} from "primeng/api";
import {ProgressBar} from "primeng/progressbar";
import {InputTextModule} from "primeng/inputtext";
import {CadastrarUsuarioService} from "./cadastrarUsuario.service";
import {extractRouteParam, parseStringParam} from "../framework/utils/route-params.operators";
import {ErrorHandlerService} from "../framework/service/error-handler.service";
import {FormValidationService} from "../framework/service/form-validation.service";

@Component({
    selector: "app-recuperar-senha",
    templateUrl: "./recuperarSenha.component.html",
    styleUrls: ["./recuperarSenha.component.css"],
  imports: [
    ReactiveFormsModule,
    NgOptimizedImage,
    ProgressBar,
    InputTextModule
  ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class RecuperarSenhaComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);
  private readonly cadastrarUsuarioService = inject(CadastrarUsuarioService);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly errorHandler = inject(ErrorHandlerService);
  private readonly formValidation = inject(FormValidationService);

  form!: FormGroup;
  showProgress = false;
  hasCode = false;

  ngOnInit() {
    // Extração e validação de token com operator utilitário
    this.route.params.pipe(
      extractRouteParam({
        paramName: 'code',
        converter: parseStringParam
      })
    ).subscribe({
      next: (code) => {
        this.hasCode = code !== null;
        this.buildForm();
        if (this.hasCode && code) {
          this.form.patchValue({code});
        }
        this.cdr.markForCheck();
      }
    });
  }

  buildForm() {
    if (this.hasCode) {
      // Form for password reset with code
      this.form = this.fb.group({
        code: ['', Validators.required],
        password: ['', [Validators.required, Validators.minLength(6)]],
        repeatPassword: ['', [Validators.required]]
      }, { validators: this.passwordMatchValidator });
    } else {
      // Form for requesting password reset
      this.form = this.fb.group({
        email: ['', [Validators.required, Validators.email]]
      });
    }
  }

  passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
    const password = group.get('password')?.value;
    const repeatPassword = group.get('repeatPassword')?.value;
    return password === repeatPassword ? null : { passwordMismatch: true };
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.messageService.add({
        severity: "error",
        summary: "Atenção",
        detail: "Por favor, preencha todos os campos corretamente.",
      });
      return;
    }

    this.showProgress = true;
    this.cdr.markForCheck();

    if (this.hasCode) {
      // Reset password with code
      const formValue = this.form.value;
      const recuperarSenha = {
        code: formValue.code,
        password: formValue.password,
        repeatPassword: formValue.repeatPassword
      };

      this.cadastrarUsuarioService.recuperarSenha(recuperarSenha).subscribe({
        next: () => {
          this.showProgress = false;
          this.cdr.markForCheck();
          this.messageService.add({
            severity: "success",
            summary: "Sucesso",
            detail: "Senha atualizada com sucesso. Efetue o login com a nova senha",
          });
          this.router.navigate(["/login"]);
        },
        error: (error) => {
          this.showProgress = false;

          // Processa erro RFC 9457 e aplica erros de campo ao formulário
          const result = this.errorHandler.handleHttpError(error, false);

          if (result.fieldErrors) {
            this.errorHandler.applyFieldErrors(this.form, result.fieldErrors);
            this.cdr.markForCheck(); // Necessário após applyFieldErrors para OnPush
            this.messageService.add({
              severity: "warn",
              summary: result.title || "Erro de validação",
              detail: "Verifique os campos destacados no formulário",
              life: 5000
            });
          } else {
            this.cdr.markForCheck(); // Atualiza showProgress
            this.messageService.add({
              severity: "error",
              summary: result.title || "Atenção",
              detail: result.message || "Verifique se as senhas digitadas são iguais e possuem pelo menos 6 dígitos.",
              life: 5000
            });
          }
        },
      });
    } else {
      // Request password reset
      const emailConfirmacao = { email: this.form.value.email };

      this.cadastrarUsuarioService.requisitarRecuperarSenha(emailConfirmacao).subscribe({
        next: () => {
          this.showProgress = false;
          this.cdr.markForCheck();
          this.messageService.add({
            severity: "success",
            summary: "Sucesso",
            detail: "Um email foi enviado contendo o link para recuperação da senha.",
          });
          this.router.navigate(["/login"]);
        },
        error: (error) => {
          this.showProgress = false;

          // Processa erro RFC 9457 e aplica erros de campo ao formulário
          const result = this.errorHandler.handleHttpError(error, false);

          if (result.fieldErrors) {
            this.errorHandler.applyFieldErrors(this.form, result.fieldErrors);
            this.cdr.markForCheck(); // Necessário após applyFieldErrors para OnPush
            this.messageService.add({
              severity: "warn",
              summary: result.title || "Erro de validação",
              detail: "Verifique os campos destacados no formulário",
              life: 5000
            });
          } else {
            this.cdr.markForCheck(); // Atualiza showProgress
            this.messageService.add({
              severity: "error",
              summary: result.title || "Atenção",
              detail: result.message || "O email informado não está cadastrado no sistema.",
              life: 5000
            });
          }
        },
      });
    }
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

  getPasswordMatchError(): string {
    if (this.form.errors?.['passwordMismatch'] && this.form.get('repeatPassword')?.touched) {
      return 'As senhas não conferem';
    }
    return '';
  }
}
