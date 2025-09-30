import {NgModule} from '@angular/core';
import {CommonModule, DatePipe} from '@angular/common';
import {HomeComponent} from './home.component';
import {ToolbarModule} from '../toolbar/toolbar.module';
import {DialogModule} from 'primeng/dialog';
import {TooltipModule} from 'primeng/tooltip';
import {HomeService} from './home.service';
import {FormsModule} from '@angular/forms';
import {ValidationModule} from '../framework/validation/validation.module';
import {ValidationService} from '../framework/validation/validation.service';
import {DatePickerModule} from 'primeng/datepicker';
import {StatCardComponent} from '../components/stat-card/stat-card.component';
import {PanelModule} from 'primeng/panel';
import {ButtonModule} from 'primeng/button';
import {RouterLink} from "@angular/router";
import {SkeletonCardComponent} from '../framework/component/skeleton-card.component';
import {SkeletonChartComponent} from '../framework/component/skeleton-chart.component';

@NgModule({
  imports: [
    CommonModule,
    ToolbarModule,
    TooltipModule,
    DialogModule,
    DatePickerModule,
    FormsModule,
    ValidationModule,
    PanelModule,
    ButtonModule,
    StatCardComponent,
    RouterLink,
    SkeletonCardComponent,
    SkeletonChartComponent
  ],
  declarations: [
    HomeComponent
  ],
  exports: [
    HomeComponent,
    StatCardComponent
  ],
  providers: [
    HomeService,
    ValidationService,
    DatePipe
  ]
})
export class HomeModule {
}
