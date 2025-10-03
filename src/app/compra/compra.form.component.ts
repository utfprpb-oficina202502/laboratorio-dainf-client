import {Component, Injector, ChangeDetectionStrategy, signal, computed} from '@angular/core';
import {CommonModule} from '@angular/common';
import {
  ReactiveFormsModule, FormsModule,
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';

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
import {AutoCompleteModule} from 'primeng/autocomplete';
import {DatePickerModule} from 'primeng/datepicker';
import {ButtonModule} from 'primeng/button';
import {TableModule} from 'primeng/table';
import {TooltipModule} from 'primeng/tooltip';

// Custom components
import {FormFieldComponent} from '../framework/component/form-field.component';
import {VoltarModule} from '../geral/voltar/voltar.module';
import {CancelarModule} from '../geral/cancelar/cancelar.module';
import {SalvarModule} from '../geral/salvar/salvar.module';
import {CadastroRapidoModule} from '../geral/cadastroRapido/cadastroRapido.module';

@Component({
  selector: 'app-form-compra',
  templateUrl: './compra.form.component.html',
  styleUrls: ['./compra.form.component.css'],
  standalone: true,
  imports: [
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
    VoltarModule,
    CancelarModule,
    SalvarModule,
    CadastroRapidoModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CompraFormComponent extends PrimeReactiveCrudFormComponent<Compra, number> {
  private readonly fb = this.injector.get(FormBuilder);
  private readonly fornecedorService = this.injector.get(FornecedorService);
  private readonly itemService = this.injector.get(ItemService);

  // Signals for state management
  protected readonly fornecedorList = signal<Fornecedor[]>([]);
  protected readonly itemList = signal<Item[]>([]);
  protected readonly compraItems = signal<CompraItem[]>([]);
  protected readonly maxDate = signal<Date>(new Date());

  // Temporary signals for adding items (not part of main form)
  protected readonly tempItem = signal<Item | null>(null);
  protected readonly tempQtde = signal<number>(1);
  protected readonly tempValor = signal<number>(0);

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

  constructor(
    protected compraService: CompraService,
    protected injector: Injector
  ) {
    super(compraService, injector, '/compra', Compra);
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
   * Autocomplete for Fornecedores
   */
  findFornecedores(event: any): void {
    this.fornecedorService.complete(event.query).subscribe(e => {
      this.fornecedorList.set(e);
    });
  }

  /**
   * Autocomplete for Items
   * Requires minimum 2 characters to search (performance optimization for 700+ items)
   */
  findProdutos(event: any): void {
    const query = event.query || '';

    // Require minimum 2 characters to search
    if (query.length < 2) {
      this.itemList.set([]);
      return;
    }

    this.itemService.completeItem(query, false).subscribe(e => {
      this.itemList.set(e);
    });
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
