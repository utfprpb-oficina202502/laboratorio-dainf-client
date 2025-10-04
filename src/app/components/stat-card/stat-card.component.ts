import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges
} from '@angular/core';
import {NgClass, NgStyle} from "@angular/common";

@Component({
  selector: 'app-stat-card',
  templateUrl: './stat-card.component.html',
  styleUrls: ['./stat-card.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgStyle,
    NgClass
  ]
})
export class StatCardComponent implements OnChanges {
  @Input() title: string;
  @Input() value: number | string | null | undefined;
  @Input() icon: string; // ex: 'handshake', 'clock-o'
  @Input() accentColor = '#3B82F6';
  @Input() clickable = false;
  @Input() iconLibrary: 'pi' | 'fa' = 'fa'; // padrão agora Font Awesome
  @Output() cardClick = new EventEmitter<void>();

  private accentTint = this.hexToRgba(this.accentColor, 0.18);
  private accentMuted = this.hexToRgba(this.accentColor, 0.24);

  ngOnChanges(changes: SimpleChanges) {
    if (changes['accentColor']) {
      this.updateAccentVariants();
    }
  }

  private updateAccentVariants() {
    this.accentTint = this.hexToRgba(this.accentColor, 0.18);
    this.accentMuted = this.hexToRgba(this.accentColor, 0.24);
  }

  private hexToRgba(hex: string, alpha: number): string {
    if (!hex) { return `rgba(0,0,0,${alpha})`; }
    let h = hex.trim();
    if (h.startsWith('rgba')) return h;
    if (h.startsWith('rgb')) return h.replace('rgb','rgba').replace(')',`,`+alpha+')');
    if (h.startsWith('#')) h = h.substring(1);
    if (h.length === 3) { h = h.split('').map(c=>c+c).join(''); }
    if (h.length !== 6) return `rgba(0,0,0,${alpha})`;
    const r = Number.parseInt(h.slice(0, 2), 16);
    const g = Number.parseInt(h.slice(2, 4), 16);
    const b = Number.parseInt(h.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  get styleVariables() {
    return {
      '--stat-card-accent-color': this.accentColor,
      '--stat-card-accent-tint': this.accentTint,
      '--stat-card-accent-muted': this.accentMuted
    };
  }

  get safeValue() {
    return this.value === null || this.value === undefined || this.value === '' ? '-' : this.value;
  }

  get iconClasses() {
    return this.iconLibrary === 'pi' ? `pi pi-${this.icon}` : `fa fa-${this.icon}`;
  }

  onClick() {
    if (this.clickable) {
      this.cardClick.emit();
    }
  }

  onKeyDown(event: KeyboardEvent) {
    if (this.clickable && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      this.cardClick.emit();
    }
  }
}
