import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {SaidaFormComponent} from './saida.form.component';
import {SaidaListComponent} from './saida.list.component';
import {SaidaService} from './saida.service';
import {FormsModule} from '@angular/forms';
import {AutoCompleteModule} from 'primeng/autocomplete';
import {InputTextModule} from 'primeng/inputtext';
import {TooltipModule} from 'primeng/tooltip';
import {ValidationModule} from '../framework/validation/validation.module';
import {ActionButtonsComponent} from '../framework/component/action-buttons.component';
import {VoltarModule} from '../geral/voltar/voltar.module';
import {CancelarModule} from '../geral/cancelar/cancelar.module';
import {SalvarModule} from '../geral/salvar/salvar.module';
import {CadastroRapidoModule} from '../geral/cadastroRapido/cadastroRapido.module';
import {OnlyNumberModule} from '../framework/directives/onlyNumber/onlyNumber.module';
import {DatePickerModule} from "primeng/datepicker";
import {SelectModule} from "primeng/select";

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    InputTextModule,
    TooltipModule,
    AutoCompleteModule,
    DatePickerModule,
    SelectModule,
    ValidationModule,
    ActionButtonsComponent,
    VoltarModule,
    CancelarModule,
    SalvarModule,
    CadastroRapidoModule,
    OnlyNumberModule,
    SaidaListComponent,
    SaidaFormComponent
  ],
  exports: [
    SaidaFormComponent,
    SaidaListComponent
  ],
  providers: [
    SaidaService
  ]
})
export class SaidaModule {

}
