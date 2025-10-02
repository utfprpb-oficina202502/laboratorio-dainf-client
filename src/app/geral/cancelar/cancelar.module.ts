import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CancelarComponent } from './cancelar.component';
import { ButtonModule } from 'primeng/button';

@NgModule({
  imports: [
    CommonModule,
    ButtonModule
  ],
  declarations: [CancelarComponent],
  exports: [CancelarComponent]
})
export class CancelarModule {}
