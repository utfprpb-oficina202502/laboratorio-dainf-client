import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {Pais} from './pais';
import {PaisService} from './pais.service';
import {
  PrimeReactiveCrudFormComponent
} from '../framework/component/prime-reactive-crud.form.component';

// PrimeNG
import {CardModule} from 'primeng/card';
import {InputTextModule} from 'primeng/inputtext';
import {ButtonModule} from 'primeng/button';
import {TooltipModule} from 'primeng/tooltip';

// Custom components
import {FormFieldComponent} from '../framework/component/form-field.component';
import {VoltarComponent} from '../geral/voltar/voltar.component';
import {CancelarComponent} from '../geral/cancelar/cancelar.component';
import {SalvarComponent} from '../geral/salvar/salvar.component';

@Component({
  selector: 'app-form-pais',
  templateUrl: './pais.form.component.html',
  styleUrls: ['./pais.form.component.css'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    // PrimeNG
    CardModule,
    InputTextModule,
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
export class PaisFormComponent extends PrimeReactiveCrudFormComponent<Pais, number> {
  protected override service = inject(PaisService);
  protected override urlList = '/pais';
  protected override type = Pais;
  private readonly fb = inject(FormBuilder);

  constructor() {
    super();
  }

  /**
   * Build the reactive form with validators
   */
  protected override buildForm(): FormGroup {
    return this.fb.group({
      id: [{ value: null, disabled: true }],
      nome: ['', [Validators.required, Validators.maxLength(255)]],
      sigla: ['', [Validators.required, Validators.maxLength(10)]]
    });
  }

  /**
   * Override to patch form with disabled id field
   */
  protected override patchFormWithObject(object: Pais): void {
    const formGroup = this.form();
    if (formGroup && 'id' in object) {
      formGroup.patchValue({
        id: object.id,
        nome: object.nome,
        sigla: object.sigla
      });
    }
  }

  /**
   * Override to prepare form value (include disabled id field)
   */
  protected override prepareFormValue(formValue: Partial<Pais>): Partial<Pais> {
    const formGroup = this.form();
    const id = formGroup?.get('id')?.value;
    return {
      ...formValue,
      ...(id && { id })
    };
  }
}
