import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  forwardRef,
  inject,
  signal,
  viewChild
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {DialogModule} from 'primeng/dialog';
import {InputTextModule} from 'primeng/inputtext';
import {IconFieldModule} from 'primeng/iconfield';
import {InputIconModule} from 'primeng/inputicon';
import {
  TableFilterCaptionComponent
} from '../../framework/component/table-filter-caption.component';
import {PrimeCrudListComponent} from '../../framework/component/prime-crud.list.component';
import {TableColumn} from '../../framework/model/table-config.interface';
import {NadaConsta, NadaConstaService} from '../nada-consta.service';
import {CardModule} from 'primeng/card';
import {TableModule} from 'primeng/table';
import {ButtonModule} from 'primeng/button';
import {ProgressBarModule} from 'primeng/progressbar';
import {TagModule} from 'primeng/tag';
import {TooltipModule} from 'primeng/tooltip';
import {PrimeCrudToolbarComponent} from '../../framework/component/prime-crud-toolbar.component';
import {finalize} from 'rxjs';
import {
  getNadaConstaStatusLabel,
  getNadaConstaStatusSeverity
} from '../../framework/utils/status-label.util';
import {createTableConfig} from '../../framework/utils/table-config.factory';
import {TableEmptyStateComponent} from '../../framework/component/table-empty-state.component';
import {TableLoadingStateComponent} from '../../framework/component/table-loading-state.component';
import {
  PrimeCrudTableWrapperComponent
} from '../../framework/component/prime-crud-table-wrapper.component';
import {MenuItem} from 'primeng/api';
import {Z_INDEX} from '../../framework/constants';
import {MenuModule} from 'primeng/menu';
import {Popover, PopoverModule} from 'primeng/popover';

@Component({
  selector: 'app-nada-consta-list',
  templateUrl: './nada-consta-list.component.html',
  styleUrls: ['./nada-consta-list.component.css'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    TableModule,
    ButtonModule,
    ProgressBarModule,
    TagModule,
    TooltipModule,
    PrimeCrudToolbarComponent,
    PrimeCrudTableWrapperComponent,
    TableEmptyStateComponent,
    TableLoadingStateComponent,
    DialogModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    TableFilterCaptionComponent,
    MenuModule,
    PopoverModule
  ],
  providers: [{ provide: PrimeCrudListComponent, useExisting: forwardRef(() => NadaConstaListComponent) }]
})
export class NadaConstaListComponent extends PrimeCrudListComponent<NadaConsta, number> {
  readonly actionsMenu = viewChild.required<Popover>('actionsMenu');
  contextMenuItems: MenuItem[] = [];
  protected readonly Z_INDEX = Z_INDEX;

  protected override columnsTable: string[] = [
    'id',
    'usuarioUsername',
    'status',
    'sendAt',
    'createdAt',
    'updatedAt',
    'createdBy',
    'updatedBy',
    'acoes'
  ];

  public tableColumns: TableColumn[] = [
    { field: 'id', header: 'ID', type: 'number', sortable: true, filterable: true, width: '8rem', align: 'center' },
    { field: 'usuarioUsername', header: 'Usuário', type: 'text', sortable: true, filterable: true, minWidth: '16rem' },
    { field: 'status', header: 'Status', type: 'text', sortable: true, filterable: true, width: '8rem', align: 'center' },
    { field: 'sendAt', header: 'Enviado em', type: 'text', sortable: true, filterable: false, width: '12rem' },
    { field: 'createdAt', header: 'Criado em', type: 'text', sortable: true, filterable: false, width: '12rem' },
    { field: 'updatedAt', header: 'Atualizado em', type: 'text', sortable: true, filterable: false, width: '12rem' },
    { field: 'createdBy', header: 'Criado por', type: 'text', sortable: false, filterable: false, minWidth: '12rem' },
    { field: 'updatedBy', header: 'Atualizado por', type: 'text', sortable: false, filterable: false, minWidth: '12rem' },
    { field: 'acoes', header: 'Ações', type: 'custom', sortable: false, filterable: false, exportable: false, align: 'center', width: '10rem', toggleable: false }
  ];

  protected readonly service = inject(NadaConstaService);

  protected cdr = inject(ChangeDetectorRef);

  // Getter público para facilitar testes
  getCdr() { return this.cdr; }

  constructor() {
    super();
    this.configureTable();
  }

  protected override getEntityName(): string {
    return 'Nada Consta';
  }

  protected override getEntityPluralName(): string {
    return 'Nada Consta';
  }

