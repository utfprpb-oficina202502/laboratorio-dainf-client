import { HostListener, Injector, OnInit, Directive, Input, ContentChild, TemplateRef, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import {Router} from '@angular/router';
import {CrudService} from '../service/crud.service';
import {ConfirmationService, MessageService} from 'primeng/api';
import {Table} from 'primeng/table';
import {MultiSelect} from 'primeng/multiselect';
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
  };

  // Template overrides for flexibility
  @ContentChild('headerTemplate') headerTemplate?: TemplateRef<any>;
  @ContentChild('toolbarStartTemplate') toolbarStartTemplate?: TemplateRef<any>;
  @ContentChild('toolbarEndTemplate') toolbarEndTemplate?: TemplateRef<any>;
  @ContentChild('emptyMessageTemplate') emptyMessageTemplate?: TemplateRef<any>;
  @ContentChild('loadingTemplate') loadingTemplate?: TemplateRef<any>;
  @ContentChild('captionTemplate') captionTemplate?: TemplateRef<any>;
  @ContentChild('rowExpansionTemplate') rowExpansionTemplate?: TemplateRef<any>;

  @ViewChild('dt') public dataTable?: Table;
  @ViewChild('globalFilterInput') globalFilterInput?: ElementRef<HTMLInputElement>;
  @ViewChild('columnToggleRef') columnToggleComponent?: MultiSelect;

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
  public expandedRows: { [key: string]: boolean } = {};
  public columnToggleModel: string[] = [];
  public columnToggleOptions: { label: string; value: string }[] = [];
  public readonly self = this as PrimeCrudListComponent<T, ID>;

  // Advanced features
  protected columnFilters: { [key: string]: any } = {};
  protected columnState: ColumnState[] = [];
  protected destroy$ = new Subject<void>();
  private readonly filterSubject = new Subject<string>();
  private readonly columnTemplates = new Map<string, TemplateRef<any>>();
  private keyboardShortcutHandlers: Array<{ predicate: (event: KeyboardEvent) => boolean; action: () => void; preventDefault?: boolean }> = [];
  private pendingSelectedKeys: any[] = [];
  private readonly defaultStateKey: string;
  private stateKey: string;
  private stateStorageRef?: Storage;

  // Performance optimizations
  trackByFn = (index: number, item: T): any => {
    const trackByField = this.tableConfig.trackByField || 'id';
    return (item as any)[trackByField] || index;
  };

  // Entity name for accessibility and labels
  protected abstract getEntityName(): string;
  protected abstract getEntityPluralName(): string;

  ngOnInit(): void {
    this.applyTableDefaults();
    this.initializeColumnHandling();
    this.initializeStateStorage();
    this.restoreTableState();
    this.initializeKeyboardShortcuts();
    this.setupUserPermissions();

    if (this.tableConfig.preloadData !== false) {
      this.findAll();
    } else {
      this.buildColumnsTable();
    }
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
    this.defaultStateKey = this.buildDefaultStateKey();
    this.stateKey = this.defaultStateKey;

    // Setup debounced filtering
    this.setupDebouncedFiltering();
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
    this.tableConfig.lazy = this.tableConfig.lazy !== false;
    this.tableConfig.lazyLoadOnInit = this.tableConfig.lazyLoadOnInit !== false;
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

  private buildDefaultStateKey(): string {
    const cleaned = this.urlForm ? this.urlForm.replace(/\//g, '-') : 'default';
    return 'prime-crud-' + cleaned;
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

    this.columnToggleOptions = this.tableConfig.columns
      .filter(col => col.toggleable !== false && col.field !== 'actions')
      .map(col => ({ label: col.header, value: col.field }));

    if (this.columnToggleModel.length === 0) {
      this.columnToggleModel = this.tableConfig.columns
        .filter(col => col.toggleable !== false && col.visible !== false && col.field !== 'actions')
        .map(col => col.field);
    }

    this.updateDisplayedColumns();
    this.updateGlobalFilterFields();
  }

  private initializeStateStorage(): void {
    if (!this.tableConfig.stateful) {
      this.stateStorageRef = undefined;
      return;
    }

    if (typeof window === 'undefined') {
      this.stateStorageRef = undefined;
      return;
    }

    try {
      this.stateKey = this.tableConfig.stateKey || this.defaultStateKey;
      this.stateStorageRef = this.tableConfig.stateStorage === 'session' ? window.sessionStorage : window.localStorage;
    } catch (error) {
      console.warn('Table state storage unavailable', error);
      this.stateStorageRef = undefined;
    }
  }

  private initializeKeyboardShortcuts(): void {
    if (this.tableConfig.keyboardShortcuts === false) {
      this.keyboardShortcutHandlers = [];
      return;
    }

    this.keyboardShortcutHandlers = [
      {
        predicate: (event: KeyboardEvent) => event.ctrlKey && event.altKey && event.key.toLowerCase() === 'f',
        action: () => this.focusGlobalFilter(),
        preventDefault: true
      },
      {
        predicate: (event: KeyboardEvent) => event.ctrlKey && event.altKey && event.key.toLowerCase() === 'n',
        action: () => { if (this.canCreate && !this.isReadOnly) { this.openForm(); } },
        preventDefault: true
      },
      {
        predicate: (event: KeyboardEvent) => event.ctrlKey && event.altKey && event.key.toLowerCase() === 'e',
        action: () => { if (this.canExport) { this.exportExcel(); } },
        preventDefault: true
      },
      {
        predicate: (event: KeyboardEvent) => event.ctrlKey && event.altKey && event.key.toLowerCase() === 'c',
        action: () => this.openColumnTogglePanel(),
        preventDefault: true
      },
      {
        predicate: (event: KeyboardEvent) => event.ctrlKey && event.altKey && event.key.toLowerCase() === 'l',
        action: () => this.clearGlobalFilter(),
        preventDefault: true
      },
      {
        predicate: (event: KeyboardEvent) => !event.ctrlKey && !event.altKey && event.key === 'Delete',
        action: () => { if (this.canDelete && this.selectedItems?.length) { this.deleteSelectedItems(); } },
        preventDefault: true
      }
    ];
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardInteractions(event: KeyboardEvent): void {
    if (this.tableConfig.keyboardShortcuts === false) {
      return;
    }

    const target = event.target as HTMLElement | null;
    const tagName = (target?.tagName || '').toLowerCase();
    if (['input', 'textarea'].includes(tagName) && !(event.ctrlKey || event.altKey)) {
      return;
    }

    for (const shortcut of this.keyboardShortcutHandlers) {
      if (shortcut.predicate(event)) {
        if (shortcut.preventDefault) {
          event.preventDefault();
          event.stopPropagation();
        }
        shortcut.action();
        break;
      }
    }
  }

  protected saveTableState(): void {
    if (!this.stateStorageRef || !this.tableConfig.stateful) {
      return;
    }

    const defaults = { columns: true, filters: true, sort: true, pagination: true, selection: true, expandedRows: true };
    const props = { ...defaults, ...(this.tableConfig.stateProps || {}) } as { [key: string]: boolean };

    const state: any = {};

    if (props.filters) {
      state.filterValue = this.filterValue;
    }

    if (props.sort) {
      state.sortField = this.sortField;
      state.sortOrder = this.sortOrder;
    }

    if (props.pagination) {
      state.pageSize = this.pageSize;
      state.pageIndex = this.pageIndex;
    }

    if (props.columns) {
      state.columns = this.tableConfig.columns?.map(col => ({ field: col.field, visible: col.visible !== false })) || [];
      state.columnToggleModel = this.columnToggleModel;
    }

    if (props.expandedRows) {
      state.expandedRowKeys = Object.keys(this.expandedRows || {}).filter(key => this.expandedRows[key]);
    }

    if (props.selection) {
      state.selectedKeys = this.getSelectionKeys();
    }

    if (Object.keys(state).length === 0) {
      return;
    }

    try {
      this.stateStorageRef.setItem(this.stateKey, JSON.stringify(state));
    } catch (error) {
      console.warn('Table state could not be saved', error);
    }
  }

  private restoreTableState(): void {
    if (!this.stateStorageRef || !this.tableConfig.stateful) {
      return;
    }

    const defaults = { columns: true, filters: true, sort: true, pagination: true, selection: true, expandedRows: true };
    const props = { ...defaults, ...(this.tableConfig.stateProps || {}) } as { [key: string]: boolean };

    try {
      const raw = this.stateStorageRef.getItem(this.stateKey);
      if (!raw) {
        return;
      }

      const state = JSON.parse(raw);

      if (props.columns && Array.isArray(state.columns) && this.tableConfig.columns) {
        state.columns.forEach((saved: any) => {
          const column = this.tableConfig.columns.find(col => col.field === saved.field);
          if (column) {
            column.visible = saved.visible !== false;
          }
        });
        if (Array.isArray(state.columnToggleModel)) {
          this.columnToggleModel = state.columnToggleModel;
        }
      }

      if (props.filters && typeof state.filterValue === 'string') {
        this.filterValue = state.filterValue;
      }

      if (props.sort && typeof state.sortField === 'string') {
        this.sortField = state.sortField;
      }

      if (props.sort && typeof state.sortOrder === 'number') {
        this.sortOrder = state.sortOrder;
      }

      if (props.pagination && typeof state.pageSize === 'number') {
        this.pageSize = state.pageSize;
        this.rows = this.pageSize;
      }

      if (props.pagination && typeof state.pageIndex === 'number') {
        this.pageIndex = state.pageIndex;
        this.first = this.pageIndex * this.pageSize;
      }

      if (props.expandedRows && Array.isArray(state.expandedRowKeys)) {
        this.expandedRows = state.expandedRowKeys.reduce((acc: { [key: string]: boolean }, key: string) => {
          acc[key] = true;
          return acc;
        }, {} as { [key: string]: boolean });
      }

      if (props.selection && Array.isArray(state.selectedKeys)) {
        this.pendingSelectedKeys = state.selectedKeys;
      }

      this.updateDisplayedColumns();
    } catch (error) {
      console.warn('Table state could not be restored', error);
    }
  }

  private getSelectionKeys(): any[] {
    if (!this.selectedItems?.length) {
      return [];
    }
    const keyField = this.tableConfig.trackByField || 'id';
    return this.selectedItems
      .map(item => (item as any)?.[keyField])
      .filter(key => key !== undefined && key !== null);
  }

  private restoreSelectionFromKeys(): void {
    if (!this.pendingSelectedKeys.length || !this.objects?.length) {
      return;
    }
    const keyField = this.tableConfig.trackByField || 'id';
    const keySet = new Set(this.pendingSelectedKeys);
    this.selectedItems = this.objects.filter(item => keySet.has((item as any)?.[keyField]));
    this.pendingSelectedKeys = [];
  }

  protected updateDisplayedColumns(): void {
    if (!this.tableConfig.columns) {
      this.columnsTable = [];
      this.displayedColumns = [];
      return;
    }

    const visibleColumns = this.tableConfig.columns.filter(col => col.visible !== false);
    this.columnsTable = visibleColumns.map(col => col.field);
    this.buildColumnsTable();
  }

  private updateGlobalFilterFields(): void {
    if (this.tableConfig.globalFilterFields?.length) {
      return;
    }
    if (!this.tableConfig.columns) {
      return;
    }
    this.tableConfig.globalFilterFields = this.tableConfig.columns
      .filter(col => col.field !== 'actions' && col.filterable !== false)
      .map(col => col.field);
  }

  onColumnToggleChange(selectedFields: string[]): void {
    if (!this.tableConfig.columns) {
      return;
    }

    if (!selectedFields || selectedFields.length === 0) {
      const fallback = this.tableConfig.columns.find(col => col.toggleable !== false && col.field !== 'actions');
      if (fallback) {
        selectedFields = [fallback.field];
      }
    }

    const selectedSet = new Set(selectedFields);
    this.tableConfig.columns.forEach(column => {
      if (column.toggleable === false || column.field === 'actions') {
        return;
      }
      column.visible = selectedSet.has(column.field);
    });

    this.columnToggleModel = selectedFields;
    this.updateDisplayedColumns();
    this.saveTableState();
  }

  onSelectionChange(selection: T[]): void {
    this.selectedItems = selection || [];
    this.saveTableState();
  }

  protected getRowKey(row: T): string {
    const keyField = this.tableConfig.rowExpansionKey || this.tableConfig.trackByField || 'id';
    return String((row as any)?.[keyField]);
  }

  isRowExpanded(row: T): boolean {
    const key = this.getRowKey(row);
    return !!this.expandedRows?.[key];
  }

  toggleRowExpansion(row: T): void {
    const key = this.getRowKey(row);
    if (!key) {
      return;
    }

    if (this.tableConfig.expandMode === 'single') {
      this.expandedRows = this.isRowExpanded(row) ? {} : { [key]: true };
    } else {
      const updated = { ...(this.expandedRows || {}) };
      if (updated[key]) {
        delete updated[key];
      } else {
        updated[key] = true;
      }
      this.expandedRows = updated;
    }

    this.saveTableState();
  }

  onRowExpand(event: any): void {
    const row = event?.data as T;
    if (!row) {
      return;
    }

    if (this.tableConfig.expandMode === 'single') {
      const key = this.getRowKey(row);
      this.expandedRows = key ? { [key]: true } : {};
    }
    this.saveTableState();
  }

  onRowCollapse(event: any): void {
    const row = event?.data as T;
    if (!row) {
      return;
    }

    const key = this.getRowKey(row);
    if (key && this.expandedRows?.[key]) {
      const updated = { ...(this.expandedRows || {}) };
      delete updated[key];
      this.expandedRows = updated;
    }
    this.saveTableState();
  }

  expandAllRows(): void {
    if (!this.objects?.length) {
      return;
    }
    const expanded: { [key: string]: boolean } = {};
    this.objects.forEach(row => {
      const key = this.getRowKey(row);
      if (key) {
        expanded[key] = true;
      }
    });
    this.expandedRows = expanded;
    this.saveTableState();
  }

  collapseAllRows(): void {
    if (!this.expandedRows || Object.keys(this.expandedRows).length === 0) {
      return;
    }
    this.expandedRows = {};
    this.saveTableState();
  }

  private focusGlobalFilter(): void {
    const element = this.globalFilterInput?.nativeElement;
    if (element) {
      element.focus({ preventScroll: true });
      if (typeof element.select === 'function') {
        element.select();
      }
    }
  }

  private openColumnTogglePanel(): void {
    if (this.tableConfig.columnToggle === false || !this.columnToggleComponent) {
      return;
    }
    if (this.columnToggleComponent.overlayVisible) {
      this.columnToggleComponent.hide();
    } else {
      this.columnToggleComponent.show();
    }
  }

  clearGlobalFilter(): void {
    if (!this.filterValue) {
      return;
    }
    this.applyFilter('');
  }

  public handleInteractiveCell(event: Event, id: ID): void {
    if (this.displayedColumns?.includes('actions')) {
      return;
    }

    if (!id) {
      console.warn('ID inválido para iteração:', id);
      return;
    }

    if (!(event instanceof KeyboardEvent || event instanceof MouseEvent || event instanceof TouchEvent)){
      console.warn('Unsupported event type for interaction:', event.type, event);
    }

    if (event instanceof KeyboardEvent) {
      const key = event.key?.toLowerCase();

      switch (key) {
        case 'enter':
        case ' ':
        case 'spacebar':
          event.preventDefault();
          event.stopPropagation();
          this.openBottomSheet(id);
          break;
        default:
          break;
      }
      return;
    }

    if (event instanceof MouseEvent) {
      switch (event.type) {
        case 'click':
          this.openBottomSheet(id);
          break;
        case 'dblclick':
          event.preventDefault();
          this.openBottomSheet(id);
          break;
        default:
          this.openBottomSheet(id);
          break;
      }
      return;
    }

    if ('TouchEvent' in window && event instanceof TouchEvent) {
      event.preventDefault();
      this.openBottomSheet(id);
    }
  }

  // PrimeNG DataView pagination event handler
  onPageChange(event: any) {
    this.loaderService.show();
    this.buildColumnsTable();

    this.first = event.first;
    this.rows = event.rows;
    this.pageIndex = Math.floor(event.first / event.rows);
    this.pageSize = event.rows;

    this.service.findAllPaged(this.pageIndex, this.pageSize, this.filterValue)
      .subscribe(
        e => {
          this.objects = e.content;
          this.totalElements = e.totalElements;
          this.pageSize = e.size;
          this.pageIndex = e.number;

          this.rows = this.pageSize;
          this.first = this.pageIndex * this.pageSize;

          this.restoreSelectionFromKeys();
          this.loaderService.hide();
          this.postFindAll();
          this.saveTableState();
        },
        error => {
          this.loaderService.hide();
          this.showError(error);
        }
      );
  }

  applyFilter(filterValue: string) {
    this.filterValue = (filterValue ?? '').trim();
    // Reset to the first page when filtering
    this.pageIndex = 0;
    this.first = 0;

    this.loadData();
  }

  findAll() {
    this.loaderService.show();
    this.service.findAllPaged(this.pageIndex, this.pageSize, this.filterValue || '')
      .subscribe(e => {
        this.objects = e.content;
        this.totalElements = e.totalElements;
        this.pageSize = e.size;
        this.pageIndex = e.number;

        this.rows = this.pageSize;
        this.first = this.pageIndex * this.pageSize;

        this.restoreSelectionFromKeys();
        this.loaderService.hide();
        this.postFindAll();
        this.saveTableState();
      }, error => {
        this.loaderService.hide();
        this.showError(error);
      });
    this.buildColumnsTable();
  }

  findAllByUsername() {
    this.loaderService.show();
    const u = localStorage.getItem('username');
    this.service.findAllByUsername(u)
      .subscribe(e => {
        this.objects = e;
        this.totalElements = e.length;
        this.pageIndex = 0;
        this.first = 0;
        this.restoreSelectionFromKeys();
        this.loaderService.hide();
        this.postFindAll();
        this.saveTableState();
      }, error => {
        this.loaderService.hide();
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
      confirmButtonText: 'Sim',
      cancelButtonText: 'Não'
    }).then((result) => {
      if (result.value) {
        this.loaderService.show();
        this.service.delete(id)
          .subscribe(e => {
            Swal.fire('Sucesso!', 'Registro excluído com sucesso!', 'success');
            this.findAll();
            this.loaderService.hide();
          }, error => {
            this.loaderService.hide();
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
    if (!this.hostListenerColumnEnable) {
      this.displayedColumns = [...this.columnsTable];
      return;
    }

    let responsiveColumns = [...this.columnsTable];

    if (window.innerWidth <= 1200) {
      responsiveColumns = responsiveColumns.filter(column => column !== 'actions');
    } else if (!responsiveColumns.includes('actions') && this.columnsTable.includes('actions')) {
      responsiveColumns = [...responsiveColumns, 'actions'];
    }

    this.displayedColumns = responsiveColumns;
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
    this.onGlobalFilterDebounced(value);
  }

  // Centralized data loading method
  private loadData() {
    this.loaderService.show();
    this.buildColumnsTable();

    this.service.findAllPaged(this.pageIndex, this.pageSize, this.filterValue)
      .subscribe(
        e => {
          this.objects = e.content;
          this.totalElements = e.totalElements;
          this.pageSize = e.size;
          this.pageIndex = e.number;

          this.rows = this.pageSize;
          this.first = this.pageIndex * this.pageSize;

          if (this.sortField && this.objects) {
            this.objects.sort((a: any, b: any) => {
              const aVal = a[this.sortField];
              const bVal = b[this.sortField];

              if (aVal < bVal) return -1 * this.sortOrder;
              if (aVal > bVal) return 1 * this.sortOrder;
              return 0;
            });
          }

          this.restoreSelectionFromKeys();
          this.loaderService.hide();
          this.postFindAll();
          this.saveTableState();
        },
        error => {
          this.loaderService.hide();
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
      confirmButtonText: 'Sim',
      cancelButtonText: 'Não'
    }).then((result) => {
      if (result.value) {
        this.loaderService.show();

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
      this.saveTableState();
      this.loaderService.hide();
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
          this.loaderService.hide();
          this.showError(error);
          Swal.fire('Erro!', `Erro ao excluir alguns registros. ${currentIndex} de ${total} foram excluídos.`, 'error');
        }
      );
  }

  // CSV Export using PrimeNG built-in functionality
  exportCSV(table?: Table | null) {
    const target = table || this.dataTable;

    if (!target) {
      console.warn('PrimeCrudListComponent: exportCSV called without table reference.');
      this.messageService.add({
        severity: 'warn',
        summary: 'Aviso',
        detail: 'Tabela não encontrada para exportação CSV'
      });
      return;
    }

    if (!this.objects || this.objects.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Aviso',
        detail: 'Não há dados para exportar'
      });
      return;
    }

    try {
      // Ensure table has columns property for PrimeNG exportCSV to work
      const exportableColumns = this.getExportableColumns();
      if (!exportableColumns || exportableColumns.length === 0) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Aviso',
          detail: 'Nenhuma coluna disponível para exportação'
        });
        return;
      }

      // Set the columns property that PrimeNG exportCSV expects
      (target as any).columns = exportableColumns.map(column => ({
        field: column.field,
        header: column.header
      }));

      // Call the native PrimeNG exportCSV method
      target.exportCSV();

      // Show success message
      this.messageService.add({
        severity: 'success',
        summary: 'Sucesso',
        detail: `${this.getEntityPluralName()} exportados para CSV com sucesso`
      });

    } catch (error) {
      console.error('Error exporting CSV:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'Erro ao exportar dados para CSV'
      });
    }
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
    if (!this.tableConfig.columns) {
      return;
    }

    const actionsColumn = this.tableConfig.columns.find(col => col.field === 'actions');
    if (actionsColumn) {
      actionsColumn.visible = !this.isReadOnly && actionsColumn.visible !== false;
    }

    this.updateDisplayedColumns();
    this.saveTableState();
  }

  // Enhanced filtering with debouncing
  onGlobalFilterDebounced(value: string): void {
    this.filterSubject.next((value ?? '').trim());
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

    if (this.tableConfig.expandable) {
      count++;
    }

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

