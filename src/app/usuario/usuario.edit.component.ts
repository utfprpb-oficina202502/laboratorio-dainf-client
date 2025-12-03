import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {Z_INDEX} from '../framework/constants';
import {Usuario} from './usuario';
import {UsuarioService} from './usuario.service';
import {
  PrimeReactiveCrudFormComponent
} from '../framework/component/prime-reactive-crud.form.component';
import {Permissao} from './permissao';

// PrimeNG Modules
import {CardModule} from 'primeng/card';
import {InputTextModule} from 'primeng/inputtext';
import {ButtonModule} from 'primeng/button';
import {TooltipModule} from 'primeng/tooltip';
import {DialogModule} from 'primeng/dialog';
import {MultiSelectModule} from 'primeng/multiselect';
import {PasswordModule} from 'primeng/password';
import {SelectItem} from 'primeng/api';

// Custom Components
import {VoltarComponent} from '../geral/voltar/voltar.component';
import {CancelarComponent} from '../geral/cancelar/cancelar.component';
import {SalvarComponent} from '../geral/salvar/salvar.component';
import {FormFieldComponent} from '../framework/component/form-field.component';
import {LoggerService} from '../framework/services/logger.service';
import {StorageService} from '../framework/services/storage.service';

@Component({
  selector: 'app-edit-usuario',
  templateUrl: './usuario.edit.component.html',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    // PrimeNG
    CardModule,
    InputTextModule,
    ButtonModule,
    TooltipModule,
    DialogModule,
    MultiSelectModule,
    PasswordModule,
    // Custom
    VoltarComponent,
    CancelarComponent,
    SalvarComponent,
    FormFieldComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UsuarioEditComponent extends PrimeReactiveCrudFormComponent<Usuario, number> {
  // Constants for template
  protected readonly Z_INDEX = Z_INDEX;

  protected override service = inject(UsuarioService);
  protected override urlList = '/usuario';
  protected override type = Usuario;

  // Injeção de DestroyRef para gerenciamento automático de subscriptions
  private readonly destroyRef = inject(DestroyRef);

  // Signals for state management
  protected readonly dialogChangeSenha = signal(false);
  protected readonly grupoAcessoDropdown = signal<SelectItem[]>([]);
  protected readonly loadingPermissoes = signal(false);
  protected readonly changeSenhaForm = signal<FormGroup | null>(null);

  // Computed signal for document label
  protected readonly documentLabel = computed(() => {
    const obj = this.object();
    const permissoes = obj?.permissoes || obj?.authorities || [];
    const isAluno = permissoes.some((p: Permissao) => p.nome.includes('ROLE_ALUNO'));
    return isAluno ? 'RA' : 'SIAPE';
  });

  private readonly fb = inject(FormBuilder);
  protected readonly logger = inject(LoggerService);
  private readonly storageService = inject(StorageService);

  constructor() {
    super();
  }

  override ngOnInit(): void {
    super.ngOnInit();
    this.buildChangeSenhaForm();
    this.loadPermissoes();
  }

  /**
   * Override save to use updateUser endpoint
   */
  override save(): void {
    this.loaderService.show();
    this.isLoading.set(true);

    const formGroup = this.form();
    if (!formGroup) {
      this.loaderService.hide();
      this.isLoading.set(false);
      return;
    }

    if (formGroup.valid && this.validExtra) {
      const formValue = this.prepareFormValue(formGroup.value);
      const objectToSave = this.mergeWithObject(formValue);

      this.service.updateUser(objectToSave).subscribe({
        next: (savedObject) => {
          this.object.set(savedObject);
          // Update sessionStorage with new user data
          this.storageService.setItem('userLogged', JSON.stringify(savedObject));
          this.loaderService.hide();
          this.isLoading.set(false);
          this.messageService.add({
            severity: 'success',
            summary: 'Sucesso!',
            detail: 'Dados atualizados com sucesso!',
            life: 3000
          });
          this.back();
        },
        error: (error) => {
          this.loaderService.hide();
          this.isLoading.set(false);

          // Processa erro RFC 9457 e aplica erros de campo ao formulário
          const result = this.errorHandler.handleHttpError(error, false);

          if (result.fieldErrors) {
            this.errorHandler.applyFieldErrors(formGroup, result.fieldErrors);
            // Força atualização da view para exibir erros (OnPush)
            this.cdr.markForCheck();
            this.messageService.add({
              severity: 'warn',
              summary: result.title || 'Erro de validação',
              detail: 'Verifique os campos destacados no formulário',
              life: 5000
            });
          } else {
            this.messageService.add({
              severity: 'error',
              summary: result.title || 'Atenção!',
              detail: result.message || 'Ocorreu um erro ao salvar o registro!',
              life: 5000
            });
          }

          this.logger.error('Erro ao atualizar usuário', error);
        }
      });
    } else {
      this.loaderService.hide();
      this.isLoading.set(false);
      this.messageService.add({
        severity: 'info',
        summary: 'Atenção',
        detail: 'Necessário preencher todos os campos corretamente!'
      });
      this.markFormAsTouched(formGroup);
    }
  }

  /**
   * Show password change dialog
   */
  showDialogChangeSenha(): void {
    const formGroup = this.changeSenhaForm();
    if (formGroup) {
      formGroup.reset();
    }
    this.dialogChangeSenha.set(true);
  }

  /**
   * Submit password change
   */
  redefinirSenha(): void {
    const formGroup = this.changeSenhaForm();
    if (!formGroup) return;

    if (formGroup.valid) {
      const senhaAtual = formGroup.get('senhaAtual')?.value;
      const novaSenha = formGroup.get('novaSenha')?.value;

      this.loaderService.show();

      const obj = this.object();
      if (!obj) {
        this.loaderService.hide();
        return;
      }

      const usuarioToUpdate = {...obj, password: novaSenha};

      this.service.changeSenha(usuarioToUpdate, senhaAtual).pipe(
        takeUntilDestroyed(this.destroyRef)
      ).subscribe({
        next: () => {
          this.loaderService.hide();
          this.messageService.add({
            severity: 'success',
            summary: 'Sucesso',
            detail: 'Senha redefinida com sucesso!'
          });
          formGroup.reset();
          this.dialogChangeSenha.set(false);
        },
        error: () => {
          this.loaderService.hide();
          this.messageService.add({
            severity: 'error',
            summary: 'Atenção',
            detail: 'A senha atual está incorreta!'
          });
        }
      });
    } else {
      this.messageService.add({
        severity: 'info',
        summary: 'Atenção',
        detail: 'Necessário preencher todos os campos corretamente!'
      });
      this.markFormAsTouched(formGroup);
    }
  }

  /**
   * Get error message for change password form
   */
  getChangeSenhaError(controlName: string): string {
    const formGroup = this.changeSenhaForm();
    if (!formGroup) return '';

    const control = formGroup.get(controlName);
    if (!control?.errors || !control?.touched) return '';

    if (control.errors['required']) return 'Este campo é obrigatório';
    if (control.errors['minlength']) {
      return `Mínimo de ${control.errors['minlength'].requiredLength} caracteres`;
    }

    return 'Campo inválido';
  }

  /**
   * Get password mismatch error
   */
  getPasswordMismatchError(): string {
    const formGroup = this.changeSenhaForm();
    if (formGroup?.errors?.['passwordMismatch'] && formGroup.get('confirmarNovaSenha')?.touched) {
      return 'As senhas não conferem';
    }
    return '';
  }

  /**
   * Override back to navigate to home instead of usuario list
   * Not all users have permission to see usuario list
   */
  override back(): void {
    // Check if user is editing their own profile
    const userLoggedStr = this.storageService.getItem('userLogged');
    const currentUser = userLoggedStr ? JSON.parse(userLoggedStr) : null;
    const editingUser = this.object();

    // If editing own profile, go to home; otherwise go to list
    if (currentUser && editingUser && currentUser.id === editingUser.id) {
      this.router.navigate(['/']);
    } else {
      this.router.navigate([this.urlList]);
    }
  }


  /**
   * Build the reactive form for user profile
   */
  protected override buildForm(): FormGroup {
    return this.fb.group({
      id: [{value: null, disabled: true}],
      nome: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(255)]],
      email: [{value: '', disabled: true}, [Validators.required, Validators.email]],
      telefone: ['', [Validators.required, Validators.minLength(8)]],
      documento: ['', [Validators.required, Validators.minLength(3)]],
      permissoes: [{value: [], disabled: true}, [Validators.required]]
    });
  }

  /**
   * Override to include disabled fields
   * Nota: username é preenchido automaticamente com o email para retrocompatibilidade com o backend
   */
  protected override prepareFormValue(formValue: Partial<Usuario>): Partial<Usuario> {
    const formGroup = this.form();
    if (!formGroup) return formValue;

    const id = formGroup.get('id')?.value;
    const nome = formGroup.get('nome')?.value;
    const email = formGroup.get('email')?.value;
    const permissoes = formGroup.get('permissoes')?.value;

    return {
      ...formValue,
      ...(id && {id}),
      ...(nome && {nome}),
      ...(email && {email}),
      username: email, // Retrocompatibilidade: username = email
      ...(permissoes && {permissoes})
    };
  }

  /**
   * Override to patch form with user object
   */
  protected override patchFormWithObject(object: Usuario): void {
    const formGroup = this.form();
    if (formGroup) {
      formGroup.patchValue({
        id: object.id,
        nome: object.nome,
        email: object.email,
        telefone: object.telefone,
        documento: object.documento,
        permissoes: object.permissoes || object.authorities || []
      });
    }
  }

  /**
   * Build the reactive form for password change
   */
  private buildChangeSenhaForm(): void {
    const changeSenhaFormGroup = this.fb.group({
      senhaAtual: ['', [Validators.required, Validators.minLength(6)]],
      novaSenha: ['', [Validators.required, Validators.minLength(6)]],
      confirmarNovaSenha: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator.bind(this)
    });

    this.changeSenhaForm.set(changeSenhaFormGroup);
  }

  /**
   * Custom validator for password confirmation
   */
  private passwordMatchValidator(formGroup: FormGroup) {
    const novaSenha = formGroup.get('novaSenha')?.value;
    const confirmarNovaSenha = formGroup.get('confirmarNovaSenha')?.value;
    return novaSenha === confirmarNovaSenha ? null : {passwordMismatch: true};
  }

  /**
   * Load available permissoes for dropdown
   */
  private loadPermissoes(): void {
    this.loadingPermissoes.set(true);

    this.service.findAllPermissao().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (permissoes) => {
        const items: SelectItem[] = permissoes.map(permissao => ({
          label: this.formatRole(permissao.nome),
          value: permissao
        }));
        this.grupoAcessoDropdown.set(items);
        this.loadingPermissoes.set(false);
      },
      error: (error) => {
        this.loadingPermissoes.set(false);
        this.logger.error('Error loading permissoes', error);
      }
    });
  }

  /**
   * Format role name for display
   */
  private formatRole(nome: string): string {
    const formatted = nome.replaceAll('ROLE_', '');
    return formatted.charAt(0).toUpperCase() + formatted.slice(1).toLowerCase();
  }
}
