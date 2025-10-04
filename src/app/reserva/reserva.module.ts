import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ReservaFormComponent} from './reserva.form.component';
import {ReservaListComponent} from './reserva.list.component';
import {NovoModule} from '../geral/novo/novo.module';
import {ReservaService} from './reserva.service';
import {VoltarModule} from '../geral/voltar/voltar.module';
import {FormsModule} from '@angular/forms';
import {AutoCompleteModule} from 'primeng/autocomplete';
import {InputTextModule} from 'primeng/inputtext';
import {CadastroRapidoModule} from '../geral/cadastroRapido/cadastroRapido.module';
import {CancelarModule} from '../geral/cancelar/cancelar.module';
import {SalvarModule} from '../geral/salvar/salvar.module';
import {ValidationModule} from '../framework/validation/validation.module';
import {ActionButtonsComponent} from '../framework/component/action-buttons.component';
import {ValidationService} from '../framework/validation/validation.service';
import { DialogModule } from 'primeng/dialog';
import { CarouselModule } from 'primeng/carousel';
import { CardModule } from 'primeng/card';
import {DatePickerModule} from "primeng/datepicker";

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    NovoModule,
    VoltarModule,
    DatePickerModule,
    CadastroRapidoModule,
    AutoCompleteModule,
    CancelarModule,
    SalvarModule,
    InputTextModule,
    ValidationModule,
    ActionButtonsComponent,
    DialogModule,
    CarouselModule,
    CardModule,
    ReservaListComponent,
    ReservaFormComponent
  ],
  declarations: [

  ],
  exports: [
    ReservaFormComponent,
    ReservaListComponent
  ],
  providers: [
    ReservaService,
    ValidationService
  ]
})
export class ReservaModule {

}
