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

// Angular Material (for components not yet migrated)
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { DragDropModule } from '@angular/cdk/drag-drop';

// Custom components
import { VoltarModule } from '../geral/voltar/voltar.module';
import { CancelarModule } from '../geral/cancelar/cancelar.module';
import { SalvarModule } from '../geral/salvar/salvar.module';
import { BottomSheetModule } from '../geral/bottomScheet/bottomSheet.module';
import { BottomSheetEmprestimoModule } from './bottomScheetEmprestimo/bottomSheetEmprestimo.module';
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
    MatCardModule,
    MatMenuModule,
    DragDropModule,
    VoltarModule,
    CancelarModule,
    SalvarModule,
    CadastroRapidoModule,
    BottomSheetModule,
    BottomSheetEmprestimoModule,
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
