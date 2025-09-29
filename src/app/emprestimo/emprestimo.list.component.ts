import {Component, forwardRef, Injector, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {PrimeCrudListComponent} from '../framework/component/prime-crud.list.component';
import {TableColumn} from '../framework/model/table-config.interface';
import {Emprestimo} from './emprestimo';
import {EmprestimoService} from './emprestimo.service';
import {MatBottomSheet} from '@angular/material/bottom-sheet';
import {BottomSheetEmprestimoComponent} from './bottomScheetEmprestimo/bottomSheetEmprestimo.component';
import {SelectItem} from 'primeng/api';
import {DateUtil} from '../framework/util/dateUtil';
import {pt} from '../framework/constantes/calendarPt';
import {EmprestimoFilter} from './emprestimo.filter';
import {Usuario} from '../usuario/usuario';
import {UsuarioService} from '../usuario/usuario.service';
import Swal from 'sweetalert2';
import {DatePicker} from "primeng/datepicker";

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
import {DatePickerModule} from 'primeng/datepicker';
import {SelectModule} from 'primeng/select';
import {PrimeCrudToolbarComponent} from '../framework/component/prime-crud-toolbar.component';
import {NovoModule} from '../geral/novo/novo.module';

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
    PrimeCrudToolbarComponent,
    NovoModule
  ],
  providers: [{ provide: PrimeCrudListComponent, useExisting: forwardRef(() => EmprestimoListComponent) }]
})
export class EmprestimoListComponent extends PrimeCrudListComponent<Emprestimo, number> {

  @ViewChild('novaData') novaData: DatePicker;
  dialogFiltroEmprestimo = false;
  emprestimoFilter: EmprestimoFilter;
  statusDropdown: SelectItem[];
  localePt = pt;
  usuarioEmprestimoList: Usuario[];
  usuarioResponsalvel: Usuario[];
  dtNovaData: string;
  idEmprestimoToChangePrazoDev: number;

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
    }
  ];

  constructor(protected emprestimoService: EmprestimoService,
              protected injector: Injector,
              private bottomSheetOptions: MatBottomSheet,
              private usuarioService: UsuarioService) {
    super(emprestimoService, injector, ['id', 'usuarioEmprestimo', 'dataEmprestimo', 'prazoDevolucao', 'status'], 'emprestimo/form');
    this.bottomSheetEnabled = false;
    this.hostListenerColumnEnable = false;
    this.emprestimoFilter = new EmprestimoFilter();
    this.buildDropdown();
    this.configureTable();
  }

  protected override getEntityName(): string {
    return 'Emprestimo';
  }

  protected override getEntityPluralName(): string {
    return 'Emprestimos';
  }

  // Override export filename for emprestimos
  protected override getExportFileName(): string {
    return 'emprestimos';
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
      stateKey: 'emprestimo-list',
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
      preloadData: true,
      keyboardShortcuts: true
    };

    this.columnsTable = this.tableConfig.columns.map(column => column.field);
    this.displayedColumns = [...this.columnsTable];
  }

  // tslint:disable-next-line:use-lifecycle-interface
  ngOnInit(): void {
    this.loginService.userLoggedIsAlunoOrProfessor().then(value => {
      this.isAlunoOrProfessor = value;
      this.isAlunoOrProfessor ? this.findAllByUsername() : this.findAll();
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

  openOptions(id): void {
    const sheet = this.bottomSheetOptions.open(BottomSheetEmprestimoComponent);
    sheet.afterDismissed().subscribe(action => {
      if (action === 'E') {
        this.edit(id);
      } else if (action === 'R') {
        this.delete(id);
      } else if (action === 'P') {
        this.idEmprestimoToChangePrazoDev = id;
        this.openCalendarNewDate();
      } else if (action === 'D') {
        this.openDevolucao(id);
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

  findUsuarios($event: any) {
    this.usuarioService.completeCustom($event.query)
      .subscribe(e => {
        this.usuarioEmprestimoList = e;
      });
  }

  findUsuarioResponsavel($event: any) {
    this.usuarioService.completeCustomUsersLab($event.query)
      .subscribe(e => {
        this.usuarioResponsalvel = e;
      });
  }

  clearFilter() {
    this.emprestimoFilter = new EmprestimoFilter();
    this.buildDropdown();
    this.isAlunoOrProfessor ? this.findAllByUsername() : this.findAll();
  }

  filter() {
    this.dialogFiltroEmprestimo = false;
    this.loaderService.display(true);
    if (this.isAlunoOrProfessor) {
      this.setUserLogadoInFilter().then(() => {
        this.findByFilter();
      });
    } else {
      this.findByFilter();
    }
  }

  findByFilter() {
    this.emprestimoService.filter(this.emprestimoFilter)
      .subscribe(e => {
        this.objects = e;
        this.totalElements = e.length;
        this.loaderService.display(false);
      }, error => {
        this.loaderService.display(false);
      });
  }

  setUserLogadoInFilter(): Promise<void> {
    return new Promise<void>(resolve => {
      const u = new Usuario();
      u.username = localStorage.getItem('username');
      this.emprestimoFilter.usuarioEmprestimo = u;
      resolve();
    });
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
        this.loaderService.display(true);
        this.emprestimoService.changePrazoDevolucao(this.idEmprestimoToChangePrazoDev, this.dtNovaData)
          .subscribe(e => {
            Swal.fire('Sucesso!', 'Prazo de devolução alterado com sucesso!', 'success');
            this.findAll();
            this.loaderService.display(false);
          }, error => {
            this.loaderService.display(false);
            Swal.fire('Atenção!', 'Ocorreu um erro ao alterar a data do prazo de devolução!', 'error');
          });
      }
    });
  }
}
