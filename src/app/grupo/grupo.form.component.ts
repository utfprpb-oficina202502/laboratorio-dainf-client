import { Component, Injector, ChangeDetectionStrategy, signal, computed, OnDestroy, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Grupo } from './grupo';
import { GrupoService } from './grupo.service';
import { PrimeReactiveCrudFormComponent } from '../framework/component/prime-reactive-crud.form.component';
import { Item } from '../item/item';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-form-grupo',
  templateUrl: './grupo.form.component.html',
  styleUrls: ['./grupo.form.component.css'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GrupoFormComponent extends PrimeReactiveCrudFormComponent<Grupo, number> implements OnDestroy {
  protected grupoService: GrupoService;
  protected injector: Injector;

  private readonly fb = this.injector.get(FormBuilder);
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
    const grupoService = inject(GrupoService);
    const injector = inject(Injector);

    super(grupoService, injector, '/grupo', Grupo);
  
    this.grupoService = grupoService;
    this.injector = injector;
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

    this.itensVinculadosSubscription = this.grupoService.findItensVinculados(obj.id).subscribe({
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
