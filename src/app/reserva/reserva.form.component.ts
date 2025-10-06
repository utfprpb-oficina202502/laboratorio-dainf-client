import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {CommonModule, NgOptimizedImage} from '@angular/common';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {Z_INDEX} from '../framework/constants';

import {Reserva} from './reserva';
import {ReservaService} from './reserva.service';
import {
  PrimeReactiveCrudFormComponent
} from '../framework/component/prime-reactive-crud.form.component';
import {Item} from '../item/item';
import {ItemService} from '../item/item.service';
import {ReservaItem} from './reservaItem';
import {ItemImage} from '../item/itemImage';
import {environment} from 'src/environments/environment';
import Swal from 'sweetalert2';

// PrimeNG
import {CardModule} from 'primeng/card';
import {InputTextModule} from 'primeng/inputtext';
import {AutoCompleteCompleteEvent, AutoCompleteModule} from 'primeng/autocomplete';
import {DatePickerModule} from 'primeng/datepicker';
import {ButtonModule} from 'primeng/button';
import {TableModule} from 'primeng/table';
import {TooltipModule} from 'primeng/tooltip';
import {TextareaModule} from 'primeng/textarea';
import {DialogModule} from 'primeng/dialog';
import {CarouselModule} from 'primeng/carousel';

// Custom components
import {FormFieldComponent} from '../framework/component/form-field.component';
import {VoltarComponent} from '../geral/voltar/voltar.component';
import {CancelarComponent} from '../geral/cancelar/cancelar.component';
import {SalvarComponent} from '../geral/salvar/salvar.component';
import {CadastroRapidoComponent} from '../geral/cadastroRapido/cadastroRapido.component';

@Component({
  selector: 'app-form-reserva',
  templateUrl: './reserva.form.component.html',
  styleUrls: ['./reserva.form.component.css'],
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
    DialogModule,
    CarouselModule,
    // Custom
    FormFieldComponent,
    VoltarComponent,
    CancelarComponent,
    SalvarComponent,
    NgOptimizedImage
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReservaFormComponent extends PrimeReactiveCrudFormComponent<Reserva, number> {
  // Constants for template
  protected readonly Z_INDEX = Z_INDEX;

  protected override service = inject(ReservaService);
  protected override urlList = '/reserva';
  protected override type = Reserva;
  private readonly fb = inject(FormBuilder);
  private readonly itemService = inject(ItemService);

  // Signals for state management
  protected readonly itemList = signal<Item[]>([]);
  protected readonly reservaItems = signal<ReservaItem[]>([]);
  protected readonly images = signal<ItemImage[]>([]);
  protected readonly dialogImagens = signal<boolean>(false);
  protected readonly minioUrl = signal<string>(environment.minio_url);

  // Temporary signals for adding items (not part of main form)
  protected readonly tempItem = signal<Item | null>(null);
  protected readonly tempQtde = signal<number>(1);

  // Carousel responsive options
  protected readonly responsiveOptions = [
    {
      breakpoint: '768px',
      numVisible: 2,
      numScroll: 2
    },
    {
      breakpoint: '560px',
      numVisible: 1,
      numScroll: 1
    }
  ];

  // Computed signals
  protected readonly qtdeTotal = computed(() =>
    this.calculateTotalQuantity(this.reservaItems())
  );

  protected readonly hasItems = computed(() => this.reservaItems().length > 0);

  constructor() {
    super();
  }

  /**
   * Build the reactive form with validators
   */
  protected override buildForm(): FormGroup {
    return this.fb.group({
      id: [{value: null, disabled: true}],
      descricao: ['', Validators.required],
      usuario: [{value: null, disabled: true}],
      dataReserva: ['', Validators.required],
      dataRetirada: ['', Validators.required],
      observacao: ['']
    });
  }

  /**
   * Initialize form values
   */
  protected override initializeValues(): void {
    this.setTodayAsDefaultDate('dataReserva');
    this.setCurrentUserAsResponsible('usuario');
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

    const currentItems = [...this.reservaItems()];
    const existingIndex = currentItems.findIndex(ri => ri.item.id === item.id);

    if (existingIndex >= 0) {
      const novaQtde = Number(currentItems[existingIndex].qtde) + Number(qtde);
      if (this.validateItemSaldo(item, novaQtde)) {
        currentItems[existingIndex].qtde = novaQtde;
      } else {
        return;
      }
    } else {
      const newReservaItem = new ReservaItem();
      newReservaItem.item = item;
      newReservaItem.qtde = qtde;
      currentItems.push(newReservaItem);
    }

    this.reservaItems.set(currentItems);

    // Reset temp values
    this.tempItem.set(null);
    this.tempQtde.set(1);
  }

  /**
   * Remove item from the list
   */
  removeItem(id: number): void {
    const updatedItems = this.removeItemById(this.reservaItems(), id, 'item.id');
    this.reservaItems.set(updatedItems);
  }

  /**
   * Show dialog with item images
   */
  showDialogImagens(): void {
    const item = this.tempItem();
    if (!item) return;

    this.loaderService.show();
    this.itemService.findAllImagesItem(item.id).subscribe({
      next: (images) => {
        this.loaderService.hide();
        if (images.length > 0) {
          this.images.set(images);
          this.dialogImagens.set(true);
        } else {
          Swal.fire('Ops...', 'Esse item não possui imagens.', 'info');
        }
      },
      error: () => {
        this.loaderService.hide();
      }
    });
  }

  /**
   * Override save to validate items
   */
  override save(): void {
    const items = this.reservaItems();

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
  protected override patchFormWithObject(object: Reserva): void {
    const formGroup = this.form();
    if (formGroup) {
      formGroup.patchValue({
        id: object.id,
        descricao: object.descricao,
        usuario: object.usuario,
        dataReserva: object.dataReserva,
        dataRetirada: object.dataRetirada,
        observacao: object.observacao
      });
    }

    // Set items
    if (object.reservaItem) {
      this.reservaItems.set([...object.reservaItem]);
    }
  }

  /**
   * Prepare form value before saving
   */
  protected override prepareFormValue(formValue: Partial<Reserva>): Partial<Reserva> {
    const formGroup = this.form();
    const id = formGroup?.get('id')?.value;
    const usuario = formGroup?.get('usuario')?.value;

    return {
      ...formValue,
      ...(id && {id}),
      usuario: usuario,
      reservaItem: this.reservaItems()
    };
  }
}
