import {Directive, ElementRef, inject, input, OnDestroy, Renderer2} from '@angular/core';
import {NgControl, ValidationErrors} from '@angular/forms';
import {ValidationService} from './validation.service';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

@Directive({
  selector: '[appValidation]',
})
export class ValidationDirective implements OnDestroy {
  private readonly el = inject(ElementRef);
  private readonly formControl = inject(NgControl);
  private readonly validationService = inject(ValidationService);
  private readonly renderer = inject(Renderer2);

  readonly validationMessage = input<string>('');

  private readonly targetElement: HTMLElement;
  private readonly formGroupElement: HTMLElement | null;
  private readonly destroy$ = new Subject<void>();

  constructor() {
    this.targetElement = this.el.nativeElement;
    this.formGroupElement = this.findFormGroup(this.targetElement);

    this.formControl.valueChanges?.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.checkValidation();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private findFormGroup(element: HTMLElement): HTMLElement | null {
    let current = element.parentElement;
    while (current) {
      // Look for form-field or flex flex-col gap-2 pattern (Tailwind)
      if (current.classList.contains('form-field') ||
        (current.classList.contains('flex') &&
          current.classList.contains('flex-col') &&
          current.classList.contains('gap-2'))) {
        return current;
      }
      current = current.parentElement;
    }
    return null;
  }

  resetFormGroup() {
    if (!this.formGroupElement) return;

    this.renderer.removeClass(this.formGroupElement, 'has-error');

    const helpBlocks = this.formGroupElement.querySelectorAll('.help-block');
    // Convert NodeList to Array for proper iteration in strict mode
    Array.from(helpBlocks).forEach(block => {
      block.remove();
    });

    if (typeof this.formControl.name === 'string') {
      this.validationService.removeValidation(this.formControl.name);
    }
  }

  getMessage(error?: string): string {
    const customMessage = this.validationMessage();
    if (customMessage) {
      return customMessage;
    } else if (error) {
      return this.validationService.getMessageByError(error);
    } else {
      return 'Por favor, insira um valor correto';
    }
  }

  getError(errors: ValidationErrors | null): string | null {
    if (!errors) {
      return null;
    }
    for (const key in errors) {
      if (Object.hasOwn(errors, key)) {
        return key;
      }
    }
    return null;
  }

  checkValidation() {
    this.resetFormGroup();

    if (!this.formGroupElement) return;

    if ((this.formControl.dirty || this.formControl.touched) && !this.formControl.valid) {
      const error = this.getError(this.formControl.errors);

      if (error) {
        const message = this.getMessage(error);

        // Add 'has-error' class
        this.renderer.addClass(this.formGroupElement, 'has-error');

        // Create and append help block
        const helpBlock = this.renderer.createElement('span');
        this.renderer.addClass(helpBlock, 'help-block');
        const text = this.renderer.createText(message);
        this.renderer.appendChild(helpBlock, text);
        this.renderer.appendChild(this.formGroupElement, helpBlock);

        let campo = '';
        const labels = this.formGroupElement.querySelectorAll('label');
        if (labels.length > 0) {
          campo = labels[0].textContent?.trim() || '';
        }

        this.validationService.addValidation({
          name: this.formControl.name as string,
          campo: campo,
          message: message,
          el: this.el
        });
      }
    }
  }
}
