import {ChangeDetectionStrategy, Component, computed, input} from '@angular/core';
import {StatCardComponent} from '../../../components/stat-card/stat-card.component';
import {SkeletonCardComponent} from '../../../framework/component/skeleton-card.component';
import {EstatisticasUsuario} from '../../models/dashboard.models';

/**
 * Componente que exibe 4 cards de estatísticas do dashboard do usuário.
 *
 * @description Reutiliza o StatCardComponent existente para exibir:
 * - Empréstimos em Aberto (azul)
 * - Empréstimos em Atraso (vermelho)
 * - Dias para Próxima Devolução (amarelo)
 * - Total de Empréstimos (verde)
 *
 * @example
 * <app-loan-stat-cards [stats]="stats()" [loading]="loading()" />
 */
@Component({
  selector: 'app-loan-stat-cards',
  templateUrl: './loan-stat-cards.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    StatCardComponent,
    SkeletonCardComponent
  ],
  host: {
    /**
     * 'contents' faz o elemento host "desaparecer" do layout,
     * permitindo que os 4 cards filhos participem diretamente do grid pai.
     * O role="group" e aria-label mantêm a semântica para leitores de tela.
     */
    'class': 'contents',
    'role': 'group',
    'aria-label': 'Estatísticas de empréstimos do usuário'
  }
})
export class LoanStatCardsComponent {
  /** Estatísticas do usuário vindas do backend */
  readonly stats = input<EstatisticasUsuario | null>(null);

  /** Indica se os dados estão carregando */
  readonly loading = input<boolean>(false);

  /** Texto formatado para próxima devolução */
  protected readonly proximaDevolucaoText = computed(() => {
    const stats = this.stats();
    if (!stats || stats.diasParaProximaDevolucao === null || stats.diasParaProximaDevolucao === undefined) {
      return '-';
    }

    const dias = stats.diasParaProximaDevolucao;
    if (dias < 0) {
      return `${Math.abs(dias)} dia(s) atrás`;
    }
    if (dias === 0) {
      return 'Hoje';
    }
    if (dias === 1) {
      return '1 dia';
    }
    return `${dias} dias`;
  });
}
