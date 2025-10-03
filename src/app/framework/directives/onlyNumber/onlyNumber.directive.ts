import { Directive, ElementRef, HostListener, inject } from '@angular/core';

@Directive({
  selector: '[onlyNumber]',
  standalone: false,
})
export class OnlyNumberDirective {
  private readonly el = inject<ElementRef<HTMLInputElement>>(ElementRef);

  @HostListener('keydown', ['$event'])
  onKeyDown(e: KeyboardEvent) {
    const alwaysAllowed = [
      'Delete', 'Backspace', 'Tab', 'Escape', 'Enter',
      'Home', 'End', 'ArrowLeft', 'ArrowRight', '.'
    ];

    if (
      alwaysAllowed.includes(e.key) ||
      (['a', 'c', 'v', 'x'].includes(e.key.toLowerCase()) && (e.ctrlKey || e.metaKey))
    ) {
      return;
    }

    if (/^\d$/.test(e.key)) return;
    e.preventDefault();
  }
}
