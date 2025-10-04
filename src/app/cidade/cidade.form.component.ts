import {ChangeDetectionStrategy, Component, inject, Injector, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {Cidade} from './cidade';
import {CidadeService} from './cidade.service';
import {Estado} from '../estado/estado';
import {EstadoService} from '../estado/estado.service';
import {
  PrimeReactiveCrudFormComponent
} from '../framework/component/prime-reactive-crud.form.component';

// PrimeNG
import {CardModule} from 'primeng/card';
import {InputTextModule} from 'primeng/inputtext';
import {AutoCompleteModule} from 'primeng/autocomplete';
import {ButtonModule} from 'primeng/button';
import {TooltipModule} from 'primeng/tooltip';

// Custom components
import {FormFieldComponent} from '../framework/component/form-field.component';
import {VoltarComponent} from '../geral/voltar/voltar.component';
import {CancelarComponent} from '../geral/cancelar/cancelar.component';
import {SalvarComponent} from '../geral/salvar/salvar.component';

@Component({
  selector: 'app-form-cidade',
  templateUrl: './cidade.form.component.html',
  styleUrls: ['./cidade.form.component.css'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    // PrimeNG
    CardModule,
    InputTextModule,
    AutoCompleteModule,
    ButtonModule,
    TooltipModule,
    // Custom
    FormFieldComponent,
    VoltarComponent,
    CancelarComponent,
    SalvarComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CidadeFormComponent extends PrimeReactiveCrudFormComponent<Cidade, number> {
  protected cidadeService: CidadeService;
  protected injector: Injector;

  private readonly fb = this.injector.get(FormBuilder);
  private readonly estadoService = this.injector.get(EstadoService);

  // Signal for autocomplete suggestions
  protected readonly estadosList = signal<Estado[]>([]);

  constructor() {
    const cidadeService = inject(CidadeService);
    const injector = inject(Injector);

    super(cidadeService, injector, '/cidade', Cidade);

    this.cidadeService = cidadeService;
    this.injector = injector;
  }

  /**
   * Build the reactive form with validators
   */
  protected override buildForm(): FormGroup {
    return this.fb.group({
      id: [{ value: null, disabled: true }],
      nome: ['', [Validators.required, Validators.maxLength(255)]],
      estado: [null, [Validators.required]]
    });
  }

  /**
   * Search for states (autocomplete)
   */
  findEstados(event: { query: string }): void {
    this.estadoService.complete(event.query).subscribe({
      next: (estados) => {
        this.estadosList.set(estados);
      }
    });
  }

  /**
   * Override to patch form with disabled id field
   */
  protected override patchFormWithObject(object: Cidade): void {
    const formGroup = this.form();
    if (formGroup && 'id' in object) {
      formGroup.patchValue({
        id: object.id,
        nome: object.nome,
        estado: object.estado
      });
    }
  }

  /**
   * Override to prepare form value (include disabled id field)
   */
  protected override prepareFormValue(formValue: Partial<Cidade>): Partial<Cidade> {
    const formGroup = this.form();
    const id = formGroup?.get('id')?.value;
    return {
      ...formValue,
      ...(id && { id })
    };
  }
}
