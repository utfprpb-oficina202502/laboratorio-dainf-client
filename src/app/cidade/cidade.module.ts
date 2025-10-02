import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { CidadeFormComponent } from './cidade.form.component';
import { CidadeListComponent } from './cidade.list.component';
import { CidadeService } from './cidade.service';

// PrimeNG
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';

// Custom components
import { FormFieldComponent } from '../framework/component/form-field.component';
import { VoltarModule } from '../geral/voltar/voltar.module';
import { CancelarModule } from '../geral/cancelar/cancelar.module';
import { SalvarModule } from '../geral/salvar/salvar.module';

@NgModule({
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
    VoltarModule,
    CancelarModule,
    SalvarModule,
    CidadeListComponent  // Import standalone component
  ],
  declarations: [
    CidadeFormComponent  // Only declare form component
  ],
  exports: [
    CidadeFormComponent,
    CidadeListComponent
  ],
  providers: [
    CidadeService
  ]
})
export class CidadeModule {

}
