import {ChangeDetectionStrategy, Component, computed, input} from '@angular/core';
import {RouterLink} from '@angular/router';
import {Card} from 'primeng/card';
import {ButtonModule} from 'primeng/button';
import {Skeleton} from 'primeng/skeleton';
import {ACTIVITY_ICONS, AtividadeUsuario} from '../../models/dashboard.models';

/**
 * Interface para item da timeline agrupado por período.
 */
interface TimelineItem {
  activity: AtividadeUsuario;
  icon: string;
  color: string;
  formattedDate: string;
  formattedTime: string;
  periodLabel: string;
  /** Título normalizado com acentos corretos */
  normalizedTitulo: string;
  /** Descrição normalizada com acentos corretos */
  normalizedDescricao: string;
}

/**
 * Mapa de correções de acentuação para textos do backend.
 * Corrige palavras que podem vir sem acentos corretos.
 */
const ACCENT_CORRECTIONS: Record<string, string> = {
  'Devolucao': 'Devolução',
  'devolucao': 'devolução',
  'Emprestimo': 'Empréstimo',
  'emprestimo': 'empréstimo',
  'Historico': 'Histórico',
  'historico': 'histórico',
  'Calendario': 'Calendário',
  'calendario': 'calendário',
  'Proximo': 'Próximo',
  'proximo': 'próximo',
  'Proxima': 'Próxima',
  'proxima': 'próxima',
  'Numero': 'Número',
  'numero': 'número',
  'Codigo': 'Código',
  'codigo': 'código',
  'Situacao': 'Situação',
  'situacao': 'situação',
  'Descricao': 'Descrição',
  'descricao': 'descrição',
  'Informacao': 'Informação',
  'informacao': 'informação',
  'Orcamento': 'Orçamento',
  'orcamento': 'orçamento'
};

/**
 * Componente que exibe a timeline de atividades recentes do usuário.
 *
 * @description Usa o p-timeline do PrimeNG para exibir:
 * - Retiradas de empréstimos
 * - Devoluções de empréstimos
 * - Reservas criadas
 *
 * Os eventos são agrupados por período: Hoje, Ontem, Esta Semana, Mais Antigo.
 *
 * @example
 * <app-activity-timeline [activities]="activities()" [loading]="loading()" />
 */
@Component({
  selector: 'app-activity-timeline',
  templateUrl: './activity-timeline.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    Card,
    ButtonModule,
    RouterLink,
    Skeleton
  ],
  host: {
    class: 'block'
  },
  styles: [`
    :host ::ng-deep .p-card {
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    :host ::ng-deep .p-card-body {
      flex: 1 1 0;
      display: flex;
      flex-direction: column;
      min-height: 0;
      overflow: hidden;
    }

    :host ::ng-deep .p-card-content {
      flex: 1;
      overflow-y: auto;
      min-height: 0;
    }
  `]
})
export class ActivityTimelineComponent {
  /** Lista de atividades vindas do backend */
  readonly activities = input<AtividadeUsuario[]>([]);

  /** Indica se os dados estão carregando */
  readonly loading = input<boolean>(false);

  /** Atividades transformadas para exibição na timeline */
  protected readonly timelineItems = computed<TimelineItem[]>(() => {
    const activities = this.activities();
    if (!activities.length) {
      return [];
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    return activities.map(activity => {
      const activityDate = new Date(activity.dataHora);
      const activityDay = new Date(activityDate.getFullYear(), activityDate.getMonth(), activityDate.getDate());

      let periodLabel: string;
      if (activityDay.getTime() === today.getTime()) {
        periodLabel = 'Hoje';
      } else if (activityDay.getTime() === yesterday.getTime()) {
        periodLabel = 'Ontem';
      } else if (activityDay >= weekAgo) {
        periodLabel = 'Esta semana';
      } else {
        periodLabel = 'Mais antigo';
      }

      const iconConfig = ACTIVITY_ICONS[activity.tipo] || {
        icon: 'pi pi-circle',
        color: '#6B7280'
      };

      return {
        activity,
        icon: iconConfig.icon,
        color: iconConfig.color,
        formattedDate: this.formatDate(activityDate),
        formattedTime: this.formatTime(activityDate),
        periodLabel,
        normalizedTitulo: this.normalizeAccents(activity.titulo),
        normalizedDescricao: this.normalizeAccents(activity.descricao)
      };
    });
  });

  /** Indica se há atividades para exibir */
  protected readonly hasActivities = computed(() => this.timelineItems().length > 0);

  /**
   * Retorna a rota para o item referenciado.
   */
  protected getRouterLink(item: TimelineItem): string[] {
    const basePath = item.activity.referenciaTipo === 'EMPRESTIMO' ? '/emprestimo' : '/reserva';
    return [basePath, item.activity.referenciaId.toString()];
  }

  /**
   * Formata a data para exibição (dd/mm/aaaa).
   */
  private formatDate(date: Date): string {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  /**
   * Formata a hora para exibição.
   */
  private formatTime(date: Date): string {
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Normaliza acentos em textos que podem vir incorretos do backend.
   *
   * @param text Texto a ser normalizado
   * @returns Texto com acentos corrigidos
   */
  private normalizeAccents(text: string): string {
    if (!text) {
      return text;
    }

    let normalized = text;
    for (const [incorrect, correct] of Object.entries(ACCENT_CORRECTIONS)) {
      normalized = normalized.replaceAll(incorrect, correct);
    }
    return normalized;
  }
}
