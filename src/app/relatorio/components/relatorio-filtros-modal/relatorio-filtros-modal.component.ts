import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  isDevMode,
  OnDestroy,
  output,
  signal,
  untracked
} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {FormsModule} from '@angular/forms';
import {DialogModule} from 'primeng/dialog';
import {ButtonModule} from 'primeng/button';
import {InputTextModule} from 'primeng/inputtext';
import {DatePickerModule} from 'primeng/datepicker';
import {
  AutoCompleteCompleteEvent,
  AutoCompleteModule,
  AutoCompleteSelectEvent
} from 'primeng/autocomplete';
import {DividerModule} from 'primeng/divider';
import {of, Subject} from 'rxjs';
import {catchError, debounceTime, distinctUntilChanged, filter, switchMap} from 'rxjs/operators';

import {
  CampoConfig,
  GerarRelatorioEvent,
  RelatorioCardConfig
} from '../../models/relatorio-card.interface';
import {FormatoRelatorio} from '../../models/formato-relatorio.type';
import {PeriodoDatas} from '../../services/relatorio-parametros.service';
import {ItemService} from '../../../item/item.service';
import {Item} from '../../../item/item';
import {BreakpointService} from '../../../framework/service/breakpoint.service';
import {PeriodoShortcutsComponent} from '../periodo-shortcuts/periodo-shortcuts.component';

/**
 * Modal para geração de relatório.
 *
 * Exibe filtros (se houver) e botões para escolher formato.
 *
 * @example
 * <app-relatorio-filtros-modal
 *   [config]="relatorioConfig"
 *   [visible]="modalVisible()"
 *   (visibleChange)="modalVisible.set($event)"
 *   (gerar)="onGerar($event)" />
 */
@Component({
  selector: 'app-relatorio-filtros-modal',
  templateUrl: './relatorio-filtros-modal.component.html',
  styleUrls: ['./relatorio-filtros-modal.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    DatePickerModule,
    AutoCompleteModule,
    DividerModule,
    PeriodoShortcutsComponent
  ]
})
export class RelatorioFiltrosModalComponent implements OnDestroy {
  /** Tempo de debounce para busca de itens (ms). */
  private static readonly SEARCH_DEBOUNCE_MS = 300;
  /** Quantidade mínima de caracteres para iniciar busca. */
  private static readonly MIN_SEARCH_LENGTH = 2;
  /**
   * Padrão de data dd/MM/yyyy.
   */
  private static readonly DATE_PATTERN = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  /**
   * Padrão para caracteres de controle (ASCII 0-31 e 127).
   */
    // eslint-disable-next-line no-control-regex
  private static readonly CONTROL_CHARS_PATTERN = /[\x00-\x1F\x7F]/g;
  /**
   * Padrão para HTML entities (nomeadas e numéricas).
   */
  private static readonly HTML_ENTITIES_PATTERN = /&(?:[a-z]+|#\d+);/gi;
  /**
   * Tamanho máximo permitido para strings sanitizadas.
   */
  private static readonly MAX_STRING_LENGTH = 255;
  /** Configuração do relatório */
  readonly config = input.required<RelatorioCardConfig>();
  /** Visibilidade do modal */
  readonly visible = input<boolean>(false);
  /** Se está carregando */
  readonly loading = input<boolean>(false);
  /** Evento de mudança de visibilidade */
  readonly visibleChange = output<boolean>();
  /** Evento de geração do relatório */
  readonly gerar = output<GerarRelatorioEvent>();
  /** Valores dos campos do formulário */
  readonly valores = signal<Record<string, unknown>>({});
  /** Item selecionado no autocomplete */
  readonly itemSelecionado = signal<Item | undefined>(undefined);
  /** Sugestões do autocomplete */
  readonly sugestoesItem = signal<Item[]>([]);
  /** Se tem campos (filtros) */
  readonly temCampos = computed(() => this.config().campos.length > 0);
  /** Se o formulário é válido */
  readonly formValido = computed(() => {
    const cfg = this.config();
    const vals = this.valores();

    // Se não tem campos, sempre válido
    if (!this.temCampos()) return true;

    return cfg.campos.every(campo => {
      if (!campo.obrigatorio) return true;

      if (campo.tipo === 'item-autocomplete') {
        return !!this.itemSelecionado();
      }

      const valor = vals[campo.nome];
      return valor !== undefined && valor !== null && valor !== '';
    });
  });
  /** Verifica se tem campos de data (para mostrar atalhos de período) */
  readonly temCamposData = computed(() =>
    this.config().campos.some(c => c.tipo === 'data')
  );
  protected readonly breakpointService = inject(BreakpointService);
  private readonly itemService = inject(ItemService);
  private readonly destroyRef = inject(DestroyRef);
  /** Subject para debounce da busca de itens */
  private readonly searchSubject = new Subject<string>();
  /** ID do último config para detectar mudanças */
  private lastConfigId = '';

  constructor() {
    // Reseta o form quando o config muda (usuário clica em outro relatório)
    effect(() => {
      const configId = this.config().id;
      // Usa untracked para evitar que resetForm crie dependências no effect
      untracked(() => {
        if (this.lastConfigId && this.lastConfigId !== configId) {
          this.resetForm();
        }
        this.lastConfigId = configId;
      });
    });

    // Configura o debounce para busca de itens com tratamento de erro robusto
    this.searchSubject.pipe(
      debounceTime(RelatorioFiltrosModalComponent.SEARCH_DEBOUNCE_MS),
      distinctUntilChanged(),
      filter(query => query.length >= RelatorioFiltrosModalComponent.MIN_SEARCH_LENGTH),
      switchMap(query =>
        this.itemService.completeItem(query, false).pipe(
          catchError(err => {
            if (isDevMode()) {
              console.error('Erro ao buscar itens:', err);
            }
            return of([] as Item[]);
          })
        )
      ),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (itens) => this.sugestoesItem.set(itens)
    });
  }

