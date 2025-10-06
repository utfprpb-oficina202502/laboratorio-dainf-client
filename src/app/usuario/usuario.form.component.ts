import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {Z_INDEX} from '../framework/constants';
import {Usuario} from './usuario';
import {UsuarioService} from './usuario.service';
import {
  PrimeReactiveCrudFormComponent
} from '../framework/component/prime-reactive-crud.form.component';
import {Permissao} from './permissao';
import Swal from 'sweetalert2';

// PrimeNG
import {CardModule} from 'primeng/card';
import {InputTextModule} from 'primeng/inputtext';
import {ButtonModule} from 'primeng/button';
import {TooltipModule} from 'primeng/tooltip';
import {DialogModule} from 'primeng/dialog';
import {MultiSelectModule} from 'primeng/multiselect';
import {PasswordModule} from 'primeng/password';
import {InputMaskModule} from 'primeng/inputmask';

// Custom components
import {FormFieldComponent} from '../framework/component/form-field.component';
import {VoltarComponent} from '../geral/voltar/voltar.component';
import {CancelarComponent} from '../geral/cancelar/cancelar.component';
import {SalvarComponent} from '../geral/salvar/salvar.component';
import {LoggerService} from '../framework/services/logger.service';

interface PermissaoSelectItem {
  label: string;
  value: Permissao;
}

