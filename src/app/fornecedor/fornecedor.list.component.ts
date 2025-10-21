import {ChangeDetectionStrategy, Component, forwardRef, inject} from '@angular/core';
import {PrimeCrudListComponent} from '../framework/component/prime-crud.list.component';
import {TableColumn} from '../framework/model/table-config.interface';
import {Fornecedor} from './fornecedor';
import {FornecedorService} from './fornecedor.service';
import {PrimeTableSharedModule} from '../framework/module/prime-table-shared.module';
import {
  TableDefaultTemplatesComponent
} from '../framework/component/table-default-templates.component';
import {CpfCnpjPipe} from "../framework/pipe/cpfCnpj/cpfCnpj.pipe";
import { createTableConfig } from '../framework/utils/table-config.factory';

@Component({
    selector: 'app-list-fornecedor',
    templateUrl: './fornecedor.list.component.html',
    styleUrls: ['./fornecedor.list.component.css'],
  imports: [
    PrimeTableSharedModule,
    TableDefaultTemplatesComponent,
    CpfCnpjPipe,
],
  providers: [{ provide: PrimeCrudListComponent, useExisting: forwardRef(() => FornecedorListComponent) }],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FornecedorListComponent extends PrimeCrudListComponent<Fornecedor, number> {
  protected override service = inject(FornecedorService);
  protected override columnsTable = ['id', 'razaoSocial', 'nomeFantasia', 'cnpj', 'actions'];
  protected override urlForm = 'fornecedor/form';

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
      field: 'razaoSocial',
      header: 'Razão Social',
      type: 'text',
      sortable: true,
      filterable: true,
      minWidth: '20rem'
    },
    {
      field: 'nomeFantasia',
      header: 'Nome Fantasia',
      type: 'text',
      sortable: true,
      filterable: true,
      minWidth: '18rem'
    },
    {
      field: 'cnpj',
      header: 'CNPJ',
      type: 'custom',
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
    return 'Fornecedor';
  }

  protected override getEntityPluralName(): string {
    return 'Fornecedores';
  }

  protected override getExportFileName(): string {
    return 'fornecedores';
  }

  private configureTable(): void {
    this.tableConfig = createTableConfig({
      columns: this.tableColumns,
      globalFilterFields: ['id', 'nome', 'cnpj'],
      defaultSortField: 'nome',
      caption: 'Fornecedores',
      stateKey: 'fornecedor-list',
      // ...outras propriedades específicas...
    });

    this.columnsTable = this.tableConfig.columns.map(column => column.field);
    this.displayedColumns = [...this.columnsTable];
  }
}
