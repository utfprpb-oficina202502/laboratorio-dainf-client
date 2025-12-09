import {ChangeDetectionStrategy, Component, inject} from '@angular/core';

import {ToggleButtonModule} from 'primeng/togglebutton';
import {ThemeService} from '../service/theme.service';
import {FormsModule} from "@angular/forms";

@Component({
  selector: 'app-theme-toggle',
  imports: [
    ToggleButtonModule,
    FormsModule
],
  template: `
    <div class="toggle-wrapper">
      <p-toggleButton
        [(ngModel)]="checked"
        (onChange)="onToggle($event)"
        [onIcon]="'pi pi-moon'"
        [offIcon]="'pi pi-sun'"
        [onLabel]="'Escuro'"
        [offLabel]="'Claro'"
        class="theme-toggle-button"
        [ariaLabel]="themeService.isDarkMode() ? 'Alternar para tema claro' : 'Alternar para tema escuro'"
      ></p-toggleButton>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }

    .toggle-wrapper {
      display: flex;
      justify-content: flex-end;
    }

    :host ::ng-deep .theme-toggle-button.p-togglebutton {
      width: 100%;
    }

    :host ::ng-deep .theme-toggle-button .p-button-icon-left,
    :host ::ng-deep .theme-toggle-button .p-button-icon-right {
      font-size: 1rem;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ThemeToggleComponent {
  readonly themeService = inject(ThemeService);

  checked = false;
  constructor() {
    const themeService = this.themeService;

    this.checked = themeService.isDarkMode();
  }

  onToggle(event: any): void {
    // event.checked é boolean, mas pode ser undefined se o evento for disparado incorretamente
    const checked = event?.checked === true;
    this.themeService.setTheme(checked ? 'dark' : 'light');
  }
}
