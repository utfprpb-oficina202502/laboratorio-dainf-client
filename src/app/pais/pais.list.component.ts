import {Component, forwardRef, Injector, ChangeDetectionStrategy} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Pais} from './pais';
import {PaisService} from './pais.service';
import {PrimeCrudListComponent} from '../framework/component/prime-crud.list.component';
import {TableColumn} from '../framework/model/table-config.interface';

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
import {ActionButtonsComponent} from '../framework/component/action-buttons.component';

@Component({
  selector: 'app-list-pais',
  templateUrl: './pais.list.component.html',
  styleUrls: ['./pais.list.component.css'],
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
    ActionButtonsComponent
  ],
  providers: [{ provide: PrimeCrudListComponent, useExisting: forwardRef(() => PaisListComponent) }],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaisListComponent extends PrimeCrudListComponent<Pais, number> {

  private readonly tableColumns: TableColumn[] = [
    {
      field: 'id',
      header: 'Codigo',
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
      header: 'Opcoes',
      type: 'custom',
      sortable: false,
      filterable: false,
      exportable: false,
      align: 'center',
      width: '10rem',
      toggleable: false
    }
  ];

  constructor(protected paisService: PaisService,
              protected injector: Injector) {
    super(paisService, injector, ['id', 'nome', 'sigla', 'actions'], 'pais/form');
    this.configureTable();
  }

  protected override getEntityName(): string {
    return 'Pais';
  }

  protected override getEntityPluralName(): string {
    return 'Paises';
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
      caption: 'Lista de Paises',
      trackByField: 'id',
      emptyMessage: 'Nenhum pais encontrado.',
      loadingMessage: 'Carregando paises...',
      globalFilterPlaceholder: 'Buscar paises...',
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
