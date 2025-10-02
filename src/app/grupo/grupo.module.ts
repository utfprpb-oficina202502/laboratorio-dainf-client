import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { GrupoFormComponent } from './grupo.form.component';
import { GrupoService } from './grupo.service';

// PrimeNG Modules
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

// Custom Modules
import { VoltarModule } from '../geral/voltar/voltar.module';
import { CancelarModule } from '../geral/cancelar/cancelar.module';
import { SalvarModule } from '../geral/salvar/salvar.module';
import { FormFieldComponent } from '../framework/component/form-field.component';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    // PrimeNG
    CardModule,
    InputTextModule,
    ButtonModule,
    TooltipModule,
    DialogModule,
    TableModule,
    ProgressSpinnerModule,
    // Custom
    VoltarModule,
    CancelarModule,
    SalvarModule,
    FormFieldComponent
  ],
  declarations: [GrupoFormComponent],
  exports: [GrupoFormComponent],
  providers: [GrupoService]
})
export class GrupoModule {}
