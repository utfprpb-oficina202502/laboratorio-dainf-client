import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {TableModule} from 'primeng/table';
import {ButtonModule} from 'primeng/button';
import {TooltipModule} from 'primeng/tooltip';
import {TagModule} from 'primeng/tag';

import {RelatorioDownloadService} from '../../services/relatorio-download.service';
import {DownloadHistoryItem} from '../../models/download-history.interface';
import {RELATORIOS_MAP} from '../../config/relatorios.config';

/**
 * Componente que exibe o histórico de downloads de relatórios.
 *
 * Mostra uma tabela com os últimos 10 relatórios gerados,
 * permitindo re-download ou remoção de itens.
 *
 * @example
 * <app-historico-downloads />
 */
@Component({
  selector: 'app-historico-downloads',
  templateUrl: './historico-downloads.component.html',
  styleUrls: ['./historico-downloads.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TableModule,
    ButtonModule,
    TooltipModule,
    TagModule
  ]
})
export class HistoricoDownloadsComponent {
  protected readonly downloadService = inject(RelatorioDownloadService);

  /** Histórico reativo */
  readonly historico = this.downloadService.historico;

  /**
   * Retorna a cor do tag baseado no formato.
   */
  getFormatoSeverity(formato: string): 'danger' | 'success' {
    return formato === 'PDF' ? 'danger' : 'success';
  }

  /**
   * Retorna o ícone do formato.
   */
  getFormatoIcon(formato: string): string {
    return formato === 'PDF' ? 'pi-file-pdf' : 'pi-file-excel';
  }

  /**
   * Retorna a cor de destaque do relatório.
   */
  getRelatorioColor(relatorioId: string): string {
    return RELATORIOS_MAP[relatorioId]?.cor || '#6B7280';
  }

  /**
   * Formata a data para exibição.
   */
  formatarData(dataIso: string): string {
    const date = new Date(dataIso);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }

  /**
   * Remove um item do histórico.
   */
  removerItem(item: DownloadHistoryItem): void {
    this.downloadService.removeFromHistory(item.id);
  }

  /**
   * Limpa todo o histórico.
   */
  limparHistorico(): void {
    this.downloadService.clearHistory();
  }
}
