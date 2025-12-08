import {ChangeDetectionStrategy, Component, forwardRef, Injector} from '@angular/core';
import {PrimeCrudListComponent} from '../framework/component/prime-crud.list.component';
import {SolicitacaoCompra} from './solicitacaoCompra';
import {SolicitacaoCompraService} from './solicitacaoCompra.service';
import {PrimeTableSharedModule} from '../framework/module/prime-table-shared.module';
import {TableEmptyStateComponent} from '../framework/component/table-empty-state.component';
import {TableLoadingStateComponent} from '../framework/component/table-loading-state.component';
import {createTableConfig, createListComponentConfig, createIdColumn, createActionsColumn} from '../framework/utils/table-config.factory';
import {MenuItem} from 'primeng/api';
import { SharedListComponentBase } from '../framework/component/shared-list-base.component';

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
export class SolicitacaoCompraListComponent extends SharedListComponentBase<SolicitacaoCompra, number> {
  public readonly listConfig = createListComponentConfig(
    [
      {
        field: 'descricao',
        header: 'Descrição',
        type: 'text',
        sortable: true,
        filterable: true,
        minWidth: '20rem'
      },
      {
        field: 'status',
        header: 'Status',
        type: 'custom',
        sortable: true,
        filterable: true,
        width: '10rem',
        align: 'center'
      },
      {
        field: 'dataSolicitacao',
        header: 'Data Solicitação',
        type: 'date',
        sortable: true,
        filterable: true,
        width: '12rem',
        align: 'center'
      }
    ],
    ['descricao', 'status', 'dataSolicitacao'],
    'descricao',
    'Solicitações de Compra',
    'solicitacao-compra-list'
  );

  contextMenuItems: MenuItem[] = [];
  service = new SolicitacaoCompraService(); // Replace with DI as needed
  columnsTable: string[] = [];
  urlForm = 'solicitacaoCompra/form';

  constructor() {
    super({
      entityName: 'Solicitação de Compra',
      entityPluralName: 'Solicitações de Compra',
      exportFileName: 'solicitacoes-compra',
      listConfig: createListComponentConfig(
        [
          {
            field: 'descricao',
            header: 'Descrição',
            type: 'text',
            sortable: true,
            filterable: true,
            minWidth: '20rem'
          },
          {
            field: 'status',
            header: 'Status',
            type: 'custom',
            sortable: true,
            filterable: true,
            width: '10rem',
            align: 'center'
          },
          {
            field: 'dataSolicitacao',
            header: 'Data Solicitação',
            type: 'date',
            sortable: true,
            filterable: true,
            width: '12rem',
            align: 'center'
          }
        ],
        ['descricao', 'status', 'dataSolicitacao'],
        'descricao',
        'Solicitações de Compra',
        'solicitacao-compra-list'
      ),
      entityService: new SolicitacaoCompraService(),
      injector: Injector as any // Replace with actual injector if needed
    });
    this.configureTable();
  }

  openOptions(event: Event, solicitacaoCompra: SolicitacaoCompra): void {
    this.contextMenuItems = [
      {
        label: 'Editar',
        icon: 'pi pi-pencil',
        command: () => this.edit(solicitacaoCompra.id)
      },
      {
        label: 'Remover',
        icon: 'pi pi-trash',
        command: () => this.delete(solicitacaoCompra.id)
      }
    ];
    const menu = this.actionsMenu?.();
    if (menu && typeof menu.toggle === 'function') {
      menu.toggle(event);
    }
  }

  onKeyDown(event: KeyboardEvent, solicitacaoCompra: SolicitacaoCompra): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.openOptions(event, solicitacaoCompra);
    }
  }

  edit(_id: number): void {
    // Implement edit logic or call base method
  }

  delete(_id: number): void {
    // Implement delete logic or call base method
  }

  public configureTable(): void {
    const tableColumns = [createIdColumn(), ...this.listConfig.entityColumns, createActionsColumn()];
    this.tableConfig = createTableConfig({
      columns: tableColumns,
      globalFilterFields: this.listConfig.globalFilterFields,
      defaultSortField: this.listConfig.defaultSortField,
      caption: this.listConfig.caption,
      stateKey: this.listConfig.stateKey,
      // ...outras propriedades específicas...
    });
    this.columnsTable = this.tableConfig.columns.map((column: any) => column.field);
    this.displayedColumns = [...this.columnsTable];
  }
}
