import {ChangeDetectionStrategy, Component, forwardRef, inject} from '@angular/core';
import {Usuario} from './usuario';
import {UsuarioService} from './usuario.service';
import {PrimeCrudListComponent} from '../framework/component/prime-crud.list.component';
import {TableColumn} from '../framework/model/table-config.interface';
import {Permissao} from './permissao';
import {PrimeTableSharedModule} from '../framework/module/prime-table-shared.module';
import {
  TableDefaultTemplatesComponent
} from '../framework/component/table-default-templates.component';
import { createTableConfig } from '../framework/utils/table-config.factory';

@Component({
    selector: 'app-list-usuario',
    templateUrl: './usuario.list.component.html',
    styleUrls: ['./usuario.list.component.css'],
  imports: [
    PrimeTableSharedModule,
    TableDefaultTemplatesComponent,
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
      minWidth: '16rem'
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
      globalFilterFields: ['id', 'nome', 'email'],
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

  formatGruposAcesso(permissao: Permissao[]) {
    let toReturn = "";
    for (let i = 0; i < permissao.length; i++) {
      if (permissao[i].nome === 'ROLE_ALUNO') {
        toReturn += 'Aluno';
      } else if (permissao[i].nome === 'ROLE_PROFESSOR') {
        toReturn += 'Professor';
      } else if (permissao[i].nome === 'ROLE_LABORATORISTA') {
        toReturn += 'Laboratorista';
      } else {
        toReturn += 'Administrador';
      }
      if (i !== permissao.length - 1) {
        toReturn += ', ';
      }
    }
    return toReturn;
  }

}
