import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { PaisFormComponent } from './pais.form.component';
import { PaisListComponent } from './pais.list.component';
import { PaisService } from './pais.service';

// PrimeNG
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
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
    ButtonModule,
    TooltipModule,
    // Custom
    FormFieldComponent,
    ActionButtonsComponent,
    VoltarModule,
    CancelarModule,
    SalvarModule,
    PaisListComponent  // Import standalone component
  ],
  declarations: [
    PaisFormComponent  // Only declare form component
  ],
  exports: [
    PaisFormComponent,
    PaisListComponent
  ],
  providers: [
    PaisService
  ]
})
export class PaisModule {
}
