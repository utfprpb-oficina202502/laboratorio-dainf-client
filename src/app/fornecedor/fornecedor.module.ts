import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

// PrimeNG
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';

// Custom components
import { FormFieldComponent } from '../framework/component/form-field.component';
import { VoltarModule } from '../geral/voltar/voltar.module';
import { CancelarModule } from '../geral/cancelar/cancelar.module';
import { SalvarModule } from '../geral/salvar/salvar.module';

// Directives
import { OnlyNumberModule } from '../framework/directives/onlyNumber/onlyNumber.module';
import { CnpjModule } from '../framework/directives/cnpj/cnpj.module';
import { TelefoneFormatModule } from '../framework/directives/telefone/telefone.format.module';

// Fornecedor components and services
import { FornecedorFormComponent } from './fornecedor.form.component';
import { FornecedorListComponent } from './fornecedor.list.component';
import { FornecedorService } from './fornecedor.service';

@NgModule({
  declarations: [
    FornecedorFormComponent
  ],
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
    VoltarModule,
    CancelarModule,
    SalvarModule,
    // Directives
    OnlyNumberModule,
    CnpjModule,
    TelefoneFormatModule,
    // List component (standalone)
    FornecedorListComponent
  ],
  exports: [
    FornecedorFormComponent,
    FornecedorListComponent
  ],
  providers: [
    FornecedorService
  ]
})
export class FornecedorModule {

}
