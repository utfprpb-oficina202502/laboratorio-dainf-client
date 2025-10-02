import { Component, Injector, ChangeDetectionStrategy, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Fornecedor } from './fornecedor';
import { FornecedorService } from './fornecedor.service';
import { Estado } from '../estado/estado';
import { CidadeService } from '../cidade/cidade.service';
import { EstadoService } from '../estado/estado.service';
import { Cidade } from '../cidade/cidade';
import { PrimeReactiveCrudFormComponent } from '../framework/component/prime-reactive-crud.form.component';

@Component({
  selector: 'app-form-fornecedor',
  templateUrl: './fornecedor.form.component.html',
  styleUrls: ['./fornecedor.form.component.css'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FornecedorFormComponent extends PrimeReactiveCrudFormComponent<Fornecedor, number> {
  private readonly fb = this.injector.get(FormBuilder);
  private readonly cidadeService = this.injector.get(CidadeService);
  private readonly estadoService = this.injector.get(EstadoService);

  // Signals for autocomplete lists
  protected readonly cidadeList = signal<Cidade[]>([]);
  protected readonly estadoList = signal<Estado[]>([]);

  constructor(
    protected fornecedorService: FornecedorService,
    protected injector: Injector
  ) {
    super(fornecedorService, injector, '/fornecedor', Fornecedor);
  }

  /**
   * Build the reactive form with validators
   */
  protected override buildForm(): FormGroup {
    return this.fb.group({
      id: [{ value: null, disabled: true }],
      razaoSocial: ['', [Validators.required, Validators.maxLength(255)]],
      nomeFantasia: ['', [Validators.required, Validators.maxLength(255)]],
      cnpj: ['', [Validators.required, Validators.minLength(14), Validators.maxLength(14)]],
      ie: ['', [Validators.required, Validators.maxLength(50)]],
      endereco: ['', [Validators.required, Validators.maxLength(500)]],
      observacao: ['', [Validators.maxLength(2000)]],
      telefone: ['', [Validators.required, Validators.maxLength(15)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
      estado: [null, [Validators.required]],
      cidade: [null, [Validators.required]]
    });
  }

  /**
   * Handle autocomplete search for cities filtered by selected state
   */
  findCidadesByEstado(event: any): void {
    const formGroup = this.form();
    if (!formGroup) return;

    const estado = formGroup.get('estado')?.value;
    if (!estado) return;

    this.cidadeService.completeByEstado(event.query, estado).subscribe({
      next: (cidades) => {
        this.cidadeList.set(cidades);
      },
      error: (error) => {
        console.error('Erro ao buscar cidades:', error);
        this.cidadeList.set([]);
      }
    });
  }

  /**
   * Handle autocomplete search for states
   */
  findEstados(event: any): void {
    this.estadoService.complete(event.query).subscribe({
      next: (estados) => {
        this.estadoList.set(estados);
      },
      error: (error) => {
        console.error('Erro ao buscar estados:', error);
        this.estadoList.set([]);
      }
    });
  }

  /**
   * Handle state change - clear city when state changes
   */
  onEstadoChange(): void {
    const formGroup = this.form();
    if (formGroup) {
      formGroup.patchValue({ cidade: null });
      this.cidadeList.set([]);
    }
  }

  /**
   * Override to patch form with object values
   */
  protected override patchFormWithObject(object: Fornecedor): void {
    const formGroup = this.form();
    if (formGroup) {
      formGroup.patchValue({
        id: object.id,
        razaoSocial: object.razaoSocial,
        nomeFantasia: object.nomeFantasia,
        cnpj: object.cnpj,
        ie: object.ie,
        endereco: object.endereco,
        observacao: object.observacao,
        telefone: object.telefone,
        email: object.email,
        estado: object.estado,
        cidade: object.cidade
      });
    }
  }

  /**
   * Override to prepare form value before saving (include disabled id field)
   */
  protected override prepareFormValue(formValue: Partial<Fornecedor>): Partial<Fornecedor> {
    const formGroup = this.form();
    const id = formGroup?.get('id')?.value;
    return {
      ...formValue,
      ...(id && { id })
    };
  }
}
