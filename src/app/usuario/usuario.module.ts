import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule} from '@angular/forms';


// PrimeNG
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { MultiSelectModule } from 'primeng/multiselect';
import { PasswordModule } from 'primeng/password';
import { InputMaskModule } from 'primeng/inputmask';

// Material (still needed for UsuarioEditComponent)
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

// Custom components
import { FormFieldComponent } from '../framework/component/form-field.component';
import { ActionButtonsComponent } from '../framework/component/action-buttons.component';
import { VoltarModule } from '../geral/voltar/voltar.module';
import { CancelarModule } from '../geral/cancelar/cancelar.module';
import { SalvarModule } from '../geral/salvar/salvar.module';

// Usuario components and services
import { UsuarioFormComponent } from './usuario.form.component';
import { UsuarioListComponent } from './usuario.list.component';
import { UsuarioEditComponent } from './usuario.edit.component';
import { UsuarioService } from './usuario.service';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule, // Still needed for UsuarioEditComponent (template-driven forms)
    // PrimeNG
    CardModule,
    InputTextModule,
    ButtonModule,
    TooltipModule,
    DialogModule,
    MultiSelectModule,
    PasswordModule,
    InputMaskModule,
    // Material (still needed for UsuarioEditComponent)
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    // Custom
    FormFieldComponent,
    ActionButtonsComponent,
    VoltarModule,
    CancelarModule,
    SalvarModule,
    UsuarioListComponent
  ],
  declarations: [
    UsuarioFormComponent,
    UsuarioEditComponent
  ],
  exports: [
    UsuarioFormComponent,
    UsuarioListComponent,
    UsuarioEditComponent
  ],
  providers: [
    UsuarioService
  ]
})
export class UsuarioModule {

}
