import {Directive, ElementRef, HostListener, inject, OnInit} from '@angular/core';
import {NgControl} from '@angular/forms';

@Directive({
  selector: '[formatTelefone]',
})
export class TelefoneFormatDirective implements OnInit {
  private readonly el = inject<ElementRef<HTMLInputElement>>(ElementRef);
  private readonly control = inject(NgControl);

  ngOnInit(): void {
    // Garante formatação inicial se já houver valor
    this.format();
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(e: KeyboardEvent) {
    // Permite edição/navegação e atalhos
    if (
      ['Delete', 'Backspace', 'Tab', 'Escape', 'Enter', 'Home', 'End', 'ArrowLeft', 'ArrowRight'].includes(e.key) ||
      (['a', 'c', 'v', 'x'].includes(e.key.toLowerCase()) && (e.ctrlKey || e.metaKey))
    ) {
      return;
    }

    // Permite apenas dígitos no keypress
    if (/^\d$/.test(e.key)) return;

    e.preventDefault();
  }

  @HostListener('input')
  onInput() {
    this.format();
  }

  private format(): void {
    const input = this.el.nativeElement;
    const digits = (input.value ?? '').replace(/\D/g, ''); // remove tudo que não é dígito

    let formatted = digits;

    if (digits.length === 10) {
      // (AA) NNNN-NNNN
      formatted = digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    } else if (digits.length === 11) {
      // (AA) NNNNN-NNNN
      formatted = digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }

    // Evita loops desnecessários: só escreve se mudou
    if (formatted !== input.value) {
      this.control?.valueAccessor?.writeValue(formatted);
    }
  }
}
