import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RelatorioFormComponent} from './relatorio.form.component';
import {RelatorioListComponent} from './relatorio.list.component';
import {RelatorioViewerComponent} from './relatorio.viewer.component';
import {RelatorioService} from './relatorio.service';
import {FormsModule} from '@angular/forms';
import {ValidationModule} from '../framework/validation/validation.module';
import {ValidationService} from '../framework/validation/validation.service';
import {OnlyNumberModule} from '../framework/directives/onlyNumber/onlyNumber.module';

// Custom modules
import {NovoModule} from '../geral/novo/novo.module';
import {VoltarModule} from '../geral/voltar/voltar.module';
import {SalvarModule} from '../geral/salvar/salvar.module';
import {CancelarModule} from '../geral/cancelar/cancelar.module';
import {HelpModule} from '../geral/help/help.module';

// PrimeNG Components
import {CardModule} from 'primeng/card';
import {TableModule} from 'primeng/table';
import {MultiSelectModule} from 'primeng/multiselect';
import {ToolbarModule} from 'primeng/toolbar';
import {ButtonModule} from 'primeng/button';
import {InputTextModule} from 'primeng/inputtext';
import {IconFieldModule} from 'primeng/iconfield';
import {InputIconModule} from 'primeng/inputicon';
import {TooltipModule} from 'primeng/tooltip';
import {DialogModule} from 'primeng/dialog';
import {FieldsetModule} from 'primeng/fieldset';
import {FileUploadModule} from 'primeng/fileupload';
import {DatePickerModule} from "primeng/datepicker";
import {SelectModule} from "primeng/select";

// Framework components
import {PrimeCrudToolbarComponent} from '../framework/component/prime-crud-toolbar.component';
import {ActionButtonsComponent} from '../framework/component/action-buttons.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ValidationModule,
    OnlyNumberModule,

    // Custom modules
    NovoModule,
    VoltarModule,
    SalvarModule,
    CancelarModule,
    HelpModule,

    // PrimeNG Components
    CardModule,
    TableModule,
    MultiSelectModule,
    ToolbarModule,
    ButtonModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    TooltipModule,
    DialogModule,
    FieldsetModule,
    FileUploadModule,
    DatePickerModule,
    SelectModule,

    // Framework components
    PrimeCrudToolbarComponent,
    ActionButtonsComponent,

    RelatorioListComponent
  ],
  declarations: [
    RelatorioFormComponent,
    RelatorioViewerComponent
  ],
  exports: [
    RelatorioFormComponent,
    RelatorioListComponent,
    RelatorioViewerComponent
  ],
  providers: [
    RelatorioService,
    ValidationService
  ]
})
export class RelatorioModule {

}
