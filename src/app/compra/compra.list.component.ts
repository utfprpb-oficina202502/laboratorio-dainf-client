import {ChangeDetectionStrategy, Component, forwardRef, Injector, inject} from '@angular/core';
import {PrimeCrudListComponent} from '../framework/component/prime-crud.list.component';
import {Compra} from './compra';
import {CompraService} from './compra.service';
import {PrimeTableSharedModule} from '../framework/module/prime-table-shared.module';
import {TableEmptyStateComponent} from '../framework/component/table-empty-state.component';
import {TableLoadingStateComponent} from '../framework/component/table-loading-state.component';
import {createListComponentConfig} from '../framework/utils/table-config.factory';
import {MenuItem} from 'primeng/api';
import { SharedListComponentBase } from '../framework/component/shared-list-base.component';
import { ListComponentConfig } from '../framework/utils/table-config.factory';

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
export class CompraListComponent extends SharedListComponentBase<
  Compra,
  ListComponentConfig,
  CompraService
> {
  public static readonly listConfig = createListComponentConfig(
    [
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
      },
      {
        field: 'dataCompra',
        header: 'Data da Compra',
        type: 'date',
        sortable: true,
        filterable: true,
        width: '12rem',
        align: 'center'
      }
    ],
    ['fornecedorNomeFantasia', 'fornecedorRazaoSocial', 'dataCompra'],
    'dataCompra',
    'Compras',
    'compra-list'
  );

  contextMenuItems: MenuItem[] = [];
  columnsTable: string[] = [];
  urlForm = 'compra/form';

  constructor() {
    super({
      entityName: 'Compra',
      entityPluralName: 'Compras',
      exportFileName: 'compras',
      listConfig: CompraListComponent.listConfig,
      entityService: inject(CompraService),
      injector: inject(Injector)
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
}
