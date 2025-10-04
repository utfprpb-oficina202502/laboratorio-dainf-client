import {ChangeDetectionStrategy, Component, inject, Injector, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {Estado} from './estado';
import {EstadoService} from './estado.service';
import {Pais} from '../pais/pais';
import {PaisService} from '../pais/pais.service';
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
  selector: 'app-form-estado',
  templateUrl: './estado.form.component.html',
  styleUrls: ['./estado.form.component.css'],
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
export class EstadoFormComponent extends PrimeReactiveCrudFormComponent<Estado, number> {
  protected estadoService: EstadoService;
  protected injector: Injector;

  private readonly fb = this.injector.get(FormBuilder);
  private readonly paisService = this.injector.get(PaisService);

  // Signal for autocomplete suggestions
  protected readonly paisList = signal<Pais[]>([]);

  constructor() {
    const estadoService = inject(EstadoService);
    const injector = inject(Injector);

    super(estadoService, injector, '/estado', Estado);

    this.estadoService = estadoService;
    this.injector = injector;
  }

  /**
   * Build the reactive form with validators
   */
  protected override buildForm(): FormGroup {
    return this.fb.group({
      id: [{ value: null, disabled: true }],
      nome: ['', [Validators.required, Validators.maxLength(255)]],
      uf: ['', [Validators.required, Validators.maxLength(2)]],
      pais: [null, [Validators.required]]
    });
  }

  /**
   * Search for countries (autocomplete)
   */
  findPaises(event: { query: string }): void {
    this.paisService.complete(event.query).subscribe({
      next: (paises) => {
        this.paisList.set(paises);
      }
    });
  }

  /**
   * Override to patch form with disabled id field
   */
  protected override patchFormWithObject(object: Estado): void {
    const formGroup = this.form();
    if (formGroup && 'id' in object) {
      formGroup.patchValue({
        id: object.id,
        nome: object.nome,
        uf: object.uf,
        pais: object.pais
      });
    }
  }

  /**
   * Override to prepare form value (include disabled id field)
   */
  protected override prepareFormValue(formValue: Partial<Estado>): Partial<Estado> {
    const formGroup = this.form();
    const id = formGroup?.get('id')?.value;
    return {
      ...formValue,
      ...(id && { id })
    };
  }
}
