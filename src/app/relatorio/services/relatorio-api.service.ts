import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../../environments/environment';
import {FormatoRelatorio} from '../models/formato-relatorio.type';

/**
 * Service para comunicação com a API de relatórios.
 *
 * Fornece métodos para geração dos 6 tipos de relatórios disponíveis.
 * Todos os endpoints retornam Blob para download direto.
 *
 * @example
 * // Gerando relatório de itens sem estoque em PDF
 * this.relatorioApiService.gerarItensSemEstoque('PDF').subscribe(blob => {
 *   // Processar blob para download
 * });
 *
 * @example
 * // Gerando histórico de empréstimo em Excel
 * this.relatorioApiService.gerarHistoricoEmprestimo('12345678', 'EXCEL').subscribe(blob => {
 *   // Processar blob para download
 * });
 */
@Injectable({providedIn: 'root'})
export class RelatorioApiService {
  private readonly baseUrl = `${environment.api_url}relatorio`;
  private readonly http = inject(HttpClient);

  /**
   * Gera relatório de histórico de empréstimos de um usuário.
   *
   * @param documento RA ou SIAPE do usuário
   * @param formato Formato de saída (PDF ou EXCEL)
   * @returns Observable com o Blob do arquivo gerado
   */
  gerarHistoricoEmprestimo(documento: string, formato: FormatoRelatorio = 'PDF'): Observable<Blob> {
    const params = new HttpParams()
    .set('documento', documento)
    .set('formato', formato);

    return this.http.get(`${this.baseUrl}/historico-emprestimo`, {
      params,
      responseType: 'blob'
    });
  }

  /**
   * Gera relatório de itens com saldo igual a zero.
   *
   * @param formato Formato de saída (PDF ou EXCEL)
   * @returns Observable com o Blob do arquivo gerado
   */
  gerarItensSemEstoque(formato: FormatoRelatorio = 'PDF'): Observable<Blob> {
    const params = new HttpParams().set('formato', formato);

    return this.http.get(`${this.baseUrl}/itens-sem-estoque`, {
      params,
      responseType: 'blob'
    });
  }

  /**
   * Gera relatório de empréstimos realizados em um período.
   *
   * @param dataInicio Data inicial no formato dd/MM/yyyy
   * @param dataFim Data final no formato dd/MM/yyyy
   * @param formato Formato de saída (PDF ou EXCEL)
   * @returns Observable com o Blob do arquivo gerado
   *
   * @remarks
   * Validações do backend:
   * - dataFim não pode ser anterior a dataInicio
   * - dataFim não pode ser no futuro
   * - Período máximo de 2 anos
   */
  gerarEmprestimosRealizados(
    dataInicio: string,
    dataFim: string,
    formato: FormatoRelatorio = 'PDF'
  ): Observable<Blob> {
    const params = new HttpParams()
    .set('dataInicio', dataInicio)
    .set('dataFim', dataFim)
    .set('formato', formato);

    return this.http.get(`${this.baseUrl}/emprestimos-realizados`, {
      params,
      responseType: 'blob'
    });
  }

  /**
   * Gera relatório de reservas de um item específico.
   *
   * @param itemId ID do item (deve ser positivo)
   * @param formato Formato de saída (PDF ou EXCEL)
   * @param nomeItem Nome do item para exibição no título (opcional)
   * @returns Observable com o Blob do arquivo gerado
   */
  gerarReservasDoItem(
    itemId: number,
    formato: FormatoRelatorio = 'PDF',
    nomeItem?: string
  ): Observable<Blob> {
    let params = new HttpParams()
    .set('itemId', itemId.toString())
    .set('formato', formato);

    if (nomeItem) {
      params = params.set('nomeItem', nomeItem);
    }

    return this.http.get(`${this.baseUrl}/reservas-item`, {
      params,
      responseType: 'blob'
    });
  }

  /**
   * Gera relatório de solicitações de compra de um item específico.
   *
   * @param itemId ID do item (deve ser positivo)
   * @param formato Formato de saída (PDF ou EXCEL)
   * @param nomeItem Nome do item para exibição no título (opcional)
   * @returns Observable com o Blob do arquivo gerado
   */
  gerarSolicitacoesDoItem(
    itemId: number,
    formato: FormatoRelatorio = 'PDF',
    nomeItem?: string
  ): Observable<Blob> {
    let params = new HttpParams()
    .set('itemId', itemId.toString())
    .set('formato', formato);

    if (nomeItem) {
      params = params.set('nomeItem', nomeItem);
    }

    return this.http.get(`${this.baseUrl}/solicitacoes-item`, {
      params,
      responseType: 'blob'
    });
  }

  /**
   * Gera relatório de itens que atingiram a quantidade mínima.
   *
   * @param formato Formato de saída (PDF ou EXCEL)
   * @returns Observable com o Blob do arquivo gerado
   */
  gerarItensQtdeMinima(formato: FormatoRelatorio = 'PDF'): Observable<Blob> {
    const params = new HttpParams().set('formato', formato);

    return this.http.get(`${this.baseUrl}/itens-qtde-minima`, {
      params,
      responseType: 'blob'
    });
  }
}
