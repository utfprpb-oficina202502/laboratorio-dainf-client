import {ChangeDetectionStrategy, Component, forwardRef, inject} from '@angular/core';
import {Pais} from './pais';
import {PaisService} from './pais.service';
import {PrimeCrudListComponent} from '../framework/component/prime-crud.list.component';
import {TableColumn} from '../framework/model/table-config.interface';
import {PrimeTableSharedModule} from '../framework/module/prime-table-shared.module';
import {
  TableDefaultTemplatesComponent
} from '../framework/component/table-default-templates.component';

@Component({
  selector: 'app-list-pais',
  templateUrl: './pais.list.component.html',
  styleUrls: ['./pais.list.component.css'],
  imports: [
    PrimeTableSharedModule,
    TableDefaultTemplatesComponent,
  ],
  providers: [{ provide: PrimeCrudListComponent, useExisting: forwardRef(() => PaisListComponent) }],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaisListComponent extends PrimeCrudListComponent<Pais, number> {
  protected override service = inject(PaisService);
  protected override columnsTable = ['id', 'nome', 'sigla', 'actions'];
  protected override urlForm = 'pais/form';

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
      field: 'nome',
      header: 'Nome',
      type: 'text',
      sortable: true,
      filterable: true,
      minWidth: '16rem'
    },
    {
      field: 'sigla',
      header: 'Sigla',
      type: 'text',
      sortable: true,
      filterable: true,
      width: '10rem'
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
    return 'País';
  }

  protected override getEntityPluralName(): string {
    return 'Países';
  }

  protected override getExportFileName(): string {
    return 'paises';
  }

  private configureTable(): void {
    this.tableConfig = {
      ...this.tableConfig,
      columns: this.tableColumns,
      globalFilterFields: ['id', 'nome', 'sigla'],
      defaultSortField: 'nome',
      defaultSortOrder: 1,
      caption: 'Lista de Países',
      trackByField: 'id',
      emptyMessage: 'Nenhum país encontrado.',
      loadingMessage: 'Carregando países...',
      globalFilterPlaceholder: 'Buscar países...',
      columnToggle: true,
      expandable: false,
      stateful: true,
      stateKey: 'pais-list',
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

  protected readonly KeyboardEvent = KeyboardEvent;
}
