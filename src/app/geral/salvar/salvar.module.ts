import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SalvarComponent } from './salvar.component';
import { ButtonModule } from 'primeng/button';

@NgModule({
  imports: [
    CommonModule,
    ButtonModule
  ],
  declarations: [SalvarComponent],
  exports: [SalvarComponent]
})
export class SalvarModule {}
