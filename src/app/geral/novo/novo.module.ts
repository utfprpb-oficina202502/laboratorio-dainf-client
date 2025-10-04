import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {NovoComponent} from './novo.component';
import {TooltipModule} from 'primeng/tooltip';
import {ButtonModule} from 'primeng/button';

@NgModule({
  imports: [
    CommonModule,
    TooltipModule,
    ButtonModule,
  ],
  declarations: [
    NovoComponent
  ],
  exports: [
    NovoComponent
  ]
})
export class NovoModule {

}
