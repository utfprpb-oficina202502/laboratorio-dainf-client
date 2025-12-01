import {ChangeDetectionStrategy, Component, forwardRef, inject} from '@angular/core';
import {Usuario} from './usuario';
import {UsuarioService} from './usuario.service';
import {PrimeCrudListComponent} from '../framework/component/prime-crud.list.component';
import {TableColumn} from '../framework/model/table-config.interface';
import {Permissao} from './permissao';
import {PrimeTableSharedModule} from '../framework/module/prime-table-shared.module';
import {TableEmptyStateComponent} from '../framework/component/table-empty-state.component';
import {TableLoadingStateComponent} from '../framework/component/table-loading-state.component';
import {createTableConfig} from '../framework/utils/table-config.factory';
import {formatRoles} from '../framework/constants/roles';

@Component({
    selector: 'app-list-usuario',
    templateUrl: './usuario.list.component.html',
    styleUrls: ['./usuario.list.component.css'],
  imports: [
    PrimeTableSharedModule,
    TableEmptyStateComponent,
    TableLoadingStateComponent,
  ],
  providers: [{ provide: PrimeCrudListComponent, useExisting: forwardRef(() => UsuarioListComponent) }],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UsuarioListComponent extends PrimeCrudListComponent<Usuario, number> {
  protected override service = inject(UsuarioService);
  protected override columnsTable = ['id', 'nome', 'username', 'permissoes', 'actions'];
  protected override urlForm = 'usuario/form';

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
      minWidth: '16rem'
    },
    {
      field: 'username',
      header: 'Usuário',
      type: 'text',
      sortable: true,
      filterable: true,
      minWidth: '12rem'
    },
    {
      field: 'permissoes',
      header: 'Grupo de Acesso',
      type: 'custom',
      sortable: true,
      filterable: true,
      minWidth: '16rem',
      exportValueGetter: (item: unknown) => formatRoles((item as Usuario).permissoes)
    },
    {
      field: 'actions',
      header: 'Opções',
      type: 'custom',
      sortable: false,
      filterable: false,
      exportable: false,
      align: 'center',
      width: '10rem',
      toggleable: false
    }
  ];

  constructor() {
    super();

    this.tableConfig = createTableConfig({
      columns: this.tableColumns,
      globalFilterFields: ['id', 'nome', 'username'],
      defaultSortField: 'nome',
      caption: 'Usuários',
      stateKey: 'usuario-list',
      // ...outras propriedades específicas...
    });
  }

  protected override getEntityName(): string {
    return 'Usuário';
  }

  protected override getEntityPluralName(): string {
    return 'Usuários';
  }

  // Override export filename for usuarios
  protected override getExportFileName(): string {
    return 'usuarios';
  }

  /**
   * Formata permissões para exibição na tabela
   * @param permissao Array de permissões do usuário
   * @returns String formatada com os grupos de acesso
   */
  formatGruposAcesso(permissao: Permissao[]): string {
    return formatRoles(permissao);
  }

}
