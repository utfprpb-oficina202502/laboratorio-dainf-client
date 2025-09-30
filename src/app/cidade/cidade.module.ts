import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { CidadeFormComponent } from './cidade.form.component';
import { CidadeListComponent } from './cidade.list.component';
import { CidadeService } from './cidade.service';
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
