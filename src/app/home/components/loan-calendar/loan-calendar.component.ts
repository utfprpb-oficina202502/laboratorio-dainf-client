import {ChangeDetectionStrategy, Component, computed, input, signal} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {DatePickerModule} from 'primeng/datepicker';
import {Card} from 'primeng/card';
import {TooltipModule} from 'primeng/tooltip';
import {Skeleton} from 'primeng/skeleton';
import {
  CALENDAR_EVENT_COLORS,
  EventoCalendario,
  TipoEventoCalendario
} from '../../models/dashboard.models';

/**
 * Tipo para representar eventos agrupados por data no calendário.
 * Chave: data no formato "YYYY-MM-DD", Valor: lista de eventos.
 */
type CalendarDateEvents = Record<string, EventoCalendario[]>;

/**
 * Componente que exibe um calendário visual com eventos de empréstimos.
 *
 * @description Usa o p-datepicker em modo inline com template customizado
 * para marcar datas com eventos:
 * - 🟦 Retirada (azul)
 * - 🟨 Devolução Prevista (amarelo)
 * - 🟩 Devolução Realizada (verde)
 * - 🟥 Atrasado (vermelho)
 *
 * @example
 * <app-loan-calendar [events]="events()" [loading]="loading()" />
 */
@Component({
  selector: 'app-loan-calendar',
  templateUrl: './loan-calendar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePickerModule,
    Card,
    TooltipModule,
    Skeleton,
    FormsModule
  ]
})
export class LoanCalendarComponent {
  /** Lista de eventos vindos do backend */
  readonly events = input<EventoCalendario[]>([]);

  /** Indica se os dados estão carregando */
  readonly loading = input<boolean>(false);

  /** Data selecionada no calendário (apenas para visualização) */
  protected readonly selectedDate = signal<Date | null>(null);

  /** Mapa de eventos agrupados por data (formato: "YYYY-MM-DD") */
  protected readonly eventsByDate = computed<CalendarDateEvents>(() => {
    const events = this.events();
    const map: CalendarDateEvents = {};

    for (const event of events) {
      const dateKey = event.data; // ISO format: "2025-01-15"
      if (!map[dateKey]) {
        map[dateKey] = [];
      }
      map[dateKey].push(event);
    }

    return map;
  });

  /** Configuração de cores por tipo de evento */
  protected readonly eventColors = CALENDAR_EVENT_COLORS;

  /**
   * Verifica se uma data tem eventos.
   */
  hasEvents(date: { day: number; month: number; year: number }): boolean {
    const dateKey = this.formatDateKey(date);
    return !!this.eventsByDate()[dateKey];
  }

  /**
   * Retorna os eventos de uma data específica.
   */
  getEventsForDate(date: { day: number; month: number; year: number }): EventoCalendario[] {
    const dateKey = this.formatDateKey(date);
    return this.eventsByDate()[dateKey] || [];
  }

  /**
   * Retorna a cor dominante para uma data (prioridade: atrasado > prevista > retirada > realizada).
   */
  getDominantColor(date: { day: number; month: number; year: number }): string | null {
    const events = this.getEventsForDate(date);
    if (!events.length) {
      return null;
    }

    // Prioridade de cores
    const priorities: TipoEventoCalendario[] = ['ATRASADO', 'DEVOLUCAO_PREVISTA', 'RETIRADA', 'DEVOLUCAO_REALIZADA'];

    for (const tipo of priorities) {
      if (events.some(e => e.tipo === tipo)) {
        return this.eventColors[tipo];
      }
    }

    return null;
  }

  /**
   * Retorna o tooltip com descrição dos eventos de uma data.
   */
  getTooltip(date: { day: number; month: number; year: number }): string {
    const events = this.getEventsForDate(date);
    if (!events.length) {
      return '';
    }

    return events.map(e => {
      const tipoLabel = this.getTipoLabel(e.tipo);
      return `${tipoLabel}: ${e.descricao}`;
    }).join('\n');
  }

  /**
   * Retorna o label legível para um tipo de evento.
   */
  private getTipoLabel(tipo: TipoEventoCalendario): string {
    const labels: Record<TipoEventoCalendario, string> = {
      RETIRADA: 'Retirada',
      DEVOLUCAO_PREVISTA: 'Devolução prevista',
      DEVOLUCAO_REALIZADA: 'Devolvido',
      ATRASADO: 'Atrasado'
    };
    return labels[tipo] || tipo;
  }

  /**
   * Formata uma data para a chave do mapa (YYYY-MM-DD).
   */
  private formatDateKey(date: { day: number; month: number; year: number }): string {
    const year = date.year;
    const month = String(date.month + 1).padStart(2, '0');
    const day = String(date.day).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
