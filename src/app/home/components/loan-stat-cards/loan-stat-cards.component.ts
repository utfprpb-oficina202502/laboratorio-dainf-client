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

  /**
   * Título dinâmico do card baseado no estado do empréstimo.
   * - Sem empréstimos: "Nenhum Empréstimo" (positivo)
   * - Atrasado: "Devolução Atrasada" (urgente)
   * - Vence hoje: "Devolução Hoje" (atenção)
   * - Outros casos: "Próx. Devolução"
   */
  protected readonly proximaDevolucaoTitle = computed(() => {
    const stats = this.stats();
    if (!stats || stats.diasParaProximaDevolucao === null || stats.diasParaProximaDevolucao === undefined) {
      return 'Nenhum Empréstimo';
    }

    const dias = stats.diasParaProximaDevolucao;
    if (dias < 0) return 'Devolução Atrasada';
    if (dias === 0) return 'Devolução Hoje';
    return 'Próx. Devolução';
  });

  /**
   * Cor do card baseada no estado do empréstimo.
   * - Verde (#22C55E): sem pendências ou prazo > 7 dias
   * - Vermelho (#EF4444): atrasado
   * - Amarelo (#F59E0B): vence em breve (0-7 dias)
   */
  protected readonly proximaDevolucaoColor = computed(() => {
    const stats = this.stats();
    if (!stats || stats.diasParaProximaDevolucao === null || stats.diasParaProximaDevolucao === undefined) {
      return '#22C55E';
    }

    const dias = stats.diasParaProximaDevolucao;
    if (dias < 0) return '#EF4444';
    if (dias > 7) return '#22C55E';
    return '#F59E0B';
  });

  /**
   * Texto formatado para próxima devolução.
   * - Sem empréstimos: "✓"
   * - Atrasado: "X dias" (quantidade de dias em atraso)
   * - Hoje: "Hoje"
   * - Amanhã: "Amanhã"
   * - Outros: "X dias"
   */
  protected readonly proximaDevolucaoText = computed(() => {
    const stats = this.stats();
    if (!stats || stats.diasParaProximaDevolucao === null || stats.diasParaProximaDevolucao === undefined) {
      return '✓';
    }

    const dias = stats.diasParaProximaDevolucao;
    if (dias < 0) {
      const diasAtraso = Math.abs(dias);
      return diasAtraso === 1 ? '1 dia' : `${diasAtraso} dias`;
    }
    if (dias === 0) return 'Hoje';
    if (dias === 1) return 'Amanhã';
    return `${dias} dias`;
  });
}
