import {ChangeDetectionStrategy, Component, forwardRef, Injector, inject} from '@angular/core';
import {PrimeCrudListComponent} from '../framework/component/prime-crud.list.component';
import {SolicitacaoCompra} from './solicitacaoCompra';
import {SolicitacaoCompraService} from './solicitacaoCompra.service';
import {PrimeTableSharedModule} from '../framework/module/prime-table-shared.module';
import {TableEmptyStateComponent} from '../framework/component/table-empty-state.component';
import {TableLoadingStateComponent} from '../framework/component/table-loading-state.component';
import {createListComponentConfig, ListComponentConfig} from '../framework/utils/table-config.factory';
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
export class SolicitacaoCompraListComponent extends SharedListComponentBase<SolicitacaoCompra, ListComponentConfig, SolicitacaoCompraService> {
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

  columnsTable: string[] = [];
  contextMenuItems: MenuItem[] = [];
  readonly service = inject(SolicitacaoCompraService);
  urlForm = 'solicitacaoCompra/form';

  // Ensure required PrimeCrudListComponent properties are present for type compatibility
  protected readonly router = super['router'];
  protected readonly messageService = super['messageService'];
  protected readonly confirmationService = super['confirmationService'];
  protected readonly loaderService = super['loaderService'];

  constructor() {
    super({
      entityName: 'Solicitação de Compra',
      entityPluralName: 'Solicitações de Compra',
      exportFileName: 'solicitacoes-compra',
      listConfig: SolicitacaoCompraListComponent.prototype.listConfig,
      entityService: inject(SolicitacaoCompraService),
      injector: inject(Injector)
    });
    this.configureTable();
  }

  openOptions(_event: Event, solicitacaoCompra: SolicitacaoCompra): void {
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

}
