import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnDestroy,
  signal
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {Subscription} from 'rxjs';
import {Grupo} from './grupo';
import {GrupoService} from './grupo.service';
import {
  PrimeReactiveCrudFormComponent
} from '../framework/component/prime-reactive-crud.form.component';
import {Item} from '../item/item';
import Swal from 'sweetalert2';

// PrimeNG Modules
import {DialogModule} from 'primeng/dialog';
import {InputTextModule} from 'primeng/inputtext';
import {TooltipModule} from 'primeng/tooltip';
import {CardModule} from 'primeng/card';
import {ButtonModule} from 'primeng/button';
import {TableModule} from 'primeng/table';
import {ProgressSpinnerModule} from 'primeng/progressspinner';

// Custom Components
import {VoltarComponent} from '../geral/voltar/voltar.component';
import {CancelarComponent} from '../geral/cancelar/cancelar.component';
import {SalvarComponent} from '../geral/salvar/salvar.component';
import {FormFieldComponent} from '../framework/component/form-field.component';

@Component({
  selector: 'app-form-grupo',
  templateUrl: './grupo.form.component.html',
  styleUrls: ['./grupo.form.component.css'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    // PrimeNG
    CardModule,
    InputTextModule,
    ButtonModule,
    TooltipModule,
    DialogModule,
    TableModule,
    ProgressSpinnerModule,
    // Custom
    VoltarComponent,
    CancelarComponent,
    SalvarComponent,
    FormFieldComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GrupoFormComponent extends PrimeReactiveCrudFormComponent<Grupo, number> implements OnDestroy {
  protected override service = inject(GrupoService);
  protected override urlList = '/grupo';
  protected override type = Grupo;
  private readonly fb = inject(FormBuilder);
  private itensVinculadosSubscription?: Subscription;

  // Signals for dialog state and related items
  protected readonly dialogItensVinculados = signal(false);
  protected readonly itensVinculados = signal<Item[]>([]);
  protected readonly loadingItensVinculados = signal(false);

  // Computed signal for whether to show the "Itens Vinculados" button
  protected readonly canShowItensVinculados = computed(() => {
    const obj = this.object();
    return !!(obj && 'id' in obj && obj.id);
  });

  constructor() {
    super();
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
   * Show dialog with linked items
   */
  showDialogItensVinculados(): void {
    this.findItensVinculados();
  }

  /**
   * Fetch items linked to this group
   */
  private findItensVinculados(): void {
    const obj = this.object();
    if (!obj || !('id' in obj) || !obj.id) {
      return;
    }

    // Cancel any existing request
    this.cancelItensVinculadosRequest();

    this.loadingItensVinculados.set(true);
    this.loaderService.showWithCancel(
      () => this.cancelItensVinculadosRequest(),
      'Cancelar Busca'
    );

    this.itensVinculadosSubscription = this.service.findItensVinculados(obj.id).subscribe({
      next: (items) => {
        this.loadingItensVinculados.set(false);
        this.loaderService.hide();
        if (items.length === 0) {
          Swal.fire('Ops...', 'Não existe nenhum item vinculado ao grupo.', 'info');
        } else {
          this.itensVinculados.set(items);
          this.dialogItensVinculados.set(true);
        }
      },
      error: (error) => {
        this.loadingItensVinculados.set(false);
        this.loaderService.hide();
        Swal.fire('Erro', 'Erro ao buscar itens vinculados.', 'error');
        console.error(error);
      }
    });
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
   * Cleanup on component destroy
   */
  ngOnDestroy(): void {
    this.cancelItensVinculadosRequest();
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
