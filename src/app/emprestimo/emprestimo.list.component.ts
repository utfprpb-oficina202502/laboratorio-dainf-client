import {ChangeDetectionStrategy, Component, forwardRef, inject, viewChild} from '@angular/core';
import {Z_INDEX} from '../framework/constants';
import {PrimeCrudListComponent} from '../framework/component/prime-crud.list.component';
import {TableColumn} from '../framework/model/table-config.interface';
import {Emprestimo} from './emprestimo';
import {EmprestimoService} from './emprestimo.service';
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

  protected override columnsTable = ['id', 'usuarioEmprestimo', 'dataEmprestimo', 'prazoDevolucao', 'status', 'actions'];
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
      field: 'usuarioEmprestimo',
      header: 'Aluno/Professor',
      type: 'custom',
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
      filterable: false,
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
  }

  // Getter for backwards compatibility with custom methods
  protected get emprestimoService(): EmprestimoService {
    return this.service;
  }

  openOptions(event: Event, id: number): void {
    this.selectedEmprestimoId = id;
    const isAlunoOrProfessor = this.isAlunoOrProfessor();
    this.contextMenuItems = [];
    const emprestimo = this.objects.find(e => e.id === id);
    const status = emprestimo ? this.getStatusEmprestimo(emprestimo) : undefined;

    if (!isAlunoOrProfessor) {
      this.contextMenuItems.push({
        label: 'Devolução',
        icon: 'pi pi-undo',
        command: () => this.openDevolucao(id)
      });
      if (emprestimo && status === 'P') {
        this.contextMenuItems.push({
          label: 'Novo Prazo',
          icon: 'pi pi-clock',
          command: () => this.abrirModalNovoPrazo(emprestimo)
        });
      }
    }
    this.contextMenuItems.push({
      label: isAlunoOrProfessor ? 'Visualizar' : 'Editar',
      icon: isAlunoOrProfessor ? 'pi pi-eye' : 'pi pi-pencil',
      command: () => this.edit(id)
    });
    if (!isAlunoOrProfessor) {
      this.contextMenuItems.push({
        label: 'Remover',
        icon: 'pi pi-trash',
        command: () => this.delete(id)
      });
    }
    this.actionsMenu().toggle(event);
    this.cdr?.markForCheck();
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

  getStatusEmprestimo(emprestimo: Emprestimo) {
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
      globalFilterFields: ['id', 'usuarioEmprestimo', 'dataEmprestimo', 'prazoDevolucao', 'status'],
      defaultSortField: 'id',
      caption: 'Empréstimos',
      stateKey: 'emprestimo-list',
      // ...outras propriedades específicas...
    });

    this.columnsTable = this.tableConfig.columns.map(column => column.field);
    this.displayedColumns = [...this.columnsTable];
  }

  formatDateString(dateStr: string | undefined): string {
    return DateUtil.formatDateString(dateStr);
  }
}