  protected override getExportFileName(): string {
    return 'nada-consta';
  }

  private configureTable(): void {
    this.tableConfig = createTableConfig({
      columns: this.tableColumns,
      globalFilterFields: ['id', 'usuarioUsername', 'status'],
      defaultSortField: 'id',
      defaultSortOrder: -1,
      caption: 'Lista de Nada Consta',
      trackByField: 'id',
      emptyMessage: 'Nenhuma solicitação de nada consta encontrada',
      loadingMessage: 'Carregando nada consta...',
      globalFilterPlaceholder: 'Buscar Nada Consta...',
      stateKey: 'nada-consta-list',
      selectable: false,
    });
    this.columnsTable = this.tableConfig.columns.map(column => column.field);
    // Exibe por padrão apenas os campos principais
    this.displayedColumns = ['id', 'usuarioUsername', 'status', 'sendAt', 'acoes'];
  }

  // Sinal para controlar exibição do modal
  protected readonly showAdicionarModal = signal(false);
  // Sinal para armazenar o valor do Registro Acadêmico
  protected readonly registroAcademico = signal('');
  protected readonly solicitando = signal(false);
  protected readonly solicitacaoErro = signal<string | null>(null);
  protected readonly solicitacaoSucesso = signal(false);
  // Sinal para o valor do filtro global (deve ser público para uso no template)
  public filterValue = '';

  /**
   * Getter público para o sinal showAdicionarModal
   * @returns boolean
   */
  public getShowAdicionarModal() {
    return this.showAdicionarModal();
  }

  /**
   * Getter público para o sinal registroAcademico
   * @returns string
   */
  public getRegistroAcademico() {
    return this.registroAcademico();
  }

  /**
   * Setter público para o sinal registroAcademico
   * @param valor Novo valor do registro acadêmico
   */
  public setRegistroAcademico(valor: string) {
    this.registroAcademico.set(valor);
  }

  /**
   * Getter público para o sinal solicitando
   * @returns boolean
   */
  public getSolicitando() {
    return this.solicitando();
  }

  /**
   * Getter público para o sinal solicitacaoErro
   * @returns string | null
   */
  public getSolicitacaoErro() {
    return this.solicitacaoErro();
  }

  /**
   * Getter público para o sinal solicitacaoSucesso
   * @returns boolean
   */
  public getSolicitacaoSucesso() {
    return this.solicitacaoSucesso();
  }

  /**
   * Getter público para o sinal showConfirmInvalidar
   * @returns boolean
   */
  public getShowConfirmInvalidar() { return this.showConfirmInvalidar(); }

  /**
   * Getter público para o sinal registroParaInvalidar
   * @returns NadaConsta | null
   */
  public getRegistroParaInvalidar() { return this.registroParaInvalidar(); }

  /**
   * Getter público para o sinal verificandoPendencias
   * @returns boolean
   */
  public getVerificandoPendencias() { return this.verificandoPendencias(); }

  /**
   * Getter público para o sinal invalidando
   * @returns boolean
   */
  public getInvalidando() { return this.invalidando(); }

  adicionar(): void {
    this.showAdicionarModal.set(true);
  }

  cancelarAdicionar(): void {
    this.showAdicionarModal.set(false);
    this.registroAcademico.set('');
    this.solicitando.set(false);
    this.solicitacaoErro.set(null);
    this.solicitacaoSucesso.set(false);
  }

