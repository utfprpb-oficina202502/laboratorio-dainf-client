import { PrimeCrudListComponent } from './prime-crud.list.component';
import { Injector } from '@angular/core';
import { createIdColumn, createActionsColumn, createTableConfig } from '../utils/table-config.factory';

export interface SharedListComponentOptions {
  entityName: string;
  entityPluralName: string;
  exportFileName: string;
  listConfig: any;
  entityService: any;
  injector: Injector;
}

export abstract class SharedListComponentBase<T, K> extends PrimeCrudListComponent<T, K> {
  protected entityName: string;
  protected entityPluralName: string;
  protected exportFileName: string;
  protected listConfig: any;

  constructor(options: SharedListComponentOptions) {
    super();
    this.entityName = options.entityName;
    this.entityPluralName = options.entityPluralName;
    this.exportFileName = options.exportFileName;
    this.listConfig = options.listConfig;
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
    this.columnsTable = this.tableConfig.columns.map((column: any) => column.field);
    this.displayedColumns = [...this.columnsTable];
  }
}
