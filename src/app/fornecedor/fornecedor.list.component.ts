import {Component, forwardRef, Injector} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {PrimeCrudListComponent} from '../framework/component/prime-crud.list.component';
import {TableColumn} from '../framework/model/table-config.interface';
import {Fornecedor} from './fornecedor';
import {FornecedorService} from './fornecedor.service';

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
import {PrimeCrudToolbarComponent} from '../framework/component/prime-crud-toolbar.component';
import {NovoModule} from '../geral/novo/novo.module';
import {CpfCnpjPipeModule} from "../framework/pipe/cpfCnpj/cpfCnpj.pipe.module";

@Component({
    selector: 'app-list-fornecedor',
    templateUrl: './fornecedor.list.component.html',
    styleUrls: ['./fornecedor.list.component.css'],
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
    PrimeCrudToolbarComponent,
    NovoModule,
    CpfCnpjPipeModule
  ],
  providers: [{ provide: PrimeCrudListComponent, useExisting: forwardRef(() => FornecedorListComponent) }]
})
export class FornecedorListComponent extends PrimeCrudListComponent<Fornecedor, number> {

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
      width: '12rem',
      align: 'center'
    }
  ];

  constructor(protected fornecedorService: FornecedorService,
              protected injector: Injector) {
    super(fornecedorService, injector, ['id', 'razaoSocial', 'nomeFantasia', 'cnpj', 'actions'], 'fornecedor/form');
    this.bottomSheetEnabled = false;
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
    this.tableConfig = {
      ...this.tableConfig,
      columns: this.tableColumns,
      globalFilterFields: ['id', 'razaoSocial', 'nomeFantasia', 'cnpj'],
      defaultSortField: 'razaoSocial',
      defaultSortOrder: 1,
      caption: 'Lista de Fornecedores',
      trackByField: 'id',
      emptyMessage: 'Nenhum fornecedor encontrado.',
      loadingMessage: 'Carregando fornecedores...',
      globalFilterPlaceholder: 'Buscar fornecedores...',
      columnToggle: true,
      expandable: false,
      expandMode: 'single',
      rowExpansionKey: 'id',
      stateful: true,
      stateKey: 'fornecedor-list',
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
}
