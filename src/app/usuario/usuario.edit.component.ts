import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnDestroy,
  signal
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {Subscription} from 'rxjs';
import {Usuario} from './usuario';
import {UsuarioService} from './usuario.service';
import {
  PrimeReactiveCrudFormComponent
} from '../framework/component/prime-reactive-crud.form.component';
import {Permissao} from './permissao';
import Swal from 'sweetalert2';

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

@Component({
  selector: 'app-edit-usuario',
  templateUrl: './usuario.edit.component.html',
  styleUrls: ['./usuario.edit.component.css'],
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
export class UsuarioEditComponent extends PrimeReactiveCrudFormComponent<Usuario, number> implements OnDestroy {
  protected override service = inject(UsuarioService);
  protected override urlList = '/usuario';
  protected override type = Usuario;
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
  private permissoesSubscription?: Subscription;
  private changeSenhaSubscription?: Subscription;

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
          // Update localStorage with new user data
          localStorage.setItem('userLogged', JSON.stringify(savedObject));
          this.loaderService.hide();
          this.isLoading.set(false);
          Swal.fire('Sucesso!', 'Dados atualizados com sucesso!', 'success');
          this.back();
        },
        error: (error) => {
          this.loaderService.hide();
          this.isLoading.set(false);
          Swal.fire('Atenção!', 'Ocorreu um erro ao salvar o registro!', 'error');
          console.error(error);
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

      this.changeSenhaSubscription = this.service.changeSenha(usuarioToUpdate, senhaAtual).subscribe({
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
    const currentUser = JSON.parse(localStorage.getItem('userLogged') || 'null');
    const editingUser = this.object();

    // If editing own profile, go to home; otherwise go to list
    if (currentUser && editingUser && currentUser.id === editingUser.id) {
      this.router.navigate(['/']);
    } else {
      this.router.navigate([this.urlList]);
    }
  }

  /**
   * Cleanup on component destroy
   */
  ngOnDestroy(): void {
    this.cancelPermissoesRequest();
    this.cancelChangeSenhaRequest();
  }

  /**
   * Build the reactive form for user profile
   */
  protected override buildForm(): FormGroup {
    return this.fb.group({
      id: [{value: null, disabled: true}],
      nome: [{value: '', disabled: true}, [Validators.required, Validators.minLength(3)]],
      email: [{value: '', disabled: true}, [Validators.required, Validators.email]],
      username: [{value: '', disabled: true}, [Validators.required]],
      telefone: ['', [Validators.required, Validators.minLength(8)]],
      documento: ['', [Validators.required, Validators.minLength(3)]],
      permissoes: [{value: [], disabled: true}, [Validators.required]]
    });
  }

  /**
   * Override to include disabled fields
   */
  protected override prepareFormValue(formValue: Partial<Usuario>): Partial<Usuario> {
    const formGroup = this.form();
    if (!formGroup) return formValue;

    const id = formGroup.get('id')?.value;
    const nome = formGroup.get('nome')?.value;
    const email = formGroup.get('email')?.value;
    const username = formGroup.get('username')?.value;
    const permissoes = formGroup.get('permissoes')?.value;

    return {
      ...formValue,
      ...(id && {id}),
      ...(nome && {nome}),
      ...(email && {email}),
      ...(username && {username}),
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
        username: object.username,
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
    this.cancelPermissoesRequest();

    this.loadingPermissoes.set(true);

    this.permissoesSubscription = this.service.findAllPermissao().subscribe({
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
        console.error('Error loading permissoes', error);
      }
    });
  }

  /**
   * Format role name for display
   */
  private formatRole(nome: string): string {
    let formatted = nome.replaceAll('ROLE_', '');
    return formatted.charAt(0).toUpperCase() + formatted.slice(1).toLowerCase();
  }

  /**
   * Cancel ongoing permissoes request
   */
  private cancelPermissoesRequest(): void {
    if (this.permissoesSubscription && !this.permissoesSubscription.closed) {
      this.permissoesSubscription.unsubscribe();
      this.loadingPermissoes.set(false);
    }
  }

  /**
   * Cancel ongoing change senha request
   */
  private cancelChangeSenhaRequest(): void {
    if (this.changeSenhaSubscription && !this.changeSenhaSubscription.closed) {
      this.changeSenhaSubscription.unsubscribe();
    }
  }
}
