import {
  ChangeDetectorRef,
  computed,
  contentChild,
  Directive,
  effect,
  ElementRef,
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
import {CrudService, PageResponse} from '../service/crud.service';
import {ConfirmationService, MessageService, SortEvent} from 'primeng/api';
import {Table, TablePageEvent, TableRowCollapseEvent, TableRowExpandEvent} from 'primeng/table';
import {MultiSelect} from 'primeng/multiselect';
import {Exception} from '../../exception/exception';
import {LoaderService} from '../loader/loader.service';
import {LoginService} from '../../login/login.service';
import {PermissionService} from '../service/permission.service';
import {ColumnState, TableColumn, TableConfiguration} from '../model/table-config.interface';
import {debounceTime, distinctUntilChanged, fromEvent, Subject, takeUntil} from 'rxjs';
import {LoggerService} from '../services/logger.service';
import {TableExportService} from '../services/table-export.service';
import {TableStateManagerService} from '../services/table-state-manager.service';
import {KeyboardShortcut, TableKeyboardService} from '../services/table-keyboard.service';
import {TableColumnManagerService} from '../services/table-column-manager.service';
import {TableRowExpansionManagerService} from '../services/table-row-expansion-manager.service';
import {StorageService} from '../services/storage.service';
import {BreakpointService} from '../services/breakpoint.service';
import {SORT_ORDER, SortOrderType} from '../constants';

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
  protected readonly cdr = inject(ChangeDetectorRef, {optional: true});
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly rowExpansionTemplate = contentChild<TemplateRef<any>>('rowExpansionTemplate');
  readonly dataTable = viewChild<Table>('dt');
  readonly globalFilterInput = viewChild<ElementRef<HTMLInputElement>>('globalFilterInput');
  readonly columnToggleComponent = viewChild<MultiSelect>('columnToggleRef');

  // Template overrides for flexibility
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

  // Permission signals - computed wrappers for lazy evaluation after PermissionService initialization
  // Automatically update when user authentication state changes
  readonly canCreate = computed(() => this.permissionService.canCreate());
  readonly canEdit = computed(() => this.permissionService.canEdit());
  readonly canDelete = computed(() => this.permissionService.canDelete());
  readonly canExport = computed(() => this.permissionService.canExport());
  readonly isReadOnly = computed(() => this.permissionService.isReadOnly());
  readonly userRole = computed(() => this.permissionService.userRole());
  readonly isAlunoOrProfessor = computed(() => this.permissionService.isAlunoOrProfessor());
  protected readonly logger: LoggerService;
  protected readonly tableExportService: TableExportService;
  protected readonly tableStateManager: TableStateManagerService;
  protected readonly tableKeyboardService: TableKeyboardService;
  protected readonly tableColumnManager: TableColumnManagerService;
  protected readonly tableRowExpansionManager: TableRowExpansionManagerService;
  protected readonly storageService: StorageService;
  protected readonly breakpointService: BreakpointService;
  private readonly exception: Exception;

  /**
   * Computed signals for template usage - optimized for OnPush change detection
   * Automatically update when BreakpointService viewport signals change
   */
  protected readonly isDesktopView = computed(() => this.breakpointService.isDesktop());
  protected readonly isMobileView = computed(() => this.breakpointService.isMobile());
  protected readonly isTabletView = computed(() => this.breakpointService.isTablet());

  /**
   * Computed signals for table state - reactive UI updates
   */
  readonly hasData = computed(() => this.objects.length > 0);
  readonly hasSelectedItems = computed(() => this.selectedItems().length > 0);
  readonly selectedCount = computed(() => this.selectedItems().length);
  readonly isEmpty = computed(() => !this.loading() && this.objects.length === 0);
  readonly deleteButtonLabel = computed(() => {
    const count = this.selectedCount();
    if (count > 0) {
      return `Deletar ${count} ${count === 1 ? this.getEntityName() : this.getEntityPluralName()}`;
    }
    return `Deletar ${this.getEntityPluralName()} Selecionados`;
  });

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
    lazyLoadOnInit: false,
    preloadData: true,
    keyboardShortcuts: true
  });
  protected columnFilters: Record<string, unknown> = {};
  // Internal mutable configuration for child components to override
  private _tableConfigOverride: TableConfiguration | null = null;
  public selectedItems = signal<T[]>([]);
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
    this.breakpointService = inject(BreakpointService);
    this.exception = inject(Exception);

    // Initialize displayedColumns as an empty array, will be set in buildColumnsTable()
    this.displayedColumns = [];
    this.rows = this.pageSize;
    // stateKey will be properly initialized in initializeStateStorage() after urlForm is available
    this.stateKey = '';

    // Set up debounced filtering
    this.setupDebouncedFiltering();

    // Effect to update columns when permissions change
    effect(() => {
      // Track permission changes
      this.isReadOnly();
      // Update columns based on new permissions
      if (this.tableConfig.columns) {
        this.updateColumnsForPermissions();
      }
    });
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
    this.setupBreakpointObserver();
    this.setupKeyboardEventListener();

    if (this.tableConfig.preloadData === false) {
      this.buildColumnsTable();
    } else {
      this.findAll();
    }
  }

  // Performance optimizations
  trackByFn = (index: number, item: T): string | number => {
    const trackByField = this.tableConfig.trackByField || 'id';
    return (item as Record<string, string | number>)[trackByField] ?? index;
  };

  // PrimeNG DataView pagination event handler
  onPageChange(event: TablePageEvent) {
    this.loading.set(true);
    this.buildColumnsTable();

    this.first = event.first ?? 0;
    this.rows = event.rows ?? 10;
    this.pageIndex = Math.floor((event.first ?? 0) / (event.rows ?? 10));
    this.pageSize = event.rows ?? 10;

    this.service.findAllPaged(this.pageIndex, this.pageSize, this.filterValue, this.buildSortParam())
    .subscribe({
      next: (e) => this.handleDataLoadSuccess(e),
      error: (error) => this.handleDataLoadError(error)
    });
  }

  buildColumnsTable() {
    // Use BreakpointService for consistent responsive behavior
    const currentWidth = this.breakpointService.isDesktop() ? 1024 : 767;
    this.displayedColumns = this.tableColumnManager.buildDisplayedColumns(
      this.columnsTable,
      this.hostListenerColumnEnable,
      currentWidth
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.saveTableState();
  }

  findAll() {
    this.loading.set(true);

    // Start an HTTP request immediately without blocking on DOM calculations
    this.service.findAllPaged(this.pageIndex, this.pageSize, this.filterValue || '', this.buildSortParam())
    .subscribe({
      next: (e) => {
        this.buildColumnsTable();  // Build columns while data is being processed
        this.handleDataLoadSuccess(e);
      },
      error: (error) => this.handleDataLoadError(error)
    });
  }

  delete(id: ID) {
    this.confirmationService.confirm({
      message: 'Tem certeza que deseja remover o registro? A ação não poderá ser desfeita.',
      header: 'Confirmação',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sim',
      rejectLabel: 'Não',
      accept: () => {
        this.loaderService.show();
        this.service.delete(id)
        .subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Sucesso!',
              detail: 'Registro excluído com sucesso!',
              life: 3000
            });
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
  // Passa columnToggleModel para exportar apenas colunas visíveis selecionadas pelo usuário
  exportExcel() {
    const exportableColumns = this.getExportableColumns();
    const fileName = this.getExportFileName();
    this.tableExportService.exportToExcel(this.objects, exportableColumns, fileName, this.columnToggleModel);
  }

  onSelectionChange(selection: T[]): void {
    this.selectedItems.set(selection || []);
    this.saveTableState();
  }

  showError(error: unknown): void {
    this.exception.addMessage(error);
  }

  postFindAll(): void {
    // Hook para processamento customizado após carregar dados
  }

  /**
   * Setup keyboard event listener using Angular v20 pattern with fromEvent
   * Replaces @HostListener for better performance and modern Angular practices
   */
  private setupKeyboardEventListener(): void {
    if (this.tableConfig.keyboardShortcuts === false) {
      return;
    }

    fromEvent<KeyboardEvent>(document, 'keydown')
    .pipe(takeUntil(this.destroy$))
    .subscribe((event) => {
      this.tableKeyboardService.handleKeyboardEvent(event, this.keyboardShortcutHandlers);
    });
  }

  private setupBreakpointObserver(): void {
    // Subscribe to breakpoint changes for responsive column adjustments
    this.breakpointService.observe('(min-width: 768px)')
    .pipe(takeUntil(this.destroy$))
    .subscribe(() => {
      this.buildColumnsTable();
      this.cdr?.markForCheck();
    });
  }

  /**
   * Handler do evento de ordenação do PrimeNG Table.
   * Atualiza campo e direção de ordenação, reseta para primeira página e recarrega dados.
   *
   * @param event Evento de ordenação contendo field e order
   *
   * @example
   * // No template:
   * <p-table (onSort)="onSort($event)">
   */
  onSort(event: SortEvent): void {
    this.sortField = event.field as string;
    this.sortOrder = (event.order ?? SORT_ORDER.ASC) as SortOrderType;

    // Reset to the first page when sorting
    this.pageIndex = 0;
    this.first = 0;

    this.loadData();
  }

  /**
   * Constrói o parâmetro de ordenação para API backend no formato Spring Data.
   *
   * @returns String no formato 'field,direction' ou undefined se não houver ordenação
   *
   * @example
   * // Retornos possíveis:
   * buildSortParam() // → undefined (sem ordenação)
   * buildSortParam() // → 'dataEmprestimo,asc' (ordenação ascendente)
   * buildSortParam() // → 'id,desc' (ordenação descendente)
   *
   * // Uso no service:
   * this.service.findAllPaged(page, size, filter, this.buildSortParam())
   */
  protected buildSortParam(): string | undefined {
    if (!this.sortField) {
      return undefined;
    }
    const direction = this.sortOrder === SORT_ORDER.ASC ? 'asc' : 'desc';
    return `${this.sortField},${direction}`;
  }

  // Bulk delete functionality
  deleteSelectedItems() {
    const items = this.selectedItems();
    if (!items || items.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Aviso',
        detail: 'Nenhum item selecionado para exclusão'
      });
      return;
    }

    const itemCount = items.length;
    this.confirmationService.confirm({
      message: `Tem certeza que deseja remover ${itemCount} registro(s)? A ação não poderá ser desfeita.`,
      header: 'Confirmação',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sim',
      rejectLabel: 'Não',
      accept: () => {
        this.loaderService.show();

        // Extract IDs from selected items
        const ids = items.map((item: T) => (item as T & { id: ID }).id);

        // Delete items sequentially (could be enhanced for bulk API call)
        this.deleteItemsSequentially(ids, 0, itemCount);
      }
    });
  }

  // Get accessibility labels
  getTableAriaLabel(): string {
    return `Tabela de ${this.getEntityPluralName()} com ${this.totalElements} registros`;
  }

  // CSV Export com suporte a exportValueGetter customizado
  exportCSV(table?: Table | null) {
    const tableRef = table || this.dataTable();
    const exportableColumns = this.getExportableColumns();
    const fileName = this.getExportFileName();
    this.tableExportService.exportToCSV(tableRef, this.objects, exportableColumns, fileName);
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

  // Setup debounced filtering for better performance
  private setupDebouncedFiltering(): void {
    this.filterSubject.pipe(
      debounceTime(1000),  // 1 segundo para usuário terminar de digitar
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(filterValue => {
      this.applyFilter(filterValue);
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
      next: (e) => this.handleArrayDataLoadSuccess(e),
      error: (error) => this.handleDataLoadError(error)
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
      this.isReadOnly()
    );
  }

  // Check if actions column should be shown
  shouldShowActionsColumn(): boolean {
    return this.tableColumnManager.shouldShowActionsColumn(this.displayedColumns, this.isReadOnly());
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

  getTableAriaDescription(): string {
    return `Tabela contendo ${this.totalElements} ${this.getEntityName().toLowerCase()} registros. Use as setas para navegar.`;
  }

  protected applyTableDefaults(): void {
    this.tableConfig.striped = this.tableConfig.striped !== false;
    this.tableConfig.rowHover = this.tableConfig.rowHover !== false;
    this.tableConfig.resizableColumns = this.tableConfig.resizableColumns !== false && this.tableConfig.resizable !== false;
    this.tableConfig.columnResizeMode = this.tableConfig.columnResizeMode || 'fit';
    // Default to true for proper server-side pagination with totalRecords
    this.tableConfig.lazy ??= true;
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
    this.tableConfig.stateKey = this.tableConfig.stateKey || this.buildDefaultStateKey();
    this.tableConfig.pageSize = this.tableConfig.pageSize || this.pageSize;
    this.tableConfig.pageSizeOptions = this.tableConfig.pageSizeOptions || [5, 10, 25, 50, 100];
    this.tableConfig.globalFilter = this.tableConfig.globalFilter !== false;
    this.pageSize = this.tableConfig.pageSize || 10;
    this.rows = this.pageSize;
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
        selectedItems: this.selectedItems()
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
        if (this.canCreate() && !this.isReadOnly()) {
          this.openForm();
        }
      },
      exportExcel: () => {
        if (this.canExport()) {
          this.exportExcel();
        }
      },
      openColumnToggle: () => this.openColumnTogglePanel(),
      clearGlobalFilter: () => this.clearGlobalFilter(),
      deleteSelected: () => {
        if (this.canDelete() && this.selectedItems()?.length) {
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
    this.selectedItems.set(this.tableStateManager.restoreSelectionFromKeys(
      this.objects,
      this.pendingSelectedKeys,
      trackByField
    ) as T[]);
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
    this.stateKey = this.tableConfig.stateKey || this.buildDefaultStateKey();
    this.stateStorageRef = this.tableStateManager.initializeStorage(
      this.tableConfig.stateful || false,
      this.tableConfig.stateStorage || 'local'
    );
  }

  /**
   * Common finalization logic for all data loading operations
   * Ensures consistent post-load behavior including change detection
   */
  private finalizeDataLoad(): void {
    this.restoreSelectionFromKeys();
    this.loading.set(false);
    this.postFindAll();
    this.saveTableState();
    this.triggerChangeDetection();
  }

  /**
   * Handler for paginated responses (findAllPaged)
   * Processes PageResponse<T> from Spring Data pagination endpoints
   */
  private handleDataLoadSuccess(response: PageResponse<T>): void {
    this.objects = response.content;
    this.totalElements = response.totalElements;
    this.pageSize = response.size;
    this.pageIndex = response.number;

    this.rows = this.pageSize;
    this.first = this.pageIndex * this.pageSize;

    this.finalizeDataLoad();
  }

  /**
   * Handler for array responses (findAllByUsername)
   * Processes simple T[] from user-specific endpoints without pagination
   */
  private handleArrayDataLoadSuccess(data: T[]): void {
    this.objects = data;
    this.totalElements = data.length;
    this.pageIndex = 0;
    this.first = 0;

    this.finalizeDataLoad();
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

  // Centralized data loading method - server-side sorting applied by backend
  private loadData() {
    this.loading.set(true);
    this.buildColumnsTable();

    this.service.findAllPaged(this.pageIndex, this.pageSize, this.filterValue, this.buildSortParam())
    .subscribe({
      next: (e) => this.handleDataLoadSuccess(e),
      error: (error) => this.handleDataLoadError(error)
    });
  }

  private deleteItemsSequentially(ids: ID[], currentIndex: number, total: number) {
    if (currentIndex >= ids.length) {
      // All deletions completed
      this.selectedItems.set([]);
      this.saveTableState();
      this.loaderService.hide();
      this.messageService.add({
        severity: 'success',
        summary: 'Sucesso!',
        detail: `${total} registro(s) excluído(s) com sucesso!`,
        life: 3000
      });
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
        this.messageService.add({
          severity: 'error',
          summary: 'Erro!',
          detail: `Erro ao excluir alguns registros. ${currentIndex} de ${total} foram excluídos.`,
          life: 5000
        });
        }
    });
  }


  // Update columns based on user permissions
  private updateColumnsForPermissions(): void {
    this.tableColumnManager.updateColumnsForPermissions(this.tableConfig.columns, this.isReadOnly());
    this.updateDisplayedColumns();
    this.saveTableState();
  }
}

