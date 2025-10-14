import {ChangeDetectionStrategy, Component, forwardRef, inject} from '@angular/core';
import {Grupo} from './grupo';
import {GrupoService} from './grupo.service';
import {PrimeCrudListComponent} from '../framework/component/prime-crud.list.component';
import {TableColumn} from '../framework/model/table-config.interface';
import {PrimeTableSharedModule} from '../framework/module/prime-table-shared.module';
import {
  TableDefaultTemplatesComponent
} from '../framework/component/table-default-templates.component';

@Component({
    selector: 'app-list-grupo',
    templateUrl: './grupo.list.component.html',
    styleUrls: ['./grupo.list.component.css'],
  imports: [
    PrimeTableSharedModule,
    TableDefaultTemplatesComponent,
  ],
  providers: [{ provide: PrimeCrudListComponent, useExisting: forwardRef(() => GrupoListComponent) }],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GrupoListComponent extends PrimeCrudListComponent<Grupo, number> {
  protected override service = inject(GrupoService);
  protected override columnsTable = ['id', 'descricao', 'actions'];
  protected override urlForm = 'grupo/form';

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
      field: 'actions',
      header: 'Opções',
      type: 'custom',
      sortable: false,
      filterable: false,
      exportable: false,
      align: 'center',
      width: '10rem',
      toggleable: false
    }
  ];

  constructor() {
    super();

    this.configureTable();
  }

  protected override getEntityName(): string {
    return 'Grupo';
  }

  protected override getEntityPluralName(): string {
    return 'Grupos';
  }

  // Override export filename for grupos
  protected override getExportFileName(): string {
    return 'grupos';
  }

  private configureTable(): void {
    this.tableConfig = {
      ...this.tableConfig,
      columns: this.tableColumns,
      globalFilterFields: ['id', 'descricao'],
      defaultSortField: 'descricao',
      defaultSortOrder: 1,
      caption: 'Lista de Grupos',
      trackByField: 'id',
      emptyMessage: 'Nenhum grupo encontrado.',
      loadingMessage: 'Carregando grupos...',
      globalFilterPlaceholder: 'Buscar grupos...',
      columnToggle: true,
      expandable: false,
      expandMode: 'single',
      rowExpansionKey: 'id',
      stateful: true,
      stateKey: 'grupo-list',
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
      lazyLoadOnInit: false,
      preloadData: true,
      keyboardShortcuts: true
    };

    this.columnsTable = this.tableConfig.columns.map(column => column.field);
    this.displayedColumns = [...this.columnsTable];
  }
}