  continuarAdicionar(): void {
    const documento = this.registroAcademico().trim();
    if (!documento) return;
    this.solicitando.set(true);
    this.solicitacaoErro.set(null);
    this.solicitacaoSucesso.set(false);
    this.service.solicitar(documento)
      .pipe(finalize(() => {
        this.solicitando.set(false);
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: () => {
          this.solicitacaoSucesso.set(true);
          this.showAdicionarModal.set(false);
          this.registroAcademico.set('');
          // Atualiza a lista conforme padrão de empréstimos
          this.findAll();
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.solicitacaoErro.set(err?.error?.message || 'Erro ao solicitar Nada Consta.');
          this.cdr.markForCheck();
        }
      });
  }

  // Aplica filtro global na tabela
  onGlobalFilter(value: string): void {
    this.filterValue = value;
    this.applyFilter(value);
  }

  // Limpa o filtro global
  clearGlobalFilter(): void {
    this.filterValue = '';
    this.applyFilter('');
  }

  // Retorna o placeholder do filtro global
  getGlobalFilterPlaceholder(): string {
    return this.tableConfig?.globalFilterPlaceholder || 'Buscar Nada Consta...';
  }

  formatDateTime(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  // Getter para expor pageSizeOptions ao template
  get pageSizeOptions(): number[] {
    return this.tableConfig?.pageSizeOptions || [5, 10, 25, 50, 100];
  }

  getStatusLabel(status: string): string {
    return getNadaConstaStatusLabel(status);
  }

  getStatusSeverity(status: string): 'warn' | 'success' | 'danger' {
    return getNadaConstaStatusSeverity(status);
  }

  reenviarNadaConsta(element: NadaConsta): void {
    // Use console.log instead of alert to be test-friendly and avoid JSDOM/windows issues
    console.warn(`Reenviar Nada Consta para registro ID ${element.id}`);
  }

  atualizarStatus(element: NadaConsta): void {
    // Use console.warn instead of alert to be test-friendly
    console.warn(`Atualizar status do registro ID ${element.id}`);
  }

  protected override urlForm = '';

  public override openForm(): void {
    this.showAdicionarModal.set(true);
  }

  protected readonly verificandoPendencias = signal<number | null>(null);
  protected readonly invalidando = signal<number | null>(null);

  /**
   * Verifica pendências do Nada Consta e atualiza o status.
   * @param row Registro do Nada Consta
   */
  verificarPendencias(row: NadaConsta): void {
    this.verificandoPendencias.set(row.id);
    this.service.verificarPendencias(row.id)
      .pipe(finalize(() => {
        this.verificandoPendencias.set(null);
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: () => {
          this.showSuccessMessage('Sucesso', 'Pendências verificadas com sucesso.');
          this.findAll();
        },
        error: (err) => this.showErrorMessage(err, 'Erro ao verificar pendências.')
      });
  }

  /**
   * Invalida o Nada Consta.
   * @param row Registro do Nada Consta
   */
  invalidar(row: NadaConsta): void {
    this.invalidando.set(row.id);
    this.service.invalidar(row.id)
      .pipe(finalize(() => {
        this.invalidando.set(null);
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: () => {
          this.showSuccessMessage('Sucesso', 'Nada Consta invalidado com sucesso.');
          this.findAll();
        },
        error: (err) => this.showErrorMessage(err, 'Erro ao invalidar Nada Consta.')
      });
  }

  protected readonly showConfirmInvalidar = signal(false);
  protected readonly registroParaInvalidar = signal<NadaConsta | null>(null);

  abrirDialogConfirmarInvalidar(row: NadaConsta): void {
    this.registroParaInvalidar.set(row);
    this.showConfirmInvalidar.set(true);
  }

  cancelarInvalidar(): void {
    this.showConfirmInvalidar.set(false);
    this.registroParaInvalidar.set(null);
  }

  confirmarInvalidar(): void {
    const registro = this.registroParaInvalidar();
    if (!registro) return;
    this.invalidar(registro);
    this.showConfirmInvalidar.set(false);
    this.registroParaInvalidar.set(null);
  }

  public setVerificandoPendencias(val: number | null) { this.verificandoPendencias.set(val); }
  public setInvalidando(val: number | null) { this.invalidando.set(val); }

  public menuLoading = signal(false);

  /**
   * Exibe mensagem de sucesso usando o MessageService.
   * @param summary Título da mensagem
   * @param detail Detalhes da mensagem
   */
  private showSuccessMessage(summary: string, detail: string): void {
    this.messageService.add({ severity: 'success', summary, detail });
    this.cdr?.markForCheck();
  }

  /**
   * Exibe mensagem de erro usando o MessageService.
   * @param err Objeto de erro da requisição
   * @param defaultMessage Mensagem padrão caso não haja mensagem no erro
   */
  private showErrorMessage(err: unknown, defaultMessage: string): void {
    const errorMessage = err && typeof err === 'object' && 'error' in err
      ? (err as { error?: { message?: string } }).error?.message
      : undefined;
    this.messageService.add({
      severity: 'error',
      summary: 'Erro',
      detail: errorMessage || defaultMessage
    });
    this.cdr?.markForCheck();
  }

  /**
   * Abre o menu de ações após construir os itens.
   * @param event Evento do clique
   */
  private openActionsMenu(event: Event): void {
    this.actionsMenu().toggle(event);
    this.cdr?.markForCheck();
  }

  /**
   * Cria o item de menu "Cancelar" padrão.
   * @returns MenuItem configurado para fechar o menu
   */
  private createCancelMenuItem(): MenuItem {
    return {
      label: 'Cancelar',
      icon: 'pi pi-times',
      ariaLabel: 'Fechar menu de ações',
      command: () => this.actionsMenu().hide()
    };
  }

  /**
   * Imprime o PDF do Nada Consta em uma nova aba do navegador.
   * @param row Registro do Nada Consta
   */
  public imprimirNadaConsta(row: NadaConsta) {
    this.actionsMenu().hide();
    this.menuLoading.set(true);

    this.service.downloadPdf(row.id)
      .pipe(finalize(() => {
        this.menuLoading.set(false);
        this.cdr?.markForCheck();
      }))
      .subscribe({
        next: (data) => {
          const blob = new Blob([data], { type: 'application/pdf' });
          const url = globalThis.URL.createObjectURL(blob);
          globalThis.open(url, '_blank');
          setTimeout(() => globalThis.URL.revokeObjectURL(url), 100);
          this.showSuccessMessage('PDF Gerado', 'O PDF foi aberto em uma nova aba.');
        },
        error: (err) => this.showErrorMessage(err, 'Erro ao gerar PDF.')
      });
  }

  /**
   * Reenvia o email com o Nada Consta para o usuário.
   * @param row Registro do Nada Consta
   */
  public reenviarEmailNadaConsta(row: NadaConsta) {
    this.actionsMenu().hide();
    this.menuLoading.set(true);
    this.service.reenviarEmail(row.id)
      .pipe(finalize(() => {
        this.menuLoading.set(false);
        this.cdr?.markForCheck();
      }))
      .subscribe({
        next: () => this.showSuccessMessage('Email Enviado', '2ª via do Nada Consta enviada com sucesso.'),
        error: (err) => this.showErrorMessage(err, 'Erro ao enviar 2ª via.')
      });
  }

  /**
   * Abre menu suspenso para linha com ações baseadas no status.
   * @param event Evento do clique
   * @param id ID do registro
   */
  public openOptions(event: Event, id: number): void {
    const nadaConsta = this.objects.find(e => e.id === id);
    if (!nadaConsta) return;

    this.contextMenuItems = this.buildContextMenuItems(nadaConsta);

    if (this.contextMenuItems.length > 0) {
      this.openActionsMenu(event);
    }
  }

  /**
   * Constrói os itens do menu contextual baseado no status do Nada Consta.
   * @param nadaConsta Registro do Nada Consta
   * @returns Array de MenuItems
   */
  private buildContextMenuItems(nadaConsta: NadaConsta): MenuItem[] {
    const status = nadaConsta.status?.toUpperCase();

    if (status === 'COMPLETED' || status === 'CONCLUIDO' || status === 'CONCLUÍDO') {
      return this.buildCompletedMenuItems(nadaConsta);
    }

    if (status === 'PENDING' || status === 'PENDENTE') {
      return this.buildPendingMenuItems(nadaConsta);
    }

    return [];
  }

  /**
   * Constrói itens do menu para status COMPLETED.
   * @param nadaConsta Registro do Nada Consta
   * @returns Array de MenuItems
   */
  private buildCompletedMenuItems(nadaConsta: NadaConsta): MenuItem[] {
    return [
      {
        label: 'Imprimir',
        icon: 'pi pi-print',
        ariaLabel: 'Baixar e imprimir PDF do Nada Consta',
        command: () => this.imprimirNadaConsta(nadaConsta)
      },
      {
        label: '2ª via email',
        icon: 'pi pi-envelope',
        ariaLabel: 'Reenviar segunda via do Nada Consta por email',
        command: () => this.reenviarEmailNadaConsta(nadaConsta)
      },
      {
        label: 'Invalidar',
        icon: 'pi pi-ban',
        ariaLabel: 'Invalidar este Nada Consta',
        command: () => {
          this.actionsMenu().hide();
          this.abrirDialogConfirmarInvalidar(nadaConsta);
        }
      },
      this.createCancelMenuItem()
    ];
  }

  /**
   * Constrói itens do menu para status PENDING.
   * @param nadaConsta Registro do Nada Consta
   * @returns Array de MenuItems
   */
  private buildPendingMenuItems(nadaConsta: NadaConsta): MenuItem[] {
    return [
      {
        label: 'Revalidar',
        icon: 'pi pi-refresh',
        ariaLabel: 'Verificar pendências e revalidar Nada Consta',
        command: () => {
          this.actionsMenu().hide();
          this.verificarPendencias(nadaConsta);
        }
      },
      this.createCancelMenuItem()
    ];
  }
}
