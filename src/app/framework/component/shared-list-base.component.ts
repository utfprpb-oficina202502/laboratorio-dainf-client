import {PrimeCrudListComponent} from './prime-crud.list.component';
import {Injector} from '@angular/core';
import {
  createActionsColumn,
  createIdColumn,
  createTableConfig,
  ListComponentConfig
} from '../utils/table-config.factory';
import {CrudService} from '../service/crud.service';
import {TableColumn} from '../model/table-config.interface';

export interface SharedListComponentOptions<T, L extends ListComponentConfig, S extends CrudService<T, number>> {
  entityName: string;
  entityPluralName: string;
  exportFileName: string;
  listConfig: L;
  entityService: S;
  injector: Injector;
}

export abstract class SharedListComponentBase<T, L extends ListComponentConfig, S extends CrudService<T, number>> extends PrimeCrudListComponent<T, number> {
  protected entityName: string;
  protected entityPluralName: string;
  protected exportFileName: string;
  protected listConfig: L;
  protected service: S;
  protected injector: Injector;

  constructor(options: SharedListComponentOptions<T, L, S>) {
    super();
    this.entityName = options.entityName;
    this.entityPluralName = options.entityPluralName;
    this.exportFileName = options.exportFileName;
    this.listConfig = options.listConfig;
    this.service = options.entityService;
    this.injector = options.injector;
  }

  getEntityName(): string {
    return this.entityName;
  }

  getEntityPluralName(): string {
    return this.entityPluralName;
  }

  getExportFileName(): string {
    return this.exportFileName;
  }

  configureTable(): void {
    let columns = [...this.listConfig.entityColumns];
    // Remove todas as colunas 'id' e 'actions' do array
    columns = columns.filter((col) => col.field !== 'id' && col.field !== 'actions');
    // Adiciona 'id' como primeira coluna
    columns.unshift(createIdColumn());
    // Adiciona 'actions' como última coluna
    columns.push(createActionsColumn());
    this.tableConfig = createTableConfig({
      columns,
      globalFilterFields: this.listConfig.globalFilterFields,
      defaultSortField: this.listConfig.defaultSortField,
      caption: this.listConfig.caption,
      stateKey: this.listConfig.stateKey,
      // ...other specific properties...
    });
    this.columnsTable = this.tableConfig.columns.map((column: TableColumn) => column.field);
    this.displayedColumns = [...this.columnsTable];
  }
}
