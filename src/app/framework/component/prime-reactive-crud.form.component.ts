import {ActivatedRoute, Router} from '@angular/router';
import {CrudService} from '../service/crud.service';
import {
  ChangeDetectorRef,
  DestroyRef,
  Directive,
  inject,
  Injector,
  OnDestroy,
  OnInit,
  signal,
  WritableSignal
} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {FormGroup} from '@angular/forms';
import {MessageService} from 'primeng/api';
import {LoaderService} from '../loader/loader.service';
import {LoginService} from '../../login/login.service';
import {Observable, of, Subject} from 'rxjs';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  filter,
  finalize,
  map,
  switchMap,
  takeUntil
} from 'rxjs/operators';
import {HttpErrorResponse} from '@angular/common/http';
import {LoggerService} from '../service/logger.service';
import {extractRouteParam, parseNumericId} from '../utils/route-params.operators';
import {FormValidationService} from '../service/form-validation.service';
import {FormStateManagerService} from '../service/form-state-manager.service';
import {FormBusinessRulesService} from '../service/form-business-rules.service';
import {ErrorHandlerService} from '../service/error-handler.service';

@Directive()
export abstract class PrimeReactiveCrudFormComponent<T, ID> implements OnInit, OnDestroy {
  // Abstract properties to be defined in child classes
  protected abstract service: CrudService<T, ID>;
  protected abstract urlList: string;
  protected abstract type?: new () => T;

  // Injected service
  protected readonly router: Router;
  protected readonly messageService: MessageService;
  protected readonly route: ActivatedRoute;
  protected readonly loaderService: LoaderService;
  protected readonly loginService: LoginService;
  protected readonly logger: LoggerService;
  protected readonly injector: Injector;
  protected readonly cdr: ChangeDetectorRef;
  protected readonly formValidation: FormValidationService;
  protected readonly formStateManager: FormStateManagerService;
  protected readonly formBusinessRules: FormBusinessRulesService;
  protected readonly errorHandler: ErrorHandlerService;
  /** Tempo de debounce padrão para autocomplete (ms) */
  protected static readonly DEFAULT_DEBOUNCE_MS = 300;
  /** Quantidade mínima de caracteres para busca no autocomplete */
  protected static readonly DEFAULT_MIN_SEARCH_LENGTH = 2;
  /** Regex para validação de caracteres permitidos em busca (inclui acentos pt-BR) */
  protected static readonly ALLOWED_SEARCH_CHARS = /^[a-zA-Z0-9\s\-_.@áàâãéèêíìîóòôõúùûçÁÀÂÃÉÈÊÍÌÎÓÒÔÕÚÙÛÇ]+$/;
  protected readonly destroyRef: DestroyRef;

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
    this.cdr = inject(ChangeDetectorRef);
    this.formValidation = inject(FormValidationService);
    this.formStateManager = inject(FormStateManagerService);
    this.formBusinessRules = inject(FormBusinessRulesService);
    this.errorHandler = inject(ErrorHandlerService);
    this.destroyRef = inject(DestroyRef);
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

          // Usa o ErrorHandlerService para processar o erro RFC 9457
          const result = this.errorHandler.handleHttpError(error, false);

