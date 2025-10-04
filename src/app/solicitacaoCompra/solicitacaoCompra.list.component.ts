import {
  ChangeDetectionStrategy,
  Component,
  forwardRef,
  inject,
  Injector,
  OnInit
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {PrimeCrudListComponent} from '../framework/component/prime-crud.list.component';
import {TableColumn} from '../framework/model/table-config.interface';
import {SolicitacaoCompra} from './solicitacaoCompra';
import {SolicitacaoCompraService} from './solicitacaoCompra.service';

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
    selector: 'app-list-solicitacao-compra',
    templateUrl: './solicitacaoCompra.list.component.html',
    styleUrls: ['./solicitacaoCompra.list.component.css'],
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
    ActionButtonsComponent,
  ],
  providers: [{ provide: PrimeCrudListComponent, useExisting: forwardRef(() => SolicitacaoCompraListComponent) }],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SolicitacaoCompraListComponent extends PrimeCrudListComponent<SolicitacaoCompra, number> implements OnInit {
  protected solicitacaoCompraService: SolicitacaoCompraService;
  protected injector: Injector;

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
      width: '12rem',
      align: 'center'
    }
  ];

  constructor() {
    const solicitacaoCompraService = inject(SolicitacaoCompraService);
    const injector = inject(Injector);

    super(solicitacaoCompraService, injector, ['id', 'descricao', 'dataSolicitacao', 'usuario', 'actions'], 'solicitacao-compra/form');
    this.solicitacaoCompraService = solicitacaoCompraService;
    this.injector = injector;

    this.bottomSheetEnabled = false;
    this.hostListenerColumnEnable = false;
    this.configureTable();
  }

  protected override getEntityName(): string {
    return 'Solicitacao de Compra';
  }

  protected override getEntityPluralName(): string {
    return 'Solicitacoes de Compra';
  }

  protected override getExportFileName(): string {
    return 'solicitacoes-compra';
  }

  private configureTable(): void {
    this.tableConfig = {
      ...this.tableConfig,
      columns: this.tableColumns,
      globalFilterFields: ['id', 'descricao', 'dataSolicitacao'],
      defaultSortField: 'dataSolicitacao',
      defaultSortOrder: -1,
      caption: 'Lista de Solicitacoes de Compra',
      trackByField: 'id',
      emptyMessage: 'Nenhuma solicitacao de compra encontrada.',
      loadingMessage: 'Carregando solicitacoes de compra...',
      globalFilterPlaceholder: 'Buscar solicitacoes de compra...',
      columnToggle: true,
      expandable: false,
      expandMode: 'single',
      rowExpansionKey: 'id',
      stateful: true,
      stateKey: 'solicitacao-compra-list',
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

  ngOnInit(): void {
    this.loginService.userLoggedIsAlunoOrProfessor().then(value => {
      this.isAlunoOrProfessor = value;
      this.isAlunoOrProfessor ? this.findAllByUsername() : this.findAll();
    });
  }

  postFindAll(): void {
    // PrimeNG tables handle sorting and filtering through the table configuration
    // Custom sorting for nested properties is handled in the template
  }

}