  /**
   * Cleanup ao destruir o componente.
   * Completa o Subject para evitar memory leaks.
   */
  ngOnDestroy(): void {
    this.searchSubject.complete();
  }

  /**
   * Fecha o modal.
   */
  fechar(): void {
    this.visibleChange.emit(false);
    this.resetForm();
  }

  /**
   * Atualiza valor de um campo.
   */
  onValorChange(campo: CampoConfig, valor: unknown): void {
    this.valores.update(v => ({...v, [campo.nome]: valor}));
  }

  /**
   * Busca itens para autocomplete com debounce.
   * O debounce evita chamadas excessivas à API durante a digitação.
   */
  buscarItens(event: AutoCompleteCompleteEvent): void {
    const query = event.query;
    if (query.length < RelatorioFiltrosModalComponent.MIN_SEARCH_LENGTH) {
      this.sugestoesItem.set([]);
      return;
    }

    // Emite para o subject que aplica debounce
    this.searchSubject.next(query);
  }

  /**
   * Callback quando um item é selecionado no autocomplete.
   */
  onItemSelect(event: AutoCompleteSelectEvent, campo: CampoConfig): void {
    const item = event.value as Item;
    this.itemSelecionado.set(item);
    this.valores.update(v => ({...v, [campo.nome]: item}));
  }

  /**
   * Limpa a seleção do item.
   */
  limparItem(campo: CampoConfig): void {
    this.itemSelecionado.set(undefined);
    this.valores.update(v => ({...v, [campo.nome]: undefined}));
  }

  /**
   * Aplica atalho de período.
   */
  onPeriodoSelecionado(periodo: PeriodoDatas): void {
    this.valores.update(v => ({
      ...v,
      dataInicio: this.parseDate(periodo.dataInicio),
      dataFim: this.parseDate(periodo.dataFim)
    }));
  }

