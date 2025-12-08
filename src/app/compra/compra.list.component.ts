import {ChangeDetectionStrategy, Component, forwardRef, Injector} from '@angular/core';
import {PrimeCrudListComponent} from '../framework/component/prime-crud.list.component';
import {Compra} from './compra';
import {CompraService} from './compra.service';
import {PrimeTableSharedModule} from '../framework/module/prime-table-shared.module';
import {TableEmptyStateComponent} from '../framework/component/table-empty-state.component';
import {TableLoadingStateComponent} from '../framework/component/table-loading-state.component';
import {createTableConfig, createListComponentConfig} from '../framework/utils/table-config.factory';
import {MenuItem} from 'primeng/api';
import { SharedListComponentBase } from '../framework/component/shared-list-base.component';

@Component({
    selector: 'app-list-compra',
    templateUrl: './compra.list.component.html',
    styleUrls: ['./compra.list.component.css'],
  imports: [
    PrimeTableSharedModule,
    TableEmptyStateComponent,
    TableLoadingStateComponent,
  ],
  providers: [{ provide: PrimeCrudListComponent, useExisting: forwardRef(() => CompraListComponent) }],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CompraListComponent extends SharedListComponentBase<Compra, number> {
  public readonly listConfig = createListComponentConfig(
    [
      // Não inclua 'id' nem 'actions' aqui, o base já adiciona
      {
        field: 'dataCompra',
        header: 'Data da Compra',
        type: 'date',
        sortable: true,
        filterable: true,
        width: '12rem',
        align: 'center'
      },
      {
        field: 'fornecedorNomeFantasia',
        header: 'Fornecedor',
        type: 'text',
        sortable: true,
        filterable: true,
        minWidth: '16rem'
      },
      {
        field: 'fornecedorRazaoSocial',
        header: 'Razão Social',
        type: 'text',
        sortable: true,
        filterable: true,
        minWidth: '16rem'
      }
    ],
    ['dataCompra', 'fornecedorNomeFantasia', 'fornecedorRazaoSocial'],
    'dataCompra',
    'Compras',
    'compra-list'
  );

  contextMenuItems: MenuItem[] = [];
  service = new CompraService(); // Replace with DI as needed
  columnsTable: string[] = [];
  urlForm = 'compra/form';

  constructor() {
    super({
      entityName: 'Compra',
      entityPluralName: 'Compras',
      exportFileName: 'compras',
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
            field: 'valor',
            header: 'Valor',
            type: 'currency',
            sortable: true,
            filterable: true,
            width: '10rem',
            align: 'right'
          },
          {
            field: 'data',
            header: 'Data',
            type: 'date',
            sortable: true,
            filterable: true,
            width: '12rem',
            align: 'center'
          }
        ],
        ['descricao', 'valor', 'data'],
        'descricao',
        'Compras',
        'compra-list'
      ),
      entityService: new CompraService(),
      injector: Injector as any // Replace with actual injector if needed
    });
    this.configureTable();
  }

  openOptions(event: Event, compra: Compra): void {
    this.contextMenuItems = [
      {
        label: 'Editar',
        icon: 'pi pi-pencil',
        command: () => this.edit(compra.id)
      },
      {
        label: 'Remover',
        icon: 'pi pi-trash',
        command: () => this.delete(compra.id)
      }
    ];
    const menu = this.actionsMenu?.();
    if (menu && typeof menu.toggle === 'function') {
      menu.toggle(event);
    }
  }

  onKeyDown(event: KeyboardEvent, compra: Compra): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.openOptions(event, compra);
    }
  }

  edit(_id: number): void {
    // Implement edit logic or call base method
  }

  delete(_id: number): void {
    // Implement delete logic or call base method
  }

  public configureTable(): void {
    // Garante que 'id' e 'actions' estejam presentes
    let columns = [...this.listConfig.entityColumns];
    columns = columns.filter(col => col.field !== 'id' && col.field !== 'actions');
    columns.unshift({
      field: 'id',
      header: 'Código',
      type: 'number',
      sortable: true,
      filterable: true,
      width: '6rem',
      align: 'center'
    });
    columns.push({
      field: 'actions',
      header: 'Opções',
      type: 'custom',
      sortable: false,
      filterable: false,
      exportable: false,
      align: 'center',
      width: '10rem',
      toggleable: false
    });
    this.tableConfig = createTableConfig({
      columns,
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
