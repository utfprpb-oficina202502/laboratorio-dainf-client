import {ChangeDetectionStrategy, Component, forwardRef, inject, viewChild} from '@angular/core';
import {PrimeCrudListComponent} from '../framework/component/prime-crud.list.component';
import {TableColumn} from '../framework/model/table-config.interface';
import {Fornecedor} from './fornecedor';
import {FornecedorService} from './fornecedor.service';
import {PrimeTableSharedModule} from '../framework/module/prime-table-shared.module';
import {TableEmptyStateComponent} from '../framework/component/table-empty-state.component';
import {TableLoadingStateComponent} from '../framework/component/table-loading-state.component';
import {CpfCnpjPipe} from "../framework/pipe/cpfCnpj/cpfCnpj.pipe";
import {createTableConfig} from '../framework/utils/table-config.factory';
import {MenuItem} from 'primeng/api';
import {Popover} from 'primeng/popover';

@Component({
    selector: 'app-list-fornecedor',
    templateUrl: './fornecedor.list.component.html',
    styleUrls: ['./fornecedor.list.component.css'],
  imports: [
    PrimeTableSharedModule,
    TableEmptyStateComponent,
    TableLoadingStateComponent,
    CpfCnpjPipe,
  ],
  providers: [{ provide: PrimeCrudListComponent, useExisting: forwardRef(() => FornecedorListComponent) }],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FornecedorListComponent extends PrimeCrudListComponent<Fornecedor, number> {
  protected override service = inject(FornecedorService);
  protected override columnsTable = ['id', 'razaoSocial', 'nomeFantasia', 'cnpj', 'actions'];
  protected override urlForm = 'fornecedor/form';

  readonly actionsMenu = viewChild.required<Popover>('actionsMenu');
  contextMenuItems: MenuItem[] = [];

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

  openOptions(event: Event, fornecedor: Fornecedor): void {
    this.contextMenuItems = [];

    this.contextMenuItems.push({
      label: 'Editar',
      icon: 'pi pi-pencil',
      command: () => this.edit(fornecedor.id)
    });
    this.contextMenuItems.push({
      label: 'Remover',
      icon: 'pi pi-trash',
      command: () => this.delete(fornecedor.id)
    });

    this.actionsMenu().toggle(event);
  }

  onKeyDown(event: KeyboardEvent, fornecedor: Fornecedor): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.openOptions(event, fornecedor);
    }
  }

  private configureTable(): void {
    this.tableConfig = createTableConfig({
      columns: this.tableColumns,
      globalFilterFields: ['id', 'razaoSocial', 'nomeFantasia', 'cnpj'],
      defaultSortField: 'razaoSocial',
      caption: 'Fornecedores',
      stateKey: 'fornecedor-list',
      // ...outras propriedades específicas...
    });

    this.columnsTable = this.tableConfig.columns.map(column => column.field);
    this.displayedColumns = [...this.columnsTable];
  }
}
