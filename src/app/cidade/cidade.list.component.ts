import {Component, forwardRef, Injector, ChangeDetectionStrategy} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {CidadeService} from './cidade.service';
import {Cidade} from './cidade';
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
import {TagModule} from 'primeng/tag';
import {PrimeCrudToolbarComponent} from '../framework/component/prime-crud-toolbar.component';
import {NovoModule} from '../geral/novo/novo.module';

@Component({
  selector: 'app-list-cidade',
  templateUrl: './cidade.list.component.html',
  styleUrls: ['./cidade.list.component.css'],
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
    TagModule,
    PrimeCrudToolbarComponent,
    NovoModule
  ],
  providers: [{ provide: PrimeCrudListComponent, useExisting: forwardRef(() => CidadeListComponent) }],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CidadeListComponent extends PrimeCrudListComponent<Cidade, number> {

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
      field: 'estado',
      header: 'Estado',
      type: 'text',
      sortable: true,
      filterable: true,
      minWidth: '14rem'
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

  constructor(protected cidadeService: CidadeService,
              protected injector: Injector) {
    super(cidadeService, injector, ['id', 'nome', 'estado', 'actions'], 'cidade/form');
    this.configureTable();
  }

  protected override getEntityName(): string {
    return 'Cidade';
  }

  protected override getEntityPluralName(): string {
    return 'Cidades';
  }

  protected override getExportFileName(): string {
    return 'cidades';
  }

  private configureTable(): void {
    this.tableConfig = {
      ...this.tableConfig,
      columns: this.tableColumns,
      globalFilterFields: ['id', 'nome'],
      defaultSortField: 'nome',
      defaultSortOrder: 1,
      caption: 'Lista de Cidades',
      trackByField: 'id',
      emptyMessage: 'Nenhuma cidade encontrada.',
      loadingMessage: 'Carregando cidades...',
      globalFilterPlaceholder: 'Buscar cidades...',
      columnToggle: true,
      expandable: false,
      expandMode: 'single',
      rowExpansionKey: 'id',
      stateful: true,
      stateKey: 'cidade-list',
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