@Component({
  selector: 'app-form-usuario',
  templateUrl: './usuario.form.component.html',
  styleUrls: ['./usuario.form.component.css'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    // PrimeNG
    CardModule,
    InputTextModule,
    ButtonModule,
    TooltipModule,
    DialogModule,
    MultiSelectModule,
    PasswordModule,
    InputMaskModule,
    // Custom
    FormFieldComponent,
    VoltarComponent,
    CancelarComponent,
    SalvarComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UsuarioFormComponent extends PrimeReactiveCrudFormComponent<Usuario, number> {
  // Constants for template
  protected readonly Z_INDEX = Z_INDEX;

  protected override service = inject(UsuarioService);
  protected override urlList = '/usuario';
  protected override type = Usuario;
  private readonly fb = inject(FormBuilder);
  protected readonly logger = inject(LoggerService);

  // Signals for dropdown options and dialog state
  protected readonly grupoAcessoDropdown = signal<PermissaoSelectItem[]>([]);
  protected readonly dialogChangeSenha = signal(false);

  // Signals for password change form
  protected readonly redSenhaAtual = signal('');
  protected readonly redNovaSenha = signal('');
  protected readonly redConfNovaSenha = signal('');

  // Separate form for password change
  protected readonly formChangeSenha = signal<FormGroup | null>(null);

  // Computed signal to determine if editing existing user
  protected readonly isEditMode = computed(() => {
    const obj = this.object();
    return !!(obj && 'id' in obj && obj.id);
  });

  // Computed signal to determine if password change button should be shown
  protected readonly canShowPasswordChange = computed(() => this.isEditMode());

  constructor() {
    super();
    this.buildGrupoDeAcesso();
    this.buildPasswordChangeForm();
  }

  /**
   * Build the reactive form with validators
   */
  protected override buildForm(): FormGroup {
    const isNew = !this.isEditMode();

    return this.fb.group({
      id: [{ value: null, disabled: true }],
      nome: ['', [Validators.required, Validators.maxLength(255)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
      telefone: ['', [Validators.required, Validators.maxLength(20)]],
      permissoes: [[], [Validators.required]],
      documento: ['', [Validators.maxLength(100)]],
      username: ['', [Validators.required, Validators.maxLength(100)]],
      password: [{ value: '', disabled: !isNew }, isNew ? [Validators.required, Validators.minLength(6)] : []]
    });
  }

  /**
   * Build the password change form
   */
  private buildPasswordChangeForm(): void {
    const form = this.fb.group({
      senhaAtual: ['', [Validators.required]],
      novaSenha: ['', [Validators.required, Validators.minLength(6)]],
      confirmarNovaSenha: ['', [Validators.required]]
    });
    this.formChangeSenha.set(form);
  }

  /**
   * Load permission options for dropdown
   */
  buildGrupoDeAcesso(): void {
    this.service.findAllPermissao()
      .subscribe({
        next: (permissoes) => {
          if (permissoes && permissoes.length > 0) {
            const items: PermissaoSelectItem[] = permissoes.map(permissao => ({
              label: this.formatRule(permissao.nome),
              value: permissao
            }));
            this.grupoAcessoDropdown.set(items);

            // Set default permission for new users
            const formGroup = this.form();
            if (formGroup && !this.isEditMode()) {
              formGroup.patchValue({
                permissoes: [permissoes[0]]
              });
            }
          }
        },
        error: (error) => {
          this.logger.error('Error loading permissions', error);
          Swal.fire('Erro', 'Erro ao carregar grupos de acesso.', 'error');
        }
      });
  }

  /**
   * Format permission name for display
   */
  formatRule(nome: string): string {
    let toReturn = nome.replaceAll('ROLE_', '');
    toReturn = toReturn.charAt(0).toUpperCase() + toReturn.slice(1).toLowerCase();
    return toReturn;
  }

  /**
   * Show password change dialog
   */
  showDialogChangeSenha(): void {
    this.dialogChangeSenha.set(true);
    this.resetPasswordForm();
  }

  /**
   * Reset password change form
   */
  private resetPasswordForm(): void {
    const form = this.formChangeSenha();
    if (form) {
      form.reset();
    }
    this.redSenhaAtual.set('');
    this.redNovaSenha.set('');
    this.redConfNovaSenha.set('');
  }

  /**
   * Submit password change
   */
  redefinirSenha(): void {
    const form = this.formChangeSenha();
    if (!form) return;

    if (form.valid) {
      const novaSenha = form.get('novaSenha')?.value;
      const confirmarNovaSenha = form.get('confirmarNovaSenha')?.value;
      const senhaAtual = form.get('senhaAtual')?.value;

      if (novaSenha !== confirmarNovaSenha) {
        Swal.fire('Atenção', 'Senhas não conferem!', 'error');
        return;
      }

      const obj = this.object();
      if (!obj) return;

      this.loaderService.show();

      const usuarioComNovaSenha = { ...obj, password: novaSenha };
      this.service.changeSenha(usuarioComNovaSenha, senhaAtual)
        .subscribe({
          next: () => {
            this.loaderService.hide();
            Swal.fire('Sucesso', 'Senha redefinida com sucesso!', 'success');
            this.resetPasswordForm();
            this.dialogChangeSenha.set(false);
          },
          error: (error) => {
            this.loaderService.hide();
            this.logger.error('Error changing password', error);
            Swal.fire('Atenção', 'A senha atual está incorreta!', 'error');
          }
        });
    } else {
      for (const key of Object.keys(form.controls)) {
        form.get(key)?.markAsTouched();
      }
    }
  }

  /**
   * Override to patch form with object data
   */
  protected override patchFormWithObject(object: Usuario): void {
    const formGroup = this.form();
    if (formGroup && 'id' in object) {
      formGroup.patchValue({
        id: object.id,
        nome: object.nome,
        email: object.email,
        telefone: object.telefone,
        permissoes: object.permissoes || [],
        documento: object.documento,
        username: object.username
      });

      // Disable password field for existing users
      formGroup.get('password')?.disable();
    }
  }

  /**
   * Override to prepare form value before saving
   */
  protected override prepareFormValue(formValue: Partial<Usuario>): Partial<Usuario> {
    const formGroup = this.form();
    const id = formGroup?.get('id')?.value;
    const password = formGroup?.get('password')?.value;

    // Include id and password if present
    return {
      ...formValue,
      ...(id && { id }),
      ...(password && { password })
    };
  }
}
