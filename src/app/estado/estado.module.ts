import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { EstadoFormComponent } from './estado.form.component';
import { EstadoListComponent } from './estado.list.component';
import { EstadoService } from './estado.service';

// PrimeNG
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';

// Custom components
import { FormFieldComponent } from '../framework/component/form-field.component';
import { ActionButtonsComponent } from '../framework/component/action-buttons.component';
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
    ActionButtonsComponent,
    VoltarModule,
    CancelarModule,
    SalvarModule,
    EstadoListComponent  // Import standalone component
  ],
  declarations: [
    EstadoFormComponent  // Only declare form component
  ],
  exports: [
    EstadoFormComponent,
    EstadoListComponent
  ],
  providers: [
    EstadoService
  ]
})
export class EstadoModule {

}
