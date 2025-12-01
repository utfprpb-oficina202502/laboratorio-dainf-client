import {ChangeDetectionStrategy, Component, forwardRef, inject} from '@angular/core';
import {PrimeCrudListComponent} from '../framework/component/prime-crud.list.component';
import {TableColumn} from '../framework/model/table-config.interface';
import {Compra} from './compra';
import {CompraService} from './compra.service';
import {PrimeTableSharedModule} from '../framework/module/prime-table-shared.module';
import {
  TableDefaultTemplatesComponent
} from '../framework/component/table-default-templates.component';
import {createTableConfig} from '../framework/utils/table-config.factory';

@Component({
    selector: 'app-list-compra',
    templateUrl: './compra.list.component.html',
    styleUrls: ['./compra.list.component.css'],
  imports: [
    PrimeTableSharedModule,
    TableDefaultTemplatesComponent,
  ],
  providers: [{ provide: PrimeCrudListComponent, useExisting: forwardRef(() => CompraListComponent) }],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CompraListComponent extends PrimeCrudListComponent<Compra, number> {
  protected override service = inject(CompraService);
  protected override columnsTable = ['id', 'fornecedorNomeFantasia', 'fornecedorRazaoSocial', 'dataCompra', 'actions'];
  protected override urlForm = 'compra/form';

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
    return 'Compra';
  }

  protected override getEntityPluralName(): string {
    return 'Compras';
  }

  protected override getExportFileName(): string {
    return 'compras';
  }

  private configureTable(): void {
    this.tableConfig = createTableConfig({
      columns: this.tableColumns,
      globalFilterFields: ['id', 'fornecedorNomeFantasia', 'fornecedorRazaoSocial', 'dataCompra'],
      defaultSortField: 'id',
      caption: 'Compras',
      stateKey: 'compra-list',
      // ...outras propriedades específicas...
    });

    this.columnsTable = this.tableConfig.columns.map(column => column.field);
    this.displayedColumns = [...this.columnsTable];
  }
}
