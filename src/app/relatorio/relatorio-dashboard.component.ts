import {ChangeDetectionStrategy, Component, inject, isDevMode, signal} from '@angular/core';
import {MessageService} from 'primeng/api';
import {ToastModule} from 'primeng/toast';
import {firstValueFrom, Observable} from 'rxjs';

import {TODOS_RELATORIOS} from './config/relatorios.config';
import {RelatorioCardComponent} from './components/relatorio-card/relatorio-card.component';
import {
  HistoricoDownloadsComponent
} from './components/historico-downloads/historico-downloads.component';
import {
  RelatorioFiltrosModalComponent
} from './components/relatorio-filtros-modal/relatorio-filtros-modal.component';
import {RelatorioApiService} from './services/relatorio-api.service';
import {RelatorioDownloadService} from './services/relatorio-download.service';
import {RelatorioParametrosService} from './services/relatorio-parametros.service';
import {GerarRelatorioEvent, RelatorioCardConfig} from './models/relatorio-card.interface';
import {FormatoRelatorio} from './models/formato-relatorio.type';
import {LoaderService} from '../framework/loader/loader.service';

// ============================================================================
// Type Guards para validação de parâmetros do Strategy Pattern
// ============================================================================

/**
 * Verifica se o valor é uma string válida (não vazia).
 */
function isValidString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Verifica se o valor é um número válido (positivo).
 */
function isValidNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

/**
 * Valida parâmetros para relatório de histórico de empréstimo.
 */
function validarHistoricoEmprestimo(valores: Record<string, unknown>): { documento: string } {
  if (!isValidString(valores['documento'])) {
    throw new Error('Documento é obrigatório e deve ser uma string válida.');
  }
  return {documento: valores['documento']};
}

/**
 * Valida parâmetros para relatório de empréstimos realizados.
 */
function validarEmprestimosRealizados(valores: Record<string, unknown>): {
  dataInicio: string;
  dataFim: string
} {
  if (!isValidString(valores['dataInicio']) || !isValidString(valores['dataFim'])) {
    throw new Error('Data de início e fim são obrigatórias.');
  }
  return {dataInicio: valores['dataInicio'], dataFim: valores['dataFim']};
}

/**
 * Valida parâmetros para relatórios baseados em item.
 */
function validarRelatorioItem(valores: Record<string, unknown>): {
  itemId: number;
  nomeItem?: string
} {
  if (!isValidNumber(valores['itemId'])) {
    throw new Error('ID do item é obrigatório e deve ser um número válido.');
  }
  const nomeItem = isValidString(valores['nomeItem']) ? valores['nomeItem'] : undefined;
  return {itemId: valores['itemId'], nomeItem};
}

/**
 * Tipo para função geradora de relatório.
 */
type RelatorioGenerator = (
  service: RelatorioApiService,
  formato: FormatoRelatorio,
  valores: Record<string, unknown>
) => Observable<Blob>;

/**
 * Mapeamento de estratégias de geração de relatório.
 * Cada relatório tem sua própria função geradora, seguindo o padrão Strategy.
 * Utiliza type guards para validação segura dos parâmetros.
 */
const RELATORIO_STRATEGIES: Record<string, RelatorioGenerator> = {
  'historico-emprestimo': (service, formato, valores) => {
    const {documento} = validarHistoricoEmprestimo(valores);
    return service.gerarHistoricoEmprestimo(documento, formato);
  },

  'itens-sem-estoque': (service, formato) =>
    service.gerarItensSemEstoque(formato),

  'emprestimos-realizados': (service, formato, valores) => {
    const {dataInicio, dataFim} = validarEmprestimosRealizados(valores);
    return service.gerarEmprestimosRealizados(dataInicio, dataFim, formato);
  },

  'reservas-item': (service, formato, valores) => {
    const {itemId, nomeItem} = validarRelatorioItem(valores);
    return service.gerarReservasDoItem(itemId, formato, nomeItem);
  },

  'solicitacoes-item': (service, formato, valores) => {
    const {itemId, nomeItem} = validarRelatorioItem(valores);
    return service.gerarSolicitacoesDoItem(itemId, formato, nomeItem);
  },

  'itens-qtde-minima': (service, formato) =>
    service.gerarItensQtdeMinima(formato)
};

