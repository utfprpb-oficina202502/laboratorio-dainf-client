import { HostListener, Injector, OnInit, Directive, Input, ContentChild, TemplateRef, OnDestroy } from '@angular/core';
import {Router} from '@angular/router';
import {CrudService} from '../service/crud.service';
import {ConfirmationService, MessageService} from 'primeng/api';

import {BottomSheetComponent} from '../../geral/bottomScheet/bottomSheet.component';
import {MatBottomSheet} from '@angular/material/bottom-sheet';
import Swal from 'sweetalert2';
import {Exception} from '../../exception/exception';
import {LoaderService} from '../loader/loader.service';
import {LoginService} from '../../login/login.service';
import {PermissionService} from '../service/permission.service';
import {TableConfiguration, TableColumn, ColumnState} from '../model/table-config.interface';
import {Subject, debounceTime, distinctUntilChanged, takeUntil} from 'rxjs';

@Directive()
export abstract class PrimeCrudListComponent<T, ID> implements OnInit, OnDestroy {

  // Core services
  protected router: Router;
  protected messageService: MessageService;
  protected confirmationService: ConfirmationService;
  protected bottom: MatBottomSheet;
  protected loaderService: LoaderService;
  protected loginService: LoginService;
  protected permissionService: PermissionService;

  // Enhanced configuration system
  @Input() tableConfig: TableConfiguration = {
    columns: [],
    selectable: true,
    resizable: true,
    reorderable: false,
    exportable: true,
    globalFilter: true,
    sortMode: 'single',
    pageSize: 10,
    pageSizeOptions: [5, 10, 25, 50, 100],
    virtualScrolling: false,
    rowHover: true,
    striped: true,
    responsive: true,
    autoLayout: false
  };

  // Template overrides for flexibility
  @ContentChild('headerTemplate') headerTemplate?: TemplateRef<any>;
  @ContentChild('toolbarStartTemplate') toolbarStartTemplate?: TemplateRef<any>;
  @ContentChild('toolbarEndTemplate') toolbarEndTemplate?: TemplateRef<any>;
  @ContentChild('emptyMessageTemplate') emptyMessageTemplate?: TemplateRef<any>;
  @ContentChild('loadingTemplate') loadingTemplate?: TemplateRef<any>;
  @ContentChild('captionTemplate') captionTemplate?: TemplateRef<any>;

  // Legacy properties (for backward compatibility)
  public displayedColumns: string[];
  public totalElements = 0;
  public pageSize = 10;
  public pageIndex = 0;
  public first = 0;
  public rows = 10;
  public bottomSheetEnabled = true;
  public hostListenerColumnEnable = true;

  // Permission and user management
  public isAlunoOrProfessor = false;
  public userRole: string = '';
  public canCreate = false;
  public canEdit = false;
  public canDelete = false;
  public canExport = false;
  public isReadOnly = false;

  // Enhanced filtering and sorting
  public filterValue: string = '';
  public sortField: string = '';
  public sortOrder: number = 1;
  public selectedItems: T[] = [];
  public objects: T[] = [];

  // Advanced features
  protected columnFilters: { [key: string]: any } = {};
  protected columnState: ColumnState[] = [];
  protected destroy$ = new Subject<void>();
  private filterSubject = new Subject<string>();
  private columnTemplates = new Map<string, TemplateRef<any>>();

  // Performance optimizations
  trackByFn = (index: number, item: T): any => {
    const trackByField = this.tableConfig.trackByField || 'id';
    return (item as any)[trackByField] || index;
  };

  // Entity name for accessibility and labels
  protected abstract getEntityName(): string;
  protected abstract getEntityPluralName(): string;

  ngOnInit(): void {
    this.setupUserPermissions();
    this.findAll();
  }

