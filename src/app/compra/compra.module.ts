import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CompraService } from './compra.service';
import { ActionButtonsComponent } from '../framework/component/action-buttons.component';
import { CompraFormComponent } from './compra.form.component';
import { CompraListComponent } from './compra.list.component';

@NgModule({
  imports: [
    CommonModule,
    ActionButtonsComponent,
    CompraListComponent,
    CompraFormComponent
  ],
  exports: [
    CompraFormComponent,
    CompraListComponent
  ],
  providers: [
    CompraService
  ]
})
export class CompraModule {

}
