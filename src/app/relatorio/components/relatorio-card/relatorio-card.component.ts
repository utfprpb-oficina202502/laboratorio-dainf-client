import {ChangeDetectionStrategy, Component, computed, input, output} from '@angular/core';
import {NgStyle} from '@angular/common';

import {RelatorioCardConfig} from '../../models/relatorio-card.interface';

/**
 * Card minimalista de relatório.
 *
 * Exibe apenas título e descrição.
 * Clique abre modal com opções de formato e filtros.
 *
 * @example
 * <app-relatorio-card
 *   [config]="relatorioConfig"
 *   [loading]="isLoading()"
 *   (cardClick)="onCardClick($event)" />
 */
@Component({
  selector: 'app-relatorio-card',
  templateUrl: './relatorio-card.component.html',
  styleUrls: ['./relatorio-card.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgStyle]
})
export class RelatorioCardComponent {
  /** Configuração do relatório */
  readonly config = input.required<RelatorioCardConfig>();

  /** Se está gerando o relatório */
  readonly loading = input<boolean>(false);

  /** Evento de clique no card */
  readonly cardClick = output<RelatorioCardConfig>();

  /** CSS variables para cor de destaque */
  readonly styleVariables = computed(() => ({
    '--card-accent': this.config().cor,
    '--card-accent-light': this.hexToRgba(this.config().cor, 0.08),
    '--card-accent-medium': this.hexToRgba(this.config().cor, 0.15)
  }));

  /**
   * Handler de clique no card.
   */
  onClick(): void {
    if (this.loading()) return;
    this.cardClick.emit(this.config());
  }

  /**
   * Converte hex para rgba.
   */
  private hexToRgba(hex: string, alpha: number): string {
    if (!hex) return `rgba(0,0,0,${alpha})`;
    let h = hex.trim();
    if (h.startsWith('#')) h = h.substring(1);
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    if (h.length !== 6) return `rgba(0,0,0,${alpha})`;
    const r = Number.parseInt(h.slice(0, 2), 16);
    const g = Number.parseInt(h.slice(2, 4), 16);
    const b = Number.parseInt(h.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }
}
