import {Injectable, signal} from '@angular/core';
import {FORMATO_EXTENSAO, FormatoRelatorio} from '../models/formato-relatorio.type';
import {DownloadHistory, DownloadHistoryItem} from '../models/download-history.interface';

/**
 * Service para gerenciar downloads de relatórios e histórico.
 *
 * Responsabilidades:
 * - Executar download de Blobs como arquivos
 * - Manter histórico de downloads em localStorage
 * - Gerenciar limite de itens no histórico (máximo 10)
 *
 * @example
 * // Fazendo download de um relatório
 * this.downloadService.downloadBlob(blob, 'relatorio.pdf');
 *
 * @example
 * // Adicionando ao histórico
 * this.downloadService.addToHistory({
 *   tipoRelatorio: 'Itens Sem Estoque',
 *   relatorioId: 'itens-sem-estoque',
 *   parametros: '-',
 *   formato: 'PDF',
 *   nomeArquivo: 'itens-sem-estoque.pdf'
 * });
 */
@Injectable({providedIn: 'root'})
export class RelatorioDownloadService {
  // Constantes estáticas - inicializadas antes de qualquer instância
  private static readonly STORAGE_KEY = 'laboratorio-relatorio-downloads';
  private static readonly MAX_ITEMS = 10;
  private static readonly SCHEMA_VERSION = 1;

  /** Signal reativo com o histórico atual */
  readonly historico = signal<DownloadHistoryItem[]>(this.loadHistory());

  /**
   * Executa o download de um Blob como arquivo.
   *
   * @param blob Conteúdo do arquivo
   * @param nomeArquivo Nome do arquivo para download
   */
  downloadBlob(blob: Blob, nomeArquivo: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = nomeArquivo;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  /**
   * Gera nome de arquivo baseado no tipo de relatório e parâmetros.
   *
   * @param relatorioId ID do relatório
   * @param formato Formato do arquivo
   * @param parametros Parâmetros usados (opcional)
   * @returns Nome do arquivo formatado
   *
   * @example
   * // 'historico-emprestimo-12345678.pdf'
   * gerarNomeArquivo('historico-emprestimo', 'PDF', '12345678');
   *
   * // 'itens-sem-estoque.xlsx'
   * gerarNomeArquivo('itens-sem-estoque', 'EXCEL');
   */
  gerarNomeArquivo(relatorioId: string, formato: FormatoRelatorio, parametros?: string): string {
    const extensao = FORMATO_EXTENSAO[formato];
    const sufixo = parametros ? `-${this.sanitizeFilename(parametros)}` : '';
    return `${relatorioId}${sufixo}.${extensao}`;
  }

  /**
   * Adiciona um item ao histórico de downloads.
   *
   * @param item Dados do download (sem id e dataGeracao)
   */
  addToHistory(item: Omit<DownloadHistoryItem, 'id' | 'dataGeracao'>): void {
    const newItem: DownloadHistoryItem = {
      ...item,
      id: this.generateId(),
      dataGeracao: new Date().toISOString()
    };

    const currentHistory = this.historico();
    const updatedHistory = [newItem, ...currentHistory].slice(0, RelatorioDownloadService.MAX_ITEMS);

    this.saveHistory(updatedHistory);
    this.historico.set(updatedHistory);
  }

  /**
   * Remove um item do histórico.
   *
   * @param id ID do item a remover
   */
  removeFromHistory(id: string): void {
    const currentHistory = this.historico();
    const updatedHistory = currentHistory.filter(item => item.id !== id);

    this.saveHistory(updatedHistory);
    this.historico.set(updatedHistory);
  }

  /**
   * Limpa todo o histórico de downloads.
   */
  clearHistory(): void {
    localStorage.removeItem(RelatorioDownloadService.STORAGE_KEY);
    this.historico.set([]);
  }

  /**
   * Carrega o histórico do localStorage.
   */
  private loadHistory(): DownloadHistoryItem[] {
    try {
      const stored = localStorage.getItem(RelatorioDownloadService.STORAGE_KEY);
      if (!stored) return [];

      const data: DownloadHistory = JSON.parse(stored);

      // Verifica versão do schema para migrações futuras
      if (data.version !== RelatorioDownloadService.SCHEMA_VERSION) {
        console.warn('Versão do histórico incompatível, limpando...');
        return [];
      }

      return data.items || [];
    } catch (e) {
      console.error('Erro ao carregar histórico de downloads:', e);
      return [];
    }
  }

  /**
   * Salva o histórico no localStorage.
   */
  private saveHistory(items: DownloadHistoryItem[]): void {
    const data: DownloadHistory = {
      items,
      version: RelatorioDownloadService.SCHEMA_VERSION
    };

    try {
      localStorage.setItem(RelatorioDownloadService.STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Erro ao salvar histórico de downloads:', e);
    }
  }

  /**
   * Gera um ID único para o item.
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Sanitiza string para uso em nome de arquivo.
   */
  private sanitizeFilename(str: string): string {
    return str
    .replaceAll(/[^a-zA-Z0-9-_]/g, '-')
    .replaceAll(/-+/g, '-')
    .substring(0, 50);
  }
}
