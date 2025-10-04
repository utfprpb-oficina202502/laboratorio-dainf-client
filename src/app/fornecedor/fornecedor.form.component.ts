import {ChangeDetectionStrategy, Component, inject, Injector, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {Fornecedor} from './fornecedor';
import {FornecedorService} from './fornecedor.service';
import {Estado} from '../estado/estado';
import {CidadeService} from '../cidade/cidade.service';
import {EstadoService} from '../estado/estado.service';
import {Cidade} from '../cidade/cidade';
import {
  PrimeReactiveCrudFormComponent
} from '../framework/component/prime-reactive-crud.form.component';

// PrimeNG
import {CardModule} from 'primeng/card';
import {InputTextModule} from 'primeng/inputtext';
import {TextareaModule} from 'primeng/textarea';
import {AutoCompleteModule} from 'primeng/autocomplete';
import {ButtonModule} from 'primeng/button';
import {TooltipModule} from 'primeng/tooltip';

// Custom components
import {FormFieldComponent} from '../framework/component/form-field.component';
import {VoltarComponent} from '../geral/voltar/voltar.component';
import {CancelarComponent} from '../geral/cancelar/cancelar.component';
import {SalvarComponent} from '../geral/salvar/salvar.component';

// Directives
import {OnlyNumberDirective} from '../framework/directives/onlyNumber/onlyNumber.directive';
import {CnpjDirective} from '../framework/directives/cnpj/cnpj.directive';
import {TelefoneFormatDirective} from '../framework/directives/telefone/telefone.format.directive';

@Component({
  selector: 'app-form-fornecedor',
  templateUrl: './fornecedor.form.component.html',
  styleUrls: ['./fornecedor.form.component.css'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    // PrimeNG
    CardModule,
    InputTextModule,
    TextareaModule,
    AutoCompleteModule,
    ButtonModule,
    TooltipModule,
    // Custom
    FormFieldComponent,
    VoltarComponent,
    CancelarComponent,
    SalvarComponent,
    // Directives
    OnlyNumberDirective,
    CnpjDirective,
    TelefoneFormatDirective
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FornecedorFormComponent extends PrimeReactiveCrudFormComponent<Fornecedor, number> {
  protected fornecedorService: FornecedorService;
  protected injector: Injector;

  private readonly fb = this.injector.get(FormBuilder);
  private readonly cidadeService = this.injector.get(CidadeService);
  private readonly estadoService = this.injector.get(EstadoService);

  // Signals for autocomplete lists
  protected readonly cidadeList = signal<Cidade[]>([]);
  protected readonly estadoList = signal<Estado[]>([]);

  constructor() {
    const fornecedorService = inject(FornecedorService);
    const injector = inject(Injector);

    super(fornecedorService, injector, '/fornecedor', Fornecedor);

    this.fornecedorService = fornecedorService;
    this.injector = injector;
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
