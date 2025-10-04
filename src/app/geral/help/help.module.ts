import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {HelpComponent} from './help.component';
import {TooltipModule} from 'primeng/tooltip';
import {ButtonModule} from 'primeng/button';
import {DialogModule} from 'primeng/dialog';

@NgModule({
  imports: [
    CommonModule,
    TooltipModule,
    ButtonModule,
    DialogModule,
  ],
  declarations: [
    HelpComponent
  ],
  exports: [
    HelpComponent
  ]
})
export class HelpModule {

}
