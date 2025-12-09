/**
 * Utilitários para formatação de histórico de transições entre entidades.
 * @module HistoricoTransicaoUtils
 * @author DAINF/UTFPR
 * @description Funções utilitárias para preservar rastreabilidade de transições
 * (Reserva → Empréstimo → Saída) no campo observação, garantindo resiliência
 * mesmo em caso de migração de banco que altere IDs.
 * @example
 * import { formatarHistoricoReserva } from './historico-transicao.utils';
 * const obs = formatarHistoricoReserva(123, 'João Silva', '12/01/2025', 'Obs original');
 */

/**
 * Formata histórico de transição de Reserva para append no campo observação do Empréstimo.
 * Preserva rastreabilidade mesmo se IDs mudarem em migrações de banco.
 * @param reservaId ID da reserva original
 * @param usuarioNome Nome do usuário que criou a reserva
 * @param dataReserva Data da criação da reserva (formato dd/mm/yyyy)
 * @param observacaoOriginal Observação original da reserva (opcional)
 * @returns String formatada com histórico + observação original
 * @example
 * const obs = formatarHistoricoReserva(123, 'João Silva', '12/01/2025', 'Preciso para aula');
 * // Retorna:
 * // --- Histórico de Transição ---
 * // [RESERVA #123] Criado por João Silva em 12/01/2025
 * // ------------------------------
 * // Preciso para aula
 */
export function formatarHistoricoReserva(
  reservaId: number,
  usuarioNome: string,
  dataReserva: string,
  observacaoOriginal?: string
): string {
  const linha = `[RESERVA #${reservaId}] Criado por ${usuarioNome} em ${dataReserva}`;

  const bloco = [
    '--- Histórico de Transição ---',
    linha,
    '------------------------------'
  ].join('\n');

  return observacaoOriginal?.trim()
    ? `${bloco}\n${observacaoOriginal}`
    : bloco;
}
