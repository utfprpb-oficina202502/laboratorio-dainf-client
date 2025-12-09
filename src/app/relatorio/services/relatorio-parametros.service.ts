import {inject, Injectable} from '@angular/core';
import {AtalhoPeriodo} from '../models/relatorio-card.interface';
import {LoggerService} from '../../framework/service/logger.service';

/**
 * Interface para parâmetros salvos de um relatório.
 */
interface ParametrosSalvos {
  /** Valores dos campos */
  parametros: Record<string, unknown>;

  /** Data/hora do último uso */
  ultimoUso: string;
}

/**
 * Interface para um período de datas.
 */
export interface PeriodoDatas {
  dataInicio: string;
  dataFim: string;
}

/**
 * Service para gerenciar smart defaults e persistência de parâmetros.
 *
 * Responsabilidades:
 * - Fornecer atalhos de período pré-definidos
 * - Salvar/recuperar últimos parâmetros usados por relatório
 * - Formatar datas no padrão brasileiro (dd/MM/yyyy)
 *
 * @example
 * // Aplicando atalho de período
 * const periodo = this.parametrosService.aplicarAtalhoPeriodo('ultimos30dias');
 * // { dataInicio: '07/11/2025', dataFim: '07/12/2025' }
 *
 * @example
 * // Salvando parâmetros usados
 * this.parametrosService.salvarParametros('historico-emprestimo', { documento: '12345678' });
 *
 * // Recuperando parâmetros anteriores
 * const params = this.parametrosService.getParametros('historico-emprestimo');
 */
@Injectable({providedIn: 'root'})
export class RelatorioParametrosService {
  private readonly logger = inject(LoggerService);

  /**
   * Labels para exibição dos atalhos de período.
   */
  readonly ATALHOS_LABELS: Record<AtalhoPeriodo, string> = {
    ultimos30dias: 'Últimos 30 dias',
    esteMes: 'Este mês',
    ultimoMes: 'Último mês',
    ultimoTrimestre: 'Último trimestre',
    esteAno: 'Este ano'
  };
  private readonly STORAGE_KEY = 'laboratorio-relatorio-parametros';
  private readonly EXPIRACAO_DIAS = 7;

  /**
   * Aplica um atalho de período e retorna as datas formatadas.
   *
   * @param atalho Identificador do atalho
   * @returns Objeto com dataInicio e dataFim formatadas
   */
  aplicarAtalhoPeriodo(atalho: AtalhoPeriodo): PeriodoDatas {
    const hoje = new Date();

    switch (atalho) {
      case 'esteMes':
        return {
          dataInicio: this.formatDate(this.startOfMonth(hoje)),
          dataFim: this.formatDate(hoje)
        };

      case 'ultimoMes': {
        const mesAnterior = this.subMonths(hoje, 1);
        return {
          dataInicio: this.formatDate(this.startOfMonth(mesAnterior)),
          dataFim: this.formatDate(this.endOfMonth(mesAnterior))
        };
      }

      case 'ultimoTrimestre':
        return {
          dataInicio: this.formatDate(this.subDays(hoje, 90)),
          dataFim: this.formatDate(hoje)
        };

      case 'esteAno':
        return {
          dataInicio: this.formatDate(this.startOfYear(hoje)),
          dataFim: this.formatDate(hoje)
        };

      case 'ultimos30dias':
      default:
        // Fall-through: default usa o mesmo comportamento de 'ultimos30dias'
        return {
          dataInicio: this.formatDate(this.subDays(hoje, 30)),
          dataFim: this.formatDate(hoje)
        };
    }
  }

  /**
   * Retorna o período padrão (últimos 30 dias).
   */
  getPeriodoPadrao(): PeriodoDatas {
    return this.aplicarAtalhoPeriodo('ultimos30dias');
  }

  /**
   * Salva os parâmetros usados em um relatório.
   *
   * @param relatorioId ID do relatório
   * @param parametros Valores dos campos
   */
  salvarParametros(relatorioId: string, parametros: Record<string, unknown>): void {
    try {
      const saved = this.getAllSaved();
      saved[relatorioId] = {
        parametros,
        ultimoUso: new Date().toISOString()
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(saved));
    } catch (e) {
      this.logger.error('Erro ao salvar parâmetros', e);
    }
  }

  /**
   * Recupera os parâmetros salvos de um relatório.
   *
   * @param relatorioId ID do relatório
   * @returns Parâmetros salvos ou undefined se não existirem/expiraram
   */
  getParametros(relatorioId: string): Record<string, unknown> | undefined {
    const saved = this.getAllSaved()[relatorioId];
    if (!saved) return undefined;

    // Verifica se os parâmetros expiraram
    const dataLimite = this.subDays(new Date(), this.EXPIRACAO_DIAS);
    if (new Date(saved.ultimoUso) < dataLimite) {
      return undefined;
    }

    return saved.parametros;
  }

  /**
   * Limpa os parâmetros salvos de um relatório específico.
   *
   * @param relatorioId ID do relatório
   */
  limparParametros(relatorioId: string): void {
    try {
      const saved = this.getAllSaved();
      delete saved[relatorioId];
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(saved));
    } catch (e) {
      this.logger.error('Erro ao limpar parâmetros', e);
    }
  }

  /**
   * Limpa todos os parâmetros salvos.
   */
  limparTodos(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * Recupera todos os parâmetros salvos do localStorage.
   */
  private getAllSaved(): Record<string, ParametrosSalvos> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }

  /**
   * Formata uma data no padrão brasileiro (dd/MM/yyyy).
   */
  private formatDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  /**
   * Subtrai dias de uma data.
   */
  private subDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() - days);
    return result;
  }

  /**
   * Subtrai meses de uma data.
   */
  private subMonths(date: Date, months: number): Date {
    const result = new Date(date);
    result.setMonth(result.getMonth() - months);
    return result;
  }

  /**
   * Retorna o primeiro dia do mês.
   */
  private startOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  /**
   * Retorna o último dia do mês.
   */
  private endOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
  }

  /**
   * Retorna o primeiro dia do ano.
   */
  private startOfYear(date: Date): Date {
    return new Date(date.getFullYear(), 0, 1);
  }
}
