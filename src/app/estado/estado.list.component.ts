import {Component, forwardRef, Injector, ChangeDetectionStrategy} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Estado} from './estado';
import {EstadoService} from './estado.service';
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
import {NovoModule} from '../geral/novo/novo.module';

@Component({
  selector: 'app-list-estado',
  templateUrl: './estado.list.component.html',
  styleUrls: ['./estado.list.component.css'],
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
    NovoModule
  ],
  providers: [{ provide: PrimeCrudListComponent, useExisting: forwardRef(() => EstadoListComponent) }],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EstadoListComponent extends PrimeCrudListComponent<Estado, number> {

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
      minWidth: '14rem'
    },
    {
      field: 'uf',
      header: 'UF',
      type: 'text',
      sortable: true,
      filterable: true,
      width: '8rem',
      align: 'center'
    },
    {
      field: 'pais',
      header: 'Pais',
      type: 'text',
      sortable: true,
      filterable: true,
      minWidth: '12rem'
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

  constructor(protected estadoService: EstadoService,
              protected injector: Injector) {
    super(estadoService, injector, ['id', 'nome', 'uf', 'pais', 'actions'], 'estado/form');
    this.configureTable();
  }

  protected override getEntityName(): string {
    return 'Estado';
  }

  protected override getEntityPluralName(): string {
    return 'Estados';
  }

  protected override getExportFileName(): string {
    return 'estados';
  }

  private configureTable(): void {
    this.tableConfig = {
      ...this.tableConfig,
      columns: this.tableColumns,
      globalFilterFields: ['id', 'nome', 'uf'],
      defaultSortField: 'nome',
      defaultSortOrder: 1,
      caption: 'Lista de Estados',
      trackByField: 'id',
      emptyMessage: 'Nenhum estado encontrado.',
      loadingMessage: 'Carregando estados...',
      globalFilterPlaceholder: 'Buscar estados...',
      columnToggle: true,
      expandable: false,
      expandMode: 'single',
      rowExpansionKey: 'id',
      stateful: true,
      stateKey: 'estado-list',
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
