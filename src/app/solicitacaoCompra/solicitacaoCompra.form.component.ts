import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnDestroy,
  signal
} from '@angular/core';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {Subject} from 'rxjs';

import {SolicitacaoCompra} from './solicitacaoCompra';
import {SolicitacaoCompraService} from './solicitacaoCompra.service';
import {
  PrimeReactiveCrudFormComponent
} from '../framework/component/prime-reactive-crud.form.component';
import {Item} from '../item/item';
import {ItemService} from '../item/item.service';
import {SolicitacaoCompraItem} from './solicitacaoCompraItem';
import {BreakpointService} from '../framework/service/breakpoint.service';

// PrimeNG
import {CardModule} from 'primeng/card';
import {InputTextModule} from 'primeng/inputtext';
import {AutoCompleteCompleteEvent, AutoCompleteModule} from 'primeng/autocomplete';
import {DatePickerModule} from 'primeng/datepicker';
import {ButtonModule} from 'primeng/button';
import {TableModule} from 'primeng/table';
import {TooltipModule} from 'primeng/tooltip';
import {TextareaModule} from 'primeng/textarea';

// Custom components
import {FormFieldComponent} from '../framework/component/form-field.component';
import {VoltarComponent} from '../geral/voltar/voltar.component';
import {CancelarComponent} from '../geral/cancelar/cancelar.component';
import {SalvarComponent} from '../geral/salvar/salvar.component';
import {CadastroRapidoComponent} from '../geral/cadastroRapido/cadastroRapido.component';

@Component({
  selector: 'app-form-solicitacao-compra',
  templateUrl: './solicitacaoCompra.form.component.html',
  styleUrls: ['./solicitacaoCompra.form.component.css'],
  imports: [
    CadastroRapidoComponent,
    ReactiveFormsModule,
    FormsModule,
    CardModule,
    InputTextModule,
    AutoCompleteModule,
    DatePickerModule,
    ButtonModule,
    TableModule,
    TooltipModule,
    TextareaModule,
    FormFieldComponent,
    VoltarComponent,
    CancelarComponent,
    SalvarComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SolicitacaoCompraFormComponent extends PrimeReactiveCrudFormComponent<SolicitacaoCompra, number> implements OnDestroy {
  protected override service = inject(SolicitacaoCompraService);
  protected override urlList = '/solicitacao-compra';
  protected override type = SolicitacaoCompra;
  private readonly fb = inject(FormBuilder);
  private readonly itemService = inject(ItemService);
  protected readonly breakpointService = inject(BreakpointService);
  /** Subject para debounce da busca de itens */
  private readonly itemSearchSubject = new Subject<string>();

  // Signals for state management
  protected readonly itemList = signal<Item[]>([]);
  protected readonly solicitacaoItems = signal<SolicitacaoCompraItem[]>([]);

  // Temporary signals for adding items (not part of main form)
  protected readonly tempItem = signal<Item | null>(null);
  protected readonly tempQtde = signal<number>(1);

  // Computed signals
  protected readonly qtdeTotal = computed(() =>
    this.calculateTotalQuantity(this.solicitacaoItems())
  );

  protected readonly hasItems = computed(() => this.solicitacaoItems().length > 0);

  constructor() {
    super();

    // Configura debounce para busca de itens usando método da classe base
    this.setupAutocompleteDebounce(
      this.itemSearchSubject,
      (query) => this.itemService.completeItem(query, false),
      this.itemList,
      'Erro ao buscar itens'
    );
  }

  ngOnDestroy(): void {
    this.itemSearchSubject.complete();
  }

  /**
   * Build the reactive form with validators
   */
  protected override buildForm(): FormGroup {
    return this.fb.group({
      id: [{value: null, disabled: true}],
      descricao: ['', Validators.required],
      usuario: [{value: null, disabled: true}],
      dataSolicitacao: ['', Validators.required],
      observacao: ['']
    });
  }

  /**
   * Initialize form values
   */
  protected override initializeValues(): void {
    this.setTodayAsDefaultDate('dataSolicitacao');
    this.setCurrentUserAsResponsible('usuario');
  }

  /**
   * Busca itens para autocomplete com debounce.
   * O debounce evita chamadas excessivas à API durante a digitação.
   */
  findProdutos(event: AutoCompleteCompleteEvent): void {
    this.handleAutocompleteQuery(event.query, this.itemSearchSubject, this.itemList, []);
  }

  /**
   * Set default quantity when item is selected
   */
  setQtdeDefaultItem(): void {
    this.tempQtde.set(1);
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

    const currentItems = [...this.solicitacaoItems()];
    const existingIndex = currentItems.findIndex(si => si.item.id === item.id);

    if (existingIndex >= 0) {
      currentItems[existingIndex].qtde = Number(currentItems[existingIndex].qtde) + Number(qtde);
    } else {
      const newSolicitacaoItem = new SolicitacaoCompraItem();
      newSolicitacaoItem.item = item;
      newSolicitacaoItem.qtde = qtde;
      currentItems.push(newSolicitacaoItem);
    }

    this.solicitacaoItems.set(currentItems);

    // Reset temp values
    this.tempItem.set(null);
    this.tempQtde.set(1);
  }

  /**
   * Remove item from the list
   */
  removeItem(id: number): void {
    const updatedItems = this.removeItemById(this.solicitacaoItems(), id, 'item.id');
    this.solicitacaoItems.set(updatedItems);
  }

  /**
   * Override save to validate items
   */
  override save(): void {
    const items = this.solicitacaoItems();

    if (!items || items.length === 0) {
      this.validExtra = false;
      this.showMinimumItemsMessage();
      return;
    }

    this.validExtra = true;
    super.save();
  }

  /**
   * Patch form with object data
   */
  protected override patchFormWithObject(object: SolicitacaoCompra): void {
    const formGroup = this.form();
    if (formGroup) {
      formGroup.patchValue({
        id: object.id,
        descricao: object.descricao,
        usuario: object.usuario,
        dataSolicitacao: object.dataSolicitacao,
        observacao: object.observacao
      });
    }

    // Set items
    if (object.solicitacaoItem) {
      this.solicitacaoItems.set([...object.solicitacaoItem]);
    }
  }

  /**
   * Prepare form value before saving
   */
  protected override prepareFormValue(formValue: Partial<SolicitacaoCompra>): Partial<SolicitacaoCompra> {
    const formGroup = this.form();
    const id = formGroup?.get('id')?.value;
    const usuario = formGroup?.get('usuario')?.value;

    return {
      ...formValue,
      ...(id && {id}),
      usuario: usuario,
      solicitacaoItem: this.solicitacaoItems()
    };
  }
}
