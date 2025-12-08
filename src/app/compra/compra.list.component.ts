import {ChangeDetectionStrategy, Component, forwardRef, inject, viewChild} from '@angular/core';
import {PrimeCrudListComponent} from '../framework/component/prime-crud.list.component';
import {Compra} from './compra';
import {CompraService} from './compra.service';
import {PrimeTableSharedModule} from '../framework/module/prime-table-shared.module';
import {TableEmptyStateComponent} from '../framework/component/table-empty-state.component';
import {TableLoadingStateComponent} from '../framework/component/table-loading-state.component';
import {createTableConfig, createListComponentConfig, createIdColumn, createActionsColumn} from '../framework/utils/table-config.factory';
import {MenuItem} from 'primeng/api';
import {Popover} from 'primeng/popover';

@Component({
    selector: 'app-list-compra',
    templateUrl: './compra.list.component.html',
    styleUrls: ['./compra.list.component.css'],
  imports: [
    PrimeTableSharedModule,
    TableEmptyStateComponent,
    TableLoadingStateComponent,
  ],
  providers: [{ provide: PrimeCrudListComponent, useExisting: forwardRef(() => CompraListComponent) }],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CompraListComponent extends PrimeCrudListComponent<Compra, number> {
  private readonly listConfig = createListComponentConfig(
    [
      {
        field: 'fornecedorNomeFantasia',
        header: 'Nome Fantasia',
        type: 'text',
        sortable: true,
        filterable: true,
        minWidth: '14rem'
      },
      {
        field: 'fornecedorRazaoSocial',
        header: 'Razão Social',
        type: 'text',
        sortable: true,
        filterable: true,
        minWidth: '14rem'
      },
      {
        field: 'dataCompra',
        header: 'Data da Compra',
        type: 'date',
        sortable: true,
        filterable: true,
        width: '14rem',
        align: 'center'
      }
    ],
    ['fornecedorNomeFantasia', 'fornecedorRazaoSocial', 'dataCompra'],
    'id',
    'Compras',
    'compra-list'
  );

  protected override service = inject(CompraService);
  protected override columnsTable = this.listConfig.columnsTable;
  protected override urlForm = 'compra/form';

  readonly actionsMenu = viewChild.required<Popover>('actionsMenu');
  contextMenuItems: MenuItem[] = [];

  constructor() {
    super();

    this.hostListenerColumnEnable = false;
    this.configureTable();
  }

  protected override getEntityName(): string {
    return 'Compra';
  }

  protected override getEntityPluralName(): string {
    return 'Compras';
  }

  protected override getExportFileName(): string {
    return 'compras';
  }

  private configureTable(): void {
    const tableColumns = [createIdColumn(), ...this.listConfig.entityColumns, createActionsColumn()];

    this.tableConfig = createTableConfig({
      columns: tableColumns,
      globalFilterFields: this.listConfig.globalFilterFields,
      defaultSortField: this.listConfig.defaultSortField,
      caption: this.listConfig.caption,
      stateKey: this.listConfig.stateKey,
      // ...outras propriedades específicas...
    });

    this.columnsTable = this.tableConfig.columns.map(column => column.field);
    this.displayedColumns = [...this.columnsTable];
  }

  openOptions(event: Event, compra: Compra): void {
    this.contextMenuItems = [
      {
        label: 'Editar',
        icon: 'pi pi-pencil',
        command: () => this.edit(compra.id)
      },
      {
        label: 'Remover',
        icon: 'pi pi-trash',
        command: () => this.delete(compra.id)
      }
    ];

    this.actionsMenu().toggle(event);
  }

  onKeyDown(event: KeyboardEvent, compra: Compra): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.openOptions(event, compra);
    }
  }
}
