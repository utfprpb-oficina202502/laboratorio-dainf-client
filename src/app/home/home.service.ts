import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {environment} from '../../environments/environment';
import {Observable} from 'rxjs';
import {DashboardEmprestimoCountRange} from './dashboard/dashboardEmprestimoCountRange';
import {DashboardEmprestimoDia} from './dashboard/dashboardEmprestimoDia';
import {DashboardItensEmprestados} from './dashboard/dashboardItensEmprestados';
import {DashboardItensAdquiridos} from './dashboard/dashboardItensAdquiridos';
import {DashboardItensSaidas} from './dashboard/dashboardItensSaidas';
import {
  AtividadeUsuario,
  EstatisticasUsuario,
  EventoCalendario,
  HistoricoUsoMensal,
  ItemFrequenteUsuario
} from './models/dashboard.models';

@Injectable()
export class HomeService {
  private readonly http = inject<HttpClient>(HttpClient);
  url: string;

  constructor() {
    this.url = `${environment.api_url}dashboard/`;
  }

  findDadosEmprestimoCountInRange(dtIni: string, dtFim: string): Observable<DashboardEmprestimoCountRange> {
    return this.http.get<DashboardEmprestimoCountRange>(`${this.url}emprestimo-count-range?dtIni=${dtIni}&dtFim=${dtFim}`);
  }

  findDadosEmprestimoByDayInRange(dtIni: string, dtFim: string): Observable<DashboardEmprestimoDia[]> {
    return this.http.get<DashboardEmprestimoDia[]>(`${this.url}emprestimo-count-day-range?dtIni=${dtIni}&dtFim=${dtFim}`);
  }

  findItensMaisEmprestados(dtIni: string, dtFim: string): Observable<DashboardItensEmprestados[]> {
    return this.http.get<DashboardItensEmprestados[]>(`${this.url}itens-mais-emprestados?dtIni=${dtIni}&dtFim=${dtFim}`);
  }

  findItensMaisAdquiridos(dtIni: string, dtFim: string): Observable<DashboardItensAdquiridos[]> {
    return this.http.get<DashboardItensAdquiridos[]>(`${this.url}itens-mais-adquiridos?dtIni=${dtIni}&dtFim=${dtFim}`);
  }

  findItensMaisSaidas(dtIni: string, dtFim: string): Observable<DashboardItensSaidas[]> {
    return this.http.get<DashboardItensSaidas[]>(`${this.url}itens-mais-saidas?dtIni=${dtIni}&dtFim=${dtFim}`);
  }

  // =============================================
  // Dashboard Pessoal do Usuário (Aluno/Professor)
  // =============================================

  /**
   * Obtém estatísticas do usuário logado.
   * @returns Estatísticas de empréstimos (em aberto, atrasados, total, próxima devolução)
   */
  getMyStats(): Observable<EstatisticasUsuario> {
    return this.http.get<EstatisticasUsuario>(`${this.url}my-stats`);
  }

  /**
   * Obtém os itens mais emprestados pelo usuário logado.
   * @param limit Quantidade máxima de itens (default: 5, min: 1, max: 20)
   * @returns Lista de itens frequentes com contagem e saldo
   */
  getMyFrequentItems(limit = 5): Observable<ItemFrequenteUsuario[]> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<ItemFrequenteUsuario[]>(`${this.url}my-frequent-items`, {params});
  }

  /**
   * Obtém o histórico de uso mensal do usuário logado.
   * @param meses Quantidade de meses para buscar (default: 6, min: 1, max: 24)
   * @returns Lista de meses com quantidade de empréstimos
   */
  getMyUsageHistory(meses = 6): Observable<HistoricoUsoMensal[]> {
    const params = new HttpParams().set('meses', meses.toString());
    return this.http.get<HistoricoUsoMensal[]>(`${this.url}my-usage-history`, {params});
  }

  /**
   * Obtém as atividades recentes do usuário logado.
   * @param limit Quantidade máxima de atividades (default: 20, min: 1, max: 100)
   * @returns Lista de atividades ordenadas por data (mais recentes primeiro)
   */
  getMyActivity(limit = 20): Observable<AtividadeUsuario[]> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<AtividadeUsuario[]>(`${this.url}my-activity`, {params});
  }

  /**
   * Obtém os eventos do calendário do usuário logado.
   * @param dtIni Data inicial no formato dd/MM/yyyy
   * @param dtFim Data final no formato dd/MM/yyyy
   * @returns Lista de eventos para exibição no calendário
   */
  getMyCalendarEvents(dtIni: string, dtFim: string): Observable<EventoCalendario[]> {
    const params = new HttpParams()
    .set('dtIni', dtIni)
    .set('dtFim', dtFim);
    return this.http.get<EventoCalendario[]>(`${this.url}my-calendar-events`, {params});
  }
}
