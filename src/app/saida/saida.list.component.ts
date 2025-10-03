import {Component, forwardRef, Injector, ChangeDetectionStrategy} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {PrimeCrudListComponent} from '../framework/component/prime-crud.list.component';
import {TableColumn} from '../framework/model/table-config.interface';
import {Saida} from './saida';
import {SaidaService} from './saida.service';
import {SaidaItem} from './saidaItem';
import Swal from 'sweetalert2';

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
import {ConfirmDialogModule} from 'primeng/confirmdialog';
import {PrimeCrudToolbarComponent} from '../framework/component/prime-crud-toolbar.component';
import {ActionButtonsComponent} from '../framework/component/action-buttons.component';

@Component({
    selector: 'app-list-saida',
    templateUrl: './saida.list.component.html',
    styleUrls: ['./saida.list.component.css'],
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
    ConfirmDialogModule,
    PrimeCrudToolbarComponent,
    ActionButtonsComponent
  ],
  providers: [{ provide: PrimeCrudListComponent, useExisting: forwardRef(() => SaidaListComponent) }],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SaidaListComponent extends PrimeCrudListComponent<Saida, number> {

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
      width: '12rem',
      align: 'center'
    }
  ];

  constructor(protected saidaService: SaidaService,
              protected injector: Injector) {
    super(saidaService, injector, ['id', 'dataSaida', 'qtde', 'usuarioResponsavel', 'observacao', 'actions'], 'saida/form');
    this.configureTable();
  }

  protected override getEntityName(): string {
    return 'Saida';
  }

  protected override getEntityPluralName(): string {
    return 'Saidas';
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
      caption: 'Lista de Saidas',
      trackByField: 'id',
      emptyMessage: 'Nenhuma saida encontrada.',
      loadingMessage: 'Carregando saidas...',
      globalFilterPlaceholder: 'Buscar saidas...',
      columnToggle: true,
      expandable: false,
      expandMode: 'single',
      rowExpansionKey: 'id',
      stateful: true,
      stateKey: 'saida-list',
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
      Swal.fire('Atenção!', 'Não é possível remover um registro originado através de uma devolução.', 'info');
    } else {
      this.delete(saida.id);
    }
  }

}
