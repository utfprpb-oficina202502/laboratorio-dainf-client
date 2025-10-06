import {ActivatedRoute, Router} from '@angular/router';
import {CrudService} from '../service/crud.service';
import {computed, Directive, inject, Injector, OnDestroy, OnInit, signal} from '@angular/core';
import {FormGroup} from '@angular/forms';
import {MessageService} from 'primeng/api';
import Swal from 'sweetalert2';
import {LoaderService} from '../loader/loader.service';
import {LoginService} from '../../login/login.service';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {LoggerService} from '../services/logger.service';

@Directive()
export abstract class PrimeReactiveCrudFormComponent<T, ID> implements OnInit, OnDestroy {
  // Abstract properties to be defined in child classes
  protected abstract service: CrudService<T, ID>;
  protected abstract urlList: string;
  protected abstract type?: new () => T;

  // Injected services
  protected readonly router: Router;
  protected readonly messageService: MessageService;
  protected readonly route: ActivatedRoute;
  protected readonly loaderService: LoaderService;
  protected readonly loginService: LoginService;
  protected readonly logger: LoggerService;
  protected readonly injector: Injector;

  // Signals for state management
  protected readonly isEditing = signal(false);
  protected readonly isAlunoOrProfessor = signal(false);
  protected readonly isLoading = signal(false);
  protected readonly object = signal<T | null>(null);

  protected readonly isFormValid = computed(() => this.form()?.valid ?? false);
  protected readonly isFormDirty = computed(() => this.form()?.dirty ?? false);
  protected readonly isFormTouched = computed(() => this.form()?.touched ?? false);

  protected readonly form = signal<FormGroup | null>(null);
  protected validExtra = true;

  // Memory leak prevention
  protected readonly destroy$ = new Subject<void>();

  protected constructor() {
    this.injector = inject(Injector);
    this.router = inject(Router);
    this.route = inject(ActivatedRoute);
    this.messageService = inject(MessageService);
    this.loaderService = inject(LoaderService);
    this.loginService = inject(LoginService);
    this.logger = inject(LoggerService);
  }

  protected abstract buildForm(): FormGroup;

  ngOnInit(): void {
    this.loginService
      .userLoggedIsAlunoOrProfessor()
      .then((value) => this.isAlunoOrProfessor.set(value));

    this.newInstance();
    this.form.set(this.buildForm());
    this.preOnInit();

    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      if (params.id) {
        if (Number.isNaN(params.id)) {
          this.initializeValues();
        } else {
          this.edit(params.id);
        }
      } else {
        this.initializeValues();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  save(): void {
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

      this.service.save(objectToSave).pipe(takeUntil(this.destroy$)).subscribe({
        next: (savedObject) => {
          this.object.set(savedObject);
          this.postSave(() => {
            this.loaderService.hide();
            this.isLoading.set(false);
            Swal.fire('Sucesso!', 'Registro salvo com sucesso!', 'success');
            this.back();
          });
        },
        error: (error) => {
          this.loaderService.hide();
          this.isLoading.set(false);
          Swal.fire('Atenção!', 'Ocorreu um erro ao salvar o registro!', 'error');
          this.logger.error('Error saving record', error);
        },
      });
    } else {
      this.loaderService.hide();
      this.isLoading.set(false);
      this.messageService.add({
        severity: 'info',
        summary: 'Atenção',
        detail: 'Necessário preencher todos os campos corretamente!',
      });
      this.markFormAsTouched(formGroup);
    }
  }

  edit(id: ID): void {
    this.loaderService.show();
    this.isLoading.set(true);

    this.service.findOne(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (object) => {
        this.object.set(object);
        this.isEditing.set(true);
        this.patchFormWithObject(object);
        this.postEdit();
        this.loaderService.hide();
        this.isLoading.set(false);
      },
      error: (error) => {
        this.loaderService.hide();
        this.isLoading.set(false);
        Swal.fire('Atenção!', 'Ocorreu um erro ao buscar o registro!', 'error');
        this.logger.error('Error fetching record', error);
      },
    });
  }

  back(): void {
    this.router.navigate([this.urlList]);
  }

  getErrorMessage(controlName: string): string {
    const formGroup = this.form();
    if (!formGroup) return '';

    const control = formGroup.get(controlName);
    if (!control?.errors || !control?.touched) return '';

    const errors = control.errors;

    if (errors['required']) return 'Este campo é obrigatório';
    if (errors['minlength'])
      return `Mínimo de ${errors['minlength'].requiredLength} caracteres`;
    if (errors['maxlength'])
      return `Máximo de ${errors['maxlength'].requiredLength} caracteres`;
    if (errors['email']) return 'E-mail inválido';
    if (errors['pattern']) return 'Formato inválido';
    if (errors['min']) return `Valor mínimo: ${errors['min'].min}`;
    if (errors['max']) return `Valor máximo: ${errors['max'].max}`;

    return 'Campo inválido';
  }

