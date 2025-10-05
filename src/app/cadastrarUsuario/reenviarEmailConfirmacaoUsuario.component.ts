import {ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit} from "@angular/core";
import {CommonModule, NgOptimizedImage} from "@angular/common";
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {Router} from "@angular/router";
import {MessageService} from "primeng/api";
import {ProgressBar} from "primeng/progressbar";
import {InputTextModule} from "primeng/inputtext";
import {CadastrarUsuarioService} from "./cadastrarUsuario.service";

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
      error: () => {
        this.showProgress = false;
        this.cdr.markForCheck();
        this.messageService.add({
          severity: "error",
          summary: "Atenção",
          detail: "O email informado não está cadastrado no sistema ou já foi confirmado.",
        });
      },
    });
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
    if (control.errors['email']) {
      return 'Email inválido';
    }
    return '';
  }
}
