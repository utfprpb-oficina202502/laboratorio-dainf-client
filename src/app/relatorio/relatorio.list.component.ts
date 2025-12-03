import {ChangeDetectionStrategy, Component, forwardRef, inject} from '@angular/core';
import {PrimeCrudListComponent} from '../framework/component/prime-crud.list.component';
import {TableColumn} from '../framework/model/table-config.interface';
import {Relatorio} from './relatorio';
import {RelatorioService} from './relatorio.service';
import {PrimeTableSharedModule} from '../framework/module/prime-table-shared.module';
import {TableEmptyStateComponent} from '../framework/component/table-empty-state.component';
import {TableLoadingStateComponent} from '../framework/component/table-loading-state.component';
import {createTableConfig} from '../framework/utils/table-config.factory';

@Component({
  selector: 'app-list-relatorio',
  templateUrl: './relatorio.list.component.html',
  styleUrls: ['./relatorio.list.component.css'],
  providers: [{
    provide: PrimeCrudListComponent,
    useExisting: forwardRef(() => RelatorioListComponent)
  }],
  imports: [
    PrimeTableSharedModule,
    TableEmptyStateComponent,
    TableLoadingStateComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RelatorioListComponent extends PrimeCrudListComponent<Relatorio, number> {
  protected override service = inject(RelatorioService);
  protected override columnsTable = ['id', 'nome', 'actions'];
  protected override urlForm = 'relatorio/form';

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
      minWidth: '20rem'
    },
    {
      field: 'actions',
      header: 'Opções',
      type: 'custom',
      sortable: false,
      filterable: false,
      exportable: false,
      toggleable: false,
      width: '12rem',
      align: 'center'
    }
  ];

  constructor() {
    super();

    this.hostListenerColumnEnable = false;
    this.configureTable();
  }

  protected override getEntityName(): string {
    return 'Relatório';
  }

  protected override getEntityPluralName(): string {
    return 'Relatórios';
  }

  protected override getExportFileName(): string {
    return 'relatorios';
  }

  private configureTable(): void {
    this.tableConfig = createTableConfig({
      columns: this.tableColumns,
      globalFilterFields: ['id', 'nome'],
      defaultSortField: 'id',
      caption: 'Relatórios',
      stateKey: 'relatorio-list',
    });

    this.columnsTable = this.tableConfig.columns.map(column => column.field);
    this.displayedColumns = [...this.columnsTable];
  }

  /**
   * Custom openOptions for relatorio with generate report action
   */
  openOptions(event: Event, relatorio: Relatorio): void {
    const isReadOnly = this.isReadOnly() || this.isAlunoOrProfessor();

    this.contextMenuItems = [];

    if (!isReadOnly) {
      if (this.canEdit()) {
        this.contextMenuItems.push({
          label: 'Editar',
          icon: 'pi pi-pencil',
          command: () => this.edit(this.getItemId(relatorio))
        });
      }

      if (this.canDelete()) {
        this.contextMenuItems.push({
          label: 'Remover',
          icon: 'pi pi-trash',
          command: () => this.delete(this.getItemId(relatorio))
        });
      }
    } else {
      this.contextMenuItems.push({
        label: 'Visualizar',
        icon: 'pi pi-eye',
        command: () => this.edit(this.getItemId(relatorio))
      });
    }

    // Add generate report action for all users
    this.contextMenuItems.push({
      label: 'Gerar Relatório',
      icon: 'pi pi-file-pdf',
      command: () => this.generateReport(this.getItemId(relatorio))
    });

    this.actionsMenu()?.toggle(event);
    this.cdr?.markForCheck();
  }

  generateReport(id: number): void {
    this.loaderService.show();
    this.router.navigate(['relatorio/view', id]);
  }

  postFindAll(): void {
    // PrimeNG tables handle sorting and filtering through the table configuration
    // Custom sorting for nested properties is handled in the template
  }
}
