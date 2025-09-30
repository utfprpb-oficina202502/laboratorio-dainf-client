import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaisFormComponent } from './pais.form.component';
import { PaisListComponent } from './pais.list.component';
import { PaisService } from './pais.service';
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
