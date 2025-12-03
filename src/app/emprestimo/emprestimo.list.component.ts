import {
  ChangeDetectionStrategy,
  Component,
  effect,
  forwardRef,
  inject,
  signal,
  untracked,
  viewChild
} from '@angular/core';
import {Z_INDEX} from '../framework/constants';
import {PrimeCrudListComponent} from '../framework/component/prime-crud.list.component';
import {TableColumn} from '../framework/model/table-config.interface';
import {Emprestimo, EmprestimoStatus} from './emprestimo';
import {EmprestimoService} from './emprestimo.service';
import {EmprestimoItem} from './emprestimoItem';
import {MenuItem, SelectItem} from 'primeng/api';
import {Popover, PopoverModule} from 'primeng/popover';
import {DateUtil} from '../framework/util/dateUtil';
import {EmprestimoFilter} from './emprestimo.filter';
import {Usuario} from '../usuario/usuario';
import {UsuarioService} from '../usuario/usuario.service';
import {DialogModule} from 'primeng/dialog';
import {AutoCompleteModule} from 'primeng/autocomplete';
import {DatePicker, DatePickerModule} from 'primeng/datepicker';
import {SelectModule} from 'primeng/select';
import {MenuModule} from 'primeng/menu';
import {SkeletonModule} from 'primeng/skeleton';
import {NovoComponent} from '../geral/novo/novo.component';
import {PrimeTableSharedModule} from '../framework/module/prime-table-shared.module';
import {BreakpointService} from '../framework/services/breakpoint.service';
import {TableEmptyStateComponent} from '../framework/component/table-empty-state.component';
import {TableLoadingStateComponent} from '../framework/component/table-loading-state.component';
import {createTableConfig} from '../framework/utils/table-config.factory';
import {firstValueFrom} from 'rxjs';

