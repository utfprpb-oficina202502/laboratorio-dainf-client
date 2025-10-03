import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CompraService } from './compra.service';
import { CompraFormComponent } from './compra.form.component';
import { CompraListComponent } from './compra.list.component';

@NgModule({
  imports: [
    CommonModule,
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
