import {ChangeDetectionStrategy, Component, forwardRef, inject, OnInit} from '@angular/core';
import {PrimeCrudListComponent} from '../framework/component/prime-crud.list.component';
import {TableColumn} from '../framework/model/table-config.interface';
import {SolicitacaoCompra} from './solicitacaoCompra';
import {SolicitacaoCompraService} from './solicitacaoCompra.service';
import {PrimeTableSharedModule} from '../framework/module/prime-table-shared.module';
import {TableEmptyStateComponent} from '../framework/component/table-empty-state.component';
import {TableLoadingStateComponent} from '../framework/component/table-loading-state.component';
import {createTableConfig} from '../framework/utils/table-config.factory';

@Component({
    selector: 'app-list-solicitacao-compra',
    templateUrl: './solicitacaoCompra.list.component.html',
  imports: [
    PrimeTableSharedModule,
    TableEmptyStateComponent,
    TableLoadingStateComponent,
  ],
  providers: [{ provide: PrimeCrudListComponent, useExisting: forwardRef(() => SolicitacaoCompraListComponent) }],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SolicitacaoCompraListComponent extends PrimeCrudListComponent<SolicitacaoCompra, number> implements OnInit {
  protected override service = inject(SolicitacaoCompraService);
  protected override columnsTable = ['id', 'descricao', 'dataSolicitacao', 'usuarioNome', 'actions'];
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
      field: 'usuarioNome',
      header: 'Usuário',
      type: 'text',
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

    // isAlunoOrProfessor is now a computed signal from base class
    // Check permission and load appropriate data
    if (this.isAlunoOrProfessor()) {
      this.findAllByUsername();
    } else {
      this.findAll();
    }
  }

  private configureTable(): void {
    this.tableConfig = createTableConfig({
      columns: this.tableColumns,
      globalFilterFields: ['id', 'descricao', 'dataSolicitacao', 'usuarioNome'],
      defaultSortField: 'id',
      caption: 'Solicitações de Compra',
      stateKey: 'solicitacao-compra-list',
      // ...outras propriedades específicas...
    });

    this.columnsTable = this.tableConfig.columns.map(column => column.field);
    this.displayedColumns = [...this.columnsTable];
  }

  postFindAll(): void {
    // PrimeNG tables handle sorting and filtering through the table configuration
    // Custom sorting for nested properties is handled in the template
  }

}
