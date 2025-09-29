import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NadaConstaVisualizarComponent } from './nada-consta-visualizar.component';
import { NadaConstaListComponent } from './list/nada-consta-list.component';
import { FormsModule } from '@angular/forms';
// PrimeNG modules
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';
import { TableModule } from 'primeng/table';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    InputTextModule,
    ButtonModule,
    ProgressBarModule,
    TableModule,
    NadaConstaListComponent,
    NadaConstaVisualizarComponent // standalone component
  ],
  // Caso tenha serviços, adicione-os em providers
  // providers: [NadaConstaService],
})
export class NadaConstaModule {}
