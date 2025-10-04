import {Directive, DoCheck, ElementRef, HostListener, inject} from '@angular/core';
import {NgControl} from '@angular/forms';

@Directive({
    selector: '[formatCnpj]',
})
export class CnpjDirective implements DoCheck {
  el = inject(ElementRef);
  private readonly control = inject(NgControl);

  ngDoCheck(): void {
    this.format();
  }

  @HostListener('input', ['$event'])
  onInput(e) {
    this.format();
  }

  private format(): void {
    const value = this.el.nativeElement.value.replace(/\D/g, '');
    this.control.valueAccessor.writeValue(value.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/g, '$1.$2.$3/$4-$5'));
  }
}
