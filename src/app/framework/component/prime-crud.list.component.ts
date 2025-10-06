import {
  ChangeDetectorRef,
  contentChild,
  Directive,
  ElementRef,
  HostListener,
  inject,
  Injector,
  input,
  OnDestroy,
  OnInit,
  signal,
  TemplateRef,
  viewChild
} from '@angular/core';
import {Router} from '@angular/router';
import {CrudService} from '../service/crud.service';
import {ConfirmationService, MessageService, SortEvent} from 'primeng/api';
import {Table, TablePageEvent, TableRowCollapseEvent, TableRowExpandEvent} from 'primeng/table';
import {MultiSelect} from 'primeng/multiselect';
import Swal from 'sweetalert2';
import {Exception} from '../../exception/exception';
import {LoaderService} from '../loader/loader.service';
import {LoginService} from '../../login/login.service';
import {PermissionService} from '../service/permission.service';
import {ColumnState, TableColumn, TableConfiguration} from '../model/table-config.interface';
import {debounceTime, distinctUntilChanged, Subject, takeUntil} from 'rxjs';
import {LoggerService} from '../services/logger.service';
import {TableExportService} from '../services/table-export.service';
import {TableStateManagerService} from '../services/table-state-manager.service';
import {KeyboardShortcut, TableKeyboardService} from '../services/table-keyboard.service';
import {TableColumnManagerService} from '../services/table-column-manager.service';
import {TableRowExpansionManagerService} from '../services/table-row-expansion-manager.service';
import {StorageService} from '../services/storage.service';

/**
 * Spring Data Page response interface
 */
interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

@Directive()
export abstract class PrimeCrudListComponent<T, ID> implements OnInit, OnDestroy {

  // Loading state signal for skeleton screens
  public readonly loading = signal<boolean>(false);
  // Core services - now injected in child classes
  protected abstract service: CrudService<T, ID>;
  protected abstract columnsTable: string[];
  protected abstract urlForm: string;
  protected readonly router: Router;
  protected readonly messageService: MessageService;
  protected readonly confirmationService: ConfirmationService;
  protected readonly loaderService: LoaderService;
  protected readonly loginService: LoginService;
  protected readonly permissionService: PermissionService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly headerTemplate = contentChild<TemplateRef<any>>('headerTemplate');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly toolbarStartTemplate = contentChild<TemplateRef<any>>('toolbarStartTemplate');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly toolbarEndTemplate = contentChild<TemplateRef<any>>('toolbarEndTemplate');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly emptyMessageTemplate = contentChild<TemplateRef<any>>('emptyMessageTemplate');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly loadingTemplate = contentChild<TemplateRef<any>>('loadingTemplate');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly captionTemplate = contentChild<TemplateRef<any>>('captionTemplate');
  protected readonly cdr: ChangeDetectorRef | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly rowExpansionTemplate = contentChild<TemplateRef<any>>('rowExpansionTemplate');
  readonly dataTable = viewChild<Table>('dt');
  readonly globalFilterInput = viewChild<ElementRef<HTMLInputElement>>('globalFilterInput');
  readonly columnToggleComponent = viewChild<MultiSelect>('columnToggleRef');

