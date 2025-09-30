import {Component, forwardRef, Injector, ChangeDetectionStrategy} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Usuario} from './usuario';
import {UsuarioService} from './usuario.service';
import {PrimeCrudListComponent} from '../framework/component/prime-crud.list.component';
import {TableColumn} from '../framework/model/table-config.interface';
import {Permissao} from './permissao';

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
    selector: 'app-list-usuario',
    templateUrl: './usuario.list.component.html',
    styleUrls: ['./usuario.list.component.css'],
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
  providers: [{ provide: PrimeCrudListComponent, useExisting: forwardRef(() => UsuarioListComponent) }],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UsuarioListComponent extends PrimeCrudListComponent<Usuario, number> {

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

  constructor(protected usuarioService: UsuarioService,
              protected injector: Injector) {
    super(usuarioService, injector, ['id', 'nome', 'username', 'permissoes', 'actions'], 'usuario/form');
    this.configureTable();
  }

  protected override getEntityName(): string {
    return 'Usuario';
  }

  protected override getEntityPluralName(): string {
    return 'Usuarios';
  }

  // Override export filename for usuarios
  protected override getExportFileName(): string {
    return 'usuarios';
  }

  private configureTable(): void {
    this.tableConfig = {
      ...this.tableConfig,
      columns: this.tableColumns,
      globalFilterFields: ['id', 'nome', 'username'],
      defaultSortField: 'nome',
      defaultSortOrder: 1,
      caption: 'Lista de Usuarios',
      trackByField: 'id',
      emptyMessage: 'Nenhum usuario encontrado.',
      loadingMessage: 'Carregando usuarios...',
      globalFilterPlaceholder: 'Buscar usuarios...',
      columnToggle: true,
      expandable: false,
      expandMode: 'single',
      rowExpansionKey: 'id',
      stateful: true,
      stateKey: 'usuario-list',
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
      if (i != permissao.length - 1) {
        toReturn += ', ';
      }
    }
    return toReturn;
  }

}
