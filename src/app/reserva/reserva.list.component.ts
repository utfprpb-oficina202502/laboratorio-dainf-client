import {
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  inject,
  viewChild
} from '@angular/core';
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
  protected override columnsTable = ['id', 'descricao', 'dataReserva', 'dataRetirada', 'usuarioNome', 'actions'];
  protected override urlForm = 'reserva/form';

  // Override: Todos os usuários autenticados podem criar reservas (alunos/professores incluídos)
  override readonly canCreate = computed(() => true);

  // Override: Reservas nunca devem ser globalmente readonly; bloqueio global é tratado em outro lugar
  // Apenas a regra isAlunoOrProfessor() bloqueia ações para alunos/professores
  override readonly isReadOnly = computed(() => false);

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
      field: 'usuarioNome',
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
    const isReadOnly = this.isReadOnly() || this.isAlunoOrProfessor();

    this.contextMenuItems = [];

    // Add custom actions first
    if (!isReadOnly) {
      this.contextMenuItems.push({
        label: 'Gerar Empréstimo',
        icon: 'pi pi-handshake',
        command: () => this.finalizarReserva(reserva)
      });
    }

    // Add standard actions based on permissions
    if (!isReadOnly) {
      if (this.canEdit()) {
        this.contextMenuItems.push({
          label: 'Editar',
          icon: 'pi pi-pencil',
          command: () => this.edit(this.getItemId(reserva))
        });
      }

      if (this.canDelete()) {
        this.contextMenuItems.push({
          label: 'Remover',
          icon: 'pi pi-trash',
          command: () => this.delete(this.getItemId(reserva))
        });
      }
    } else {
      this.contextMenuItems.push({
        label: 'Visualizar',
        icon: 'pi pi-eye',
        command: () => this.edit(this.getItemId(reserva))
      });
    }

    this.actionsMenu().toggle(event);
    this.cdr?.markForCheck();
  }

  private configureTable(): void {
    this.tableConfig = createTableConfig({
      columns: this.tableColumns,
      globalFilterFields: ['id', 'descricao', 'dataReserva', 'usuarioNome'],
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