          // Se houver erros de validacao por campo, aplica ao formulario
          if (result.fieldErrors && formGroup) {
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

        // Usa o ErrorHandlerService para processar o erro RFC 9457
        const result = this.errorHandler.handleHttpError(error, false);
        this.messageService.add({
          severity: 'error',
          summary: result.title || 'Atencao!',
          detail: result.message || 'Ocorreu um erro ao buscar o registro!',
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
  protected validateItemSaldo<K extends { saldo: number,disponivelEmprestimoCalculado:number }>(
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

  /**
   * Configura debounce para busca de autocomplete.
   * Centraliza a lógica comum de debounce, distinctUntilChanged, switchMap e tratamento de erro.
   *
   * Inclui:
   * - Sanitização de input (trim + validação de caracteres)
   * - Tratamento de erros HTTP específicos (401, 403, 404, network)
   * - Gerenciamento seguro do loadingSignal com finalize
   *
   * @param searchSubject Subject que recebe as queries de busca
   * @param searchFn Função que executa a busca no serviço
   * @param resultSignal Signal para armazenar os resultados
   * @param errorMessage Mensagem de erro para o logger
   * @param options Opções adicionais (minLength, debounceMs, loadingSignal, emptyValue)
   *
   * @example
   * ```typescript
   * // No constructor do componente:
   * this.setupAutocompleteDebounce(
   *   this.itemSearchSubject,
   *   (query) => this.itemService.completeItem(query, true), // true = apenas disponíveis
   *   this.itemList,
   *   'Erro ao buscar itens',
   *   { loadingSignal: this.itemLoading }
   * );
   * ```
   */
  protected setupAutocompleteDebounce<R>(
    searchSubject: Subject<string>,
    searchFn: (query: string) => Observable<R>,
    resultSignal: WritableSignal<R>,
    errorMessage: string,
    options?: {
      /** Quantidade mínima de caracteres para busca (padrão: 2) */
      minLength?: number;
      /** Tempo de debounce em ms (padrão: 300) */
      debounceMs?: number;
      /** Signal de loading para indicar carregamento */
      loadingSignal?: WritableSignal<boolean>;
      /** Valor a ser usado em caso de erro (padrão: [] vazio) */
      emptyValue?: R;
    }
  ): void {
    const minLength = options?.minLength ?? PrimeReactiveCrudFormComponent.DEFAULT_MIN_SEARCH_LENGTH;
    const debounceMs = options?.debounceMs ?? PrimeReactiveCrudFormComponent.DEFAULT_DEBOUNCE_MS;
    const loadingSignal = options?.loadingSignal;

    searchSubject.pipe(
      debounceTime(debounceMs),
      // Sanitização: trim e filtragem de caracteres inválidos
      map(query => query.trim()),
      distinctUntilChanged(),
      filter(query => query.length >= minLength),
      // Validação de segurança: apenas caracteres permitidos
      filter(query => PrimeReactiveCrudFormComponent.ALLOWED_SEARCH_CHARS.test(query)),
      switchMap(query => {
        loadingSignal?.set(true);
        return searchFn(query).pipe(
          catchError((error: HttpErrorResponse | Error) => {
            this.logger.error(errorMessage, error);

            // Determina mensagem específica baseada no tipo/status do erro
            const detail = this.getErrorDetail(error, errorMessage);
            this.messageService.add({
              severity: 'error',
              summary: 'Erro',
              detail,
              life: 5000
            });

            // Retorna o emptyValue se fornecido, senão usa array vazio
            return of(options?.emptyValue ?? ([] as unknown as R));
          }),
          // Garante que loadingSignal seja resetado mesmo em caso de erro
          finalize(() => loadingSignal?.set(false))
        );
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (result) => {
        resultSignal.set(result);
      }
    });
  }

  /**
   * Handler genérico para evento de autocomplete.
   * Verifica tamanho mínimo da query e emite para o Subject.
   * A sanitização completa (trim + regex) é feita no setupAutocompleteDebounce.
   *
   * @param query Query digitada pelo usuário
   * @param searchSubject Subject para emitir a query
   * @param resultSignal Signal para limpar se query muito curta
   * @param emptyValue Valor vazio para limpar o signal
   * @param minLength Tamanho mínimo da query (padrão: 2)
   *
   * @example
   * ```typescript
   * findProdutos(event: AutoCompleteCompleteEvent): void {
   *   this.handleAutocompleteQuery(event.query, this.itemSearchSubject, this.itemList, []);
   * }
   * ```
   */
  protected handleAutocompleteQuery<R>(
    query: string,
    searchSubject: Subject<string>,
    resultSignal: WritableSignal<R>,
    emptyValue: R,
    minLength = PrimeReactiveCrudFormComponent.DEFAULT_MIN_SEARCH_LENGTH
  ): void {
    // Sanitização básica - trim será reaplicado no pipe
    const sanitizedQuery = query.trim();

    if (sanitizedQuery.length < minLength) {
      resultSignal.set(emptyValue);
      return;
    }
    searchSubject.next(sanitizedQuery);
  }

  /**
   * Retorna mensagem de erro específica baseada no status HTTP.
   * @param error Erro capturado (HttpErrorResponse ou Error genérico)
   * @param defaultMessage Mensagem padrão para erros desconhecidos
   */
  private getErrorDetail(error: HttpErrorResponse | Error, defaultMessage: string): string {
    if (error instanceof HttpErrorResponse) {
      switch (error.status) {
        case 0:
          return 'Sem conexão com o servidor. Verifique sua internet.';
        case 401:
          return 'Sessão expirada. Faça login novamente.';
        case 403:
          return 'Sem permissão para acessar esses dados.';
        case 404:
          return 'Recurso não encontrado.';
        case 500:
        case 502:
        case 503:
          return 'Erro no servidor. Tente novamente em alguns instantes.';
        default:
          return `${defaultMessage}. Tente novamente.`;
      }
    }
    return `${defaultMessage}. Tente novamente.`;
  }
}
