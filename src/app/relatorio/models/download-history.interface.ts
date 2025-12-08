import {FormatoRelatorio} from './formato-relatorio.type';

/**
 * Item do histórico de downloads de relatórios.
 *
 * Armazenado em localStorage para permitir re-download e tracking.
 *
 * @example
 * const item: DownloadHistoryItem = {
 *   id: 'abc123',
 *   tipoRelatorio: 'Histórico de Empréstimo',
 *   relatorioId: 'historico-emprestimo',
 *   parametros: '12345678',
 *   formato: 'PDF',
 *   dataGeracao: '2025-12-07T10:30:00.000Z',
 *   nomeArquivo: 'historico-emprestimo-12345678.pdf'
 * };
 */
export interface DownloadHistoryItem {
  /** UUID único para identificação */
  id: string;

  /** Nome do relatório para exibição */
  tipoRelatorio: string;

  /** ID do relatório (para identificar o tipo) */
  relatorioId: string;

  /** Resumo dos parâmetros usados (para exibição) */
  parametros: string;

  /** Formato do arquivo gerado */
  formato: FormatoRelatorio;

  /** Data/hora da geração (ISO 8601) */
  dataGeracao: string;

  /** Nome do arquivo baixado */
  nomeArquivo: string;
}

/**
 * Estrutura do histórico completo armazenado em localStorage.
 */
export interface DownloadHistory {
  /** Lista de itens (máximo 10, mais recentes primeiro) */
  items: DownloadHistoryItem[];

  /** Versão do schema para migrações futuras */
  version: number;
}
