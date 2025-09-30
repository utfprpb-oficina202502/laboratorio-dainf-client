import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EstadoFormComponent } from './estado.form.component';
import { EstadoListComponent } from './estado.list.component';
import { EstadoService } from './estado.service';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    InputTextModule,
    TooltipModule,
    AutoCompleteModule,
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
