import {ActivatedRoute, Router} from '@angular/router';
import {CrudService} from '../service/crud.service';
import {Directive, inject, Injector, OnDestroy, OnInit, signal} from '@angular/core';
import {FormGroup} from '@angular/forms';
import {MessageService} from 'primeng/api';
import {LoaderService} from '../loader/loader.service';
import {LoginService} from '../../login/login.service';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {LoggerService} from '../services/logger.service';
import {extractRouteParam, parseNumericId} from '../utils/route-params.operators';
import {FormValidationService} from '../services/form-validation.service';
import {FormStateManagerService} from '../services/form-state-manager.service';
import {FormBusinessRulesService} from '../services/form-business-rules.service';

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
  protected readonly formValidation: FormValidationService;
  protected readonly formStateManager: FormStateManagerService;
  protected readonly formBusinessRules: FormBusinessRulesService;

  // Signals for state management
  protected readonly isEditing = signal(false);
  protected readonly isAlunoOrProfessor = signal(false);
  protected readonly isLoading = signal(false);
  protected readonly object = signal<T | null>(null);

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
    this.formValidation = inject(FormValidationService);
    this.formStateManager = inject(FormStateManagerService);
    this.formBusinessRules = inject(FormBusinessRulesService);
  }

  protected abstract buildForm(): FormGroup;

  ngOnInit(): void {
    this.loginService
      .userLoggedIsAlunoOrProfessor()
      .then((value) => this.isAlunoOrProfessor.set(value));

    this.newInstance();
    this.form.set(this.buildForm());
    this.preOnInit();

    // Extração e validação de parâmetro ID com operator utilitário
    this.route.params.pipe(
      extractRouteParam({
        paramName: 'id',
        converter: parseNumericId,
        onError: (value) => {
          this.logger.warn(`Invalid ID parameter: ${value}`);
          this.initializeValues();
        }
      })
    ).subscribe({
      next: (id) => {
        if (id === null) {
          this.initializeValues();
        } else {
          this.edit(id as ID);
        }
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
            this.messageService.add({
              severity: 'success',
              summary: 'Sucesso!',
              detail: 'Registro salvo com sucesso!',
              life: 3000
            });
            this.back();
          });
        },
        error: (error) => {
          this.loaderService.hide();
          this.isLoading.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Atenção!',
            detail: 'Ocorreu um erro ao salvar o registro!',
            life: 5000
          });
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
        this.messageService.add({
          severity: 'error',
          summary: 'Atenção!',
          detail: 'Ocorreu um erro ao buscar o registro!',
          life: 5000
        });
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
    return this.formValidation.getErrorMessage(control);
  }

  hasError(controlName: string): boolean {
    const formGroup = this.form();
    if (!formGroup) return false;

    const control = formGroup.get(controlName);
    return this.formValidation.hasError(control);
  }

  isValidField(controlName: string): boolean {
    const formGroup = this.form();
    if (!formGroup) return false;

    const control = formGroup.get(controlName);
    return this.formValidation.isValidField(control);
  }

  protected markFormAsTouched(formGroup: FormGroup): void {
    this.formValidation.markFormAsTouched(formGroup);
  }

  protected patchFormWithObject(object: T): void {
    const formGroup = this.form();
    this.formStateManager.patchFormWithObject(formGroup, object);
  }

  protected prepareFormValue(formValue: Partial<T>): Partial<T> {
    return this.formStateManager.prepareFormValue(formValue, false);
  }

  protected mergeWithObject(formValue: Partial<T>): T {
    const currentObject = this.object();
    return this.formStateManager.mergeWithObject(formValue, currentObject);
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
    const formGroup = this.form();
    this.formBusinessRules.setCurrentUserAsResponsible(formGroup, fieldName)
    .pipe(takeUntil(this.destroy$))
    .subscribe();
  }

  /**
   * Calculate total quantity from an array of items
   * @param items Array of items with qtde property
   */
  protected calculateTotalQuantity<K extends { qtde: number }>(items: K[]): number {
    return this.formBusinessRules.calculateTotalQuantity(items);
  }

  /**
   * Validate if item quantity doesn't exceed available saldo
   * @param item Item with saldo property
   * @param qtdeInserir Quantity to insert
   */
  protected validateItemSaldo<K extends { saldo: number,disponivelParaEmprestimo:number }>(
    item: K | null,
    qtdeInserir: number
  ): boolean {
    return this.formBusinessRules.validateItemSaldo(item, qtdeInserir);
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
    return this.formBusinessRules.removeItemById(items, itemId, idField);
  }

  /**
   * Show info message for missing item or quantity
   */
  protected showItemRequiredMessage(): void {
    this.formBusinessRules.showItemRequiredMessage();
  }

  /**
   * Show info message for missing items in list
   */
  protected showMinimumItemsMessage(customMessage?: string): void {
    this.formBusinessRules.showMinimumItemsMessage(customMessage);
  }

  /**
   * Set today's date as default value for a date field
   * Formats date as dd/MM/yyyy string (Brazilian format)
   * @param fieldName Name of the form field to set
   */
  protected setTodayAsDefaultDate(fieldName: string): void {
    const formGroup = this.form();
    this.formBusinessRules.setTodayAsDefaultDate(formGroup, fieldName);
  }
}