@Component({
    selector: 'app-list-emprestimo',
    templateUrl: './emprestimo.list.component.html',
    styleUrls: ['./emprestimo.list.component.css'],
  imports: [
    PrimeTableSharedModule,
    DialogModule,
    AutoCompleteModule,
    DatePickerModule,
    SelectModule,
    PopoverModule,
    MenuModule,
    SkeletonModule,
    NovoComponent,
    TableEmptyStateComponent,
    TableLoadingStateComponent,
  ],
  providers: [{ provide: PrimeCrudListComponent, useExisting: forwardRef(() => EmprestimoListComponent) }],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmprestimoListComponent extends PrimeCrudListComponent<Emprestimo, number> {
  readonly actionsMenu = viewChild.required<Popover>('actionsMenu');
  readonly novaData = viewChild.required<DatePicker>('novaData');
  contextMenuItems: MenuItem[] = [];
  protected override service = inject(EmprestimoService);
  protected readonly breakpointService = inject(BreakpointService);
  protected override urlForm = 'emprestimo/form';
  private readonly usuarioService = inject(UsuarioService);

  // Constants for template
  protected readonly Z_INDEX = Z_INDEX;
  selectedEmprestimoId!: number;
  dialogFiltroEmprestimo = false;
  emprestimoFilter = new EmprestimoFilter();
  statusDropdown: SelectItem[] = [];
  usuarioEmprestimoList: Usuario[] = [];
  usuarioResponsavel: Usuario[] = [];
  dtNovaData!: string;
  idEmprestimoToChangePrazoDev!: number;
  modalNovoPrazoVisible = false;
  novaDataPrazo: string | undefined;
  emprestimoSelecionadoParaPrazo: Emprestimo | undefined;

  // Dialog de itens emprestados
  dialogItensVisible = false;
  emprestimoSelecionadoParaItens: Emprestimo | undefined;
  itensDoEmprestimo = signal<EmprestimoItem[]>([]);
  loadingItensDialog = signal(false);

  protected override columnsTable = ['id', 'usuarioEmprestimoNome', 'dataEmprestimo', 'prazoDevolucao', 'status', 'actions'];
  private readonly tableColumns: TableColumn[] = [
    {
      field: 'id',
      header: 'Código',
      type: 'number',
      sortable: true,
      filterable: true,
      width: '8rem',
      align: 'center'
    },
    {
      field: 'usuarioEmprestimoNome',
      header: 'Aluno/Professor',
      type: 'text',
      sortable: true,
      filterable: true,
      width: '20rem'
    },
    {
      field: 'dataEmprestimo',
      header: 'Data do Empréstimo',
      type: 'date',
      sortable: true,
      filterable: true,
      width: '12rem',
      align: 'center'
    },
    {
      field: 'prazoDevolucao',
      header: 'Prazo de Devolução',
      type: 'date',
      sortable: true,
      filterable: true,
      width: '12rem',
      align: 'center'
    },
    {
      field: 'status',
      header: 'Status',
      type: 'custom',
      sortable: true,
      filterable: true,
      width: '10rem',
      align: 'center'
    },
    {
      field: 'actions',
      header: 'Ações',
      type: 'custom',
      sortable: false,
      filterable: false,
      exportable: false,
      align: 'center',
      width: '10rem',
      toggleable: false
    }
  ];

  constructor() {
    super();

    this.hostListenerColumnEnable = false;
    this.emprestimoFilter = new EmprestimoFilter();
    this.buildDropdown();
    this.configureTable();

    // Garante que a coluna de ações permaneça visível para alunos/professores
    // para que possam acessar o botão "Ver itens"
    effect(() => {
      // Rastreia mudanças de permissão (trigger do effect)
      this.isReadOnly();

      // Usa untracked para evitar dependências circulares ao modificar tableConfig
      untracked(() => {
        const actionsColumn = this.tableConfig.columns?.find(col => col.field === 'actions');
        if (actionsColumn && !actionsColumn.visible) {
          actionsColumn.visible = true;
          this.cdr?.markForCheck();
        }
      });
    });
  }

  // Getter for backwards compatibility with custom methods
  protected get emprestimoService(): EmprestimoService {
    return this.service;
  }

  openOptions(event: Event, row: Emprestimo): void {
    this.selectedEmprestimoId = row.id;
    const isAlunoOrProfessor = this.isAlunoOrProfessor();
    this.contextMenuItems = [];
    const status = this.getStatusEmprestimo(row);

    // Opção Ver Itens - disponível para todos
    this.contextMenuItems.push({
      label: 'Ver Itens',
      icon: 'pi pi-list',
      command: () => this.abrirDialogItens(row)
    });

    if (!isAlunoOrProfessor) {
      this.contextMenuItems.push({
        label: 'Devolução',
        icon: 'pi pi-undo',
        command: () => this.openDevolucao(row.id)
      });
      if (status === 'P') {
        this.contextMenuItems.push({
          label: 'Novo Prazo',
          icon: 'pi pi-clock',
          command: () => this.abrirModalNovoPrazo(row)
        });
      }
      this.contextMenuItems.push({
        label: 'Editar',
        icon: 'pi pi-pencil',
        command: () => this.edit(row.id)
      });
      this.contextMenuItems.push({
        label: 'Remover',
        icon: 'pi pi-trash',
        command: () => this.delete(row.id)
      });
    } else {
      this.contextMenuItems.push({
        label: 'Visualizar',
        icon: 'pi pi-eye',
        command: () => this.view(row.id)
      });
    }

    this.actionsMenu().toggle(event);
  }

  onKeyDown(event: KeyboardEvent, row: Emprestimo): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.openOptions(event, row);
    }
  }

  abrirModalNovoPrazo(emprestimo: Emprestimo) {
    this.actionsMenu().hide(); // Fecha o popover antes de abrir o modal
    this.emprestimoSelecionadoParaPrazo = emprestimo;
    this.novaDataPrazo = this.calcularNovaDataPrazo(emprestimo.prazoDevolucao);
    this.modalNovoPrazoVisible = true;
  }

  calcularNovaDataPrazo(prazoAtual: string | undefined): string | undefined {
    if (!prazoAtual) return undefined;
    return DateUtil.addDays(prazoAtual, 7);
  }

  fecharModalNovoPrazo() {
    this.modalNovoPrazoVisible = false;
    this.novaDataPrazo = undefined;
    this.emprestimoSelecionadoParaPrazo = undefined;
  }

  async enviarNovoPrazo() {
    if (!this.emprestimoSelecionadoParaPrazo || !this.novaDataPrazo) return;
    // Validação robusta da nova data
    let novaData: Date | undefined;
    // Aceita formatos dd/MM/yyyy e ISO
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(this.novaDataPrazo)) {
      const [dia, mes, ano] = this.novaDataPrazo.split('/').map(Number);
      novaData = new Date(ano, mes - 1, dia);
    } else {
      novaData = new Date(this.novaDataPrazo);
    }
    if (!novaData || Number.isNaN(novaData.getTime())) {
      this.messageService.add({
        severity: 'error',
        summary: 'Data inválida',
        detail: 'Selecione uma data válida para o novo prazo de devolução.',
        life: 5000
      });
      return;
    }
    // Normaliza para início do dia
    novaData.setHours(0, 0, 0, 0);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    // Prazo atual
    let prazoAtual: Date | undefined;
    if (this.emprestimoSelecionadoParaPrazo.prazoDevolucao) {
      const prazoStr = this.emprestimoSelecionadoParaPrazo.prazoDevolucao;
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(prazoStr)) {
        const [dia, mes, ano] = prazoStr.split('/').map(Number);
        prazoAtual = new Date(ano, mes - 1, dia);
      } else {
        prazoAtual = new Date(prazoStr);
      }
      if (prazoAtual && !Number.isNaN(prazoAtual.getTime())) {
        prazoAtual.setHours(0, 0, 0, 0);
      } else {
        prazoAtual = undefined;
      }
    }
    if (novaData <= hoje) {
      this.messageService.add({
        severity: 'error',
        summary: 'Data inválida',
        detail: 'A nova data de devolução deve ser futura em relação a hoje.',
        life: 5000
      });
      return;
    }
    if (prazoAtual && novaData <= prazoAtual) {
      this.messageService.add({
        severity: 'error',
        summary: 'Data inválida',
        detail: 'A nova data deve ser posterior ao prazo de devolução atual.',
        life: 5000
      });
      return;
    }
    this.loaderService.show();
    try {
      // Buscar o objeto completo do empréstimo
      const emprestimo = await firstValueFrom(this.emprestimoService.findOne(this.emprestimoSelecionadoParaPrazo.id));
      if (!emprestimo) {
        throw new Error('Empréstimo não encontrado!');
      }
      // Atualiza apenas o prazoDevolucao
      emprestimo.prazoDevolucao = this.novaDataPrazo;
      await firstValueFrom(this.emprestimoService.saveEmprestimo(emprestimo, 0));
      this.fecharModalNovoPrazo();
      this.findAll();
      this.cdr?.markForCheck();
      this.messageService.add({
        severity: 'success',
        summary: 'Sucesso!',
        detail: 'Prazo de devolução alterado com sucesso!',
        life: 3000
      });
    } catch (error: unknown) {
      this.messageService.add({
        severity: 'error',
        summary: 'Atenção!',
        detail: (error as Error)?.message || 'Ocorreu um erro ao alterar a data do prazo de devolução!',
        life: 5000
      });
    } finally {
      this.loaderService.hide();
    }
  }

  findUsuarios($event: { query: string }) {
    this.usuarioService.completeCustom($event.query)
    .subscribe({
      next: (usuarios: Usuario[]) => {
        this.usuarioEmprestimoList = usuarios;
      }
    });
  }

  findUsuarioResponsavel($event: { query: string }) {
    this.usuarioService.completeCustomUsersLab($event.query)
    .subscribe({
      next: (usuarios: Usuario[]) => {
        this.usuarioResponsavel = usuarios;
      }
    });
  }

  buildDropdown() {
    this.statusDropdown = [
      {label: 'Todos', value: 'T'},
      {label: 'Em andamento', value: 'P'},
      {label: 'Em atraso', value: 'A'},
      {label: 'Finalizado', value: 'F'}
    ];
    this.emprestimoFilter.status = 'T';
  }

  postFindAll(): void {
    // PrimeNG tables handle sorting and filtering through the table configuration
    // Custom sorting and filtering logic is now handled in the tableConfig
  }

  findByFilter() {
    this.emprestimoService.filter(this.emprestimoFilter)
    .subscribe({
      next: (e) => {
        this.objects = e;
        this.totalElements = e.length;
        this.loaderService.hide();
      },
      error: () => {
        this.loaderService.hide();
      }
      });
  }

  openDevolucao(id: number) {
    this.router.navigate(['emprestimo/devolucao', id]);
  }

  openCalendarNewDate() {
    this.novaData().overlayVisible = true;
  }

  view(id: number) {
    this.router.navigate([this.urlForm, id, 'view']);
  }

  /**
   * Calcula o status do empréstimo baseado nas datas.
   *
   * @param emprestimo Empréstimo a ter o status calculado
   * @returns Status: 'P' (Pendente), 'A' (Atrasado), 'F' (Finalizado)
   *
   * @example
   * getStatusEmprestimo(emprestimoSemDevolucao) // → 'P' ou 'A'
   * getStatusEmprestimo(emprestimoDevolvido)    // → 'F'
   */
  getStatusEmprestimo(emprestimo: Emprestimo): EmprestimoStatus {
    // Handle null/undefined prazoDevolucao gracefully
    if (!emprestimo.prazoDevolucao) {
      return 'P'; // Default to pending if no due date
    }

    if (DateUtil.dtIsBeforeToday(emprestimo.prazoDevolucao) && !emprestimo.dataDevolucao) {
      return 'A';
    } else if (emprestimo.dataDevolucao) {
      return 'F';
    } else {
      return 'P';
    }
  }

  openDialogFiltro() {
    this.dialogFiltroEmprestimo = true;
  }

  changePrazoDevolucao() {
    this.confirmationService.confirm({
      message: `Você realmente deseja alterar o prazo de devolução para o dia ${this.dtNovaData}?`,
      header: 'Confirmação',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sim',
      rejectLabel: 'Não',
      accept: () => {
        this.loaderService.show();
        this.emprestimoService.changePrazoDevolucao(this.idEmprestimoToChangePrazoDev, this.dtNovaData)
        .subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Sucesso!',
              detail: 'Prazo de devolução alterado com sucesso!',
              life: 3000
            });
            this.findAll();
            this.loaderService.hide();
          },
          error: () => {
            this.loaderService.hide();
            this.messageService.add({
              severity: 'error',
              summary: 'Atenção!',
              detail: 'Ocorreu um erro ao alterar a data do prazo de devolução!',
              life: 5000
            });
          }
          });
      }
    });
  }

  clearFilter() {
    this.emprestimoFilter = new EmprestimoFilter();
    this.buildDropdown();
    if (this.isAlunoOrProfessor()) {
      this.findAllByUsername();
    } else {
      this.findAll();
    }
  }

  filter() {
    this.dialogFiltroEmprestimo = false;
    this.loaderService.show();
    if (this.isAlunoOrProfessor()) {
      this.setUserLogadoInFilter().then(() => {
        this.findByFilter();
      });
    } else {
      this.findByFilter();
    }
  }

  setUserLogadoInFilter(): Promise<void> {
    return new Promise<void>(resolve => {
      const u = new Usuario();
      u.username = this.storageService.getItem('username') ?? '';
      this.emprestimoFilter.usuarioEmprestimo = u;
      resolve();
    });
  }

  protected override getEntityName(): string {
    return 'Empréstimo';
  }

  protected override getEntityPluralName(): string {
    return 'Empréstimos';
  }

  protected override getExportFileName(): string {
    return 'emprestimos';
  }

  private configureTable(): void {
    this.tableConfig = createTableConfig({
      columns: this.tableColumns,
      globalFilterFields: ['id', 'usuarioEmprestimoNome', 'dataEmprestimo', 'prazoDevolucao', 'status'],
      defaultSortField: 'id',
      caption: 'Empréstimos',
      stateKey: 'emprestimo-list',
    });

    this.columnsTable = this.tableConfig.columns.map(column => column.field);
    this.displayedColumns = [...this.columnsTable];
  }

  formatDateString(dateStr: string | undefined): string {
    return DateUtil.formatDateString(dateStr);
  }

  /**
   * Abre o dialog para visualizar os itens de um empréstimo.
   * Realiza lazy loading dos itens via API findOne.
   * @param emprestimo Empréstimo selecionado
   */
  abrirDialogItens(emprestimo: Emprestimo): void {
    this.actionsMenu().hide();
    this.emprestimoSelecionadoParaItens = emprestimo;
    this.dialogItensVisible = true;
    this.loadingItensDialog.set(true);
    this.itensDoEmprestimo.set([]);

    this.emprestimoService.findOne(emprestimo.id).subscribe({
      next: (emprestimoCompleto) => {
        this.itensDoEmprestimo.set(emprestimoCompleto.emprestimoItem || []);
        this.loadingItensDialog.set(false);
        this.cdr?.markForCheck();
      },
      error: () => {
        this.loadingItensDialog.set(false);
        this.cdr?.markForCheck();
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Erro ao carregar itens do empréstimo',
          life: 5000
        });
      }
    });
  }

  /**
   * Fecha o dialog de itens emprestados.
   */
  fecharDialogItens(): void {
    this.dialogItensVisible = false;
    this.emprestimoSelecionadoParaItens = undefined;
    this.itensDoEmprestimo.set([]);
  }
}
