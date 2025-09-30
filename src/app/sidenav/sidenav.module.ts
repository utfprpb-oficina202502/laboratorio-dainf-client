import {NgModule} from '@angular/core';
import {SidenavComponent} from './sidenav.component';
import {RouterModule} from '@angular/router';
import {CommonModule} from '@angular/common';
import {SidenavService} from './sidenav.service';
import {ThemeToggleComponent} from '../framework/component/theme-toggle.component';

// PrimeNG Components
import {DrawerModule} from 'primeng/drawer';

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    DrawerModule,
    ThemeToggleComponent
  ],
  exports: [
    SidenavComponent
  ],
  declarations: [
    SidenavComponent
  ],
  providers: [
    SidenavService
  ]
})
export class SidenavModule {

}
