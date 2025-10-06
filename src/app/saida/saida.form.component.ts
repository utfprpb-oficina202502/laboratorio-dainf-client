import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';

import {Saida} from './saida';
import {SaidaService} from './saida.service';
import {
  PrimeReactiveCrudFormComponent
} from '../framework/component/prime-reactive-crud.form.component';
import {Item} from '../item/item';
import {ItemService} from '../item/item.service';
import {SaidaItem} from './saidaItem';

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
  selector: 'app-form-saida',
  templateUrl: './saida.form.component.html',
  styleUrls: ['./saida.form.component.css'],
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
    TextareaModule,
    // Custom
    FormFieldComponent,
    VoltarComponent,
    CancelarComponent,
    SalvarComponent,

  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SaidaFormComponent extends PrimeReactiveCrudFormComponent<Saida, number> {
  protected override service = inject(SaidaService);
  protected override urlList = '/saida';
  protected override type = Saida;
  private readonly fb = inject(FormBuilder);
  private readonly itemService = inject(ItemService);

  // Signals for state management
  protected readonly itemList = signal<Item[]>([]);
  protected readonly saidaItems = signal<SaidaItem[]>([]);
  protected readonly maxDate = signal<Date>(new Date());

  // Temporary signals for adding items (not part of main form)
  protected readonly tempItem = signal<Item | null>(null);
  protected readonly tempQtde = signal<number>(1);

  // Computed signals
  protected readonly qtdeTotal = computed(() =>
    this.calculateTotalQuantity(this.saidaItems())
  );

  protected readonly hasItems = computed(() => this.saidaItems().length > 0);

  // Determine if form is disabled (from emprestimo)
  protected readonly isFromEmprestimo = computed(() => {
    const obj = this.object();
    return obj && obj.idEmprestimo !== null && obj.idEmprestimo !== undefined;
  });

  constructor() {
    super();
  }

  /**
   * Build the reactive form with validators
   */
  protected override buildForm(): FormGroup {
    return this.fb.group({
      id: [{value: null, disabled: true}],
      usuarioResponsavel: [{value: null, disabled: true}],
      dataSaida: ['', Validators.required],
      observacao: [''],
      idEmprestimo: [null]
    });
  }

  /**
   * Initialize form values
   */
  protected override initializeValues(): void {
    this.setTodayAsDefaultDate('dataSaida');
    this.setCurrentUserAsResponsible('usuarioResponsavel');
  }

  /**
   * Autocomplete for Items
   */
  findProdutos(event: AutoCompleteCompleteEvent): void {
    this.itemService.completeItem(event.query, true).subscribe(e => {
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

    if (!this.validateItemSaldo(item, qtde)) {
      return;
    }

    const currentItems = [...this.saidaItems()];
    const existingIndex = currentItems.findIndex(si => si.item.id === item.id);

    if (existingIndex >= 0) {
      const novaQtde = Number(currentItems[existingIndex].qtde) + Number(qtde);
      if (this.validateItemSaldo(item, novaQtde)) {
        currentItems[existingIndex].qtde = novaQtde;
      } else {
        return;
      }
    } else {
      const newSaidaItem = new SaidaItem();
      newSaidaItem.item = item;
      newSaidaItem.qtde = qtde;
      currentItems.push(newSaidaItem);
    }

    this.saidaItems.set(currentItems);

    // Reset temp values
    this.tempItem.set(null);
    this.tempQtde.set(1);
  }

  /**
   * Remove item from the list
   */
  removeItem(id: number): void {
    const updatedItems = this.removeItemById(this.saidaItems(), id, 'item.id');
    this.saidaItems.set(updatedItems);
  }

  /**
   * Override save to validate items
   */
  override save(): void {
    const items = this.saidaItems();

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
  protected override patchFormWithObject(object: Saida): void {
    const formGroup = this.form();
    if (formGroup) {
      formGroup.patchValue({
        id: object.id,
        usuarioResponsavel: object.usuarioResponsavel,
        dataSaida: object.dataSaida,
        observacao: object.observacao,
        idEmprestimo: object.idEmprestimo
      });

      // Disable fields if from emprestimo
      if (object.idEmprestimo) {
        formGroup.get('dataSaida')?.disable();
        formGroup.get('observacao')?.disable();
      }
    }

    // Set items
    if (object.saidaItem) {
      this.saidaItems.set([...object.saidaItem]);
    }
  }

  /**
   * Prepare form value before saving
   */
  protected override prepareFormValue(formValue: Partial<Saida>): Partial<Saida> {
    const formGroup = this.form();
    const id = formGroup?.get('id')?.value;
    const usuarioResponsavel = formGroup?.get('usuarioResponsavel')?.value;
    const dataSaida = formGroup?.get('dataSaida')?.value;
    const idEmprestimo = formGroup?.get('idEmprestimo')?.value;

    return {
      ...formValue,
      ...(id && {id}),
      usuarioResponsavel: usuarioResponsavel,
      dataSaida: dataSaida,
      ...(idEmprestimo && {idEmprestimo}),
      saidaItem: this.saidaItems()
    };
  }
}
