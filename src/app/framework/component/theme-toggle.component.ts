import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { ThemeService } from '../services/theme.service';
import {FormsModule} from "@angular/forms";

@Component({
  selector: 'app-theme-toggle',
  imports: [
    CommonModule,
    ToggleButtonModule,
    FormsModule
  ],
  template: `
    <div class="toggle-wrapper">
      <p-toggleButton
        [(ngModel)]="checked"
        (onChange)="onToggle($event.checked)"
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
  checked = false;
  constructor(public readonly themeService: ThemeService) {
    this.checked = themeService.isDarkMode();
  }

  onToggle(checked: boolean): void {
    this.themeService.setTheme(checked ? 'dark' : 'light');
  }
}
