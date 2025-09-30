import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoaderComponent } from './loader.component';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@NgModule({
  imports: [
    CommonModule,
    LoaderComponent,
    ProgressSpinnerModule
  ],
  exports: [
    LoaderComponent
  ]
})
export class LoaderModule {

}