  /**
   * Gera o relatório no formato especificado.
   */
  gerarRelatorio(formato: FormatoRelatorio): void {
    if (!this.formValido() || this.loading()) return;

    this.gerar.emit({
      relatorioId: this.config().id,
      formato,
      valores: this.prepararValores()
    });
  }

  /**
   * Converte string dd/MM/yyyy para Date com validação.
   * @throws Error se o formato for inválido
   */
  private parseDate(dateStr: string): Date {
    if (!dateStr || typeof dateStr !== 'string') {
      throw new Error('Data inválida: valor não fornecido.');
    }

    const match = RelatorioFiltrosModalComponent.DATE_PATTERN.exec(dateStr);
    if (!match) {
      throw new Error('Data inválida: formato deve ser dd/MM/yyyy.');
    }

    const [, dayStr, monthStr, yearStr] = match;
    const day = Number.parseInt(dayStr, 10);
    const month = Number.parseInt(monthStr, 10);
    const year = Number.parseInt(yearStr, 10);

    // Valida ranges
    if (month < 1 || month > 12) {
      throw new Error('Data inválida: mês deve estar entre 1 e 12.');
    }
    if (day < 1 || day > 31) {
      throw new Error('Data inválida: dia deve estar entre 1 e 31.');
    }
    if (year < 1900 || year > 2100) {
      throw new Error('Data inválida: ano fora do intervalo permitido.');
    }

    const date = new Date(year, month - 1, day);

    // Verifica se a data é válida (ex: 31/02/2025 criaria 03/03/2025)
    if (date.getDate() !== day || date.getMonth() !== month - 1 || date.getFullYear() !== year) {
      throw new Error('Data inválida: combinação de dia/mês inválida.');
    }

    return date;
  }

  /**
   * Sanitiza uma string removendo caracteres potencialmente perigosos.
   * Previne XSS e injection attacks.
   */
  private sanitizeString(value: string): string {
    if (!value || typeof value !== 'string') return '';

    // Remove caracteres perigosos, HTML entities e caracteres de controle
    // IMPORTANTE: A ordem é crítica - HTML entities primeiro, depois caracteres individuais
    return value
    .replace(RelatorioFiltrosModalComponent.HTML_ENTITIES_PATTERN, '') // Remove HTML entities primeiro
    .replace(/[<>&"']/g, '')                                      // Depois remove < > & " '
    .replace(RelatorioFiltrosModalComponent.CONTROL_CHARS_PATTERN, '') // Remove caracteres de controle
    .trim()
    .substring(0, RelatorioFiltrosModalComponent.MAX_STRING_LENGTH);
  }

  /**
   * Prepara os valores para envio com sanitização.
   */
  private prepararValores(): Record<string, unknown> {
    const vals = this.valores();
    const resultado: Record<string, unknown> = {};

    for (const campo of this.config().campos) {
      const valor = vals[campo.nome];

      if (campo.tipo === 'data' && valor instanceof Date) {
        resultado[campo.nome] = this.formatDate(valor);
      } else if (campo.tipo === 'item-autocomplete') {
        const item = this.itemSelecionado();
        if (item) {
          // itemId é validado como número no backend
          resultado['itemId'] = typeof item.id === 'number' ? item.id : undefined;
          // Sanitiza o nome do item
          resultado['nomeItem'] = this.sanitizeString(item.nome);
        }
      } else if (typeof valor === 'string') {
        // Sanitiza todas as strings de entrada do usuário
        resultado[campo.nome] = this.sanitizeString(valor);
      } else {
        resultado[campo.nome] = valor;
      }
    }

    return resultado;
  }

  /**
   * Formata data para dd/MM/yyyy.
   */
  private formatDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  /**
   * Reseta o formulário.
   */
  private resetForm(): void {
    this.valores.set({});
    this.itemSelecionado.set(undefined);
    this.sugestoesItem.set([]);
  }
}
