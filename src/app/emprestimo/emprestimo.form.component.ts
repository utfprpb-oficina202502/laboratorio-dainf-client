import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  OnDestroy,
  signal
} from '@angular/core';
import {CommonModule, NgOptimizedImage} from '@angular/common';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {Subscription} from 'rxjs';
import {Emprestimo} from './emprestimo';
import {EmprestimoService} from './emprestimo.service';
import {
  PrimeReactiveCrudFormComponent
} from '../framework/component/prime-reactive-crud.form.component';
import {EmprestimoItem} from './emprestimoItem';
import {EmprestimoDevolucaoItem, StatusDevolucao} from './emprestimoDevolucaoItem';
import {Item} from '../item/item';
import {ItemService} from '../item/item.service';
import {UsuarioService} from '../usuario/usuario.service';
import {Usuario} from '../usuario/usuario';
import {SelectItem} from 'primeng/api';

// PrimeNG
import {CardModule} from 'primeng/card';
import {InputTextModule} from 'primeng/inputtext';
import {TextareaModule} from 'primeng/textarea';
import {
  AutoCompleteCompleteEvent,
  AutoCompleteModule,
  AutoCompleteSelectEvent
} from 'primeng/autocomplete';
import {DatePickerModule} from 'primeng/datepicker';
import {ButtonModule} from 'primeng/button';
import {TableModule} from 'primeng/table';
import {TooltipModule} from 'primeng/tooltip';
import {SelectModule} from 'primeng/select';
import {DialogModule} from 'primeng/dialog';
import {ScrollPanelModule} from 'primeng/scrollpanel';
import {TagModule} from 'primeng/tag';

// Custom components
import {FormFieldComponent} from '../framework/component/form-field.component';
import {VoltarComponent} from '../geral/voltar/voltar.component';
import {CancelarComponent} from '../geral/cancelar/cancelar.component';
import {SalvarComponent} from '../geral/salvar/salvar.component';
import {CadastroRapidoComponent} from '../geral/cadastroRapido/cadastroRapido.component';
import {LoggerService} from '../framework/services/logger.service';

