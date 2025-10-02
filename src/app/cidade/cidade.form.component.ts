import { Component, Injector, ChangeDetectionStrategy, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Cidade } from './cidade';
import { CidadeService } from './cidade.service';
import { Estado } from '../estado/estado';
import { EstadoService } from '../estado/estado.service';
import { PrimeReactiveCrudFormComponent } from '../framework/component/prime-reactive-crud.form.component';

@Component({
  selector: 'app-form-cidade',
  templateUrl: './cidade.form.component.html',
  styleUrls: ['./cidade.form.component.css'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CidadeFormComponent extends PrimeReactiveCrudFormComponent<Cidade, number> {
  private readonly fb = this.injector.get(FormBuilder);
  private readonly estadoService = this.injector.get(EstadoService);

  // Signal for autocomplete suggestions
  protected readonly estadosList = signal<Estado[]>([]);

  constructor(
    protected cidadeService: CidadeService,
    protected injector: Injector
  ) {
    super(cidadeService, injector, '/cidade', Cidade);
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
