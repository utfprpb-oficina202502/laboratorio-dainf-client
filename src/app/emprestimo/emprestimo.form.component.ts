import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {CommonModule, NgOptimizedImage} from '@angular/common';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {Emprestimo} from './emprestimo';
import {EmprestimoService} from './emprestimo.service';
import {
  PrimeReactiveCrudFormComponent
} from '../framework/component/prime-reactive-crud.form.component';
import {EmprestimoItem} from './emprestimoItem';
import {Item} from '../item/item';
import {ItemService} from '../item/item.service';
import {UsuarioService} from '../usuario/usuario.service';
import {Usuario} from '../usuario/usuario';
import {SelectItem} from 'primeng/api';
import {environment} from 'src/environments/environment';

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
    // Custom
    FormFieldComponent,
    VoltarComponent,
    CancelarComponent,
    SalvarComponent,
    NgOptimizedImage
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmprestimoFormComponent extends PrimeReactiveCrudFormComponent<Emprestimo, number> {
  protected override service = inject(EmprestimoService);
  protected override urlList = '/emprestimo';
  protected override type = Emprestimo;
  private readonly fb = inject(FormBuilder);
  private readonly itemService = inject(ItemService);
  private readonly usuarioService = inject(UsuarioService);
  protected readonly logger = inject(LoggerService);

  // State signals
  protected readonly itemList = signal<Item[]>([]);
  protected readonly usuarioList = signal<Usuario[]>([]);
  protected readonly emprestimoItems = signal<EmprestimoItem[]>([]);
  protected readonly maxDateEmprestimo = signal<Date>(new Date());
  protected readonly minDatePrazoDevolucao = signal<Date | undefined>(undefined);
  protected readonly documentoUsuario = signal<string>('');
  protected readonly disableForm = signal<boolean>(false);
  protected readonly idReserva = signal<number>(0);
  protected readonly minioUrl = signal<string>(environment.minio_url);

  // Temporary signals for adding items
  protected readonly tempItem = signal<Item | null>(null);
  protected readonly tempQtde = signal<number>(1);
  protected readonly tempDevolver = signal<boolean | null>(null);

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
   * Autocomplete for Items
   */
  findProdutos(event: AutoCompleteCompleteEvent): void {
    this.itemService.completeItem(event.query, true).subscribe({
      next: (e) => {
        this.itemList.set(e);
      }
    });
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
      next: (e) => {
        this.usuarioList.set(e);
        if (e !== null && e.length === 1) {
          const formGroup = this.form();
          if (formGroup) {
            formGroup.patchValue({usuarioEmprestimo: e[0]});
            this.documentoUsuario.set(e[0].documento);
          }
        }
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
        this.messageService.add({
          severity: 'error',
          summary: 'Atenção!',
          detail: 'Ocorreu um erro ao salvar o registro!',
          life: 5000
        });
        this.logger.error('Erro ao buscar itens', error);
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
    const existingIndex = currentItems.findIndex(ei => ei.item.id === item.id);

    if (existingIndex >= 0) {
      const novaQtde = Number(currentItems[existingIndex].qtde) + Number(qtde);
      if (this.validateItemSaldo(item, novaQtde)) {
        currentItems[existingIndex].qtde = novaQtde;
      }
    } else {
      const newEmprestimoItem = new EmprestimoItem();
      newEmprestimoItem.item = item;
      newEmprestimoItem.qtde = qtde;
      newEmprestimoItem.devolver = this.tempDevolver() ?? false;
      currentItems.push(newEmprestimoItem);
    }

    this.emprestimoItems.set(currentItems);

    // Reset temp values
    this.tempItem.set(null);
    this.tempQtde.set(1);
    this.tempDevolver.set(null);
  }

  /**
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
    const isAluno = this.isAlunoOrProfessor();
    const obj = this.object();
    const hasDevolucao = obj && 'dataDevolucao' in obj && !!obj.dataDevolucao;

    if (isAluno || hasDevolucao) {
      this.disableForm.set(true);
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
