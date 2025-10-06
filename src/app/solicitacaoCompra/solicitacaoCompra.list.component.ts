import {ChangeDetectionStrategy, Component, forwardRef, inject, OnInit} from '@angular/core';
import {PrimeCrudListComponent} from '../framework/component/prime-crud.list.component';
import {TableColumn} from '../framework/model/table-config.interface';
import {SolicitacaoCompra} from './solicitacaoCompra';
import {SolicitacaoCompraService} from './solicitacaoCompra.service';
import {PrimeTableSharedModule} from '../framework/module/prime-table-shared.module';

@Component({
    selector: 'app-list-solicitacao-compra',
    templateUrl: './solicitacaoCompra.list.component.html',
    styleUrls: ['./solicitacaoCompra.list.component.css'],
  imports: [
    PrimeTableSharedModule,
  ],
  providers: [{ provide: PrimeCrudListComponent, useExisting: forwardRef(() => SolicitacaoCompraListComponent) }],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SolicitacaoCompraListComponent extends PrimeCrudListComponent<SolicitacaoCompra, number> implements OnInit {
  protected override service = inject(SolicitacaoCompraService);
  protected override columnsTable = ['id', 'descricao', 'dataSolicitacao', 'usuario', 'actions'];
  protected override urlForm = 'solicitacao-compra/form';

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
      minWidth: '20rem'
    },
    {
      field: 'dataSolicitacao',
      header: 'Data Solicitação',
      type: 'date',
      sortable: true,
      filterable: true,
      width: '14rem',
      align: 'center'
    },
    {
      field: 'usuario',
      header: 'Usuário',
      type: 'custom',
      sortable: true,
      filterable: true,
      minWidth: '16rem'
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
    return 'Solicitação de Compra';
  }

  protected override getEntityPluralName(): string {
    return 'Solicitações de Compra';
  }

  protected override getExportFileName(): string {
    return 'solicitacoes-compra';
  }

  ngOnInit(): void {
    super.ngOnInit();

    this.loginService.userLoggedIsAlunoOrProfessor().then(value => {
      this.isAlunoOrProfessor = value;
      if (this.isAlunoOrProfessor) {
        this.findAllByUsername();
      } else {
        this.findAll();
      }
    });
  }

  private configureTable(): void {
    this.tableConfig = {
      ...this.tableConfig,
      columns: this.tableColumns,
      globalFilterFields: ['id', 'descricao', 'dataSolicitacao'],
      defaultSortField: 'dataSolicitacao',
      defaultSortOrder: -1,
      caption: 'Lista de Solicitações de Compra',
      trackByField: 'id',
      emptyMessage: 'Nenhuma solicitação de compra encontrada.',
      loadingMessage: 'Carregando solicitações de compra...',
      globalFilterPlaceholder: 'Buscar solicitações de compra...',
      columnToggle: true,
      expandable: false,
      expandMode: 'single',
      rowExpansionKey: 'id',
      stateful: true,
      stateKey: 'solicitacao-compra-list-v2',
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

  postFindAll(): void {
    // PrimeNG tables handle sorting and filtering through the table configuration
    // Custom sorting for nested properties is handled in the template
  }

}