  // Template overrides for flexibility
  public userRole = '';
  // Enhanced filtering and sorting
  public filterValue = '';
  public sortField = '';
  public sortOrder = 1;
  public expandedRows: Record<string, boolean> = {};
  // Legacy properties (for backward compatibility)
  public displayedColumns: string[];
  public totalElements = 0;
  public pageSize = 10;
  public pageIndex = 0;
  public first = 0;
  public rows = 10;
  public hostListenerColumnEnable = true;
  // Permission and user management
  public isAlunoOrProfessor = false;
  public canCreate = false;
  public canEdit = false;
  public canDelete = false;
  public canExport = false;
  public isReadOnly = false;
  protected readonly logger: LoggerService;
  protected readonly tableExportService: TableExportService;
  protected readonly tableStateManager: TableStateManagerService;
  protected readonly tableKeyboardService: TableKeyboardService;
  protected readonly tableColumnManager: TableColumnManagerService;
  protected readonly tableRowExpansionManager: TableRowExpansionManagerService;
  protected readonly storageService: StorageService;
  // Enhanced configuration system
  protected readonly _tableConfigInput = input<TableConfiguration>({
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
    autoLayout: false,
    stateful: true,
    stateStorage: 'local',
    columnToggle: true,
    expandable: false,
    expandMode: 'single',
    resizableColumns: true,
    columnResizeMode: 'fit',
    lazy: true,
    lazyLoadOnInit: true,
    preloadData: true,
    keyboardShortcuts: true
  });
  protected columnFilters: Record<string, unknown> = {};
  // Internal mutable configuration for child components to override
  private _tableConfigOverride: TableConfiguration | null = null;
  public selectedItems: T[] = [];
  public objects: T[] = [];
  private keyboardShortcutHandlers: KeyboardShortcut[] = [];
  public columnToggleModel: string[] = [];
  public columnToggleOptions: { label: string; value: string }[] = [];
  public readonly self = this as PrimeCrudListComponent<T, ID>;

  // Advanced features
  protected readonly injector: Injector;
  private pendingSelectedKeys: unknown[] = [];
  protected columnState: ColumnState[] = [];
  protected destroy$ = new Subject<void>();
  private readonly filterSubject = new Subject<string>();
  private readonly defaultStateKey: string;
  private stateKey: string;
  private stateStorageRef?: Storage;

  constructor() {
    // Inject all required services using inject() function
    this.injector = inject(Injector);
    this.router = inject(Router);
    this.messageService = inject(MessageService);
    this.confirmationService = inject(ConfirmationService);
    this.loaderService = inject(LoaderService);
    this.loginService = inject(LoginService);
    this.permissionService = inject(PermissionService);
    this.logger = inject(LoggerService);
    this.tableExportService = inject(TableExportService);
    this.tableStateManager = inject(TableStateManagerService);
    this.tableKeyboardService = inject(TableKeyboardService);
    this.tableColumnManager = inject(TableColumnManagerService);
    this.tableRowExpansionManager = inject(TableRowExpansionManagerService);
    this.storageService = inject(StorageService);

    // Get ChangeDetectorRef for OnPush components (optional)
    try {
      this.cdr = inject(ChangeDetectorRef);
    } catch {
      this.cdr = null;
    }

    // Initialize displayedColumns as an empty array, will be set in buildColumnsTable()
    this.displayedColumns = [];
    this.rows = this.pageSize;
    this.defaultStateKey = this.buildDefaultStateKey();
    this.stateKey = this.defaultStateKey;

    // Set up debounced filtering
    this.setupDebouncedFiltering();
  }

  // Public getter/setter for backward compatibility with child components
  get tableConfig(): TableConfiguration {
    return this._tableConfigOverride || this._tableConfigInput();
  }

  set tableConfig(config: TableConfiguration) {
    this._tableConfigOverride = config;
  }

  ngOnInit(): void {
    this.applyTableDefaults();
    this.initializeColumnHandling();
    this.initializeStateStorage();
    this.restoreTableState();
    this.initializeKeyboardShortcuts();
    this.setupUserPermissions();

    if (this.tableConfig.preloadData === false) {
      this.buildColumnsTable();
    } else {
      this.findAll();
    }
  }

  // Performance optimizations
  trackByFn = (index: number, item: T): string | number => {
    const trackByField = this.tableConfig.trackByField || 'id';
    return (item as Record<string, string | number>)[trackByField] || index;
  };

