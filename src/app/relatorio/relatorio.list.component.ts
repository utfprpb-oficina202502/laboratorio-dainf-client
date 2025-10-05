import {ChangeDetectionStrategy, Component, forwardRef, inject} from '@angular/core';
import {PrimeCrudListComponent} from '../framework/component/prime-crud.list.component';
import {TableColumn} from '../framework/model/table-config.interface';
import {Relatorio} from './relatorio';
import {RelatorioService} from './relatorio.service';
import {NgClass, NgTemplateOutlet} from "@angular/common";
import {Button} from "primeng/button";
import {TableModule} from "primeng/table";
import {Card} from "primeng/card";
import {PrimeCrudToolbarComponent} from "../framework/component/prime-crud-toolbar.component";
import {ActionButtonsComponent} from '../framework/component/action-buttons.component';
import {InputIconModule} from "primeng/inputicon";
import {IconFieldModule} from "primeng/iconfield";
import {InputTextModule} from "primeng/inputtext";

@Component({
  selector: 'app-list-relatorio',
  templateUrl: './relatorio.list.component.html',
  styleUrls: ['./relatorio.list.component.css'],
  providers: [{
    provide: PrimeCrudListComponent,
    useExisting: forwardRef(() => RelatorioListComponent)
  }],
  imports: [
    NgTemplateOutlet,
    Button,
    TableModule,
    NgClass,
    Card,
    PrimeCrudToolbarComponent,
    ActionButtonsComponent,
    InputIconModule,
    IconFieldModule,
    InputTextModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RelatorioListComponent extends PrimeCrudListComponent<Relatorio, number> {
  protected override service = inject(RelatorioService);
  protected override columnsTable = ['id', 'nome', 'actions'];
  protected override urlForm = 'relatorio/form';

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

    this.hostListenerColumnEnable = false;
    this.configureTable();
  }

  protected override getEntityName(): string {
    return 'Relatório';
  }

  protected override getEntityPluralName(): string {
    return 'Relatórios';
  }

  protected override getExportFileName(): string {
    return 'relatorios';
  }

  private configureTable(): void {
    this.tableConfig = {
      ...this.tableConfig,
      columns: this.tableColumns,
      globalFilterFields: ['id', 'nome'],
      defaultSortField: 'nome',
      defaultSortOrder: 1,
      caption: 'Lista de Relatórios',
      trackByField: 'id',
      emptyMessage: 'Nenhum relatório encontrado.',
      loadingMessage: 'Carregando relatórios...',
      globalFilterPlaceholder: 'Buscar relatórios...',
      columnToggle: true,
      expandable: false,
      expandMode: 'single',
      rowExpansionKey: 'id',
      stateful: true,
      stateKey: 'relatorio-list-v2',
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

  generateReport(id: number): void {
    this.loaderService.show();
    this.router.navigate(['relatorio/view', id]);
  }

  postFindAll(): void {
    // PrimeNG tables handle sorting and filtering through the table configuration
    // Custom sorting for nested properties is handled in the template
  }
}
