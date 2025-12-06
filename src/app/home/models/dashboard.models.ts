/**
 * Interfaces TypeScript para o Dashboard Pessoal de Alunos/Professores.
 * Espelham os DTOs do backend (DashboardService).
 *
 * @description Modelos de dados para exibição de estatísticas, atividades,
 * calendário e itens frequentes do usuário logado.
 */

/**
 * Estatísticas gerais do usuário.
 * Espelha EstatisticasUsuarioDto.java
 */
export interface EstatisticasUsuario {
  /** Empréstimos ativos dentro do prazo */
  emprestimosEmAberto: number;
  /** Empréstimos ativos com prazo vencido */
  emprestimosEmAtraso: number;
  /** Total histórico de empréstimos do usuário */
  emprestimosTotal: number;
  /** Data da próxima devolução (ISO: "2025-01-15") ou null se não houver */
  proximaDevolucao: string | null;
  /** Dias até a próxima devolução (negativo se atrasado) ou null */
  diasParaProximaDevolucao: number | null;
}

/**
 * Item frequentemente emprestado pelo usuário.
 * Espelha ItemFrequenteUsuarioDto.java
 */
export interface ItemFrequenteUsuario {
  /** ID do item */
  itemId: number;
  /** Nome do item */
  itemNome: string;
  /** Quantidade de vezes que o usuário emprestou este item */
  qtde: number;
  /** Saldo disponível atual do item */
  saldo: number;
}

/**
 * Histórico de uso mensal do usuário.
 * Espelha HistoricoUsoMensalDto.java
 */
export interface HistoricoUsoMensal {
  /** Mês no formato "2025-01" */
  mes: string;
  /** Label do mês no formato "Jan/25" (pt-BR) */
  mesLabel: string;
  /** Total de empréstimos no mês */
  quantidade: number;
}

/**
 * Atividade recente do usuário (timeline).
 * Espelha AtividadeUsuarioDto.java
 */
export interface AtividadeUsuario {
  /** Data e hora da atividade (ISO: "2025-01-15T10:30:00") */
  dataHora: string;
  /** Tipo da atividade */
  tipo: TipoAtividade;
  /** Título da atividade */
  titulo: string;
  /** Descrição detalhada */
  descricao: string;
  /** ID do empréstimo ou reserva relacionado */
  referenciaId: number;
  /** Tipo da referência */
  referenciaTipo: TipoReferencia;
}

/** Tipos de atividade do usuário */
export type TipoAtividade = 'EMPRESTIMO_RETIRADA' | 'EMPRESTIMO_DEVOLUCAO' | 'RESERVA_CRIADA';

/** Tipos de referência para atividades */
export type TipoReferencia = 'EMPRESTIMO' | 'RESERVA';

/**
 * Evento do calendário do usuário.
 * Espelha EventoCalendarioDto.java
 */
export interface EventoCalendario {
  /** Data do evento (ISO: "2025-01-15") */
  data: string;
  /** Tipo do evento no calendário */
  tipo: TipoEventoCalendario;
  /** ID do empréstimo relacionado */
  emprestimoId: number;
  /** Descrição com nomes dos itens */
  descricao: string;
}

/** Tipos de evento no calendário */
export type TipoEventoCalendario =
  'RETIRADA'
  | 'DEVOLUCAO_PREVISTA'
  | 'DEVOLUCAO_REALIZADA'
  | 'ATRASADO';

/**
 * Constante para alerta de vencimento próximo.
 * Alertas amarelos aparecem quando faltam 7 dias ou menos para devolução.
 */
export const ALERT_DAYS_BEFORE_DUE = 7;

/**
 * Configuração de cores por tipo de evento no calendário.
 */
export const CALENDAR_EVENT_COLORS: Record<TipoEventoCalendario, string> = {
  RETIRADA: '#3B82F6',           // Azul
  DEVOLUCAO_PREVISTA: '#F59E0B', // Amarelo
  DEVOLUCAO_REALIZADA: '#22C55E', // Verde
  ATRASADO: '#EF4444'            // Vermelho
};

/**
 * Configuração de ícones por tipo de atividade na timeline.
 */
export const ACTIVITY_ICONS: Record<TipoAtividade, { icon: string; color: string }> = {
  EMPRESTIMO_RETIRADA: {icon: 'pi pi-arrow-up-right', color: '#3B82F6'},
  EMPRESTIMO_DEVOLUCAO: {icon: 'pi pi-check', color: '#22C55E'},
  RESERVA_CRIADA: {icon: 'pi pi-calendar-plus', color: '#F59E0B'}
};