/**
 * Dashboard principal de relatórios.
 *
 * Exibe grid simples de cards de relatório.
 * Clique no card abre modal para seleção de formato e filtros.
 *
 * @example
 * // Rota: /relatorio
 * // Lazy loaded via app.routes.ts
 */
@Component({
  selector: 'app-relatorio-dashboard',
  templateUrl: './relatorio-dashboard.component.html',
  styleUrls: ['./relatorio-dashboard.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [MessageService],
  imports: [
    ToastModule,
    RelatorioCardComponent,
    HistoricoDownloadsComponent,
    RelatorioFiltrosModalComponent
  ]
})
export class RelatorioDashboardComponent {
  /**
   * Padrão válido para IDs de relatório (apenas letras minúsculas e hífens).
   * Previne prototype pollution e ataques de injeção.
   */
  private static readonly VALID_RELATORIO_ID_PATTERN = /^[a-z][a-z-]*[a-z]$/;
  /**
   * Mensagens de erro seguras (sem informações sensíveis).
   */
  private static readonly ERROR_MESSAGES: Record<number, string> = {
    400: 'Parâmetros inválidos. Verifique os dados informados.',
    403: 'Você não tem permissão para gerar este relatório.',
    404: 'Nenhum registro encontrado para os filtros informados.',
    500: 'Erro interno do servidor. Tente novamente mais tarde.',
    503: 'Serviço temporariamente indisponível. Tente novamente mais tarde.'
  };
  /**
   * Mensagens de validação (geradas pelo sistema, seguras para exibir).
   */
  private static readonly VALIDATION_MESSAGES = [
    'Documento é obrigatório',
    'Data de início e fim são obrigatórias',
    'ID do item é obrigatório',
    'ID de relatório inválido'
  ];
  /** Lista flat de todos os relatórios */
  readonly relatorios = TODOS_RELATORIOS;
  /** ID do relatório em geração (para loading state) */
  readonly relatorioEmGeracao = signal<string | undefined>(undefined);
  /** Estado do modal */
  readonly modalVisible = signal(false);
  readonly modalConfig = signal<RelatorioCardConfig | undefined>(undefined);
  private readonly relatorioApiService = inject(RelatorioApiService);
  private readonly downloadService = inject(RelatorioDownloadService);
  private readonly parametrosService = inject(RelatorioParametrosService);
  private readonly loaderService = inject(LoaderService);
  private readonly messageService = inject(MessageService);

  /**
   * Abre o modal ao clicar em um card.
   */
  onCardClick(config: RelatorioCardConfig): void {
    this.modalConfig.set(config);
    this.modalVisible.set(true);
  }

  /**
   * Gera um relatório baseado no evento recebido.
   * Inclui guarda para prevenir operações concorrentes.
   */
  async onGerarRelatorio(event: GerarRelatorioEvent): Promise<void> {
    // Guarda: previne operações concorrentes
    if (this.relatorioEmGeracao()) {
      return;
    }

    const {relatorioId, formato, valores} = event;

    this.relatorioEmGeracao.set(relatorioId);
    this.loaderService.show();
    this.modalVisible.set(false);

    try {
      const blob = await this.gerarRelatorioApi(relatorioId, formato, valores);

      const parametrosResumo = this.resumirParametros(valores);
      const nomeArquivo = this.downloadService.gerarNomeArquivo(relatorioId, formato, parametrosResumo);

      this.downloadService.downloadBlob(blob, nomeArquivo);

      this.downloadService.addToHistory({
        tipoRelatorio: this.getTituloRelatorio(relatorioId),
        relatorioId,
        parametros: parametrosResumo || '-',
        formato,
        nomeArquivo
      });

      if (Object.keys(valores).length > 0) {
        this.parametrosService.salvarParametros(relatorioId, valores);
      }

      this.messageService.add({
        severity: 'success',
        summary: 'Relatório gerado!',
        detail: `${nomeArquivo} foi baixado com sucesso.`,
        life: 4000
      });

    } catch (error) {
      if (isDevMode()) {
        console.error('Erro ao gerar relatório:', error);
      }

      this.messageService.add({
        severity: 'error',
        summary: 'Erro ao gerar relatório',
        detail: this.getErrorMessage(error),
        life: 6000
      });

    } finally {
      this.relatorioEmGeracao.set(undefined);
      this.loaderService.hide();
    }
  }

  /**
   * Chama o endpoint correto baseado no ID do relatório.
   * Utiliza o padrão Strategy para selecionar a função geradora correta.
   *
   * @param relatorioId ID do relatório a gerar
   * @param formato Formato de saída (PDF ou EXCEL)
   * @param valores Parâmetros do relatório
   * @returns Promise com o Blob do arquivo gerado
   */
  private gerarRelatorioApi(
    relatorioId: string,
    formato: FormatoRelatorio,
    valores: Record<string, unknown>
  ): Promise<Blob> {
    // Validação de formato para prevenir prototype pollution
    if (!RelatorioDashboardComponent.VALID_RELATORIO_ID_PATTERN.test(relatorioId)) {
      return Promise.reject(new Error('ID de relatório inválido.'));
    }

    const strategy = RELATORIO_STRATEGIES[relatorioId];

    if (!strategy) {
      return Promise.reject(new Error(`Relatório desconhecido: ${relatorioId}`));
    }

    return firstValueFrom(strategy(this.relatorioApiService, formato, valores));
  }

  /**
   * Retorna o título do relatório pelo ID.
   */
  private getTituloRelatorio(relatorioId: string): string {
    const relatorio = TODOS_RELATORIOS.find(r => r.id === relatorioId);
    return relatorio?.titulo || relatorioId;
  }

  /**
   * Resume os parâmetros para exibição no histórico.
   * Utiliza type guard para garantir que apenas strings válidas sejam usadas,
   * evitando '[object Object]' na saída.
   */
  private resumirParametros(valores: Record<string, unknown>): string {
    const partes: string[] = [];

    if (isValidString(valores['documento'])) {
      partes.push(valores['documento']);
    }

    if (isValidString(valores['nomeItem'])) {
      partes.push(valores['nomeItem']);
    }

    if (isValidString(valores['dataInicio']) && isValidString(valores['dataFim'])) {
      partes.push(`${valores['dataInicio']} a ${valores['dataFim']}`);
    }

    return partes.join(' | ');
  }

  /**
   * Extrai mensagem de erro amigável e segura.
   * Não expõe detalhes técnicos ou informações sensíveis ao usuário.
   */
  private getErrorMessage(error: unknown): string {
    // Erros de validação do próprio sistema (type guards)
    if (error instanceof Error) {
      const isValidationError = RelatorioDashboardComponent.VALIDATION_MESSAGES.some(
        msg => error.message.includes(msg)
      );
      if (isValidationError) {
        return error.message;
      }
      // Não expõe mensagens de erro genéricas que podem conter info sensível
      if (isDevMode()) {
        console.error('Erro de relatório:', error.message);
      }
    }

    // Erros HTTP - usa mensagens predefinidas seguras
    const httpError = error as { status?: number };
    if (httpError?.status && RelatorioDashboardComponent.ERROR_MESSAGES[httpError.status]) {
      return RelatorioDashboardComponent.ERROR_MESSAGES[httpError.status];
    }

    return 'Ocorreu um erro ao gerar o relatório. Tente novamente.';
  }
}