  // PrimeNG DataView pagination event handler
  onPageChange(event: TablePageEvent) {
    this.loading.set(true);
    this.buildColumnsTable();

    this.first = event.first ?? 0;
    this.rows = event.rows ?? 10;
    this.pageIndex = Math.floor((event.first ?? 0) / (event.rows ?? 10));
    this.pageSize = event.rows ?? 10;

    this.service.findAllPaged(this.pageIndex, this.pageSize, this.filterValue)
    .subscribe({
      next: (e) => this.handleDataLoadSuccess(e),
      error: (error) => this.handleDataLoadError(error)
    });
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardInteractions(event: KeyboardEvent): void {
    if (this.tableConfig.keyboardShortcuts === false) {
      return;
    }

    this.tableKeyboardService.handleKeyboardEvent(event, this.keyboardShortcutHandlers);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.saveTableState();
  }

  // Setup debounced filtering for better performance
  private setupDebouncedFiltering(): void {
    this.filterSubject.pipe(
      debounceTime(600),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(filterValue => {
      this.applyFilter(filterValue);
    });
  }

  protected applyTableDefaults(): void {
    this.tableConfig.striped = this.tableConfig.striped !== false;
    this.tableConfig.rowHover = this.tableConfig.rowHover !== false;
    const resizableColumns = this.tableConfig.resizableColumns !== false && this.tableConfig.resizable !== false;
    this.tableConfig.resizableColumns = resizableColumns;
    this.tableConfig.columnResizeMode = this.tableConfig.columnResizeMode || 'fit';
    // Default to true for proper server-side pagination with totalRecords
    this.tableConfig.lazy ??= true;
    this.tableConfig.lazyLoadOnInit ??= false;
    this.tableConfig.preloadData = this.tableConfig.preloadData !== false;
    this.tableConfig.columnToggle = this.tableConfig.columnToggle !== false;
    this.tableConfig.keyboardShortcuts = this.tableConfig.keyboardShortcuts !== false;
    this.tableConfig.stateful = this.tableConfig.stateful !== false;
    this.tableConfig.stateStorage = this.tableConfig.stateStorage || 'local';
    this.tableConfig.expandable = this.tableConfig.expandable === true;
    if (this.tableConfig.expandable) {
      this.tableConfig.expandMode = this.tableConfig.expandMode || 'single';
      this.tableConfig.rowExpansionKey = this.tableConfig.rowExpansionKey || this.tableConfig.trackByField || 'id';
    }
    this.tableConfig.stateKey = this.tableConfig.stateKey || this.defaultStateKey;
    this.tableConfig.pageSize = this.tableConfig.pageSize || this.pageSize;
    this.tableConfig.pageSizeOptions = this.tableConfig.pageSizeOptions || [5, 10, 25, 50, 100];
    this.tableConfig.globalFilter = this.tableConfig.globalFilter !== false;
    this.pageSize = this.tableConfig.pageSize || 10;
    this.rows = this.pageSize;
  }

  onColumnToggleChange(selectedFields: string[]): void {
    this.columnToggleModel = this.tableColumnManager.handleColumnToggleChange(
      this.tableConfig.columns,
      selectedFields
    );
    this.updateDisplayedColumns();
    this.saveTableState();
  }

  isRowExpanded(row: T): boolean {
    const key = this.getRowKey(row);
    return this.tableRowExpansionManager.isRowExpanded(this.expandedRows, key);
  }

  toggleRowExpansion(row: T): void {
    const key = this.getRowKey(row);
    this.expandedRows = this.tableRowExpansionManager.toggleRowExpansion(
      this.expandedRows,
      key,
      this.tableConfig.expandMode || 'multiple'
    );
    this.saveTableState();
  }

  onRowExpand(event: TableRowExpandEvent): void {
    const row = event?.data as T;
    if (!row) {
      return;
    }

    const key = this.getRowKey(row);
    this.expandedRows = this.tableRowExpansionManager.expandRow(
      this.expandedRows,
      key,
      this.tableConfig.expandMode || 'multiple'
    );
    this.saveTableState();
  }

  onRowCollapse(event: TableRowCollapseEvent): void {
    const row = event?.data as T;
    if (!row) {
      return;
    }

    const key = this.getRowKey(row);
    this.expandedRows = this.tableRowExpansionManager.collapseRow(this.expandedRows, key);
    this.saveTableState();
  }

  expandAllRows(): void {
    this.expandedRows = this.tableRowExpansionManager.expandAllRows(
      this.objects,
      (row) => this.getRowKey(row)
    );
    this.saveTableState();
  }

  collapseAllRows(): void {
    if (!this.tableRowExpansionManager.hasExpandedRows(this.expandedRows)) {
      return;
    }
    this.expandedRows = this.tableRowExpansionManager.collapseAllRows();
    this.saveTableState();
  }

  // Export functionality - can be overridden in child components for custom export logic
  exportExcel() {
    const exportableColumns = this.getExportableColumns();
    const fileName = this.getExportFileName();
    this.tableExportService.exportToExcel(this.objects, exportableColumns, fileName);
  }

  onSelectionChange(selection: T[]): void {
    this.selectedItems = selection || [];
    this.saveTableState();
  }

  delete(id: ID) {
    Swal.fire({
      title: `Tem certeza que deseja remover o registro?`,
      text: 'A ação não poderá ser desfeita.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sim',
      cancelButtonText: 'Não'
    }).then((result) => {
      if (result.value) {
        this.loaderService.show();
        this.service.delete(id)
        .subscribe({
          next: () => {
            Swal.fire('Sucesso!', 'Registro excluído com sucesso!', 'success');
            this.findAll();
            this.loaderService.hide();
          },
          error: (error) => {
            this.loaderService.hide();
            this.showError(error);
          }
        });
      }
    });
  }

  postFindAll(): void {
    // Hook para processamento customizado após carregar dados
  }

  @HostListener('window:resize', ['$event'])
  buildColumnsTable() {
    this.displayedColumns = this.tableColumnManager.buildDisplayedColumns(
      this.columnsTable,
      this.hostListenerColumnEnable,
      globalThis.innerWidth
    );
  }

  // PrimeNG Sort event handler
  onSort(event: SortEvent) {
    this.sortField = event.field as string;
    this.sortOrder = event.order ?? 1;

    // Reset to the first page when sorting
    this.pageIndex = 0;
    this.first = 0;

    this.loadData();
  }

  showError(error: unknown): void {
    Exception.addMessage(error);
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
      confirmButtonText: 'Sim',
      cancelButtonText: 'Não'
    }).then((result) => {
      if (result.value) {
        this.loaderService.show();

        // Extract IDs from selected items
        const ids = this.selectedItems.map((item: T) => (item as T & { id: ID }).id);

        // Delete items sequentially (could be enhanced for bulk API call)
        this.deleteItemsSequentially(ids, 0, itemCount);
      }
    });
  }

