import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { EmprestimoFormComponent } from './emprestimo.form.component';
import { EmprestimoListComponent } from './emprestimo.list.component';
import { EmprestimoService } from './emprestimo.service';
import { EmprestimoDevolucaoComponent } from './emprestimo.devolucao.component';

// PrimeNG
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { TextareaModule } from 'primeng/textarea';
import { MenuModule } from 'primeng/menu';
import { TagModule } from 'primeng/tag';

// Angular CDK
import { DragDropModule } from '@angular/cdk/drag-drop';

// Custom components
import { VoltarModule } from '../geral/voltar/voltar.module';
import { CancelarModule } from '../geral/cancelar/cancelar.module';
import { SalvarModule } from '../geral/salvar/salvar.module';
import { CadastroRapidoModule } from '../geral/cadastroRapido/cadastroRapido.module';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    CardModule,
    InputTextModule,
    AutoCompleteModule,
    DatePickerModule,
    SelectModule,
    ButtonModule,
    TableModule,
    TooltipModule,
    DialogModule,
    ScrollPanelModule,
    TextareaModule,
    MenuModule,
    TagModule,
    DragDropModule,
    VoltarModule,
    CancelarModule,
    SalvarModule,
    CadastroRapidoModule,
    EmprestimoListComponent,
    EmprestimoFormComponent
  ],
  declarations: [
    EmprestimoDevolucaoComponent
  ],
  exports: [
    EmprestimoFormComponent,
    EmprestimoListComponent,
    EmprestimoDevolucaoComponent
  ],
  providers: [
    EmprestimoService
  ]
})
export class EmprestimoModule {

}
