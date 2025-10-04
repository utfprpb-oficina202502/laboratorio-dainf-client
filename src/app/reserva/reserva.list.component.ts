import {
  ChangeDetectionStrategy,
  Component,
  forwardRef,
  inject,
  Injector,
  OnInit,
  ViewChild
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {PrimeCrudListComponent} from '../framework/component/prime-crud.list.component';
import {TableColumn} from '../framework/model/table-config.interface';
import {Reserva} from './reserva';
import {ReservaService} from './reserva.service';
import {MenuItem} from 'primeng/api';
import {Popover, PopoverModule} from 'primeng/popover';

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

import {MenuModule} from 'primeng/menu';
import {PrimeCrudToolbarComponent} from '../framework/component/prime-crud-toolbar.component';
import {ActionButtonsComponent} from '../framework/component/action-buttons.component';

@Component({
    selector: 'app-list-reserva',
    templateUrl: './reserva.list.component.html',
    styleUrls: ['./reserva.list.component.css'],
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
    PopoverModule,
    MenuModule,
    PrimeCrudToolbarComponent,
    ActionButtonsComponent,
  ],
  providers: [{ provide: PrimeCrudListComponent, useExisting: forwardRef(() => ReservaListComponent) }],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReservaListComponent extends PrimeCrudListComponent<Reserva, number> implements OnInit{
  protected reservaService: ReservaService;
  protected injector: Injector;

  @ViewChild('actionsMenu') actionsMenu: Popover;
  contextMenuItems: MenuItem[] = [];
  selectedReserva: Reserva;

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
      field: 'descricao',
      header: 'Descrição',
      type: 'text',
      sortable: true,
      filterable: true,
      minWidth: '16rem'
    },
    {
      field: 'dataReserva',
      header: 'Data Reserva',
      type: 'date',
      sortable: true,
      filterable: true,
      width: '12rem',
      align: 'center'
    },
    {
      field: 'dataRetirada',
      header: 'Data Retirada',
      type: 'date',
      sortable: true,
      filterable: true,
      width: '12rem',
      align: 'center'
    },
    {
      field: 'usuario',
      header: 'Usuário',
      type: 'custom',
      sortable: true,
      filterable: true,
      minWidth: '14rem'
    },
    {
      field: 'actions',
      header: 'Opções',
      type: 'custom',
      sortable: false,
      filterable: false,
      width: '12rem',
      align: 'center'
    }
  ];

  constructor() {
    const reservaService = inject(ReservaService);
    const injector = inject(Injector);

    super(reservaService, injector, ['id', 'descricao', 'dataReserva', 'dataRetirada', 'usuario', 'actions'], 'reserva/form');
    this.reservaService = reservaService;
    this.injector = injector;

    this.bottomSheetEnabled = false;
    this.hostListenerColumnEnable = false;
    this.configureTable();
  }

  protected override getEntityName(): string {
    return 'Reserva';
  }

  protected override getEntityPluralName(): string {
    return 'Reservas';
  }

  protected override getExportFileName(): string {
    return 'reservas';
  }

  private configureTable(): void {
    this.tableConfig = {
      ...this.tableConfig,
      columns: this.tableColumns,
      globalFilterFields: ['id', 'descricao', 'dataReserva', 'dataRetirada'],
      defaultSortField: 'dataReserva',
      defaultSortOrder: -1,
      caption: 'Lista de Reservas',
      trackByField: 'id',
      emptyMessage: 'Nenhuma reserva encontrada.',
      loadingMessage: 'Carregando reservas...',
      globalFilterPlaceholder: 'Buscar reservas...',
      columnToggle: true,
      expandable: false,
      expandMode: 'single',
      rowExpansionKey: 'id',
      stateful: true,
      stateKey: 'reserva-list',
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

  ngOnInit(): void {
    this.loginService.userLoggedIsAlunoOrProfessor().then(value => {
      this.isAlunoOrProfessor = value;
      this.isAlunoOrProfessor ? this.findAllByUsername() : this.findAll();
    });
  }

  async openOptions(event: Event, reserva: Reserva): Promise<void> {
    this.selectedReserva = reserva;
    const isAlunoOrProfessor = await this.loginService.userLoggedIsAlunoOrProfessor();

    this.contextMenuItems = [];

    if (!isAlunoOrProfessor) {
      this.contextMenuItems.push({
        label: 'Gerar Empréstimo',
        icon: 'fa fa-handshake-o',
        command: () => this.finalizarReserva(reserva)
      });
    }

    this.contextMenuItems.push({
      label: 'Editar',
      icon: 'fa fa-edit',
      command: () => this.edit(reserva.id)
    });

    this.contextMenuItems.push({
      label: 'Remover',
      icon: 'fa fa-trash-o',
      command: () => this.delete(reserva.id)
    });

    this.actionsMenu.toggle(event);
    this.cdr.markForCheck();
  }

  finalizarReserva(reserva) {
    localStorage.setItem('reserva-to-emprestimo', JSON.stringify(reserva));
    this.router.navigate(['emprestimo/form/reserva']);
  }

  postFindAll(): void {
    // PrimeNG tables handle sorting and filtering through the table configuration
    // Custom sorting for nested properties is handled in the template
  }
}
