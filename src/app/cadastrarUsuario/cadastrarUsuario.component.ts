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
import {Router} from "@angular/router";
import {MessageService} from "primeng/api";
import {ProgressBar} from "primeng/progressbar";
import {InputTextModule} from "primeng/inputtext";
import {CadastrarUsuarioService} from "./cadastrarUsuario.service";

@Component({
    selector: "app-cadastrar-usuario",
    templateUrl: "./cadastrarUsuario.component.html",
    styleUrls: ["./cadastrarUsuario.component.css"],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NgOptimizedImage,
    ProgressBar,
    InputTextModule
  ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CadastrarUsuarioComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);
  private readonly cadastrarUsuarioService = inject(CadastrarUsuarioService);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);

  form!: FormGroup;
  showProgress = false;

  ngOnInit() {
    this.buildForm();
  }

  buildForm() {
    this.form = this.fb.group({
      nome: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email, this.utfprEmailValidator]],
      documento: ['', [Validators.required, Validators.minLength(3), Validators.pattern(/^\d+$/)]],
      telefone: ['', [Validators.required, Validators.minLength(8)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  utfprEmailValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return null;
    }
    const email = control.value.toLowerCase();
    const isValid = email.endsWith('@utfpr.edu.br') || email.endsWith('@alunos.utfpr.edu.br');
    return isValid ? null : { utfprEmail: true };
  }

  passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
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

    const formValue = this.form.value;
    const usuario = {
      nome: formValue.nome,
      email: formValue.email,
      documento: formValue.documento,
      telefone: formValue.telefone,
      password: formValue.password,
      confirmPassword: formValue.confirmPassword
    };

    this.cadastrarUsuarioService.saveUser(usuario).subscribe({
      next: () => {
        this.showProgress = false;
        this.cdr.markForCheck();
        this.messageService.add({
          severity: "success",
          summary: "Sucesso",
          detail:
            "Cadastro realizado com sucesso. Um email de confirmação foi enviado para o endereço de email cadastrado.",
        });
        this.router.navigate(["/login"]);
      },
      error: () => {
        this.showProgress = false;
        this.cdr.markForCheck();
        this.messageService.add({
          severity: "error",
          summary: "Atenção",
          detail:
            "Verifique o formulário, os dados de cadastro estão incorretos",
        });
      },
    });
  }

  goToLogin() {
    this.router.navigate(["/login"]);
  }

  /**
   * Retorna a mensagem de erro apropriada para um campo do formulário.
   * A ordem das verificações é importante para exibir a mensagem mais relevante.
   * @param fieldName Nome do campo no formulário
   * @returns Mensagem de erro em pt-BR ou string vazia se não houver erro
   * @example
   * getErrorMessage('documento') // 'O RA/SIAPE deve conter apenas números'
   * getErrorMessage('email') // 'Digite um email válido da UTFPR...'
   */
  getErrorMessage(fieldName: string): string {
    const control = this.form.get(fieldName);
    if (!control?.errors || !control?.touched) {
      return '';
    }

    if (control.errors['required']) {
      return 'Este campo é obrigatório';
    }
    // Pattern é verificado antes de minlength para documento,
    // pois "abc" deve mostrar "apenas números" e não "mínimo 3 caracteres"
    if (control.errors['pattern']) {
      return 'O RA/SIAPE deve conter apenas números';
    }
    if (control.errors['minlength']) {
      return `Mínimo de ${control.errors['minlength'].requiredLength} caracteres`;
    }
    if (control.errors['email']) {
      return 'Email inválido';
    }
    if (control.errors['utfprEmail']) {
      return 'Digite um email válido da UTFPR (@utfpr.edu.br ou @alunos.utfpr.edu.br)';
    }
    return '';
  }

  /**
   * Retorna mensagem de erro quando as senhas não conferem.
   * Verifica o erro a nível de FormGroup (validador cross-field).
   * @returns Mensagem de erro ou string vazia se senhas conferem
   */
  getPasswordMatchError(): string {
    if (this.form.errors?.['passwordMismatch'] && this.form.get('confirmPassword')?.touched) {
      return 'As senhas não conferem';
    }
    return '';
  }

  /**
   * Filtra caracteres não numéricos do campo RA/SIAPE.
   * Remove qualquer caractere que não seja dígito em tempo real.
   * @param event Evento de input do campo
   */
  onDocumentoInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const filteredValue = input.value.replaceAll(/\D/g, '');
    if (input.value !== filteredValue) {
      input.value = filteredValue;
      this.form.get('documento')?.setValue(filteredValue, {emitEvent: false});
    }
  }
}
