import {ChangeDetectionStrategy, Component, forwardRef, inject, viewChild} from '@angular/core';
import {PrimeCrudListComponent} from '../framework/component/prime-crud.list.component';
import {TableColumn} from '../framework/model/table-config.interface';
import {Reserva} from './reserva';
import {ReservaService} from './reserva.service';
import {MenuItem} from 'primeng/api';
import {Popover, PopoverModule} from 'primeng/popover';
import {MenuModule} from 'primeng/menu';
import {PrimeTableSharedModule} from '../framework/module/prime-table-shared.module';
import {TableEmptyStateComponent} from '../framework/component/table-empty-state.component';
import {TableLoadingStateComponent} from '../framework/component/table-loading-state.component';
import {createTableConfig} from '../framework/utils/table-config.factory';

@Component({
    selector: 'app-list-reserva',
    templateUrl: './reserva.list.component.html',
    styleUrls: ['./reserva.list.component.css'],
  imports: [
    PrimeTableSharedModule,
    TableEmptyStateComponent,
    TableLoadingStateComponent,
    PopoverModule,
    MenuModule,
  ],
  providers: [{ provide: PrimeCrudListComponent, useExisting: forwardRef(() => ReservaListComponent) }],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReservaListComponent extends PrimeCrudListComponent<Reserva, number> {
  protected override service = inject(ReservaService);
  protected override columnsTable = ['id', 'descricao', 'dataReserva', 'dataRetirada', 'nomeUsuario', 'actions'];
  protected override urlForm = 'reserva/form';

  readonly actionsMenu = viewChild.required<Popover>('actionsMenu');
  contextMenuItems: MenuItem[] = [];
  selectedReserva!: Reserva;

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
      field: 'nomeUsuario',
      header: 'Usuário',
      type: 'text',
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
      exportable: false,
      toggleable: false,
      width: '12rem',
      align: 'center'
    }
  ];

  constructor() {
    super();

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

  openOptions(event: Event, reserva: Reserva): void {
    this.selectedReserva = reserva;
    const isAlunoOrProfessor = this.isAlunoOrProfessor();

    this.contextMenuItems = [];

    if (!isAlunoOrProfessor) {
      this.contextMenuItems.push({
        label: 'Gerar Empréstimo',
        icon: 'pi pi-handshake',
        command: () => this.finalizarReserva(reserva)
      });
    }

    this.contextMenuItems.push(
      {
        label: 'Editar',
        icon: 'pi pi-pencil',
        command: () => this.edit(reserva.id)
      },
      {
        label: 'Remover',
        icon: 'pi pi-trash',
        command: () => this.delete(reserva.id)
      }
    );

    this.actionsMenu().toggle(event);
    this.cdr?.markForCheck();
  }

  private configureTable(): void {
    this.tableConfig = createTableConfig({
      columns: this.tableColumns,
      globalFilterFields: ['id', 'descricao', 'dataReserva', 'nomeUsuario'],
      defaultSortField: 'id',
      caption: 'Reservas',
      stateKey: 'reserva-list',
      // ...outras propriedades específicas...
    });

    this.columnsTable = this.tableConfig.columns.map(column => column.field);
    this.displayedColumns = [...this.columnsTable];
  }

  finalizarReserva(reserva: Reserva) {
    localStorage.setItem('reserva-to-emprestimo', JSON.stringify(reserva));
    this.router.navigate(['emprestimo/form/reserva']);
  }

  postFindAll(): void {
    // PrimeNG tables handle sorting and filtering through the table configuration
    // Custom sorting for nested properties is handled in the template
  }
}
