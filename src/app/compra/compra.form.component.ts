import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnDestroy,
  signal
} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {of, Subject} from 'rxjs';
import {catchError, debounceTime, distinctUntilChanged, filter, switchMap} from 'rxjs/operators';

import {Compra} from './compra';
import {CompraService} from './compra.service';
import {
  PrimeReactiveCrudFormComponent
} from '../framework/component/prime-reactive-crud.form.component';
import {Fornecedor} from '../fornecedor/fornecedor';
import {FornecedorService} from '../fornecedor/fornecedor.service';
import {ItemService} from '../item/item.service';
import {Item} from '../item/item';
import {CompraItem} from './compraItem';

// PrimeNG
import {CardModule} from 'primeng/card';
import {InputTextModule} from 'primeng/inputtext';
import {AutoCompleteCompleteEvent, AutoCompleteModule} from 'primeng/autocomplete';
import {DatePickerModule} from 'primeng/datepicker';
import {ButtonModule} from 'primeng/button';
import {TableModule} from 'primeng/table';
import {TooltipModule} from 'primeng/tooltip';

// Custom components
import {FormFieldComponent} from '../framework/component/form-field.component';
import {VoltarComponent} from '../geral/voltar/voltar.component';
import {CancelarComponent} from '../geral/cancelar/cancelar.component';
import {SalvarComponent} from '../geral/salvar/salvar.component';
import {CadastroRapidoComponent} from '../geral/cadastroRapido/cadastroRapido.component';

