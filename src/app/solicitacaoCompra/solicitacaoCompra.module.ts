import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {NovoModule} from '../geral/novo/novo.module';
import {VoltarModule} from '../geral/voltar/voltar.module';
import {AutoCompleteModule} from 'primeng/autocomplete';
import {InputTextModule} from 'primeng/inputtext';
import {CadastroRapidoModule} from '../geral/cadastroRapido/cadastroRapido.module';
import {CancelarModule} from '../geral/cancelar/cancelar.module';
import {SalvarModule} from '../geral/salvar/salvar.module';
import {ValidationModule} from '../framework/validation/validation.module';
import {ActionButtonsComponent} from '../framework/component/action-buttons.component';
import {SolicitacaoCompraFormComponent} from './solicitacaoCompra.form.component';
import {SolicitacaoCompraListComponent} from './solicitacaoCompra.list.component';
import {ValidationService} from '../framework/validation/validation.service';
import {SolicitacaoCompraService} from './solicitacaoCompra.service';
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
    SolicitacaoCompraListComponent,
    SolicitacaoCompraFormComponent,
  ],
  exports: [
    SolicitacaoCompraFormComponent,
    SolicitacaoCompraListComponent
  ],
  providers: [
    SolicitacaoCompraService,
    ValidationService
  ]
})
export class SolicitacaoCompraModule {

}
