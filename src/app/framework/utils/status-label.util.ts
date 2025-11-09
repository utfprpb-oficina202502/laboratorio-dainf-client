/**
 * Utilitários para tradução de status e severidade de Nada Consta.
 * @module StatusLabelUtil
 * @author DAINF/UTFPR
 * @description Funções utilitárias para tradução de status e severidade, usadas em listas e tabelas.
 * @example
 * import { getNadaConstaStatusLabel, getNadaConstaStatusSeverity } from './status-label.util';
 * const label = getNadaConstaStatusLabel('PENDENTE');
 * const severity = getNadaConstaStatusSeverity('FAILED');
 */

/**
 * Retorna o label traduzido do status do Nada Consta.
 * @param status Status original
 * @returns Label traduzido
 */
export function getNadaConstaStatusLabel(status: string): string {
  switch (status) {
    case 'PENDENTE':
    case 'PENDING':
      return 'COM PENDÊNCIA';
    case 'COMPLETED':
    case 'CONCLUIDO':
    case 'CONCLUÍDO':
      return 'EMITIDO';
    case 'FAILED':
    case 'FALHA':
      return 'FALHA';
    case 'INVALIDADO':
    case 'INVALIDATED':
      return 'INVALIDADO';
    default:
      return status;
  }
}

/**
 * Retorna a severidade do status do Nada Consta para uso em tags PrimeNG.
 * @param status Status original
 * @returns 'warn' | 'success' | 'danger'
 */
export function getNadaConstaStatusSeverity(status: string): 'warn' | 'success' | 'danger' {
  switch (status) {
    case 'PENDENTE':
    case 'PENDING':
      return 'warn';
    case 'COMPLETED':
    case 'CONCLUIDO':
    case 'CONCLUÍDO':
      return 'success';
    case 'FAILED':
    case 'FALHA':
      return 'danger';
    case 'INVALIDADO':
    case 'INVALIDATED':
      return 'danger';
    default:
      return 'warn';
  }
}
