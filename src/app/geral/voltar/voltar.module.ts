import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VoltarComponent } from './voltar.component';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';

@NgModule({
  imports: [
    CommonModule,
    ButtonModule,
    TooltipModule
  ],
  declarations: [VoltarComponent],
  exports: [VoltarComponent]
})
export class VoltarModule {}
