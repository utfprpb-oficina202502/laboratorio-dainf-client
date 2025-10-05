import {Directive, ElementRef, inject} from '@angular/core';

@Directive({
  selector: '[appOnlyNumber]',
  host: {
    '(keydown)': 'onKeyDown($event)'
  }
})
export class OnlyNumberDirective {
  private readonly el = inject<ElementRef<HTMLInputElement>>(ElementRef);

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
