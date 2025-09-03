import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {HomeComponent} from './home.component';
import {AppToolbarModule} from '../toolbar/toolbar.module';
import {DialogModule} from 'primeng/dialog';
import {TooltipModule} from 'primeng/tooltip';
import {HomeService} from './home.service';
import {ButtonModule} from 'primeng/button';
import {CardModule} from 'primeng/card';
import {PanelModule} from 'primeng/panel';
import {FormsModule} from '@angular/forms';
import {ValidationModule} from '../framework/validation/validation.module';
import {ValidationService} from '../framework/validation/validation.service';
import {DatePickerModule} from "primeng/datepicker";
import {StatCardComponent} from '../geral/stat-card/stat-card.component';

@NgModule({
  imports: [
    CommonModule,
    AppToolbarModule,
    TooltipModule,
    DialogModule,
    DatePickerModule,
    ButtonModule,
    CardModule,
    PanelModule,
    FormsModule,
    ValidationModule
  ],
  declarations: [
    HomeComponent,
    StatCardComponent
  ],
  exports: [
    HomeComponent,
    StatCardComponent
  ],
  providers: [
    HomeService,
    ValidationService
  ]
})
export class HomeModule {
}
