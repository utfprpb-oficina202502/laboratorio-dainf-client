import {Directive, DoCheck, ElementRef, inject} from '@angular/core';
import {NgControl} from '@angular/forms';

@Directive({
  selector: '[appFormatCnpj]',
  host: {
    '(input)': 'onInput()'
  }
})
export class CnpjDirective implements DoCheck {
  el = inject(ElementRef);
  private readonly control = inject(NgControl);

  ngDoCheck(): void {
    this.format();
  }

  onInput() {
    this.format();
  }

  private format(): void {
    const value = this.el.nativeElement.value.replace(/\D/g, '');
    this.control.valueAccessor?.writeValue(value.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/g, '$1.$2.$3/$4-$5'));
  }
}
