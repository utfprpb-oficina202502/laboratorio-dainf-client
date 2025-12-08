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
   * Generate a unique temporary ID for matching items before backend persistence
   * Uses cryptographically secure random number generator (CSPRNG)
   */
  private generateTempId(): string {
    // Use crypto.getRandomValues() for cryptographically secure random values
    const array = new Uint32Array(2);
    crypto.getRandomValues(array);
    const randomPart = array[0].toString(36) + array[1].toString(36);
    return `temp_${Date.now()}_${randomPart}`;
  }

  /**
   * Robust matching strategy for finding corresponding EmprestimoDevolucaoItem
   *
   * IMPORTANT: This method does NOT assume arrays are aligned by position.
   * Instead, it uses multiple identification strategies to find the correct match:
   *
   * 1. Try matching by tempId (for newly created items) - MOST RELIABLE
   * 2. Try matching by emprestimoItem.id (for persisted items with unique IDs) - RELIABLE
   * 3. Fallback to matching by item.id + qtde (exact match) - LESS RELIABLE for duplicates
   *
   * For duplicate items (same item.id and qtde), the method uses occurrence counting
   * to maintain positional correlation within the subset of matching items.
   *
   * @param emprestimoItem The emprestimo item to find the corresponding devolucao item for
   * @returns The corresponding EmprestimoDevolucaoItem or null if not found
   */
  private findCorrespondingDevolucaoItemRobust(emprestimoItem: EmprestimoItem): EmprestimoDevolucaoItem | null {
    const emprestimo = this.object();
    if (!emprestimo?.emprestimoDevolucaoItem || !emprestimo?.emprestimoItem) {
      return null;
    }

    // Validate array synchronization
    this.validateArraySynchronization(emprestimo);

    // Strategy 1: Try matching by tempId (for newly created items)
    const tempIdMatch = this.findByTempId(emprestimo, emprestimoItem);
    if (tempIdMatch) {
      return tempIdMatch;
    }

    // Strategy 2: Try matching by backend emprestimoItem.id (unique identifier)
    if (emprestimoItem.id) {
      const backendMatch = this.findByBackendId(emprestimo, emprestimoItem);
      if (backendMatch) {
        return backendMatch;
      }
    }

    // Strategy 3: Fallback to matching by item.id and qtde
    return this.findByItemIdAndQtde(emprestimo, emprestimoItem);
  }

  /**
   * Validate that emprestimoItem and emprestimoDevolucaoItem arrays are properly synchronized
   * Logs warnings if inconsistencies are detected
   */
  private validateArraySynchronization(emprestimo: Emprestimo): void {
    if (!emprestimo.emprestimoItem || !emprestimo.emprestimoDevolucaoItem) {
      return;
    }

    const emprestimoLength = emprestimo.emprestimoItem.length;
    const devolucaoLength = emprestimo.emprestimoDevolucaoItem.length;

    // Arrays should have the same length for backend data
    if (emprestimoLength !== devolucaoLength && emprestimo.id) {
      this.logger.warn(
        `Array synchronization issue detected: emprestimoItem has ${emprestimoLength} items ` +
        `but emprestimoDevolucaoItem has ${devolucaoLength} items. Emprestimo ID: ${emprestimo.id}`
      );
    }

    // Validate that each emprestimoItem has a corresponding devolucaoItem
    if (emprestimo.id) {
      for (const emprestimoItem of emprestimo.emprestimoItem) {
        const hasMatch = emprestimo.emprestimoDevolucaoItem.some(
          edi => edi.item.id === emprestimoItem.item.id &&
                 Number(edi.qtde) === Number(emprestimoItem.qtde)
        );
        if (!hasMatch && !emprestimoItem.tempId) {
          this.logger.warn(
            `No matching devolucaoItem found for emprestimoItem with item.id=${emprestimoItem.item.id} ` +
            `and qtde=${emprestimoItem.qtde}. Emprestimo ID: ${emprestimo.id}`
          );
        }
      }
    }
  }

  /**
   * Find devolucaoItem by tempId (most reliable for newly created items)
   */
  private findByTempId(emprestimo: Emprestimo, emprestimoItem: EmprestimoItem): EmprestimoDevolucaoItem | null {
    if (!emprestimoItem.tempId) {
      return null;
    }
    return emprestimo.emprestimoDevolucaoItem.find(
      edi => edi.tempId === emprestimoItem.tempId
    ) || null;
  }

  /**
   * Find devolucaoItem by backend emprestimoItem.id (reliable for persisted items)
   *
   * This method:
   * 1. Finds the emprestimoItem in backend array by its unique ID
   * 2. Searches for devolucaoItems with matching item.id and qtde
   * 3. If multiple matches exist, uses occurrence counting to find the correct one
   *
   * @param emprestimo The emprestimo object containing both arrays
   * @param emprestimoItem The item to find the corresponding devolucao for
   * @returns The corresponding EmprestimoDevolucaoItem or null
   */
  private findByBackendId(emprestimo: Emprestimo, emprestimoItem: EmprestimoItem): EmprestimoDevolucaoItem | null {
    const backendEmprestimoItem = emprestimo.emprestimoItem.find(ei => ei.id === emprestimoItem.id);
    if (!backendEmprestimoItem) {
      this.logger.warn(
        `Backend emprestimoItem not found for ID ${emprestimoItem.id}. ` +
        `This may indicate data inconsistency.`
      );
      return null;
    }

    const matches = emprestimo.emprestimoDevolucaoItem.filter(
      edi => edi.item.id === backendEmprestimoItem.item.id &&
             Number(edi.qtde) === Number(backendEmprestimoItem.qtde)
    );

    if (matches.length === 0) {
      this.logger.warn(
        `No matching devolucaoItem found for emprestimoItem ID ${emprestimoItem.id} ` +
        `(item.id=${backendEmprestimoItem.item.id}, qtde=${backendEmprestimoItem.qtde})`
      );
      return null;
    }

    if (matches.length === 1) {
      return matches[0];
    }

    // Multiple matches: use occurrence-based matching
    if (matches.length > 1) {
      this.logger.debug(
        `Multiple devolucaoItems found for emprestimoItem ID ${emprestimoItem.id}. ` +
        `Using occurrence-based matching.`
      );
      return this.findNthMatchByPosition(emprestimo, emprestimoItem, backendEmprestimoItem);
    }

    return null;
  }

  /**
   * Find the Nth match by position correlation for duplicate items
   *
   * When multiple emprestimoItems have the same item.id and qtde, this method
   * determines which specific one we're looking for by counting how many matching
   * items appear before it in the emprestimoItem array, then finding the corresponding
   * Nth occurrence in the emprestimoDevolucaoItem array.
   *
   * This maintains correlation for duplicates without assuming array alignment.
   *
   * @param emprestimo The emprestimo object
   * @param emprestimoItem The original item being searched
   * @param backendEmprestimoItem The backend emprestimoItem found by ID
   * @returns The corresponding EmprestimoDevolucaoItem or null
   */
  private findNthMatchByPosition(
    emprestimo: Emprestimo,
    emprestimoItem: EmprestimoItem,
    backendEmprestimoItem: EmprestimoItem
  ): EmprestimoDevolucaoItem | null {
    const backendIndex = emprestimo.emprestimoItem.findIndex(ei => ei.id === emprestimoItem.id);
    if (backendIndex < 0) {
      this.logger.warn(
        `Backend index not found for emprestimoItem ID ${emprestimoItem.id} ` +
        `despite previous successful lookup. Data may have changed.`
      );
      return null;
    }

    const countBefore = this.countMatchingItemsBefore(
      emprestimo.emprestimoItem,
      backendEmprestimoItem,
      backendIndex
    );

    const result = this.findNthMatchingDevolucaoItem(
      emprestimo.emprestimoDevolucaoItem,
      backendEmprestimoItem,
      countBefore
    );

    if (!result) {
      this.logger.warn(
        `Failed to find ${countBefore}th occurrence of devolucaoItem ` +
        `for item.id=${backendEmprestimoItem.item.id}, qtde=${backendEmprestimoItem.qtde}`
      );
    }

    return result;
  }

  /**
   * Count matching items before a given index
   */
  private countMatchingItemsBefore(
    items: EmprestimoItem[],
    target: EmprestimoItem,
    beforeIndex: number
  ): number {
    let count = 0;
    for (let i = 0; i < beforeIndex; i++) {
      const ei = items[i];
      if (ei.item.id === target.item.id && Number(ei.qtde) === Number(target.qtde)) {
        count++;
      }
    }
    return count;
  }

  /**
   * Find the Nth matching devolucaoItem
   */
  private findNthMatchingDevolucaoItem(
    devolucaoItems: EmprestimoDevolucaoItem[],
    target: EmprestimoItem,
    occurrenceNumber: number
  ): EmprestimoDevolucaoItem | null {
    let currentCount = 0;
    for (const edi of devolucaoItems) {
      if (edi.item.id === target.item.id && Number(edi.qtde) === Number(target.qtde)) {
        if (currentCount === occurrenceNumber) {
          return edi;
        }
        currentCount++;
      }
    }
    return null;
  }

  /**
   * Find devolucaoItem by item.id and qtde (fallback for items without unique IDs)
   *
   * WARNING: This is the least reliable matching strategy and should only be used
   * when tempId and backend ID are not available (e.g., for newly created items
   * before they're synced with backend).
   *
   * For duplicate items (same item.id and qtde), this uses occurrence counting
   * which can fail if arrays become desynchronized.
   *
   * @param emprestimo The emprestimo object
   * @param emprestimoItem The item to find
   * @returns The corresponding EmprestimoDevolucaoItem or null
   */
  private findByItemIdAndQtde(emprestimo: Emprestimo, emprestimoItem: EmprestimoItem): EmprestimoDevolucaoItem | null {
    const matches = emprestimo.emprestimoDevolucaoItem.filter(
      edi => edi.item.id === emprestimoItem.item.id &&
             Number(edi.qtde) === Number(emprestimoItem.qtde)
    );

    if (matches.length === 1) {
      return matches[0];
    }

    if (matches.length > 1) {
      const emprestimoItemsArray = this.emprestimoItems();
      const index = emprestimoItemsArray.indexOf(emprestimoItem);

      if (index === -1) {
        return null;
      }

      const occurrenceNumber = this.countOccurrencesBefore(
        emprestimoItemsArray,
        emprestimoItem,
        index
      );

      return this.findNthDevolucaoItemOccurrence(
        emprestimo.emprestimoDevolucaoItem,
        emprestimoItem,
        occurrenceNumber
      );
    }

    return null;
  }

  /**
   * Find the Nth occurrence of a matching devolucaoItem
   */
  private findNthDevolucaoItemOccurrence(
    devolucaoItems: EmprestimoDevolucaoItem[],
    target: EmprestimoItem,
    occurrenceNumber: number
  ): EmprestimoDevolucaoItem | null {
    let count = 0;
    let currentIndex = 0;

    for (const devolucaoItem of devolucaoItems) {
      if (devolucaoItem.item.id === target.item.id &&
          Number(devolucaoItem.qtde) === Number(target.qtde)) {
        if (count === occurrenceNumber) {
          return devolucaoItems[currentIndex];
        }
        count++;
      }
      currentIndex++;
    }
    return null;
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
      if (item.tipoItem === 'P') {
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

    // Sync with emprestimoDevolucaoItem BEFORE updating quantity
    // This is crucial because findCorrespondingDevolucaoItemRobust uses the current qtde to find matches
    const emprestimo = this.object();
    if (emprestimo?.emprestimoDevolucaoItem) {
      // Use the original item from emprestimoItems() signal for robust matching
      const originalEmprestimoItems = this.emprestimoItems();
      const originalItem = originalEmprestimoItems[index];

      if (originalItem) {
        const devolucaoItem = this.findCorrespondingDevolucaoItemRobust(originalItem);
        if (devolucaoItem) {
          devolucaoItem.qtde = novaQtde;
        }
      }
    }

    // Update quantity AFTER finding and updating devolucaoItem
    currentItems[index].qtde = novaQtde;
  }

  /**
   * Create a new EmprestimoItem and sync with backend if editing
   */
  private createNewEmprestimoItem(currentItems: EmprestimoItem[], item: Item, qtde: number): void {
    const tempId = this.generateTempId();
    const newEmprestimoItem = new EmprestimoItem();
    newEmprestimoItem.item = item;
    newEmprestimoItem.qtde = qtde;
    // Set devolver based on item type: true for permanent (P), false for consumable (C)
    newEmprestimoItem.devolver = item.tipoItem === 'P';
    newEmprestimoItem.tempId = tempId;
    currentItems.push(newEmprestimoItem);

    // Sync with emprestimo object if editing
    const emprestimo = this.object();
    if (emprestimo?.emprestimoItem) {
      emprestimo.emprestimoItem.push(newEmprestimoItem);
      // Create devolucaoItem only for permanent items (devolver = true)
      if (newEmprestimoItem.devolver) {
        this.createCorrespondingDevolucaoItem(emprestimo, item, qtde, tempId);
      }
    }
  }

  /**
   * Create corresponding EmprestimoDevolucaoItem with status 'P'
   */
  private createCorrespondingDevolucaoItem(emprestimo: Emprestimo, item: Item, qtde: number, tempId: string): void {
    if (!emprestimo.emprestimoDevolucaoItem) {
      return;
    }

    const newDevolucaoItem = new EmprestimoDevolucaoItem();
    newDevolucaoItem.item = item;
    newDevolucaoItem.qtde = qtde;
    newDevolucaoItem.statusDevolucao = StatusDevolucao.P;
    newDevolucaoItem.tempId = tempId; // Set matching tempId for robust correlation
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
   * Uses occurrence-based matching to handle duplicate items correctly
   */
  removeItemByIndex(index: number): void {
    const currentItems = [...this.emprestimoItems()];

    if (index < 0 || index >= currentItems.length) {
      return;
    }

    const itemToRemove = currentItems[index];

    currentItems.splice(index, 1);
    this.emprestimoItems.set(currentItems);

    this.syncRemovalWithBackend(itemToRemove, index);
  }

  /**
   * Sync removal with backend arrays (emprestimoItem and emprestimoDevolucaoItem)
   * Uses occurrence-based matching to ensure the correct item is removed
   */
  private syncRemovalWithBackend(itemToRemove: EmprestimoItem, removalIndex: number): void {
    const emprestimo = this.object();
    if (!emprestimo?.emprestimoItem) {
      return;
    }

    const emprestimoItemIndex = this.findEmprestimoItemIndexByOccurrence(emprestimo, itemToRemove, removalIndex);
    const devolucaoItemIndex = this.findDevolucaoItemIndexByOccurrence(emprestimo, itemToRemove, removalIndex);

    if (emprestimoItemIndex >= 0) {
      emprestimo.emprestimoItem.splice(emprestimoItemIndex, 1);
    }

    if (devolucaoItemIndex >= 0 && emprestimo.emprestimoDevolucaoItem) {
      emprestimo.emprestimoDevolucaoItem.splice(devolucaoItemIndex, 1);
    }
  }

  /**
   * Find the index of emprestimoItem to remove using occurrence-based matching
   * Counts how many matching items appear before the removal index, then finds the Nth occurrence
   */
  private findEmprestimoItemIndexByOccurrence(
    emprestimo: Emprestimo,
    itemToRemove: EmprestimoItem,
    removalIndex: number
  ): number {
    // For items with tempId, use direct matching (newly created items)
    if (itemToRemove.tempId) {
      return emprestimo.emprestimoItem.findIndex(ei => ei.tempId === itemToRemove.tempId);
    }

    // For items with backend ID, use direct matching (persisted items with unique IDs)
    if (itemToRemove.id) {
      return emprestimo.emprestimoItem.findIndex(ei => ei.id === itemToRemove.id);
    }

    // For items without unique identifiers, use occurrence-based matching
    // Count how many items with same item.id and qtde appear BEFORE the removal index
    const occurrenceNumber = this.countOccurrencesBefore(
      this.emprestimoItems(),
      itemToRemove,
      removalIndex
    );

    // Find the Nth occurrence in the backend array
    return this.findNthOccurrence(
      emprestimo.emprestimoItem,
      itemToRemove,
      occurrenceNumber
    );
  }

  /**
   * Find the index of emprestimoDevolucaoItem to remove using occurrence-based matching
   */
  private findDevolucaoItemIndexByOccurrence(
    emprestimo: Emprestimo,
    itemToRemove: EmprestimoItem,
    removalIndex: number
  ): number {
    if (!emprestimo.emprestimoDevolucaoItem) {
      return -1;
    }

    // For items with tempId or backend ID, use robust matching
    if (itemToRemove.tempId || itemToRemove.id) {
      const devolucaoItem = this.findCorrespondingDevolucaoItemRobust(itemToRemove);
      return devolucaoItem ? emprestimo.emprestimoDevolucaoItem.indexOf(devolucaoItem) : -1;
    }

    // For items without unique identifiers, use occurrence-based matching
    const occurrenceNumber = this.countOccurrencesBefore(
      this.emprestimoItems(),
      itemToRemove,
      removalIndex
    );

    return this.findNthItemOccurrence(
      emprestimo.emprestimoDevolucaoItem,
      itemToRemove,
      occurrenceNumber
    );
  }

  /**
   * Count how many items with the same item.id and qtde appear before the given index
   */
  private countOccurrencesBefore(
    items: EmprestimoItem[],
    target: EmprestimoItem,
    beforeIndex: number
  ): number {
    let count = 0;
    for (let i = 0; i < beforeIndex && i < items.length; i++) {
      if (items[i].item.id === target.item.id && Number(items[i].qtde) === Number(target.qtde)) {
        count++;
      }
    }
    return count;
  }

  /**
   * Find the Nth occurrence of an item in emprestimoItem array
   */
  private findNthOccurrence(
    items: EmprestimoItem[],
    target: EmprestimoItem,
    occurrenceNumber: number
  ): number {
    return this.findNthItemOccurrence(items, target, occurrenceNumber);
  }

  /**
   * Find the Nth occurrence of an item in either emprestimoItem or emprestimoDevolucaoItem array
   * Generic method that works with both item types
   */
  private findNthItemOccurrence<T extends { item: { id: number }, qtde: number }>(
    items: T[],
    target: EmprestimoItem,
    occurrenceNumber: number
  ): number {
    let count = 0;
    for (let i = 0; i < items.length; i++) {
      if (items[i].item.id === target.item.id && Number(items[i].qtde) === Number(target.qtde)) {
        if (count === occurrenceNumber) {
          return i;
        }
        count++;
      }
    }
    return -1;
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
   * Uses robust matching strategy with multiple fallbacks
   */
  getStatusDevolucao(emprestimoItem: EmprestimoItem): StatusDevolucao | null {
    const devolucaoItem = this.findCorrespondingDevolucaoItemRobust(emprestimoItem);
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
    if (!reservaData) {
      this.logger.warn('Nenhum dado de reserva encontrado no localStorage');
      return;
    }

    const reserva = JSON.parse(reservaData);
    this.logger.info('Gerando empréstimo a partir da reserva:', reserva);
    this.idReserva.set(reserva.id);

    const formGroup = this.form();
    if (formGroup) {
      formGroup.patchValue({
        usuarioEmprestimo: reserva.usuario,
        observacao: reserva.observacao
      });
    }

    if (reserva.usuario?.documento) {
      this.documentoUsuario.set(reserva.usuario.documento);
    }

    const newItems: EmprestimoItem[] = [];
    if (reserva.reservaItem && Array.isArray(reserva.reservaItem)) {
      for (const reservaItem of reserva.reservaItem) {
        const emprestimoItem = new EmprestimoItem();
        emprestimoItem.item = reservaItem.item;
        emprestimoItem.qtde = reservaItem.qtde;
        // Set devolver based on item type: true for permanent (P), false for consumable (C)
        emprestimoItem.devolver = reservaItem.item.tipoItem === 'P';
        newItems.push(emprestimoItem);
      }
      this.logger.info(`${newItems.length} itens carregados da reserva`);
    } else {
      this.logger.warn('Nenhum reservaItem encontrado na reserva');
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
