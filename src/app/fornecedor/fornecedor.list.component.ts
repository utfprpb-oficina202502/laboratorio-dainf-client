import {ChangeDetectionStrategy, Component, forwardRef, inject, Injector} from '@angular/core';
import {PrimeCrudListComponent} from '../framework/component/prime-crud.list.component';
import {Fornecedor} from './fornecedor';
import {FornecedorService} from './fornecedor.service';
import {PrimeTableSharedModule} from '../framework/module/prime-table-shared.module';
import {TableEmptyStateComponent} from '../framework/component/table-empty-state.component';
import {TableLoadingStateComponent} from '../framework/component/table-loading-state.component';
import {CpfCnpjPipe} from "../framework/pipe/cpfCnpj/cpfCnpj.pipe";
import {
  createListComponentConfig,
  ListComponentConfig
} from '../framework/utils/table-config.factory';
import {MenuItem} from 'primeng/api';
import {SharedListComponentBase} from '../framework/component/shared-list-base.component';

@Component({
    selector: 'app-list-fornecedor',
    templateUrl: './fornecedor.list.component.html',
    styleUrls: ['./fornecedor.list.component.css'],
  imports: [
    PrimeTableSharedModule,
    TableEmptyStateComponent,
    TableLoadingStateComponent,
    CpfCnpjPipe,
  ],
  providers: [{ provide: PrimeCrudListComponent, useExisting: forwardRef(() => FornecedorListComponent) }],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FornecedorListComponent extends SharedListComponentBase<Fornecedor, ListComponentConfig, FornecedorService> {
  public readonly listConfig = createListComponentConfig(
    [
      {
        field: 'razaoSocial',
        header: 'Razão Social',
        type: 'text',
        sortable: true,
        filterable: true,
        minWidth: '20rem'
      },
      {
        field: 'nomeFantasia',
        header: 'Nome Fantasia',
        type: 'text',
        sortable: true,
        filterable: true,
        minWidth: '18rem'
      },
      {
        field: 'cnpj',
        header: 'CNPJ',
        type: 'custom',
        sortable: true,
        filterable: true,
        width: '14rem',
        align: 'center'
      }
    ],
    ['razaoSocial', 'nomeFantasia', 'cnpj'],
    'razaoSocial',
    'Fornecedores',
    'fornecedor-list'
  );

  contextMenuItems: MenuItem[] = [];
  readonly service = inject(FornecedorService);
  columnsTable: string[] = [];
  urlForm = 'fornecedor/form';

  constructor() {
    super({
      entityName: 'Fornecedor',
      entityPluralName: 'Fornecedores',
      exportFileName: 'fornecedores',
      listConfig: FornecedorListComponent.prototype.listConfig,
      entityService: inject(FornecedorService),
      injector: inject(Injector)
    });
    this.configureTable();
  }

  openOptions(event: Event, fornecedor: Fornecedor): void {
    this.contextMenuItems = [
      {
        label: 'Editar',
        icon: 'pi pi-pencil',
        command: () => this.edit(fornecedor.id)
      },
      {
        label: 'Remover',
        icon: 'pi pi-trash',
        command: () => this.delete(fornecedor.id)
      }
    ];
    const menu = this.actionsMenu?.();
    if (menu && typeof menu.toggle === 'function') {
      menu.toggle(event);
    }
  }

  onKeyDown(event: KeyboardEvent, fornecedor: Fornecedor): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.openOptions(event, fornecedor);
    }
  }

}
