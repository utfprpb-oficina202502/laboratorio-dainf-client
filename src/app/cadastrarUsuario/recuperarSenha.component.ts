import {ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit} from "@angular/core";
import {CommonModule, NgOptimizedImage} from "@angular/common";
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

@Component({
    selector: "app-recuperar-senha",
    templateUrl: "./recuperarSenha.component.html",
    styleUrls: ["./recuperarSenha.component.css"],
  imports: [
    CommonModule,
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

  form!: FormGroup;
  showProgress = false;
  hasCode = false;

  ngOnInit() {
    this.route.params.subscribe((params) => {
      this.hasCode = !!params.code;
      this.buildForm();
      if (this.hasCode) {
        this.form.patchValue({ code: params.code });
      }
      this.cdr.markForCheck();
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
        next: (e) => {
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
          this.cdr.markForCheck();
          this.messageService.add({
            severity: "error",
            summary: "Atenção",
            detail: "Verifique se as senhas digitadas são iguais e possuem pelo menos 6 dígitos.",
          });
        },
      });
    } else {
      // Request password reset
      const emailConfirmacao = { email: this.form.value.email };

      this.cadastrarUsuarioService.requisitarRecuperarSenha(emailConfirmacao).subscribe({
        next: (e) => {
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
          this.cdr.markForCheck();
          this.messageService.add({
            severity: "error",
            summary: "Atenção",
            detail: "O email informado não está cadastrado no sistema.",
          });
        },
      });
    }
  }

  goToLogin() {
    this.router.navigate(["/login"]);
  }

  getErrorMessage(fieldName: string): string {
    const control = this.form.get(fieldName);
    if (!control?.errors || !control?.touched) {
      return '';
    }

    if (control.errors['required']) {
      return 'Este campo é obrigatório';
    }
    if (control.errors['minlength']) {
      return `Mínimo de ${control.errors['minlength'].requiredLength} caracteres`;
    }
    if (control.errors['email']) {
      return 'Email inválido';
    }
    return '';
  }

  getPasswordMatchError(): string {
    if (this.form.errors?.['passwordMismatch'] && this.form.get('repeatPassword')?.touched) {
      return 'As senhas não conferem';
    }
    return '';
  }
}