  // CSV Export using PrimeNG built-in functionality
  exportCSV(table?: Table | null) {
    const tableRef = table || this.dataTable();
    const exportableColumns = this.getExportableColumns();
    this.tableExportService.exportToCSV(tableRef, this.objects, exportableColumns);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  registerColumnTemplate(field: string, template: TemplateRef<any>): void {
    this.tableColumnManager.registerColumnTemplate(field, template);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getColumnTemplate(field: string): TemplateRef<any> | undefined {
    return this.tableColumnManager.getColumnTemplate(field);
  }

  getDeleteButtonLabel(count = 0): string {
    if (count > 0) {
      return `Deletar ${count} ${count === 1 ? this.getEntityName() : this.getEntityPluralName()}`;
    }
    return `Deletar ${this.getEntityPluralName()} Selecionados`;
  }

  // Column utilities
  getVisibleColumns(): TableColumn[] {
    return this.tableColumnManager.getVisibleColumns(this.tableConfig.columns);
  }

  clearGlobalFilter(): void {
    if (!this.filterValue) {
      return;
    }
    this.applyFilter('');
  }

  findAll() {
    this.loading.set(true);
    this.buildColumnsTable();

    this.service.findAllPaged(this.pageIndex, this.pageSize, this.filterValue || '')
    .subscribe({
      next: (e) => this.handleDataLoadSuccess(e),
      error: (error) => this.handleDataLoadError(error)
    });
  }

  findAllByUsername() {
    this.loading.set(true);
    const u = this.storageService.getItem('username');
    if (!u) {
      this.loading.set(false);
      return;
    }
    this.service.findAllByUsername(u)
    .subscribe({
      next: (e) => {
        this.objects = e;
        this.totalElements = e.length;
        this.pageIndex = 0;
        this.first = 0;
        this.restoreSelectionFromKeys();
        this.loading.set(false);
        this.postFindAll();
        this.saveTableState();
      },
      error: (error) => {
        this.loading.set(false);
        this.showError(error);
      }
    });
  }

  applyFilter(filterValue: string) {
    this.filterValue = (filterValue ?? '').trim();
    // Reset to the first page when filtering
    this.pageIndex = 0;
    this.first = 0;

    this.loadData();
  }

  getSortableColumns(): TableColumn[] {
    return this.tableColumnManager.getSortableColumns(this.tableConfig.columns);
  }

  getFilterableColumns(): TableColumn[] {
    return this.tableColumnManager.getFilterableColumns(this.tableConfig.columns);
  }

  edit(id: number) {
    this.router.navigate([this.urlForm, id]);
  }

  getExportableColumns(): TableColumn[] {
    return this.tableColumnManager.getExportableColumns(this.tableConfig.columns);
  }

  // Get column count for colspan calculations
  getColumnCount(): number {
    return this.tableColumnManager.getColumnCount(
      this.getVisibleColumns().length,
      this.tableConfig.expandable || false,
      this.tableConfig.selectable || false,
      this.isReadOnly
    );
  }

  // Check if actions column should be shown
  shouldShowActionsColumn(): boolean {
    return this.tableColumnManager.shouldShowActionsColumn(this.displayedColumns, this.isReadOnly);
  }

  openForm() {
    this.router.navigate([this.urlForm]);
  }

  // Utility method for consistent column width
  getColumnWidth(column: TableColumn): string | undefined {
    return this.tableColumnManager.getColumnWidth(column);
  }


  // Override this method in child components for a custom filename
  protected getExportFileName(): string {
    return 'dados';
  }

  // Global filter handler for backend integration
  onGlobalFilter(value: string) {
    this.onGlobalFilterDebounced(value);
  }

  // Enhanced filtering with debouncing
  onGlobalFilterDebounced(value: string): void {
    this.filterSubject.next((value ?? '').trim());
  }

  private buildDefaultStateKey(): string {
    const cleaned = this.urlForm ? this.urlForm.replaceAll('/', '-') : 'default';
    return 'prime-crud-' + cleaned;
  }

  /**
   * Triggers change detection for OnPush components
   * Extracts duplicated change detection logic
   */
  private triggerChangeDetection(): void {
    if (this.cdr) {
      this.cdr?.markForCheck();
    }
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

  // Entity name for accessibility and labels
  protected abstract getEntityName(): string;

  // Template registration for dynamic columns

  protected abstract getEntityPluralName(): string;

  protected saveTableState(): void {
    this.tableStateManager.saveState(
      this.stateStorageRef,
      this.stateKey,
      {
        filterValue: this.filterValue,
        sortField: this.sortField,
        sortOrder: this.sortOrder,
        pageSize: this.pageSize,
        pageIndex: this.pageIndex,
        columns: this.tableConfig.columns,
        columnToggleModel: this.columnToggleModel,
        expandedRows: this.expandedRows,
        selectedItems: this.selectedItems
      },
      this.tableConfig.stateProps,
      this.tableConfig.trackByField || 'id'
    );
  }

  protected updateDisplayedColumns(): void {
    if (!this.tableConfig.columns) {
      this.columnsTable = [];
      this.displayedColumns = [];
      return;
    }

    this.columnsTable = this.tableColumnManager.getDisplayedColumnsFromConfig(this.tableConfig.columns);
    this.buildColumnsTable();
  }

  protected getRowKey(row: T): string {
    const keyField = this.tableConfig.rowExpansionKey || this.tableConfig.trackByField || 'id';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return String((row as any)?.[keyField]);
  }

  private initializeColumnHandling(): void {
    if (!this.tableConfig.columns) {
      this.tableConfig.columns = [];
    }

    if (this.tableConfig.columns.length === 0 && this.columnsTable?.length) {
      this.tableConfig.columns = this.columnsTable.map(field => ({
        field,
        header: field,
        sortable: true,
        filterable: true,
        toggleable: field !== 'actions'
      }));
    }

    if (this.columnToggleModel.length === 0) {
      const toggleData = this.tableColumnManager.initializeColumnToggle(this.tableConfig.columns);
      this.columnToggleOptions = toggleData.columnToggleOptions;
      this.columnToggleModel = toggleData.columnToggleModel;
    }

    this.updateDisplayedColumns();
    this.updateGlobalFilterFields();
  }

  private initializeKeyboardShortcuts(): void {
    if (this.tableConfig.keyboardShortcuts === false) {
      this.keyboardShortcutHandlers = [];
      return;
    }

    this.keyboardShortcutHandlers = this.tableKeyboardService.buildDefaultShortcuts({
      focusGlobalFilter: () => this.focusGlobalFilter(),
      openForm: () => {
        if (this.canCreate && !this.isReadOnly) {
          this.openForm();
        }
      },
      exportExcel: () => {
        if (this.canExport) {
          this.exportExcel();
        }
      },
      openColumnToggle: () => this.openColumnTogglePanel(),
      clearGlobalFilter: () => this.clearGlobalFilter(),
      deleteSelected: () => {
        if (this.canDelete && this.selectedItems?.length) {
          this.deleteSelectedItems();
        }
      }
    });
  }

  private restoreTableState(): void {
    const restored = this.tableStateManager.restoreState(
      this.stateStorageRef,
      this.stateKey,
      this.tableConfig.columns,
      this.tableConfig.stateProps
    );

    if (!restored) {
      return;
    }

    // Apply restored state to component properties
    if (restored.filterValue !== undefined) {
      this.filterValue = restored.filterValue;
    }

    if (restored.sortField !== undefined) {
      this.sortField = restored.sortField;
    }

    if (restored.sortOrder !== undefined) {
      this.sortOrder = restored.sortOrder;
    }

    if (restored.pageSize !== undefined) {
      this.pageSize = restored.pageSize;
      this.rows = this.pageSize;
    }

    if (restored.pageIndex !== undefined) {
      this.pageIndex = restored.pageIndex;
      this.first = this.pageIndex * this.pageSize;
    }

    if (restored.expandedRowKeys !== undefined) {
      this.expandedRows = restored.expandedRowKeys;
    }

    if (restored.selectedKeys !== undefined) {
      this.pendingSelectedKeys = restored.selectedKeys;
    }

    if (restored.columnToggleModel !== undefined) {
      this.columnToggleModel = restored.columnToggleModel;
    }

    this.updateDisplayedColumns();
  }

  private restoreSelectionFromKeys(): void {
    if (!this.pendingSelectedKeys.length || !this.objects?.length) {
      return;
    }
    const trackByField = this.tableConfig.trackByField || 'id';
    this.selectedItems = this.tableStateManager.restoreSelectionFromKeys(
      this.objects,
      this.pendingSelectedKeys,
      trackByField
    ) as T[];
    this.pendingSelectedKeys = [];
  }

  private updateGlobalFilterFields(): void {
    if (this.tableConfig.globalFilterFields?.length) {
      return;
    }
    this.tableConfig.globalFilterFields = this.tableColumnManager.initializeGlobalFilterFields(
      this.tableConfig.columns
    );
  }

  private focusGlobalFilter(): void {
    const element = this.globalFilterInput()?.nativeElement;
    if (element) {
      element.focus({preventScroll: true});
      if (typeof element.select === 'function') {
        element.select();
      }
    }
  }

  private openColumnTogglePanel(): void {
    const component = this.columnToggleComponent();
    if (this.tableConfig.columnToggle === false || !component) {
      return;
    }
    if (component.overlayVisible) {
      component.hide();
    } else {
      component.show();
    }
  }

  private initializeStateStorage(): void {
    this.stateKey = this.tableConfig.stateKey || this.defaultStateKey;
    this.stateStorageRef = this.tableStateManager.initializeStorage(
      this.tableConfig.stateful || false,
      this.tableConfig.stateStorage || 'local'
    );
  }

  /**
   * Common handler for successful data loading
   * Extracts duplicated logic from findAll(), onPageChange(), and loadData()
   */
  private handleDataLoadSuccess(response: PageResponse<T>): void {
    this.objects = response.content;
    this.totalElements = response.totalElements;
    this.pageSize = response.size;
    this.pageIndex = response.number;

    this.rows = this.pageSize;
    this.first = this.pageIndex * this.pageSize;

    this.restoreSelectionFromKeys();
    this.loading.set(false);
    this.postFindAll();
    this.saveTableState();

    this.triggerChangeDetection();
  }

  /**
   * Common handler for data loading errors
   * Extracts duplicated error handling logic
   */
  private handleDataLoadError(error: unknown): void {
    this.loading.set(false);
    this.showError(error);
    this.triggerChangeDetection();
  }

  // Centralized data loading method
  private loadData() {
    this.loading.set(true);
    this.buildColumnsTable();

    this.service.findAllPaged(this.pageIndex, this.pageSize, this.filterValue)
    .subscribe({
      next: (e) => {
          // Apply client-side sorting if needed
          if (this.sortField && e.content) {
            e.content.sort((a: T, b: T) => {
              const aVal = (a as Record<string, unknown>)[this.sortField];
              const bVal = (b as Record<string, unknown>)[this.sortField];

              // Handle null/undefined
              if (aVal === null && bVal === null) return 0;
              if (aVal === null || aVal === undefined) return 1 * this.sortOrder;
              if (bVal === null || bVal === undefined) return -1 * this.sortOrder;

              // Compare values (works for strings, numbers, dates)
              if (aVal < bVal) return -1 * this.sortOrder;
              if (aVal > bVal) return 1 * this.sortOrder;
              return 0;
            });
          }

          this.handleDataLoadSuccess(e);
        },
      error: (error) => this.handleDataLoadError(error)
    });
  }

  private deleteItemsSequentially(ids: ID[], currentIndex: number, total: number) {
    if (currentIndex >= ids.length) {
      // All deletions completed
      this.selectedItems = [];
      this.saveTableState();
      this.loaderService.hide();
      Swal.fire('Sucesso!', `${total} registro(s) excluído(s) com sucesso!`, 'success');
      this.findAll();
      return;
    }

    this.service.delete(ids[currentIndex])
    .subscribe({
      next: () => {
          // Continue with next item
          this.deleteItemsSequentially(ids, currentIndex + 1, total);
        },
      error: (error) => {
          this.loaderService.hide();
          this.showError(error);
          Swal.fire('Erro!', `Erro ao excluir alguns registros. ${currentIndex} de ${total} foram excluídos.`, 'error');
        }
    });
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
      this.logger.error('Error setting up user permissions', error);
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
    this.tableColumnManager.updateColumnsForPermissions(this.tableConfig.columns, this.isReadOnly);
    this.updateDisplayedColumns();
    this.saveTableState();
  }
}