  constructor(protected service: CrudService<T, ID>,
              protected injector: Injector,
              protected columnsTable: string[],
              protected urlForm: string) {
    this.router = this.injector.get(Router);
    this.messageService = this.injector.get(MessageService);
    this.confirmationService = this.injector.get(ConfirmationService);
    this.bottom = injector.get(MatBottomSheet);
    this.loaderService = injector.get(LoaderService);
    this.loginService = injector.get(LoginService);
    this.permissionService = injector.get(PermissionService);
    this.displayedColumns = this.columnsTable;
    this.rows = this.pageSize;

    // Setup debounced filtering
    this.setupDebouncedFiltering();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Setup debounced filtering for better performance
  private setupDebouncedFiltering(): void {
    this.filterSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(filterValue => {
      this.applyFilter(filterValue);
    });
  }

  // PrimeNG DataView pagination event handler
  onPageChange(event: any) {
    this.loaderService.display(true);
    this.buildColumnsTable();

    // Update PrimeNG pagination properties
    this.first = event.first;
    this.rows = event.rows;

    // Calculate page index for backend service
    this.pageIndex = Math.floor(event.first / event.rows);
    this.pageSize = event.rows;

    this.service.findAllPaged(this.pageIndex, this.pageSize, this.filterValue)
      .subscribe(
        e => {
          this.objects = e.content;
          this.totalElements = e.totalElements;
          this.pageSize = e.size;
          this.pageIndex = e.number;

          // Update PrimeNG pagination properties
          this.rows = this.pageSize;
          this.first = this.pageIndex * this.pageSize;

          this.loaderService.display(false);
          this.postFindAll();
        },
        error => {
          this.loaderService.display(false);
          this.showError(error);
        }
      );
  }

  applyFilter(filterValue: string) {
    this.filterValue = filterValue;
    // Reset to first page when filtering
    this.pageIndex = 0;
    this.first = 0;

    this.loaderService.display(true);
    this.service.findAllPaged(this.pageIndex, this.pageSize, filterValue)
      .subscribe(e => {
        this.objects = e.content;
        this.totalElements = e.totalElements;
        this.pageSize = e.size;
        this.pageIndex = e.number;

        // Update PrimeNG pagination properties
        this.rows = this.pageSize;
        this.first = this.pageIndex * this.pageSize;

        this.loaderService.display(false);
        this.postFindAll();
      }, error => {
        this.loaderService.display(false);
        this.showError(error);
      });
    this.buildColumnsTable();
  }

  findAll() {
    this.loaderService.display(true);
    this.service.findAllPaged(this.pageIndex, this.pageSize, '')
      .subscribe(e => {
        this.objects = e.content;
        this.totalElements = e.totalElements;
        this.pageSize = e.size;
        this.pageIndex = e.number;

        // Update PrimeNG pagination properties
        this.rows = this.pageSize;
        this.first = this.pageIndex * this.pageSize;

        this.loaderService.display(false);
        this.postFindAll();
      }, error => {
        this.loaderService.display(false);
        this.showError(error);
      });
    this.buildColumnsTable();
  }

  findAllByUsername() {
    this.loaderService.display(true);
    const u = localStorage.getItem('username');
    this.service.findAllByUsername(u)
      .subscribe(e => {
        this.objects = e;
        this.totalElements = e.length;
        this.pageIndex = 0;
        this.first = 0;
        this.loaderService.display(false);
        this.postFindAll();
      }, error => {
        this.loaderService.display(false);
        this.showError(error);
      });
  }

  edit(id: number) {
    this.router.navigate([this.urlForm, id]);
  }

  postFindAll(): void {
    //editar caso seja necessário trabalhar com os itens do findAll
  }

  delete(id: any) {
    Swal.fire({
      title: `Tem certeza que deseja remover o registro?`,
      text: 'A ação não poderá ser desfeita.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sim',
      cancelButtonText: 'Não'
    }).then((result) => {
      if (result.value) {
        this.loaderService.display(true);
        this.service.delete(id)
          .subscribe(e => {
            Swal.fire('Sucesso!', 'Registro excluído com sucesso!', 'success');
            this.findAll();
            this.loaderService.display(false);
          }, error => {
            this.loaderService.display(false);
            this.showError(error);
          });
      }
    });
  }

  openBottomSheet(id): void {
    if (window.innerWidth <= 1200 && this.bottomSheetEnabled) {
      const sheet = this.bottom.open(BottomSheetComponent);
      sheet.afterDismissed().subscribe(action => {
        if (action === 'E') {
          this.edit(id);
        } else if (action === 'R') {
          this.delete(id);
        }
      });
    }
  }

  openForm() {
    this.router.navigate([this.urlForm]);
  }

  @HostListener('window:resize', ['$event'])
  buildColumnsTable() {
    if (this.hostListenerColumnEnable) {
      if (window.innerWidth <= 1200) {
        this.columnsTable.forEach((value, index) => {
          if (value === 'actions') {
            this.columnsTable.splice(index, 1);
          }
        });
      } else if (this.columnsTable.filter(value => value === 'actions').length === 0) {
        this.columnsTable.push('actions');
      }
    }
  }

  showError(error: any): void {
    Exception.addMessage(error);
  }

  // PrimeNG Sort event handler
  onSort(event: any) {
    this.sortField = event.field;
    this.sortOrder = event.order;

    // Reset to first page when sorting
    this.pageIndex = 0;
    this.first = 0;

    this.loadData();
  }

  // Global filter handler for backend integration
  onGlobalFilter(value: string) {
    this.filterValue = value.trim();

    // Reset to first page when filtering
    this.pageIndex = 0;
    this.first = 0;

    this.loadData();
  }

  // Centralized data loading method
  private loadData() {
    this.loaderService.display(true);
    this.buildColumnsTable();

    // For now, we use the existing findAllPaged method
    // In the future, this could be enhanced to pass sort parameters to backend
    this.service.findAllPaged(this.pageIndex, this.pageSize, this.filterValue)
      .subscribe(
        e => {
          this.objects = e.content;
          this.totalElements = e.totalElements;
          this.pageSize = e.size;
          this.pageIndex = e.number;

          // Update PrimeNG pagination properties
          this.rows = this.pageSize;
          this.first = this.pageIndex * this.pageSize;

          // Apply client-side sorting if backend doesn't support it
          if (this.sortField && this.objects) {
            this.objects.sort((a: any, b: any) => {
              const aVal = a[this.sortField];
              const bVal = b[this.sortField];

              if (aVal < bVal) return -1 * this.sortOrder;
              if (aVal > bVal) return 1 * this.sortOrder;
              return 0;
            });
          }

          this.loaderService.display(false);
          this.postFindAll();
        },
        error => {
          this.loaderService.display(false);
          this.showError(error);
        }
      );
  }

  // Export functionality - can be overridden in child components for custom export logic
  exportExcel() {
    if (!this.objects || this.objects.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Aviso',
        detail: 'Não há dados para exportar'
      });
      return;
    }

