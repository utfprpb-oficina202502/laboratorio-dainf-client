import {inject, Injectable, signal} from '@angular/core';
import {BreakpointObserver, Breakpoints} from '@angular/cdk/layout';

/**
 * Serviço responsivo para detecção de breakpoints e dispositivos móveis
 *
 * Fornece signals reativos para detectar diferentes tamanhos de tela:
 * - isMobile(): Detecta smartphones (max-width: 768px)
 * - isTablet(): Detecta tablets (768px - 1024px)
 * - isDesktop(): Detecta desktop (min-width: 1024px)
 *
 * Uso em componentes:
 * ```typescript
 * export class MyComponent {
 *   private breakpointService = inject(BreakpointService);
 *   isMobile = this.breakpointService.isMobile;
 * }
 * ```
 *
 * Uso em templates:
 * ```html
 * <p-datePicker
 *   [readonlyInput]="breakpointService.isMobile()">
 * </p-datePicker>
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class BreakpointService {
  /**
   * Signal indicando se o viewport atual é mobile (≤768px)
   */
  readonly isMobile = signal(false);

  /**
   * Signal indicando se o viewport atual é tablet (768px - 1024px)
   */
  readonly isTablet = signal(false);

  /**
   * Signal indicando se o viewport atual é desktop (≥1024px)
   */
  readonly isDesktop = signal(true);

  /**
   * Signal indicando se o viewport atual é handset (smartphone em portrait/landscape)
   */
  readonly isHandset = signal(false);

  private readonly breakpointObserver = inject(BreakpointObserver);

  constructor() {
    // Detecta mobile (custom breakpoint ≤768px)
    this.breakpointObserver
    .observe(['(max-width: 768px)'])
    .subscribe(result => {
      this.isMobile.set(result.matches);
    });

    // Detecta tablet (768px - 1024px)
    this.breakpointObserver
    .observe(['(min-width: 768px) and (max-width: 1024px)'])
    .subscribe(result => {
      this.isTablet.set(result.matches);
    });

    // Detecta desktop (≥1024px)
    this.breakpointObserver
    .observe(['(min-width: 1024px)'])
    .subscribe(result => {
      this.isDesktop.set(result.matches);
    });

    // Detecta handset usando breakpoints do Angular CDK
    this.breakpointObserver
    .observe([Breakpoints.Handset, Breakpoints.HandsetPortrait, Breakpoints.HandsetLandscape])
    .subscribe(result => {
      this.isHandset.set(result.matches);
    });
  }

  /**
   * Verifica se o viewport corresponde a um breakpoint customizado
   * @param query Media query CSS (ex: '(max-width: 600px)')
   * @returns Observable<boolean> indicando se o breakpoint corresponde
   */
  observe(query: string) {
    return this.breakpointObserver.observe([query]);
  }
}
