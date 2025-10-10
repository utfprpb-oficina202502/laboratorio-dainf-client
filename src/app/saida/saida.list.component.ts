import {ChangeDetectionStrategy, Component, forwardRef, inject} from '@angular/core';
import {PrimeCrudListComponent} from '../framework/component/prime-crud.list.component';
import {TableColumn} from '../framework/model/table-config.interface';
import {Saida} from './saida';
import {SaidaService} from './saida.service';
import {SaidaItem} from './saidaItem';
import {PrimeTableSharedModule} from '../framework/module/prime-table-shared.module';
import {ConfirmDialogModule} from 'primeng/confirmdialog';

@Component({
    selector: 'app-list-saida',
    templateUrl: './saida.list.component.html',
    styleUrls: ['./saida.list.component.css'],
  imports: [
    PrimeTableSharedModule,
    ConfirmDialogModule,
  ],
  providers: [{ provide: PrimeCrudListComponent, useExisting: forwardRef(() => SaidaListComponent) }],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SaidaListComponent extends PrimeCrudListComponent<Saida, number> {
  protected override service = inject(SaidaService);
  protected override columnsTable = ['id', 'dataSaida', 'qtde', 'usuarioResponsavel', 'observacao', 'actions'];
  protected override urlForm = 'saida/form';

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
      field: 'dataSaida',
      header: 'Data Saída',
      type: 'date',
      sortable: true,
      filterable: true,
      width: '12rem',
      align: 'center'
    },
    {
      field: 'qtde',
      header: 'Quantidade',
      type: 'custom',
      sortable: false,
      filterable: false,
      width: '10rem',
      align: 'center'
    },
    {
      field: 'usuarioResponsavel',
      header: 'Usuário Responsável',
      type: 'custom',
      sortable: true,
      filterable: true,
      minWidth: '16rem'
    },
    {
      field: 'observacao',
      header: 'Observação',
      type: 'text',
      sortable: true,
      filterable: true,
      minWidth: '20rem'
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

    this.configureTable();
  }

  protected override getEntityName(): string {
    return 'Saída';
  }

  protected override getEntityPluralName(): string {
    return 'Saídas';
  }

  protected override getExportFileName(): string {
    return 'saidas';
  }

  private configureTable(): void {
    this.tableConfig = {
      ...this.tableConfig,
      columns: this.tableColumns,
      globalFilterFields: ['id', 'dataSaida', 'usuarioResponsavel', 'observacao'],
      defaultSortField: 'dataSaida',
      defaultSortOrder: -1,
      caption: 'Lista de Saídas',
      trackByField: 'id',
      emptyMessage: 'Nenhuma saída encontrada.',
      loadingMessage: 'Carregando saídas...',
      globalFilterPlaceholder: 'Buscar saídas...',
      columnToggle: true,
      expandable: false,
      expandMode: 'single',
      rowExpansionKey: 'id',
      stateful: true,
      stateKey: 'saida-list-v2',
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

  getQtdeTotal(saidaItem: SaidaItem[]) {
    return saidaItem.map(t => t.qtde).reduce((acc, value) => Number(acc) + Number(value), 0);
  }

  preDelete(saida: Saida) {
    if (saida.idEmprestimo) {
      this.messageService.add({
        severity: 'info',
        summary: 'Atenção!',
        detail: 'Não é possível remover um registro originado através de uma devolução.',
        life: 4000
      });
    } else {
      this.delete(saida.id);
    }
  }

}
