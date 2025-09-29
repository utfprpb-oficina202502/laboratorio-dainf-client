import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToolbarComponent } from './toolbar.component';
import { RouterModule } from '@angular/router';
import { TieredMenuModule } from 'primeng/tieredmenu';
import { ToolbarModule as PrimeToolbarModule } from 'primeng/toolbar';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';

@NgModule({
  imports: [
    CommonModule,
    PrimeToolbarModule,
    ButtonModule,
    TooltipModule,
    RouterModule,
    TieredMenuModule
  ],
  declarations: [
    ToolbarComponent
  ],
  exports: [
    ToolbarComponent
  ],
})
export class ToolbarModule {}
