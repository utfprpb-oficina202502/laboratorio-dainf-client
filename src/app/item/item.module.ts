import { NgModule } from "@angular/core";
import {CommonModule, NgOptimizedImage} from "@angular/common";
import { ReactiveFormsModule } from "@angular/forms";

// PrimeNG
import { AutoCompleteModule } from "primeng/autocomplete";
import { ButtonModule } from "primeng/button";
import { CardModule } from "primeng/card";
import { CarouselModule } from "primeng/carousel";
import { DialogModule } from "primeng/dialog";
import { FileUploadModule } from "primeng/fileupload";
import { InputTextModule } from "primeng/inputtext";
import { TextareaModule } from "primeng/textarea";
import { InputNumberModule } from "primeng/inputnumber";
import { SelectModule } from "primeng/select";
import { TooltipModule } from "primeng/tooltip";
import { DataViewModule } from 'primeng/dataview';
import { TagModule } from 'primeng/tag';

// Framework
import { FormFieldComponent } from "../framework/component/form-field.component";
import { ActionButtonsComponent } from "../framework/component/action-buttons.component";

// Geral components
import { VoltarModule } from "../geral/voltar/voltar.module";
import { CancelarModule } from "../geral/cancelar/cancelar.module";
import { SalvarModule } from "../geral/salvar/salvar.module";
import { NovoModule } from "../geral/novo/novo.module";
import { CadastroRapidoModule } from "../geral/cadastroRapido/cadastroRapido.module";

// Item components and services
import { ItemFormComponent } from "./item.form.component";
import { ItemListComponent } from "./item.list.component";
import { ItemViewComponent } from "./item.view.component";
import { ItemService } from "./item.service";

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    // PrimeNG
    AutoCompleteModule,
    ButtonModule,
    CardModule,
    CarouselModule,
    DialogModule,
    FileUploadModule,
    InputTextModule,
    TextareaModule,
    InputNumberModule,
    SelectModule,
    TooltipModule,
    DataViewModule,
    TagModule,
    // Framework
    FormFieldComponent,
    ActionButtonsComponent,
    // Geral
    VoltarModule,
    CancelarModule,
    SalvarModule,
    NovoModule,
    CadastroRapidoModule,
    // Item
    ItemListComponent,
    NgOptimizedImage
  ],
  declarations: [ItemFormComponent, ItemViewComponent],
  exports: [ItemFormComponent, ItemListComponent, ItemViewComponent],
  providers: [ItemService],
})
export class ItemModule {}