@Component({
  selector: 'app-form-emprestimo',
  templateUrl: './emprestimo.form.component.html',
  styleUrls: ['./emprestimo.form.component.css'],
  imports: [
    CadastroRapidoComponent,
    CommonModule,
    NgOptimizedImage,
    ReactiveFormsModule,
    FormsModule,
    // PrimeNG
    CardModule,
    InputTextModule,
    TextareaModule,
    AutoCompleteModule,
    DatePickerModule,
    ButtonModule,
    TableModule,
    TooltipModule,
    SelectModule,
    DialogModule,
    ScrollPanelModule,
    TagModule,
    // Custom
    FormFieldComponent,
    VoltarComponent,
    CancelarComponent,
    SalvarComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmprestimoFormComponent extends PrimeReactiveCrudFormComponent<Emprestimo, number> implements OnDestroy {
  protected override service = inject(EmprestimoService);
  protected override urlList = '/emprestimo';
  protected override type = Emprestimo;
  private readonly fb = inject(FormBuilder);
  private readonly itemService = inject(ItemService);
  private readonly usuarioService = inject(UsuarioService);
  protected readonly logger = inject(LoggerService);
  protected readonly itemLoading = signal(false);

  // State signals
  protected readonly itemList = signal<Item[]>([]);
  protected readonly itemTotalRecords = signal(0);
  private itemSubscription?: Subscription;
  protected readonly usuarioList = signal<Usuario[]>([]);
  protected readonly emprestimoItems = signal<EmprestimoItem[]>([]);
  protected readonly maxDateEmprestimo = signal<Date>(new Date());
  protected readonly minDatePrazoDevolucao = signal<Date | undefined>(undefined);
  protected readonly documentoUsuario = signal<string>('');
  protected readonly disableForm = signal<boolean>(false);
  protected readonly idReserva = signal<number>(0);
  // Pagination state for Item autocomplete
  private readonly ITEM_PAGE_SIZE = 10;
  private itemPage = 0;
  private itemQuery = '';

  // Temporary signals for adding items
  protected tempItem = signal<Item | null>(null);
  protected tempQtde = signal<number>(1);
  protected tempDevolver = signal<boolean | null>(null);

  // Dropdown options
  protected readonly yesNoDropdown: SelectItem[] = [
    {label: 'Sim', value: true},
    {label: 'Não', value: false}
  ];

  // Computed signals
  protected readonly qtdeTotal = computed(() =>
    this.calculateTotalQuantity(this.emprestimoItems())
  );

  protected readonly hasItems = computed(() => this.emprestimoItems().length > 0);

  protected readonly isEmprestimoFinalizado = computed(() => {
    const obj = this.object();
    return !!(obj && 'dataDevolucao' in obj && obj.dataDevolucao);
  });

  constructor() {
    super();

    effect(() => {
      const formGroup = this.form();
      const shouldDisable = this.disableForm();

      if (formGroup) {
        const controls = ['usuarioEmprestimo', 'dataEmprestimo', 'prazoDevolucao', 'observacao'];
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

  /**
   * Build the reactive form with validators
   */
  protected override buildForm(): FormGroup {
    return this.fb.group({
      id: [{value: null, disabled: true}],
      usuarioEmprestimo: [null, Validators.required],
      usuarioResponsavel: [{value: null, disabled: true}],
      dataEmprestimo: ['', Validators.required],
      prazoDevolucao: ['', Validators.required],
      dataDevolucao: [{value: '', disabled: true}],
      observacao: ['']
    });
  }

  /**
   * Autocomplete for Items with pagination
   */
  findProdutos(event: AutoCompleteCompleteEvent): void {
    this.cancelItemRequest(); // Cancel previous request to prevent race condition

    // Reset pagination on new query
    if (event.query !== this.itemQuery) {
      this.itemPage = 0;
      this.itemList.set([]);
    }
    this.itemQuery = event.query;

    this.loadItemsPage();
  }

  /**
   * Handler for p-autoComplete onLazyLoad (virtual scroll)
   */
  onItemLazyLoad(event: { first: number; last: number }): void {
    this.cancelItemRequest(); // Cancel previous request to prevent race condition

    const currentLength = this.itemList().length;
    const neededPage = Math.floor(event.last / this.ITEM_PAGE_SIZE);

    // Load next page if approaching end and more records exist
    if (neededPage >= this.itemPage && currentLength < this.itemTotalRecords()) {
      this.itemPage = neededPage;
      this.loadItemsPage();
    }
  }

  /**
   * Cleanup subscriptions on destroy
   */
  ngOnDestroy(): void {
    this.cancelItemRequest();
  }

  /**
   * Load a page of items
   */
  private loadItemsPage(): void {
    this.itemLoading.set(true);

    this.itemSubscription = this.itemService
    .completeItemPaged(this.itemQuery, true, this.itemPage, this.ITEM_PAGE_SIZE)
    .subscribe({
      next: (response) => {
        // Append to existing list for virtual scroll
        const currentList = this.itemList();
        if (this.itemPage === 0) {
          this.itemList.set(response.content);
        } else {
          this.itemList.set([...currentList, ...response.content]);
        }
        this.itemTotalRecords.set(response.totalElements);
        this.itemLoading.set(false);
      },
      error: (error) => {
        this.logger.error('Error fetching items', error);
        this.itemLoading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Erro ao carregar itens. Tente novamente.',
          life: 5000
        });
      }
    });
  }

  /**
   * Cancel ongoing item request
   */
  private cancelItemRequest(): void {
    if (this.itemSubscription && !this.itemSubscription.closed) {
      this.itemSubscription.unsubscribe();
    }
  }

  /**
   * Post edit hook
   */
  protected override postEdit(): void {
    const obj = this.object();
    if (obj && 'usuarioEmprestimo' in obj && obj.usuarioEmprestimo) {
      this.documentoUsuario.set(obj.usuarioEmprestimo.documento);
    }
    this.verifyFormDisable();
  }

  /**
   * Autocomplete for Usuarios
   */
  findUsuarios(event: AutoCompleteCompleteEvent): void {
    this.usuarioService.completeCustom(event.query).subscribe({
      next: (usuarios) => {
        this.usuarioList.set(usuarios);
        if (usuarios.length === 1) {
          const formGroup = this.form();
          if (formGroup) {
            formGroup.patchValue({usuarioEmprestimo: usuarios[0]});
            this.documentoUsuario.set(usuarios[0].documento);
          }
        }
      },
      error: (error) => {
        this.logger.error('Erro ao buscar usuários', error);
        this.usuarioList.set([]);
      }
    });
  }

  /**
   * Override save to use custom service method
   */
  override save(): void {
    const formGroup = this.form();
    const items = this.emprestimoItems();
    const usuarioEmprestimo = formGroup?.get('usuarioEmprestimo')?.value;

    if (!items || items.length === 0 || typeof usuarioEmprestimo !== 'object') {
      this.validExtra = false;
      this.showMinimumItemsMessage('Necessário informar o aluno/professor e adicionar ao menos um item!');
      return;
    }

    this.validExtra = true;

    if (!formGroup || !formGroup.valid || !this.validExtra) {
      this.messageService.add({
        severity: 'info',
        summary: 'Atenção',
        detail: 'Necessário preencher todos os campos corretamente!'
      });
      if (formGroup) {
        this.markFormAsTouched(formGroup);
      }
      return;
    }

    this.loaderService.show();
    this.isLoading.set(true);

    const formValue = this.prepareFormValue(formGroup.value);
    const objectToSave = this.mergeWithObject(formValue);

    this.service.saveEmprestimo(objectToSave, this.idReserva()).subscribe({
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

        // Processa erro RFC 9457 e aplica erros de campo ao formulário
        const formGroup = this.form();
        const result = this.errorHandler.handleHttpError(error, false);

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

        this.logger.error('Erro ao salvar empréstimo', error);
      }
    });
  }

  /**
   * Handle usuario emprestimo change
   */
  onUsuarioEmprestimoChange(event: AutoCompleteSelectEvent): void {
    const usuario = event?.value;
    if (usuario?.documento) {
      this.documentoUsuario.set(usuario.documento);
    }
  }

  /**
   * Set devolution flag when item is selected
   */
  setDevolucaoItem(): void {
    const item = this.tempItem();
    if (item && typeof item === 'object') {
      if (item.tipoItem === 'C') {
        this.tempDevolver.set(true);
      } else {
        this.tempDevolver.set(false);
      }
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

    if (!this.validateItemSaldo(item, qtde)) {
      return;
    }

    const currentItems = [...this.emprestimoItems()];
    const pendingItemIndex = this.findPendingItemIndex(currentItems, item.id);

    if (pendingItemIndex >= 0) {
      this.addQuantityToPendingItem(currentItems, pendingItemIndex, item, qtde);
    } else {
      this.createNewEmprestimoItem(currentItems, item, qtde);
    }

    this.emprestimoItems.set(currentItems);
    this.resetTempValues();
  }

  /**
   * Add quantity to an existing pending item
   */
  private addQuantityToPendingItem(currentItems: EmprestimoItem[], index: number, item: Item, qtde: number): void {
    const novaQtde = Number(currentItems[index].qtde) + Number(qtde);
    if (!this.validateItemSaldo(item, novaQtde)) {
      return;
    }

    currentItems[index].qtde = novaQtde;

    // Sync with emprestimoDevolucaoItem if editing
    const emprestimo = this.object();
    if (emprestimo?.emprestimoDevolucaoItem) {
      const devolucaoItem = this.findCorrespondingDevolucaoItem(currentItems[index]);
      if (devolucaoItem) {
        devolucaoItem.qtde = novaQtde;
      }
    }
  }

  /**
   * Create a new EmprestimoItem and sync with backend if editing
   */
  private createNewEmprestimoItem(currentItems: EmprestimoItem[], item: Item, qtde: number): void {
    const newEmprestimoItem = new EmprestimoItem();
    newEmprestimoItem.item = item;
    newEmprestimoItem.qtde = qtde;
    newEmprestimoItem.devolver = this.tempDevolver() ?? false;
    currentItems.push(newEmprestimoItem);

    // Sync with emprestimo object if editing
    const emprestimo = this.object();
    if (emprestimo?.emprestimoItem) {
      emprestimo.emprestimoItem.push(newEmprestimoItem);
      this.createCorrespondingDevolucaoItem(emprestimo, item, qtde);
    }
  }

  /**
   * Create corresponding EmprestimoDevolucaoItem with status 'P'
   */
  private createCorrespondingDevolucaoItem(emprestimo: Emprestimo, item: Item, qtde: number): void {
    if (!emprestimo.emprestimoDevolucaoItem) {
      return;
    }

    const newDevolucaoItem = new EmprestimoDevolucaoItem();
    newDevolucaoItem.item = item;
    newDevolucaoItem.qtde = qtde;
    newDevolucaoItem.statusDevolucao = StatusDevolucao.P;
    emprestimo.emprestimoDevolucaoItem.push(newDevolucaoItem);
  }

  /**
   * Reset temporary form values
   */
  private resetTempValues(): void {
    this.tempItem.set(null);
    this.tempQtde.set(1);
    this.tempDevolver.set(null);
  }

  /**
   * Find the corresponding EmprestimoDevolucaoItem for a given EmprestimoItem
   */
  private findCorrespondingDevolucaoItem(emprestimoItem: EmprestimoItem): EmprestimoDevolucaoItem | null {
    const emprestimo = this.object();
    if (!emprestimo?.emprestimoDevolucaoItem || !emprestimo?.emprestimoItem) {
      return null;
    }

    const emprestimoItemsArray = this.emprestimoItems();
    const index = emprestimoItemsArray.indexOf(emprestimoItem);

    if (index === -1) {
      return null;
    }

    // Get all emprestimoDevolucaoItem that match this item
    const matchingDevolucaoItems = emprestimo.emprestimoDevolucaoItem.filter(
      edi => edi.item.id === emprestimoItem.item.id
    );

    // Count how many matching items come before this index
    let matchIndex = 0;
    for (let i = 0; i < index; i++) {
      if (emprestimoItemsArray[i].item.id === emprestimoItem.item.id) {
        matchIndex++;
      }
    }

    return matchingDevolucaoItems[matchIndex] || null;
  }

  /**
   * Find the index of a pending item (status 'P') with the given item ID
   * Returns -1 if no pending item is found
   */
  private findPendingItemIndex(emprestimoItems: EmprestimoItem[], itemId: number): number {
    const emprestimo = this.object();

    // If no emprestimo or no devolucao items, treat all items as pending (can add to existing)
    if (!emprestimo?.emprestimoDevolucaoItem) {
      return emprestimoItems.findIndex(ei => ei.item.id === itemId);
    }

    // Find all items with the same item.id
    for (let i = 0; i < emprestimoItems.length; i++) {
      const emprestimoItem = emprestimoItems[i];
      if (emprestimoItem.item.id === itemId) {
        const status = this.getStatusDevolucao(emprestimoItem);

        // If status is 'P' (Pendente) or null (new item), we can add to this one
        if (status === StatusDevolucao.P || status === null) {
          return i;
        }
      }
    }

    return -1;
  }

  /**
   * Remove item from the list by index
   * Only removes the specific instance, not all items with the same item.id
   * Also syncs with EmprestimoItem and EmprestimoDevolucaoItem in the emprestimo object if in edit mode
   * Removes the item with the matching status
   */
  removeItemByIndex(index: number): void {
    const currentItems = [...this.emprestimoItems()];

    if (index < 0 || index >= currentItems.length) {
      return;
    }

    const itemToRemove = currentItems[index];
    const statusToRemove = this.getStatusDevolucao(itemToRemove);

    currentItems.splice(index, 1);
    this.emprestimoItems.set(currentItems);

    // Sync with EmprestimoItem and EmprestimoDevolucaoItem in emprestimo object if editing
    const emprestimo = this.object();
    if (emprestimo?.emprestimoItem) {
      // Find and remove the corresponding EmprestimoItem
      // Match by item.id and quantity to handle fractioned items correctly
      const emprestimoItemIndex = emprestimo.emprestimoItem.findIndex(
        ei => ei.item.id === itemToRemove.item.id && Number(ei.qtde) === Number(itemToRemove.qtde)
      );

      if (emprestimoItemIndex >= 0) {
        emprestimo.emprestimoItem.splice(emprestimoItemIndex, 1);
      }

      // Also remove the corresponding EmprestimoDevolucaoItem with matching status
      if (emprestimo.emprestimoDevolucaoItem && statusToRemove) {
        const devolucaoItemIndex = emprestimo.emprestimoDevolucaoItem.findIndex(
          edi => edi.item.id === itemToRemove.item.id &&
                 Number(edi.qtde) === Number(itemToRemove.qtde) &&
                 edi.statusDevolucao === statusToRemove
        );

        if (devolucaoItemIndex >= 0) {
          emprestimo.emprestimoDevolucaoItem.splice(devolucaoItemIndex, 1);
        }
      }
    }
  }

  /**
   * @deprecated Use removeItemByIndex instead to avoid removing all items with same id
   * Remove item from the list
   */
  removeItem(id: number): void {
    const updatedItems = this.removeItemById(this.emprestimoItems(), id, 'item.id');
    this.emprestimoItems.set(updatedItems);
  }

  /**
   * Set minimum date for prazo devolucao
   */
  setDateMinPrazoDevolucao(): void {
    const formGroup = this.form();
    const dataEmprestimo = formGroup?.get('dataEmprestimo')?.value;
    if (dataEmprestimo) {
      // Parse dd/MM/yyyy to Date
      const parts = dataEmprestimo.split('/');
      if (parts.length === 3) {
        const minDate = new Date(Number.parseInt(parts[2]), Number.parseInt(parts[1]) - 1, Number.parseInt(parts[0]));
        this.minDatePrazoDevolucao.set(minDate);
      }
    }
  }

  /**
   * Get the status of EmprestimoDevolucaoItem for a given EmprestimoItem
   * First tries to match by item.id AND qtde, then falls back to positional matching
   */
  getStatusDevolucao(emprestimoItem: EmprestimoItem): StatusDevolucao | null {
    const emprestimo = this.object();
    if (!emprestimo?.emprestimoDevolucaoItem || !emprestimo?.emprestimoItem) {
      return null;
    }

    // First try to match by item.id AND quantity
    const devolucaoItemByQtde = emprestimo.emprestimoDevolucaoItem.find(
      edi => edi.item.id === emprestimoItem.item.id &&
             Number(edi.qtde) === Number(emprestimoItem.qtde)
    );

    if (devolucaoItemByQtde) {
      return devolucaoItemByQtde.statusDevolucao;
    }

    // Fallback to positional matching if no quantity match found
    const emprestimoItemsArray = this.emprestimoItems();
    const index = emprestimoItemsArray.indexOf(emprestimoItem);

    if (index === -1) {
      return null;
    }

    // Get all emprestimoDevolucaoItem that match this item
    const matchingDevolucaoItems = emprestimo.emprestimoDevolucaoItem.filter(
      edi => edi.item.id === emprestimoItem.item.id
    );

    // If we have a matching index in the filtered array, use it
    // Count how many matching items come before this index
    let matchIndex = 0;
    for (let i = 0; i < index; i++) {
      if (emprestimoItemsArray[i].item.id === emprestimoItem.item.id) {
        matchIndex++;
      }
    }

    const devolucaoItem = matchingDevolucaoItems[matchIndex];
    return devolucaoItem?.statusDevolucao ?? null;
  }

  /**
   * Get status label for display
   */
  getStatusLabel(status: StatusDevolucao | null): string {
    if (!status) return '';

    switch (status) {
      case StatusDevolucao.P:
        return 'Pendente';
      case StatusDevolucao.D:
        return 'Devolvido';
      case StatusDevolucao.S:
        return 'Saída';
      default:
        return '';
    }
  }

  /**
   * Get status severity for tag styling
   */
  getStatusSeverity(status: StatusDevolucao | null): 'success' | 'warn' | 'secondary' | 'info' {
    if (!status) return 'secondary';

    switch (status) {
      case StatusDevolucao.P:
        return 'warn';
      case StatusDevolucao.D:
        return 'success';
      case StatusDevolucao.S:
        return 'info';
      default:
        return 'secondary';
    }
  }

  /**
   * Initialize form values
   */
  protected override initializeValues(): void {
    this.setTodayAsDefaultDate('dataEmprestimo');
    this.setDateMinPrazoDevolucao();
    this.setCurrentUserAsResponsible('usuarioResponsavel');

    if (globalThis.location.href.includes('reserva')) {
      this.generateEmprestimoByReserva();
    }
  }

  /**
   * Verify if form should be disabled
   */
  verifyFormDisable(): void {
    const obj = this.object();
    const hasDevolucao = obj && 'dataDevolucao' in obj && !!obj.dataDevolucao;

    if (hasDevolucao) {
      this.disableForm.set(true);
      return;
    }

    const isEditMode = obj && !!obj.id;
    const isAluno = this.isAlunoOrProfessor();

    if (isEditMode && isAluno) {
      this.disableForm.set(true);
    } else {
      this.disableForm.set(false);
    }
  }

  /**
   * Generate emprestimo from reserva
   */
  generateEmprestimoByReserva(): void {
    const reservaData = localStorage.getItem('reserva-to-emprestimo');
    if (!reservaData) return;

    const reserva = JSON.parse(reservaData);
    this.idReserva.set(reserva.id);

    const formGroup = this.form();
    if (formGroup) {
      formGroup.patchValue({
        usuarioEmprestimo: reserva.usuario,
        observacao: reserva.observacao
      });
    }

    this.documentoUsuario.set(reserva.usuario.documento);

    const newItems: EmprestimoItem[] = [];
    for (const reservaItem of reserva.reservaItem) {
      const emprestimoItem = new EmprestimoItem();
      emprestimoItem.item = reservaItem.item;
      emprestimoItem.qtde = reservaItem.qtde;
      newItems.push(emprestimoItem);
    }

    this.emprestimoItems.set(newItems);
    localStorage.removeItem('reserva-to-emprestimo');
  }

  /**
   * Patch form with object data
   */
  protected override patchFormWithObject(object: Emprestimo): void {
    const formGroup = this.form();
    if (formGroup) {
      formGroup.patchValue({
        id: object.id,
        usuarioEmprestimo: object.usuarioEmprestimo,
        usuarioResponsavel: object.usuarioResponsavel,
        dataEmprestimo: object.dataEmprestimo,
        prazoDevolucao: object.prazoDevolucao,
        dataDevolucao: object.dataDevolucao,
        observacao: object.observacao
      });
    }

    // Set items
    if (object.emprestimoItem) {
      this.emprestimoItems.set([...object.emprestimoItem]);
    }
  }

  /**
   * Prepare form value before saving
   */
  protected override prepareFormValue(formValue: Partial<Emprestimo>): Partial<Emprestimo> {
    const formGroup = this.form();
    const id = formGroup?.get('id')?.value;
    const usuarioResponsavel = formGroup?.get('usuarioResponsavel')?.value;
    const dataDevolucao = formGroup?.get('dataDevolucao')?.value;

    return {
      ...formValue,
      ...(id && {id}),
      usuarioResponsavel: usuarioResponsavel,
      ...(dataDevolucao && {dataDevolucao}),
      emprestimoItem: this.emprestimoItems()
    };
  }
}
