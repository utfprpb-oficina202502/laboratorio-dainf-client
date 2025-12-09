import {computed, effect, Injectable, signal} from '@angular/core';

export type ThemeMode = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  // Theme mode signal with localStorage persistence
  private readonly _themeMode = signal<ThemeMode>(this.getInitialTheme());

  // Public readonly computed signal
  public readonly themeMode = computed(() => this._themeMode());
  public readonly isDarkMode = computed(() => this._themeMode() === 'dark');

  constructor() {
    // Effect to apply theme changes to DOM and persist to localStorage
    effect(() => {
      const theme = this._themeMode();
      this.applyTheme(theme);
      localStorage.setItem('theme-mode', theme);
    });
  }

  /**
   * Toggle between light and dark themes
   */
  toggleTheme(): void {
    this._themeMode.update(current => current === 'light' ? 'dark' : 'light');
  }

  /**
   * Set specific theme mode
   */
  setTheme(theme: ThemeMode): void {
    this._themeMode.set(theme);
  }

  /**
   * Get initial theme from localStorage or system preference
   */
  private getInitialTheme(): ThemeMode {
    // Check localStorage first
    const savedTheme = localStorage.getItem('theme-mode') as ThemeMode;
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme;
    }

    if (globalThis?.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }

    return 'light';
  }

  /**
   * Apply theme to DOM
   */
  private applyTheme(theme: ThemeMode): void {
    const root = document.documentElement;

    // Remove existing theme classes
    root.classList.remove('theme-light', 'theme-dark');

    // Add current theme class
    root.classList.add(`theme-${theme}`);

    // Set data attribute for CSS targeting
    root.setAttribute('data-theme', theme);
  }
}