  hasError(controlName: string): boolean {
    const formGroup = this.form();
    if (!formGroup) return false;

    const control = formGroup.get(controlName);
    return !!(control && control.invalid && control.touched);
  }

  isValidField(controlName: string): boolean {
    const formGroup = this.form();
    if (!formGroup) return false;

    const control = formGroup.get(controlName);
    return !!(control && control.valid && control.touched);
  }

  protected markFormAsTouched(formGroup: FormGroup): void {
    for (const key of Object.keys(formGroup.controls)) {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormAsTouched(control);
      }
    }
  }

  protected patchFormWithObject(object: T): void {
    const formGroup = this.form();
    if (formGroup) {
      formGroup.patchValue(object as Partial<T>);
    }
  }

  protected prepareFormValue(formValue: Partial<T>): Partial<T> {
    return formValue;
  }

  protected mergeWithObject(formValue: Partial<T>): T {
    const currentObject = this.object();
    return { ...currentObject, ...formValue } as T;
  }

  protected newInstance(): void {
    if (this.type) {
      this.object.set(new this.type());
    } else {
      this.object.set({} as T);
    }
  }

  protected initializeValues(): void {
    // lógica antes de inicializar
  }

  protected preOnInit(): void {
    // lógica antes de inicializar o componente
  }

  protected postEdit(): void {
    // lógica após edit
  }

  protected postSave(callback: () => void): void {
    callback();
  }

  /**
   * Set current user as responsible user in the form
   * Common pattern used across multiple forms
   */
  protected setCurrentUserAsResponsible(fieldName = 'usuario'): void {
    this.loginService.getCurrentUser().pipe(takeUntil(this.destroy$)).subscribe((user) => {
      const formGroup = this.form();
      if (formGroup) {
        formGroup.patchValue({ [fieldName]: user });
      }
    });
  }

  /**
   * Calculate total quantity from an array of items
   * @param items Array of items with qtde property
   */
  protected calculateTotalQuantity<K extends { qtde: number }>(items: K[]): number {
    return items.length > 0
      ? items.map(t => t.qtde).reduce((acc, value) => Number(acc) + Number(value), 0)
      : 0;
  }

  /**
   * Validate if item quantity doesn't exceed available saldo
   * @param item Item with saldo property
   * @param qtdeInserir Quantity to insert
   */
  protected validateItemSaldo<K extends { saldo: number }>(
    item: K | null,
    qtdeInserir: number
  ): boolean {
    if (!item) return false;

    const isValid = item.saldo > 0 && qtdeInserir <= item.saldo;
    if (!isValid) {
      this.messageService.add({
        severity: 'info',
        detail: 'A quantidade informada é maior do que o saldo atual do item.'
      });
      return false;
    }
    return true;
  }

  /**
   * Remove item from array by id
   * @param items Current items array
   * @param itemId ID of item to remove
   * @param idField Field name to compare (default: 'id')
   */
  protected removeItemById<K>(
    items: K[],
    itemId: unknown,
    idField = 'id'
  ): K[] {
    return items.filter((item: K) => {
      const itemRecord = item as Record<string, unknown>;
      const nestedId = idField.includes('.')
        ? idField.split('.').reduce((obj: Record<string, unknown>, key: string) => (obj?.[key] as Record<string, unknown>) || {}, itemRecord)
        : itemRecord[idField];
      return nestedId !== itemId;
    });
  }

  /**
   * Show info message for missing item or quantity
   */
  protected showItemRequiredMessage(): void {
    this.messageService.add({
      severity: 'info',
      detail: 'Necessário informar o item e a quantidade.'
    });
  }

  /**
   * Show info message for missing items in list
   */
  protected showMinimumItemsMessage(customMessage?: string): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Atenção',
      detail: customMessage || 'Necessário adicionar ao menos um item!'
    });
  }

  /**
   * Set today's date as default value for a date field
   * Formats date as dd/MM/yyyy string (Brazilian format)
   * @param fieldName Name of the form field to set
   */
  protected setTodayAsDefaultDate(fieldName: string): void {
    const formGroup = this.form();
    if (formGroup) {
      const hoje = new Date();
      const dia = String(hoje.getDate()).padStart(2, '0');
      const mes = String(hoje.getMonth() + 1).padStart(2, '0');
      const ano = hoje.getFullYear();
      formGroup.patchValue({
        [fieldName]: `${dia}/${mes}/${ano}`
      });
    }
  }
}
