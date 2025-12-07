import {ChangeDetectionStrategy, Component, computed, input} from '@angular/core';
import {RouterLink} from '@angular/router';
import {ButtonModule} from 'primeng/button';
import {ALERT_DAYS_BEFORE_DUE, EstatisticasUsuario} from '../../models/dashboard.models';

/**
 * Interface para representar um alerta no dashboard.
 */
interface AlertItem {
  type: 'atraso' | 'vencimento';
  severity: 'danger' | 'warn';
  icon: string;
  title: string;
  message: string;
}

/**
 * Componente que exibe alertas de empréstimos atrasados e próximos de vencer.
 *
 * @description Calcula alertas localmente baseado nas estatísticas do usuário:
 * - Alerta vermelho: quando há empréstimos em atraso
 * - Alerta amarelo: quando a próxima devolução é em até 7 dias
 *
 * @example
 * <app-alert-center [stats]="stats()" />
 */
@Component({
  selector: 'app-alert-center',
  templateUrl: './alert-center.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ButtonModule,
    RouterLink
  ]
})
export class AlertCenterComponent {
  /** Estatísticas do usuário vindas do backend */
  readonly stats = input<EstatisticasUsuario | null>(null);

  /** Lista de alertas calculados */
  protected readonly alerts = computed<AlertItem[]>(() => {
    const stats = this.stats();
    if (!stats) {
      return [];
    }

    const alertList: AlertItem[] = [];

    // Alerta de atraso (vermelho)
    if (stats.emprestimosEmAtraso > 0) {
      const plural = stats.emprestimosEmAtraso > 1 ? 's' : '';
      alertList.push({
        type: 'atraso',
        severity: 'danger',
        icon: 'pi pi-exclamation-triangle',
        title: 'Empréstimo em atraso',
        message: `Você tem ${stats.emprestimosEmAtraso} empréstimo${plural} com prazo vencido. Regularize o mais rápido possível.`
      });
    }

    // Alerta de vencimento próximo (amarelo)
    if (stats.diasParaProximaDevolucao !== null &&
      stats.diasParaProximaDevolucao >= 0 &&
      stats.diasParaProximaDevolucao <= ALERT_DAYS_BEFORE_DUE) {

      const dias = stats.diasParaProximaDevolucao;
      let message: string;

      if (dias === 0) {
        message = 'Você tem uma devolução para hoje!';
      } else if (dias === 1) {
        message = 'Você tem uma devolução para amanhã.';
      } else {
        message = `Você tem uma devolução em ${dias} dias.`;
      }

      alertList.push({
        type: 'vencimento',
        severity: 'warn',
        icon: 'pi pi-calendar',
        title: 'Devolução próxima',
        message
      });
    }

    return alertList;
  });

  /** Indica se há alertas para exibir */
  protected readonly hasAlerts = computed(() => this.alerts().length > 0);
}
