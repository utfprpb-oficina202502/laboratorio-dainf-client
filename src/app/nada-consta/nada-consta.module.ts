import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NadaConstaVisualizarComponent } from './nada-consta-visualizar.component';
import { NadaConstaListComponent } from './list/nada-consta-list.component';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { FormsModule } from '@angular/forms';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressBarModule,
    NadaConstaListComponent,
    NadaConstaVisualizarComponent // standalone component
  ],
  // Caso tenha serviços, adicione-os em providers
  // providers: [NadaConstaService],
})
export class NadaConstaModule {}