@Component({
  selector: 'app-form-compra',
  templateUrl: './compra.form.component.html',
  styleUrls: ['./compra.form.component.css'],
  imports: [
    CadastroRapidoComponent,
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    // PrimeNG
    CardModule,
    InputTextModule,
    AutoCompleteModule,
    DatePickerModule,
    ButtonModule,
    TableModule,
    TooltipModule,
    // Custom
    FormFieldComponent,
    VoltarComponent,
    CancelarComponent,
    SalvarComponent,

  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CompraFormComponent extends PrimeReactiveCrudFormComponent<Compra, number> implements OnDestroy {
  protected override service = inject(CompraService);
  protected override urlList = '/compra';
  protected override type = Compra;
  private readonly fb = inject(FormBuilder);
  private readonly fornecedorService = inject(FornecedorService);
  private readonly itemService = inject(ItemService);
  /** Tempo de debounce para busca (ms) */
  private static readonly SEARCH_DEBOUNCE_MS = 300;
  /** Quantidade mínima de caracteres para busca */
  private static readonly MIN_SEARCH_LENGTH = 2;
  private readonly destroyRef = inject(DestroyRef);
  /** Subject para debounce da busca de fornecedores */
  private readonly fornecedorSearchSubject = new Subject<string>();
  /** Subject para debounce da busca de itens */
  private readonly itemSearchSubject = new Subject<string>();

  // Signals for state management
  protected readonly fornecedorList = signal<Fornecedor[]>([]);
  protected readonly itemList = signal<Item[]>([]);
  protected readonly compraItems = signal<CompraItem[]>([]);
  protected readonly maxDate = signal<Date>(new Date());

  // Temporary signals for adding items (not part of main form)
  protected tempItem = signal<Item | null>(null);
  protected tempQtde = signal<number>(1);
  protected tempValor = signal<number>(0);

  // Computed signals
  protected readonly totalCompra = computed(() => {
    const items = this.compraItems();
    return items.length > 0
      ? items.map(t => t.valor).reduce((acc, value) => acc + value, 0)
      : 0;
  });

  protected readonly qtdeTotal = computed(() =>
    this.calculateTotalQuantity(this.compraItems())
  );

  protected readonly hasItems = computed(() => this.compraItems().length > 0);

  constructor() {
    super();

    // Configura debounce para busca de fornecedores
    this.fornecedorSearchSubject.pipe(
      debounceTime(CompraFormComponent.SEARCH_DEBOUNCE_MS),
      distinctUntilChanged(),
      filter(query => query.length >= CompraFormComponent.MIN_SEARCH_LENGTH),
      switchMap(query => this.fornecedorService.complete(query).pipe(
        catchError(err => {
          this.logger.error('Erro ao buscar fornecedores:', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail: 'Não foi possível buscar fornecedores. Tente novamente.'
          });
          return of([]);
        })
      )),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(fornecedores => this.fornecedorList.set(fornecedores));

    // Configura debounce para busca de itens
    this.itemSearchSubject.pipe(
      debounceTime(CompraFormComponent.SEARCH_DEBOUNCE_MS),
      distinctUntilChanged(),
      filter(query => query.length >= CompraFormComponent.MIN_SEARCH_LENGTH),
      switchMap(query => this.itemService.completeItem(query, false).pipe(
        catchError(err => {
          this.logger.error('Erro ao buscar itens:', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail: 'Não foi possível buscar itens. Tente novamente.'
          });
          return of([]);
        })
      )),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(items => this.itemList.set(items));
  }

  ngOnDestroy(): void {
    this.fornecedorSearchSubject.complete();
    this.itemSearchSubject.complete();
  }

  /**
   * Build the reactive form with validators
   */
  protected override buildForm(): FormGroup {
    return this.fb.group({
      id: [{value: null, disabled: true}],
      fornecedor: [null, Validators.required],
      usuario: [{value: null, disabled: true}],
      dataCompra: ['', Validators.required]
    });
  }

  /**
   * Initialize form values
   */
  protected override initializeValues(): void {
    this.setTodayAsDefaultDate('dataCompra');
    this.setCurrentUserAsResponsible('usuario');
  }

  /**
   * Busca fornecedores para autocomplete com debounce.
   * O debounce evita chamadas excessivas à API durante a digitação.
   */
  findFornecedores(event: AutoCompleteCompleteEvent): void {
    const query = event.query;
    if (query.length < CompraFormComponent.MIN_SEARCH_LENGTH) {
      this.fornecedorList.set([]);
      return;
    }
    this.fornecedorSearchSubject.next(query);
  }

  /**
   * Busca itens para autocomplete com debounce.
   * O debounce evita chamadas excessivas à API durante a digitação.
   */
  findProdutos(event: AutoCompleteCompleteEvent): void {
    const query = event.query;
    if (query.length < CompraFormComponent.MIN_SEARCH_LENGTH) {
      this.itemList.set([]);
      return;
    }
    this.itemSearchSubject.next(query);
  }

  /**
   * Set price when item is selected
   */
  setPrecoProduto(): void {
    const item = this.tempItem();
    if (item) {
      this.tempValor.set(item.valor);
      this.tempQtde.set(1);
    }
  }

  /**
   * Insert item into the list
   */
  insertItem(): void {
    const item = this.tempItem();
    const qtde = this.tempQtde();

    if (!item || !qtde || typeof item !== 'object') {
      this.showItemRequiredMessage();
      return;
    }

    const currentItems = [...this.compraItems()];
    const existingIndex = currentItems.findIndex(ci => ci.item.id === item.id);

    if (existingIndex >= 0) {
      currentItems[existingIndex].qtde = Number(currentItems[existingIndex].qtde) + Number(qtde);
    } else {
      const newCompraItem = new CompraItem();
      newCompraItem.item = item;
      newCompraItem.qtde = qtde;
      newCompraItem.valor = this.tempValor();
      currentItems.push(newCompraItem);
    }

    this.compraItems.set(currentItems);

    // Reset temp values
    this.tempItem.set(null);
    this.tempQtde.set(1);
    this.tempValor.set(0);
  }

  /**
   * Remove item from the list
   */
  removeItem(id: number): void {
    const updatedItems = this.removeItemById(this.compraItems(), id, 'item.id');
    this.compraItems.set(updatedItems);
  }

  /**
   * Override save to validate items
   */
  override save(): void {
    const formGroup = this.form();
    const items = this.compraItems();
    const fornecedor = formGroup?.get('fornecedor')?.value;

    if (!items || items.length === 0 || typeof fornecedor !== 'object') {
      this.validExtra = false;
      this.showMinimumItemsMessage('Necessário informar o fornecedor e adicionar ao menos um item!');
      return;
    }

    this.validExtra = true;
    super.save();
  }

  /**
   * Patch form with object data
   */
  protected override patchFormWithObject(object: Compra): void {
    const formGroup = this.form();
    if (formGroup) {
      formGroup.patchValue({
        id: object.id,
        fornecedor: object.fornecedor,
        usuario: object.usuario,
        dataCompra: object.dataCompra
      });
    }

    // Set items
    if (object.compraItem) {
      this.compraItems.set([...object.compraItem]);
    }
  }

  /**
   * Prepare form value before saving
   */
  protected override prepareFormValue(formValue: Partial<Compra>): Partial<Compra> {
    const formGroup = this.form();
    const id = formGroup?.get('id')?.value;
    const usuario = formGroup?.get('usuario')?.value;

    return {
      ...formValue,
      ...(id && {id}),
      usuario: usuario,
      compraItem: this.compraItems()
    };
  }
}
