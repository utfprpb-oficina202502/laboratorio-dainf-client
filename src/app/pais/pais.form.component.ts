import { Component, Injector, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Pais } from './pais';
import { PaisService } from './pais.service';
import { PrimeReactiveCrudFormComponent } from '../framework/component/prime-reactive-crud.form.component';

@Component({
  selector: 'app-form-pais',
  templateUrl: './pais.form.component.html',
  styleUrls: ['./pais.form.component.css'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaisFormComponent extends PrimeReactiveCrudFormComponent<Pais, number> {
  private readonly fb = this.injector.get(FormBuilder);

  constructor(
    protected paisService: PaisService,
    protected injector: Injector
  ) {
    super(paisService, injector, '/pais', Pais);
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
