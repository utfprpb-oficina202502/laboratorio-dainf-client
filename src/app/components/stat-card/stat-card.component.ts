import {ChangeDetectionStrategy, Component, effect, input, output, signal} from '@angular/core';

@Component({
  selector: 'app-stat-card',
  templateUrl: './stat-card.component.html',
  styleUrls: ['./stat-card.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true
})
export class StatCardComponent {
  readonly title = input.required<string>();
  readonly value = input<number | string | null | undefined>();
  readonly icon = input.required<string>(); // ex: 'handshake', 'clock-o'
  readonly accentColor = input<string>('#3B82F6');
  readonly clickable = input<boolean>(false);
  readonly iconLibrary = input<'pi' | 'fa'>('fa'); // padrão agora Font Awesome
  readonly cardClick = output<void>();

  // Sinais derivados para as variantes de cor
  private readonly accentTint = signal(this.hexToRgba(this.accentColor(), 0.18));
  private readonly accentMuted = signal(this.hexToRgba(this.accentColor(), 0.24));

  constructor() {
    // Effect reage automaticamente quando accentColor() muda
    effect(() => {
      const color = this.accentColor();
      this.accentTint.set(this.hexToRgba(color, 0.18));
      this.accentMuted.set(this.hexToRgba(color, 0.24));
    });
  }

  get iconClasses() {
    return this.iconLibrary() === 'fa' ? `fa fa-${this.icon()}` : `pi pi-${this.icon()}`;
  }

  get styleVariables() {
    return {
      '--stat-card-accent-color': this.accentColor(),
      '--stat-card-accent-tint': this.accentTint(),
      '--stat-card-accent-muted': this.accentMuted()
    };
  }

  get safeValue() {
    const val = this.value();
    return val === null || val === undefined || val === '' ? '-' : val;
  }

  onClick() {
    if (this.clickable()) {
      this.cardClick.emit();
    }
  }

  private hexToRgba(hex: string, alpha: number): string {
    if (!hex) { return `rgba(0,0,0,${alpha})`; }
    let h = hex.trim();
    if (h.startsWith('rgba')) return h;
    if (h.startsWith('rgb')) return h.replace('rgb', 'rgba').replaceAll(')', `,` + alpha + ')');
    if (h.startsWith('#')) h = h.substring(1);
    if (h.length === 3) { h = h.split('').map(c=>c+c).join(''); }
    if (h.length !== 6) return `rgba(0,0,0,${alpha})`;
    const r = Number.parseInt(h.slice(0, 2), 16);
    const g = Number.parseInt(h.slice(2, 4), 16);
    const b = Number.parseInt(h.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  onKeyDown(event: KeyboardEvent) {
    if (this.clickable() && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      this.cardClick.emit();
    }
  }
}
