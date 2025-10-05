import {
  ChangeDetectionStrategy,
  Component,
  forwardRef,
  inject,
  OnInit,
  ViewChild
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
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
import Swal from 'sweetalert2';

// PrimeNG Components
import {CardModule} from 'primeng/card';
import {TableModule} from 'primeng/table';
import {MultiSelectModule} from 'primeng/multiselect';
import {ToolbarModule} from 'primeng/toolbar';
import {ButtonModule} from 'primeng/button';
import {InputTextModule} from 'primeng/inputtext';
import {IconFieldModule} from 'primeng/iconfield';
import {InputIconModule} from 'primeng/inputicon';
import {TooltipModule} from 'primeng/tooltip';
import {TagModule} from 'primeng/tag';
import {DialogModule} from 'primeng/dialog';
import {AutoCompleteModule} from 'primeng/autocomplete';
import {DatePicker, DatePickerModule} from 'primeng/datepicker';
import {SelectModule} from 'primeng/select';

import {MenuModule} from 'primeng/menu';
import {PrimeCrudToolbarComponent} from '../framework/component/prime-crud-toolbar.component';
import {NovoComponent} from '../geral/novo/novo.component';

@Component({
    selector: 'app-list-emprestimo',
    templateUrl: './emprestimo.list.component.html',
    styleUrls: ['./emprestimo.list.component.css'],
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    TableModule,
    MultiSelectModule,
    ToolbarModule,
    ButtonModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    TooltipModule,
    TagModule,
    DialogModule,
    AutoCompleteModule,
    DatePickerModule,
    SelectModule,
    PopoverModule,
    MenuModule,
    PrimeCrudToolbarComponent,
    NovoComponent
  ],
  providers: [{ provide: PrimeCrudListComponent, useExisting: forwardRef(() => EmprestimoListComponent) }],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmprestimoListComponent extends PrimeCrudListComponent<Emprestimo, number> implements OnInit{
  @ViewChild('actionsMenu') actionsMenu: Popover;
  @ViewChild('novaData') novaData: DatePicker;
  contextMenuItems: MenuItem[] = [];
  protected override service = inject(EmprestimoService);
  selectedEmprestimoId: number;
  dialogFiltroEmprestimo = false;
  emprestimoFilter: EmprestimoFilter;
  statusDropdown: SelectItem[];
  usuarioEmprestimoList: Usuario[];
  usuarioResponsalvel: Usuario[];
  dtNovaData: string;
  idEmprestimoToChangePrazoDev: number;
  protected override columnsTable = ['id', 'usuarioEmprestimo', 'dataEmprestimo', 'prazoDevolucao', 'status', 'actions'];
  protected override urlForm = 'emprestimo/form';
  private readonly usuarioService = inject(UsuarioService);
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
      minWidth: '16rem'
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
      header: 'Opções',
      type: 'custom',
      sortable: false,
      filterable: false,
      exportable: false,
      toggleable: false,
      width: '12rem',
      align: 'center'
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

  async openOptions(event: Event, id: number): Promise<void> {
    this.selectedEmprestimoId = id;
    const isAlunoOrProfessor = await this.loginService.userLoggedIsAlunoOrProfessor();

    this.contextMenuItems = [];

    if (!isAlunoOrProfessor) {
      this.contextMenuItems.push(
        {
          label: 'Devolução',
          icon: 'pi pi-undo',
          command: () => this.openDevolucao(id)
        },
        {
          label: 'Novo Prazo',
          icon: 'pi pi-clock',
          command: () => {
            this.idEmprestimoToChangePrazoDev = id;
            this.openCalendarNewDate();
          }
        }
      );
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

    this.actionsMenu.toggle(event);
    this.cdr.markForCheck();
  }

  findUsuarios($event: any) {
    this.usuarioService.completeCustom($event.query)
    .subscribe({
      next: (e) => {
        this.usuarioEmprestimoList = e;
      }
    });
  }

  protected override getExportFileName(): string {
    return 'emprestimos';
  }

  // tslint:disable-next-line:use-lifecycle-interface
  ngOnInit(): void {
    super.ngOnInit();

    this.loginService.userLoggedIsAlunoOrProfessor().then(value => {
      this.isAlunoOrProfessor = value;
      this.cdr.markForCheck();
      this.isAlunoOrProfessor ? this.findAllByUsername() : this.findAll();
    });
  }

  findUsuarioResponsavel($event: any) {
    this.usuarioService.completeCustomUsersLab($event.query)
    .subscribe({
      next: (e) => {
        this.usuarioResponsalvel = e;
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
      error: (error) => {
        this.loaderService.hide();
      }
      });
  }

  openDevolucao(id) {
    this.router.navigate(['emprestimo/devolucao', id]);
  }

  openCalendarNewDate() {
    this.novaData.overlayVisible = true;
  }

  getStatusEmprestimo(emprestimo: Emprestimo) {
    if (DateUtil.dtIsBeforeToday(emprestimo.prazoDevolucao) && emprestimo.dataDevolucao == null) {
      return 'A';
    } else if (emprestimo.dataDevolucao == null) {
      return 'P';
    } else {
      return 'F';
    }
  }

  openDialogFiltro() {
    this.dialogFiltroEmprestimo = true;
  }

  changePrazoDevolucao() {
    Swal.fire({
      title: `Confirmação`,
      text: `Você realmente deseja alterar o prazo de devolução para o dia ${this.dtNovaData}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sim',
      cancelButtonText: 'Não'
    }).then((result) => {
      if (result.value) {
        this.loaderService.show();
        this.emprestimoService.changePrazoDevolucao(this.idEmprestimoToChangePrazoDev, this.dtNovaData)
        .subscribe({
          next: (e) => {
            Swal.fire('Sucesso!', 'Prazo de devolução alterado com sucesso!', 'success');
            this.findAll();
            this.loaderService.hide();
          },
          error: (error) => {
            this.loaderService.hide();
            Swal.fire('Atenção!', 'Ocorreu um erro ao alterar a data do prazo de devolução!', 'error');
          }
          });
      }
    });
  }

  clearFilter() {
    this.emprestimoFilter = new EmprestimoFilter();
    this.buildDropdown();
    this.isAlunoOrProfessor ? this.findAllByUsername() : this.findAll();
  }

  filter() {
    this.dialogFiltroEmprestimo = false;
    this.loaderService.show();
    if (this.isAlunoOrProfessor) {
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
      u.username = localStorage.getItem('username');
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

  private configureTable(): void {
    this.tableConfig = {
      ...this.tableConfig,
      columns: this.tableColumns,
      globalFilterFields: ['id', 'dataEmprestimo', 'prazoDevolucao'],
      defaultSortField: 'dataEmprestimo',
      defaultSortOrder: -1,
      caption: 'Lista de Emprestimos',
      trackByField: 'id',
      emptyMessage: 'Nenhum emprestimo encontrado.',
      loadingMessage: 'Carregando emprestimos...',
      globalFilterPlaceholder: 'Buscar emprestimos...',
      columnToggle: true,
      expandable: false,
      expandMode: 'single',
      rowExpansionKey: 'id',
      stateful: true,
      stateKey: 'emprestimo-list-v2',
      stateStorage: 'local',
      stateProps: {
        columns: true,
        filters: true,
        sort: true,
        pagination: true,
        selection: true,
        expandedRows: true
      },
      resizableColumns: true,
      columnResizeMode: 'fit',
      lazy: true,
      lazyLoadOnInit: true,
      preloadData: false,
      keyboardShortcuts: true
    };

    this.columnsTable = this.tableConfig.columns.map(column => column.field);
    this.displayedColumns = [...this.columnsTable];
  }
}