    import('xlsx').then((xlsx) => {
      const data = this.prepareExportData();

      const worksheet = xlsx.utils.json_to_sheet(data);
      const workbook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
      const excelBuffer: any = xlsx.write(workbook, { bookType: 'xlsx', type: 'array' });

      this.saveAsExcelFile(excelBuffer, this.getExportFileName());
    }).catch(error => {
      console.error('Error importing xlsx library:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'Erro ao exportar dados para Excel'
      });
    });
  }

  // Override this method in child components for custom export data preparation
  protected prepareExportData(): any[] {
    return this.objects.map(item => {
      const exportItem: any = {};

      // Default export fields - can be customized in child components
      if (item.hasOwnProperty('id')) exportItem['Código'] = (item as any).id;
      if (item.hasOwnProperty('descricao')) exportItem['Descrição'] = (item as any).descricao;

      return exportItem;
    });
  }

  // Override this method in child components for custom filename
  protected getExportFileName(): string {
    return 'dados';
  }

  saveAsExcelFile(buffer: any, fileName: string): void {
    import('file-saver').then((module) => {
      if (module?.default) {
        const data: Blob = new Blob([buffer], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8'
        });
        module.default.saveAs(data, fileName + '_export_' + new Date().getTime() + '.xlsx');
      }
    }).catch(error => {
      console.error('Error importing file-saver library:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'Erro ao salvar arquivo Excel'
      });
    });
  }

  // Bulk delete functionality
  deleteSelectedItems() {
    if (!this.selectedItems || this.selectedItems.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Aviso',
        detail: 'Nenhum item selecionado para exclusão'
      });
      return;
    }

    const itemCount = this.selectedItems.length;
    Swal.fire({
      title: `Tem certeza que deseja remover ${itemCount} registro(s)?`,
      text: 'A ação não poderá ser desfeita.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sim',
      cancelButtonText: 'Não'
    }).then((result) => {
      if (result.value) {
        this.loaderService.display(true);

        // Extract IDs from selected items
        const ids = this.selectedItems.map((item: any) => item.id);

        // Delete items sequentially (could be enhanced for bulk API call)
        this.deleteItemsSequentially(ids, 0, itemCount);
      }
    });
  }

  private deleteItemsSequentially(ids: any[], currentIndex: number, total: number) {
    if (currentIndex >= ids.length) {
      // All deletions completed
      this.selectedItems = [];
      this.loaderService.display(false);
      Swal.fire('Sucesso!', `${total} registro(s) excluído(s) com sucesso!`, 'success');
      this.findAll();
      return;
    }

    this.service.delete(ids[currentIndex])
      .subscribe(
        e => {
          // Continue with next item
          this.deleteItemsSequentially(ids, currentIndex + 1, total);
        },
        error => {
          this.loaderService.display(false);
          this.showError(error);
          Swal.fire('Erro!', `Erro ao excluir alguns registros. ${currentIndex} de ${total} foram excluídos.`, 'error');
        }
      );
  }

  // CSV Export using PrimeNG built-in functionality
  exportCSV(table: any) {
    table.exportCSV();
  }

  // Centralized permission setup using the permission service
  private async setupUserPermissions(): Promise<void> {
    try {
      const permissions = await this.permissionService.getUserPermissions();

      // Apply permissions to component properties
      this.canCreate = permissions.canCreate;
      this.canEdit = permissions.canEdit;
      this.canDelete = permissions.canDelete;
      this.canExport = permissions.canExport;
      this.isReadOnly = permissions.isReadOnly;
      this.userRole = permissions.userRole;
      this.isAlunoOrProfessor = permissions.isAlunoOrProfessor;

      // Update columns based on permissions
      this.updateColumnsForPermissions();
    } catch (error) {
      console.error('Error setting up user permissions:', error);
      // Default to read-only if permission setup fails
      this.canCreate = false;
      this.canEdit = false;
      this.canDelete = false;
      this.canExport = false;
      this.isReadOnly = true;
      this.userRole = 'GUEST';
      this.isAlunoOrProfessor = true;
    }
  }

  // Update columns based on user permissions
  private updateColumnsForPermissions(): void {
    if (this.isReadOnly) {
      // Remove actions column for read-only users
      this.columnsTable = this.columnsTable.filter(col => col !== 'actions');
    } else if (!this.columnsTable.includes('actions')) {
      this.columnsTable.push('actions');
    }
    this.displayedColumns = [...this.columnsTable];
  }

  // Enhanced filtering with debouncing
  onGlobalFilterDebounced(value: string): void {
    this.filterSubject.next(value);
  }

  // Template registration for dynamic columns
  registerColumnTemplate(field: string, template: TemplateRef<any>): void {
    this.columnTemplates.set(field, template);
  }

  getColumnTemplate(field: string): TemplateRef<any> | undefined {
    return this.columnTemplates.get(field);
  }

  // Get table style classes
  getTableStyleClass(): string {
    let classes = '';

    if (this.tableConfig.striped) {
      classes += 'p-datatable-striped ';
    }

    if (this.tableConfig.responsive) {
      classes += 'p-datatable-responsive ';
    }

    if (this.tableConfig.styleClass) {
      classes += this.tableConfig.styleClass;
    }

    return classes.trim();
  }

  // Get accessibility labels
  getTableAriaLabel(): string {
    return `${this.getEntityPluralName()} table with ${this.totalElements} records`;
  }

  getTableAriaDescription(): string {
    return `Table containing ${this.totalElements} ${this.getEntityName().toLowerCase()} records. Use arrow keys to navigate.`;
  }

  // Get dynamic entity names for messages
  getCreateButtonLabel(): string {
    return `Adicionar ${this.getEntityName()}`;
  }

  getDeleteButtonLabel(count: number = 0): string {
    if (count > 0) {
      return `Deletar ${count} ${count === 1 ? this.getEntityName() : this.getEntityPluralName()}`;
    }
    return `Deletar ${this.getEntityPluralName()} Selecionados`;
  }

  getExportButtonLabel(type: 'excel' | 'csv'): string {
    return `Exportar ${this.getEntityPluralName()} para ${type.toUpperCase()}`;
  }

  getEmptyMessage(): string {
    return this.tableConfig.emptyMessage || `Nenhum ${this.getEntityName().toLowerCase()} encontrado.`;
  }

  getLoadingMessage(): string {
    return this.tableConfig.loadingMessage || `Carregando ${this.getEntityPluralName().toLowerCase()}...`;
  }

  getGlobalFilterPlaceholder(): string {
    return this.tableConfig.globalFilterPlaceholder || `Buscar ${this.getEntityPluralName().toLowerCase()}...`;
  }

  // Column utilities
  getVisibleColumns(): TableColumn[] {
    return this.tableConfig.columns.filter(col => col.visible !== false);
  }

  getSortableColumns(): TableColumn[] {
    return this.tableConfig.columns.filter(col => col.sortable !== false);
  }

  getFilterableColumns(): TableColumn[] {
    return this.tableConfig.columns.filter(col => col.filterable === true);
  }

  getExportableColumns(): TableColumn[] {
    return this.tableConfig.columns.filter(col => col.exportable !== false);
  }

  // Get column count for colspan calculations
  getColumnCount(): number {
    let count = this.getVisibleColumns().length;

    // Add selection column if enabled and user can select
    if (this.tableConfig.selectable && !this.isReadOnly) {
      count++;
    }

    return count;
  }

  // Check if actions column should be shown
  shouldShowActionsColumn(): boolean {
    return this.displayedColumns.includes('actions') && !this.isReadOnly;
  }

  // Utility method for consistent column width
  getColumnWidth(column: TableColumn): string | undefined {
    if (column.width) {
      return column.width;
    }

    // Auto-size based on column type
    switch (column.type) {
      case 'boolean':
        return '80px';
      case 'number':
        return '120px';
      case 'date':
        return '140px';
      default:
        return column.minWidth || undefined;
    }
  }
}
