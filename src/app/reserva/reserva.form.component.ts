import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  OnDestroy,
  OnInit,
  signal
} from '@angular/core';
import {NgOptimizedImage} from '@angular/common';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {Router} from '@angular/router';
import {Subject} from 'rxjs';
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
import {BreakpointService} from '../framework/service/breakpoint.service';
import {CartItem, CartService} from '../framework/service/cart.service';

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
    NgOptimizedImage,
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
    DialogModule,
    CarouselModule,
    FormFieldComponent,
    VoltarComponent,
    CancelarComponent,
    SalvarComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReservaFormComponent extends PrimeReactiveCrudFormComponent<Reserva, number> implements OnInit, OnDestroy {
  // Constants for template
  protected readonly Z_INDEX = Z_INDEX;

  protected override service = inject(ReservaService);
  protected override urlList = '/reserva';
  protected override type = Reserva;
  private readonly fb = inject(FormBuilder);
  private readonly itemService = inject(ItemService);
  protected readonly breakpointService = inject(BreakpointService);
  private readonly cartService = inject(CartService);
  private readonly routerRef = inject(Router);
  /** Subject para debounce da busca de itens */
  private readonly itemSearchSubject = new Subject<string>();

  // Signals for state management
  protected readonly itemList = signal<Item[]>([]);
  protected readonly reservaItems = signal<ReservaItem[]>([]);
  protected readonly images = signal<ItemImage[]>([]);
  protected readonly dialogImagens = signal<boolean>(false);

  // Signal para controle de desabilitação do formulário (modo visualização)
  protected readonly disableForm = signal<boolean>(false);

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

  private readonly RESERVA_ITEMS_KEY = 'reserva_items_draft';

  constructor() {
    super();

    // Configura debounce para busca de itens usando método da classe base
    this.setupAutocompleteDebounce(
      this.itemSearchSubject,
      (query) => this.itemService.completeItem(query, true),
      this.itemList,
      'Erro ao buscar itens'
    );

    // Auto-save dos itens da reserva quando mudam
    effect(() => {
      const items = this.reservaItems();
      if (items.length > 0) {
        this.saveReservaItemsToStorage(items);
      }
    });

    // Effect para desabilitar/habilitar campos do formulário em modo visualização
    effect(() => {
      const formGroup = this.form();
      const shouldDisable = this.disableForm();

      if (formGroup) {
        const controls = ['descricao', 'dataReserva', 'dataRetirada', 'observacao'];
        controls.forEach(controlName => {
          const control = formGroup.get(controlName);
          if (control) {
            if (shouldDisable) {
              control.disable({emitEvent: false});
            } else {
              control.enable({emitEvent: false});
            }
          }
        });
      }
    });
  }

  ngOnDestroy(): void {
    this.itemSearchSubject.complete();
  }

  /**
   * Lifecycle hook - loads cart items if navigating from cart.
   */
  override ngOnInit(): void {
    super.ngOnInit();
    this.loadCartItems();
  }

  /**
   * Override back para limpar o storage ao voltar.
   */
  override back(): void {
    this.clearReservaItemsFromStorage();
    super.back();
  }

  /**
   * Override postSave para limpar o storage após salvar com sucesso.
   */
  protected override postSave(callback: () => void): void {
    this.clearReservaItemsFromStorage();
    super.postSave(callback);
  }

  /**
   * Verifica se o formulário deve ser desabilitado.
   * Alunos/professores visualizando registros existentes terão o formulário somente-leitura.
   */
  verifyFormDisable(): void {
    const obj = this.object();
    const isEditMode = obj && !!obj.id;
    const isAluno = this.isAlunoOrProfessor();

    if (isEditMode && isAluno) {
      this.disableForm.set(true);
    } else {
      this.disableForm.set(false);
    }
  }

  /**
   * Hook executado após carregar dados do objeto para edição.
   * Verifica permissões para desabilitar o formulário.
   */
  protected override postEdit(): void {
    this.verifyFormDisable();
  }

  /**
   * Carrega itens do carrinho se vieram via Router state,
   * ou recupera do SessionStorage se for refresh da página.
   */
  private loadCartItems(): void {
    // 1. Tenta carregar do Router state (navegação do carrinho)
    const navigation = this.routerRef.getCurrentNavigation();
    const state = navigation?.extras?.state as { cartItems?: CartItem[] } | undefined;
    const historyState = history.state as { cartItems?: CartItem[] } | undefined;
    const cartItems = state?.cartItems || historyState?.cartItems;

    if (cartItems?.length) {
      const reservaItems = this.convertCartItemsToReservaItems(cartItems);
      this.reservaItems.set(reservaItems);

      // Salva no SessionStorage para sobreviver refresh
      this.saveReservaItemsToStorage(reservaItems);

      // Limpa o carrinho após carregar os itens
      this.cartService.clear();

      this.messageService.add({
        severity: 'info',
        summary: 'Itens carregados',
        detail: `${cartItems.length} item(ns) foram adicionados do carrinho.`,
        life: 4000
      });
      return;
    }

    // 2. Se não veio do carrinho, tenta recuperar do SessionStorage (refresh)
    this.loadReservaItemsFromStorage();
  }

  /**
   * Salva itens da reserva em SessionStorage.
   */
  private saveReservaItemsToStorage(items: ReservaItem[]): void {
    sessionStorage.setItem(this.RESERVA_ITEMS_KEY, JSON.stringify(items));
  }

  /**
   * Carrega itens da reserva do SessionStorage.
   */
  private loadReservaItemsFromStorage(): void {
    const stored = sessionStorage.getItem(this.RESERVA_ITEMS_KEY);
    if (stored) {
      try {
        const items = JSON.parse(stored) as ReservaItem[];
        if (items?.length) {
          this.reservaItems.set(items);
        }
      } catch {
        // Ignora erro de parse
      }
    }
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
          this.messageService.add({
            severity: 'info',
            summary: 'Ops...',
            detail: 'Esse item não possui imagens.',
            life: 4000
          });
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
   * Limpa itens salvos do SessionStorage.
   */
  private clearReservaItemsFromStorage(): void {
    sessionStorage.removeItem(this.RESERVA_ITEMS_KEY);
  }

  /**
   * Converte CartItems em ReservaItems.
   */
  private convertCartItemsToReservaItems(cartItems: CartItem[]): ReservaItem[] {
    return cartItems.map(cartItem => {
      const reservaItem = new ReservaItem();
      reservaItem.item = cartItem.item;
      reservaItem.qtde = cartItem.qtde;
      return reservaItem;
    });
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
