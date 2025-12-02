import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
  signal
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {Subject, Subscription} from 'rxjs';
import {debounceTime, distinctUntilChanged, takeUntil} from 'rxjs/operators';
import {Z_INDEX} from '../framework/constants';
import {Grupo} from './grupo';
import {GrupoService} from './grupo.service';
import {
  PrimeReactiveCrudFormComponent
} from '../framework/component/prime-reactive-crud.form.component';
import {Item} from '../item/item';
import {TableModule, TablePageEvent} from 'primeng/table';

// PrimeNG Modules
import {DialogModule} from 'primeng/dialog';
import {InputTextModule} from 'primeng/inputtext';
import {TooltipModule} from 'primeng/tooltip';
import {CardModule} from 'primeng/card';
import {ButtonModule} from 'primeng/button';
import {ProgressSpinnerModule} from 'primeng/progressspinner';
import {IconFieldModule} from 'primeng/iconfield';
import {InputIconModule} from 'primeng/inputicon';

// Custom Components
import {VoltarComponent} from '../geral/voltar/voltar.component';
import {CancelarComponent} from '../geral/cancelar/cancelar.component';
import {SalvarComponent} from '../geral/salvar/salvar.component';
import {FormFieldComponent} from '../framework/component/form-field.component';
import {LoggerService} from '../framework/services/logger.service';

@Component({
  selector: 'app-form-grupo',
  templateUrl: './grupo.form.component.html',
  styleUrls: ['./grupo.form.component.css'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    // PrimeNG
    CardModule,
    InputTextModule,
    ButtonModule,
    TooltipModule,
    DialogModule,
    TableModule,
    ProgressSpinnerModule,
    IconFieldModule,
    InputIconModule,
    // Custom
    VoltarComponent,
    CancelarComponent,
    SalvarComponent,
    FormFieldComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GrupoFormComponent extends PrimeReactiveCrudFormComponent<Grupo, number> implements OnInit, OnDestroy {
  // Constants for template
  protected readonly Z_INDEX = Z_INDEX;

  protected override service = inject(GrupoService);
  protected override urlList = '/grupo';
  protected override type = Grupo;
  private readonly fb = inject(FormBuilder);
  protected readonly logger = inject(LoggerService);
  private itensVinculadosSubscription?: Subscription;

  // Signals for dialog state and related items
  protected readonly dialogItensVinculados = signal(false);
  protected readonly itensVinculados = signal<Item[]>([]);
  protected readonly loadingItensVinculados = signal(false);

  // Pagination signals
  protected readonly totalItensVinculados = signal(0);
  protected readonly pageIndexItens = signal(0);
  protected readonly pageSizeItens = signal(25);
  protected readonly firstItens = signal(0);

  // Filter for items
  protected filtroItens = '';
  private readonly filterSubject = new Subject<string>();

  // Computed signal for whether to show the "Itens Vinculados" button
  protected readonly canShowItensVinculados = computed(() => {
    const obj = this.object();
    return !!(obj && 'id' in obj && obj.id);
  });

  constructor() {
    super();
  }

  ngOnInit(): void {
    super.ngOnInit();
    this.setupDebouncedFiltering();
  }

  /**
   * Show dialog with linked items
   */
  showDialogItensVinculados(): void {
    // Reset pagination and filter when opening dialog
    this.pageIndexItens.set(0);
    this.firstItens.set(0);
    this.filtroItens = '';
    this.dialogItensVinculados.set(true);
    this.findItensVinculados();
  }

  /**
   * Build the reactive form with validators
   */
  protected override buildForm(): FormGroup {
    return this.fb.group({
      id: [{ value: null, disabled: true }],
      descricao: ['', [Validators.required, Validators.maxLength(255)]]
    });
  }

  /**
   * Handle page change event from p-table
   */
  onPageChangeItens(event: TablePageEvent): void {
    this.pageIndexItens.set(Math.floor((event.first ?? 0) / (event.rows ?? 25)));
    this.pageSizeItens.set(event.rows ?? 25);
    this.firstItens.set(event.first ?? 0);
    this.findItensVinculados();
  }

  /**
   * Handle filter input change
   */
  onFilterItens(filter: string): void {
    this.filterSubject.next(filter);
  }

  /**
   * Cleanup on component destroy
   */
  override ngOnDestroy(): void {
    this.cancelItensVinculadosRequest();
    super.ngOnDestroy();
  }

  /**
   * Cancel ongoing request for linked items
   */
  cancelItensVinculadosRequest(): void {
    if (this.itensVinculadosSubscription && !this.itensVinculadosSubscription.closed) {
      this.itensVinculadosSubscription.unsubscribe();
      this.loadingItensVinculados.set(false);
      this.loaderService.hide();
    }
  }

  /**
   * Setup debounced filtering for items search
   */
  private setupDebouncedFiltering(): void {
    this.filterSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(filter => {
      this.filtroItens = filter;
      this.pageIndexItens.set(0);
      this.firstItens.set(0);
      this.findItensVinculados();
    });
  }

  /**
   * Fetch items linked to this group with pagination
   */
  private findItensVinculados(): void {
    const obj = this.object();
    if (!obj || !('id' in obj) || !obj.id) {
      return;
    }

    // Cancel any existing request
    this.cancelItensVinculadosRequest();

    this.loadingItensVinculados.set(true);

    this.itensVinculadosSubscription = this.service.findItensVinculados(
      obj.id,
      this.pageIndexItens(),
      this.pageSizeItens(),
      this.filtroItens
    ).subscribe({
      next: (pageResponse) => {
        this.loadingItensVinculados.set(false);
        this.itensVinculados.set(pageResponse.content);
        this.totalItensVinculados.set(pageResponse.totalElements);

        // Close dialog and show message if no items found
        if (pageResponse.totalElements === 0 && !this.filtroItens) {
          this.dialogItensVinculados.set(false);
          this.messageService.add({
            severity: 'info',
            summary: 'Ops...',
            detail: 'Não existe nenhum item vinculado ao grupo.',
            life: 4000
          });
        }
      },
      error: (error) => {
        this.loadingItensVinculados.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Erro ao buscar itens vinculados.',
          life: 5000
        });
        this.logger.error('Erro ao buscar itens vinculados', error);
      }
    });
  }

  /**
   * Override to patch form with disabled id field
   */
  protected override patchFormWithObject(object: Grupo): void {
    const formGroup = this.form();
    if (formGroup && 'id' in object) {
      formGroup.patchValue({
        id: object.id,
        descricao: object.descricao
      });
    }
  }

  /**
   * Override to prepare form value (include disabled id field)
   */
  protected override prepareFormValue(formValue: Partial<Grupo>): Partial<Grupo> {
    const formGroup = this.form();
    const id = formGroup?.get('id')?.value;
    return {
      ...formValue,
      ...(id && { id })
    };
  }
}
