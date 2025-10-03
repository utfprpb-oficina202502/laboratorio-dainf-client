import { Component, Injector, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import {CommonModule} from '@angular/common';
import {
  ReactiveFormsModule, FormsModule,
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';

import {SolicitacaoCompra} from './solicitacaoCompra';
import {SolicitacaoCompraService} from './solicitacaoCompra.service';
import {
  PrimeReactiveCrudFormComponent
} from '../framework/component/prime-reactive-crud.form.component';
import {Item} from '../item/item';
import {ItemService} from '../item/item.service';
import {SolicitacaoCompraItem} from './solicitacaoCompraItem';

// PrimeNG
import {CardModule} from 'primeng/card';
import {InputTextModule} from 'primeng/inputtext';
import {AutoCompleteModule} from 'primeng/autocomplete';
import {DatePickerModule} from 'primeng/datepicker';
import {ButtonModule} from 'primeng/button';
import {TableModule} from 'primeng/table';
import {TooltipModule} from 'primeng/tooltip';
import {TextareaModule} from 'primeng/textarea';

// Custom components
import {FormFieldComponent} from '../framework/component/form-field.component';
import {VoltarModule} from '../geral/voltar/voltar.module';
import {CancelarModule} from '../geral/cancelar/cancelar.module';
import {SalvarModule} from '../geral/salvar/salvar.module';
import {CadastroRapidoModule} from '../geral/cadastroRapido/cadastroRapido.module';

@Component({
  selector: 'app-form-solicitacao-compra',
  templateUrl: './solicitacaoCompra.form.component.html',
  styleUrls: ['./solicitacaoCompra.form.component.css'],
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
    TextareaModule,
    // Custom
    FormFieldComponent,
    VoltarModule,
    CancelarModule,
    SalvarModule,
    CadastroRapidoModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SolicitacaoCompraFormComponent extends PrimeReactiveCrudFormComponent<SolicitacaoCompra, number> {
  protected solicitacaoCompraService: SolicitacaoCompraService;
  protected injector: Injector;

  private readonly fb = this.injector.get(FormBuilder);
  private readonly itemService = this.injector.get(ItemService);

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
    const solicitacaoCompraService = inject(SolicitacaoCompraService);
    const injector = inject(Injector);

    super(solicitacaoCompraService, injector, '/solicitacao-compra', SolicitacaoCompra);
  
    this.solicitacaoCompraService = solicitacaoCompraService;
    this.injector = injector;
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
   * Autocomplete for Items
   */
  findProdutos(event: any): void {
    this.itemService.completeItem(event.query, false).subscribe(e => {
      this.itemList.set(e);
    });
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
      const novaQtde = Number(currentItems[existingIndex].qtde) + Number(qtde);
      currentItems[existingIndex].qtde = novaQtde;
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
