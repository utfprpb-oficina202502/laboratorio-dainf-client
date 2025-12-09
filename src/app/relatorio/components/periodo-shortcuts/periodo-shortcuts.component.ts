import {ChangeDetectionStrategy, Component, inject, input, output} from '@angular/core';
import {ChipModule} from 'primeng/chip';

import {AtalhoPeriodo} from '../../models/relatorio-card.interface';
import {
  PeriodoDatas,
  RelatorioParametrosService
} from '../../services/relatorio-parametros.service';

/**
 * Componente de atalhos de período para relatórios.
 *
 * Exibe chips clicáveis que aplicam períodos pré-definidos:
 * - Últimos 30 dias
 * - Este mês
 * - Último mês
 * - Último trimestre
 * - Este ano
 *
 * @example
 * <app-periodo-shortcuts
 *   [atalhos]="['ultimos30dias', 'esteMes', 'ultimoMes']"
 *   (periodoSelecionado)="onPeriodoSelecionado($event)">
 * </app-periodo-shortcuts>
 */
@Component({
  selector: 'app-periodo-shortcuts',
  template: `
    <div class="periodo-shortcuts">
      <span class="periodo-shortcuts-label">Atalhos:</span>
      <div class="periodo-shortcuts-chips">
        @for (atalho of atalhos(); track atalho) {
          <p-chip
            [label]="parametrosService.ATALHOS_LABELS[atalho]"
            (click)="onAtalhoClick(atalho)"
            [removable]="false"
            styleClass="periodo-chip"/>
        }
      </div>
    </div>
  `,
  styles: [`
    .periodo-shortcuts {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
      margin-bottom: 0.75rem;
    }

    .periodo-shortcuts-label {
      font-size: 0.75rem;
      color: var(--color-text-secondary);
      font-weight: 500;
    }

    .periodo-shortcuts-chips {
      display: flex;
      gap: 0.375rem;
      flex-wrap: wrap;
    }

    :host ::ng-deep .periodo-chip {
      cursor: pointer;
      font-size: 0.75rem;
      padding: 0.25rem 0.5rem;
      background-color: var(--p-surface-100, #f3f4f6);
      border: 1px solid var(--p-surface-200, #e5e7eb);
      transition: all 0.2s ease;
    }

    :host ::ng-deep .periodo-chip:hover {
      background-color: var(--p-primary-50, #eff6ff);
      border-color: var(--p-primary-200, #bfdbfe);
      color: var(--p-primary-700, #1d4ed8);
    }

    :host ::ng-deep .periodo-chip:active {
      transform: scale(0.96);
    }

    /* Mobile: layout em grid para melhor aproveitamento (≤768px conforme BreakpointService) */
    @media (max-width: 768px) {
      .periodo-shortcuts {
        flex-direction: column;
        align-items: stretch;
        gap: 0.375rem;
      }

      .periodo-shortcuts-label {
        margin-bottom: 0.125rem;
        font-size: 0.6875rem;
        text-transform: uppercase;
        letter-spacing: 0.025em;
      }

      .periodo-shortcuts-chips {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 0.5rem;
        width: 100%;
      }

      :host ::ng-deep .periodo-chip {
        justify-content: center;
        text-align: center;
        padding: 0.5rem 0.375rem;
        min-height: 2.25rem; /* Área de toque mínima ~36px */
        font-size: 0.6875rem;
      }

      :host ::ng-deep .periodo-chip .p-chip-label {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }

    /* Telas muito pequenas (320px - 374px): mantém 2 colunas com ajustes de tamanho */
    @media (max-width: 374px) {
      .periodo-shortcuts-chips {
        grid-template-columns: repeat(2, 1fr);
        gap: 0.375rem;
      }

      :host ::ng-deep .periodo-chip {
        font-size: 0.625rem;
        padding: 0.375rem 0.25rem;
      }
    }

    /* Dark mode */
    :host-context(.theme-dark) ::ng-deep .periodo-chip {
      background-color: var(--p-surface-700, #334155);
      border-color: var(--p-surface-600, #475569);
      color: var(--p-surface-200, #e2e8f0);
    }

    :host-context(.theme-dark) ::ng-deep .periodo-chip:hover {
      background-color: var(--p-surface-600, #475569);
      border-color: var(--p-primary-400, #60a5fa);
      color: var(--p-primary-300, #93c5fd);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ChipModule]
})
export class PeriodoShortcutsComponent {
  /** Lista de atalhos a exibir */
  readonly atalhos = input.required<AtalhoPeriodo[]>();
  /** Evento emitido quando um período é selecionado */
  readonly periodoSelecionado = output<PeriodoDatas>();
  protected readonly parametrosService = inject(RelatorioParametrosService);

  /**
   * Callback quando um atalho é clicado.
   */
  onAtalhoClick(atalho: AtalhoPeriodo): void {
    const periodo = this.parametrosService.aplicarAtalhoPeriodo(atalho);
    this.periodoSelecionado.emit(periodo);
  }
}
