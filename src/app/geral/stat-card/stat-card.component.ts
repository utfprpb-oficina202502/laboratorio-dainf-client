import {ChangeDetectionStrategy, Component, Input, Output, EventEmitter} from '@angular/core';

@Component({
  selector: 'app-stat-card',
  templateUrl: './stat-card.component.html',
  styleUrls: ['./stat-card.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false
})
export class StatCardComponent {
  @Input() title: string;
  @Input() value: number | string | null | undefined;
  @Input() icon: string; // ex: 'pi-handshake'
  @Input() accentColor = '#3B82F6'; // azul padrão
  @Input() clickable = false; // suporte a clique opcional
  @Output() cardClick = new EventEmitter<void>();

  get safeValue() {
    return this.value === null || this.value === undefined || this.value === '' ? '-' : this.value;
  }

  onClick() {
    if (this.clickable) {
      this.cardClick.emit();
    }
  }
}
