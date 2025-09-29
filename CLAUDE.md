# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Development server**: `npm run dev` (starts dev server at http://localhost:4200)
- **Production build**: `npm run build` (builds for production with Angular configuration)
- **Testing**: `npm run test` (runs unit tests with Karma)
- **Single test**: `npm run test -- --include="**/[component-name].spec.ts"` (run specific test file)
- **Linting**: `npm run lint` (runs TSLint with project rules)
- **E2E testing**: `npm run e2e` (runs end-to-end tests)
- **Production start**: `npm start` (starts Node.js Express server for production)

## Multi-Environment Build Support

This project supports building for multiple environments with specific configurations:
- **Production**: `ng build --configuration production`
- **Robotnik**: `ng build --configuration robotnik`a
- **Patobots**: `ng build --configuration patobots`
- **Daele**: `ng build --configuration daele`

Each environment has its own environment file in `src/environments/` and corresponding Docker configurations.

## Architecture Overview

This is an Angular 20+ application for the DAINF (Departamento Acadêmico de Informática) laboratory management system at UTFPR Campus Pato Branco.

### Core Structure
- **Frontend**: Angular with TypeScript, PrimeNG (primary), Bootstrap, Angular Material (being phased out)
- **Backend Integration**: RESTful API communication via HttpClient
- **Authentication**: JWT-based with HTTP interceptor for token management
- **Internationalization**: Portuguese (pt-BR) locale with custom configurations

## Migration Status

This application is currently being migrated from Angular 18 to Angular 20+ patterns:

**Current State**: Traditional NgModules architecture with Angular 20+ dependencies
**Target State**: Modern Angular 20+ with standalone components, signals, and new control flow

**Migration Priorities**:
- ✅ Use Angular 20+ patterns for all new components
- ✅ Prefer PrimeNG over Angular Material for new UI components
- ⏳ Gradually migrate existing components to standalone architecture
- ⏳ Replace Angular Material components with PrimeNG equivalents

### Key Architectural Components

## PrimeNG List Migration

When migrating legacy Angular Material list screens (`CrudListComponent`) to the new PrimeNG stack (`PrimeCrudListComponent`), follow these practices so code stays consistent and reusable across the app.

### Migration Process Overview

1. **Assess before editing**
   - Confirm the feature really needs the migration (touching CRUD flows or UI refresh).
   - Capture current behaviors: displayed columns, filters, bottom-sheet actions, custom formatters.
   - Check for shared CSS or services referenced by the Material table so they can be reused or retired.

2. **Refactor TypeScript first**
   - Replace the `CrudListComponent` inheritance with `PrimeCrudListComponent`.
   - Provide the required entity metadata (`getEntityName`, `getEntityPluralName`) and export naming overrides.
   - Build a `tableConfig` (columns, permissions, state settings, global filter fields) instead of manipulating `displayedColumns` directly.
   - Remove `MatTableDataSource`, `MatPaginator`, `MatSort`, and associated imports/events. Tie pagination/sorting into the Prime base calls (`onPageChange`, `onSort`, `applyFilter`).
   - Enable optional features intentionally: column toggles, expansion rows, localStorage state, keyboard shortcuts. Do not turn them on by default unless the UX requires it.

3. **Rebuild the template with PrimeNG widgets**
   - Swap `<mat-card>`, `<mat-table>`, `<mat-paginator>` etc. for their Prime equivalents (`p-card`, `p-table`, `p-toolbar`, built-in paginator).
   - Use Prime control-flow ready markup: leverage `p-toolbar`, `p-button`, `p-iconField`, `p-tableCheckbox`, etc.
   - Keep the structure accessible: add `aria-label`s, current page summaries, and keyboard-friendly buttons (see the new base component helpers).
   - Adopt column templates via `getVisibleColumns()` and the table config instead of hard-coded `<td>` order.
   - When Prime features aren't needed (row expansion, column toggler), leave them out—`PrimeCrudListComponent` has sensible defaults.

4. **Clean dependencies**
   - Drop Angular Material modules that the component no longer needs (module imports, styles, providers).
   - Ensure PrimeNG modules are pulled in once, preferably through the standalone component `imports` array.
   - Remove legacy CSS that targeted `.mat-` classes. Replace with Prime-friendly utility classes or scoped styles.

5. **Verify behaviour**
   - Exercise pagination, sorting, filtering, bulk delete, and bottom-sheet actions after the migration.
   - Test keyboard shortcuts (Ctrl+Alt+F/N/E/C/L) if the component enables them.
   - Confirm persisted state works when `stateful` is true (reload the page to check column visibility, filters, expansion).
   - Update or add unit/integration tests so the Prime-based component is covered.

6. **Roll out incrementally**
   - Keep PRs focused: migrate one list at a time.
   - Share new patterns in documentation/examples so other lists can follow the same approach.
   - When the Prime base gains new capabilities, retrofit earlier migrations to stay consistent.

### Complete Migration Template

#### TypeScript Migration Pattern

```typescript
// 1. Update imports
import {Component, forwardRef, Injector} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {PrimeCrudListComponent} from '../framework/component/prime-crud.list.component';
import {TableColumn} from '../framework/model/table-config.interface';

// PrimeNG Components (customize based on component needs)
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

// 2. Update component decorator
@Component({
  selector: 'app-list-[entity]',
  templateUrl: './[entity].list.component.html',
  styleUrls: ['./[entity].list.component.css'],
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
  providers: [{ provide: PrimeCrudListComponent, useExisting: forwardRef(() => EntityListComponent) }]
})
export class EntityListComponent extends PrimeCrudListComponent<Entity, KeyType> {

  // 3. Define table columns with proper metadata
  private readonly tableColumns: TableColumn[] = [
    {
      field: 'id',
      header: 'Codigo',
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
      field: 'actions',
      header: 'Opcoes',
      type: 'custom',
      sortable: false,
      filterable: false,
      exportable: false,
      align: 'center',
      width: '10rem',
      toggleable: false
    }
  ];

  constructor(protected entityService: EntityService,
              protected injector: Injector) {
    super(entityService, injector, ['id', 'nome', 'actions'], 'entity/form');
    this.configureTable();
  }

  // 4. Implement required methods
  protected override getEntityName(): string {
    return 'Entity';
  }

  protected override getEntityPluralName(): string {
    return 'Entities';
  }

  protected override getExportFileName(): string {
    return 'entities';
  }

  // 5. Configure table with comprehensive settings
  private configureTable(): void {
    this.tableConfig = {
      ...this.tableConfig,
      columns: this.tableColumns,
      globalFilterFields: ['id', 'nome'],
      defaultSortField: 'nome',
      defaultSortOrder: 1,
      caption: 'Lista de Entities',
      trackByField: 'id',
      emptyMessage: 'Nenhuma entity encontrada.',
      loadingMessage: 'Carregando entities...',
      globalFilterPlaceholder: 'Buscar entities...',
      columnToggle: true,
      expandable: false,
      expandMode: 'single',
      rowExpansionKey: 'id',
      stateful: true,
      stateKey: 'entity-list',
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
}
```

#### HTML Template Migration Pattern

```html
<div class="container-fluid my-3">
  <p-card>
    <ng-template pTemplate="header">
      <div class="flex items-center justify-between p-3">
        <span class="text-xl font-bold">Entities</span>
      </div>
    </ng-template>

    <ng-template pTemplate="content">
      <!-- Toolbar with optional custom templates -->
      <app-prime-crud-toolbar [table]="dt" [list]="self">
        <ng-template #toolbarStartTemplate>
          <!-- Custom toolbar buttons go here -->
        </ng-template>
      </app-prime-crud-toolbar>

      <!-- Main table -->
      <p-table
        #dt
        [value]="objects"
        [rows]="rows"
        [totalRecords]="totalElements"
        [paginator]="true"
        [rowsPerPageOptions]="tableConfig.pageSizeOptions || [5, 10, 25, 50, 100]"
        (onPage)="onPageChange($event)"
        (onSort)="onSort($event)"
        [first]="first"
        [lazy]="tableConfig.lazy !== false"
        [lazyLoadOnInit]="tableConfig.lazyLoadOnInit !== false"
        [(selection)]="selectedItems"
        (selectionChange)="onSelectionChange($event)"
        [dataKey]="tableConfig.rowExpansionKey || 'id'"
        [resizableColumns]="tableConfig.resizableColumns !== false"
        [columnResizeMode]="tableConfig.columnResizeMode || 'fit'"
        [rowHover]="tableConfig.rowHover !== false"
        [stripedRows]="tableConfig.striped !== false"
        [rowExpandMode]="tableConfig.expandMode || 'single'"
        [expandedRowKeys]="expandedRows"
        (onRowExpand)="onRowExpand($event)"
        (onRowCollapse)="onRowCollapse($event)"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} registros"
        [showCurrentPageReport]="true"
        [tableStyleClass]="getTableStyleClass()"
        [attr.aria-label]="'Lista de entities com ' + totalElements + ' registro(s)'">

        <!-- Search caption -->
        <ng-template pTemplate="caption">
          <div class="d-flex align-items-center justify-content-end gap-2 flex-wrap">
            <p-iconField iconPosition="left" class="flex-grow-1 flex-md-grow-0">
              <p-inputIcon class="pi pi-search" aria-hidden="true"></p-inputIcon>
              <input
                #globalFilterInput
                pInputText
                type="text"
                (input)="onGlobalFilter($any($event.target).value)"
                [value]="filterValue"
                [placeholder]="getGlobalFilterPlaceholder()"
                [attr.aria-label]="'Campo de busca para filtrar entities'"
                autocomplete="off" />
            </p-iconField>
            <p-button
              type="button"
              severity="secondary"
              [outlined]="true"
              (onClick)="clearGlobalFilter()"
              [attr.aria-label]="'Limpar filtro global'">
              <span pButtonIcon class="pi pi-filter-slash"></span>
              <span pButtonLabel>Limpar</span>
            </p-button>
          </div>
        </ng-template>

        <!-- Table header -->
        <ng-template pTemplate="header">
          <tr>
            @if (tableConfig.expandable) {
              <th scope="col" style="width: 3rem" [attr.aria-label]="'Alternar detalhes'"></th>
            }
            @if (!isReadOnly && tableConfig.selectable !== false) {
              <th scope="col" style="width: 3rem" [attr.aria-label]="'Selecao de entities'">
                <p-tableHeaderCheckbox [attr.aria-label]="'Selecionar todas as entities'"></p-tableHeaderCheckbox>
              </th>
            }
            @for (column of getVisibleColumns(); track column.field) {
              <th
                scope="col"
                [attr.id]="'col-' + column.field"
                [attr.data-field]="column.field"
                [pSortableColumn]="column.sortable === false || column.field === 'actions' ? null : column.field"
                [style.width]="column.width"
                [style.min-width]="column.minWidth"
                [ngClass]="column.headerClass"
                [attr.aria-label]="column.tooltip || column.header">
                <div class="d-flex align-items-center gap-2" [class.justify-content-center]="column.align === 'center'">
                  {{ column.header }}
                  @if (column.sortable !== false && column.field !== 'actions') {
                    <p-sortIcon [field]="column.field" aria-hidden="true"></p-sortIcon>
                  }
                </div>
              </th>
            }
          </tr>
        </ng-template>

        <!-- Table body with modern control flow -->
        <ng-template pTemplate="body" let-row>
          <tr>
            @if (tableConfig.expandable) {
              <td style="width: 3rem">
                <button
                  type="button"
                  pButton
                  [pRowToggler]="row"
                  class="p-button-text p-button-rounded"
                  [attr.aria-label]="(isRowExpanded(row) ? 'Recolher' : 'Expandir') + ' detalhes da entity ' + row.nome">
                  <span pButtonIcon [ngClass]="isRowExpanded(row) ? 'pi pi-chevron-down' : 'pi pi-chevron-right'"></span>
                </button>
              </td>
            }
            @if (!isReadOnly && tableConfig.selectable !== false) {
              <td style="width: 3rem">
                <p-tableCheckbox
                  [value]="row"
                  [attr.aria-label]="'Selecionar entity ' + row.nome">
                </p-tableCheckbox>
              </td>
            }
            @for (column of getVisibleColumns(); track column.field) {
              <td
                [ngSwitch]="column.field"
                [style.text-align]="column.align || 'left'"
                [style.width]="column.width"
                [style.min-width]="column.minWidth"
                [attr.headers]="'col-' + column.field">
                @switch (column.field) {
                  @case ('actions') {
                    <div class="d-flex align-items-center gap-2 justify-content-center">
                      @if (canEdit) {
                        <p-button
                          severity="secondary"
                          [outlined]="true"
                          [rounded]="true"
                          pTooltip="Editar entity"
                          tooltipPosition="top"
                          (onClick)="edit(row.id)"
                          [attr.aria-label]="'Editar entity ' + row.nome">
                          <span pButtonIcon class="pi pi-pencil"></span>
                        </p-button>
                      }
                      @if (canDelete) {
                        <p-button
                          severity="danger"
                          [outlined]="true"
                          [rounded]="true"
                          pTooltip="Remover entity"
                          tooltipPosition="top"
                          (onClick)="delete(row.id)"
                          [attr.aria-label]="'Remover entity ' + row.nome">
                          <span pButtonIcon class="pi pi-trash"></span>
                        </p-button>
                      }
                    </div>
                  }
                  @default {
                    <span
                      [attr.role]="!displayedColumns.includes('actions') ? 'button' : null"
                      [attr.tabindex]="!displayedColumns.includes('actions') ? '0' : null"
                      [class.cursor-pointer]="!displayedColumns.includes('actions')"
                      (click)="handleInteractiveCell($event, row.id)"
                      (keydown.enter)="handleInteractiveCell($event, row.id)"
                      (keydown.space)="handleInteractiveCell($event, row.id)"
                      [attr.aria-label]="column.header + ': ' + row[column.field]">
                      {{ row[column.field] }}
                    </span>
                  }
                }
              </td>
            }
          </tr>
        </ng-template>

        <!-- Row expansion template -->
        <ng-template pTemplate="rowexpansion" let-row>
          @if (rowExpansionTemplate) {
            <ng-container [ngTemplateOutlet]="rowExpansionTemplate" [ngTemplateOutletContext]="{$implicit: row}"></ng-container>
          } @else {
            <div class="p-3">
              <p class="mb-1"><strong>Codigo:</strong> {{ row.id }}</p>
              <p class="mb-0"><strong>Nome:</strong> {{ row.nome }}</p>
            </div>
          }
        </ng-template>

        <!-- Empty state -->
        <ng-template pTemplate="emptymessage">
          <tr>
            <td [attr.colspan]="getColumnCount()" class="text-center p-4">
              <i class="pi pi-search" style="font-size: 3rem; color: #dee2e6;"></i>
              <p class="mt-3 mb-0">Nenhuma entity encontrada.</p>
            </td>
          </tr>
        </ng-template>
      </p-table>
    </ng-template>
  </p-card>
</div>
```

### Advanced Migration Patterns

#### Complex Cell Rendering
For components with custom data formatting (like `formatGruposAcesso` in usuario.list.component):

```typescript
@case ('customField') {
  <span
    [attr.role]="!displayedColumns.includes('actions') ? 'button' : null"
    [attr.tabindex]="!displayedColumns.includes('actions') ? '0' : null"
    [class.cursor-pointer]="!displayedColumns.includes('actions')"
    (click)="handleInteractiveCell($event, row.id)"
    [attr.aria-label]="column.header + ': ' + customFormatMethod(row[column.field])">
    {{ customFormatMethod(row[column.field]) }}
  </span>
}
```

#### Status Tags with PrimeNG
For status indicators (like in emprestimo.list.component):

```typescript
@case ('status') {
  <div class="d-flex justify-content-center">
    @if (getStatusMethod(row) === 'ACTIVE') {
      <p-tag value="Ativo" severity="success"></p-tag>
    }
    @if (getStatusMethod(row) === 'INACTIVE') {
      <p-tag value="Inativo" severity="danger"></p-tag>
    }
  </div>
}
```

#### Image Handling
For components with image display (like item.list.component):

```typescript
@case ('imagem') {
  <div class="d-flex justify-content-center">
    <img
      style="width: 80px; height: 60px; object-fit: cover; border-radius: 4px;"
      [src]="row.imageField?.length > 0 ? imageUrl + row.imageField[0].name : '/assets/no-image.png'"
      [alt]="'Imagem do item ' + row.nome"
      (click)="handleImageClick(row.id)"
      class="cursor-pointer" />
  </div>
}
```

### Migration Checklist

- [ ] Import `PrimeCrudListComponent` and `TableColumn`
- [ ] Add required PrimeNG module imports
- [ ] Update component decorator with imports and providers
- [ ] Change inheritance from `CrudListComponent` to `PrimeCrudListComponent`
- [ ] Define `tableColumns` array with proper metadata
- [ ] Implement required methods: `getEntityName()`, `getEntityPluralName()`, `getExportFileName()`
- [ ] Create `configureTable()` method with comprehensive table configuration
- [ ] Replace `<mat-card>` with `<p-card>` and proper template structure
- [ ] Replace `<mat-table>` with `<p-table>` using modern control flow
- [ ] Add `<app-prime-crud-toolbar>` with proper bindings
- [ ] Handle custom cell rendering with `@switch` statements
- [ ] Add proper accessibility attributes and keyboard navigation
- [ ] Test all functionality: sorting, filtering, pagination, actions
- [ ] Remove unused Angular Material imports and dependencies

**Module Organization**: The application follows a feature-based module structure where each business domain has its own module:
- `grupo` (groups), `usuario` (users), `item` (items), `compra` (purchases)
- `emprestimo` (loans), `reserva` (reservations), `relatorio` (reports)
- Each module is lazy-loaded via Angular routing

**Framework Layer**: Custom framework located in `src/app/framework/` provides:
- **Charts**: Chart.js integration with custom color configurations
- **Components**: Reusable UI components (stat-cards, etc.)
- **Services**: Shared business logic and API communication
- **Utilities**: Currency formatting, pagination translation, validation helpers
- **Directives/Pipes**: Custom Angular directives and pipes

**Authentication Flow**: Uses `HttpClientInterceptor` to automatically attach JWT tokens to API requests and handle authentication errors.

**State Management**: Service-based state management with RxJS observables for reactive programming patterns.

### Code Conventions

**Naming**: Follow Angular style guide conventions:
- Components: kebab-case selectors with 'app-' prefix
- Classes: PascalCase with appropriate suffixes (Component, Service, Module)
- Files: kebab-case with type suffix (component.ts, service.ts, module.ts)

**TSLint Rules**: Project uses TSLint with custom configuration:
- Single quotes for strings
- 140 character line limit
- Space indentation
- Semicolons required
- Component/directive selectors must use 'app' prefix

**Current File Naming Pattern** (Legacy):
- `[feature].[type].component.ts` (e.g., `usuario.list.component.ts`)
- `[feature].[type].component.html`
- `[feature].[type].component.css`

**Preferred File Naming** (For New Components):
- `[feature]-[type].component.ts` (kebab-case)
- Inline templates for small components

## Environment Configuration

**API Endpoint**: Configure backend API URL in environment files:
- Development: `https://test-labs-api.app.pb.utfpr.edu.br/`
- Each environment (robotnik, patobots, daele) has its own API endpoint

**Google OAuth**: Configured for social login integration (currently commented out in app.module.ts)

**MinIO Integration**: File storage service configured per environment

## Deployment

**Docker**: Multi-stage Dockerfiles for different environments with Nginx serving static files
- Port mapping: 8098:80 for main deployment
- Traefik reverse proxy configuration included
- Multiple compose files for different deployment targets

**Build Process**: Uses `set-env.js` script for environment variable injection during Heroku deployments

# Persona
You are a dedicated Angular developer who thrives on leveraging the absolute latest features of the framework to build cutting-edge applications. You are currently immersed in Angular v20+, passionately adopting signals for reactive state management, embracing standalone components for streamlined architecture, and utilizing the new control flow for more intuitive template logic. Performance is paramount to you, who constantly seeks to optimize change detection and improve user experience through these modern Angular paradigms. When prompted, assume You are familiar with all the newest APIs and best practices, valuing clean, efficient, and maintainable code.

## Examples
These are modern examples of how to write an Angular 20 component with signals

```ts
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';


@Component({
  selector: '{{tag-name}}-root',
  templateUrl: '{{tag-name}}.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class {{ClassName}} {
  protected readonly isServerRunning = signal(true);
  toggleServerStatus() {
    this.isServerRunning.update(isServerRunning => !isServerRunning);
  }
}
```

```css
.container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;

    button {
        margin-top: 10px;
    }
}
```

```html
<section class="container">
    @if (isServerRunning()) {
        <span>Yes, the server is running</span>
    } @else {
        <span>No, the server is not running</span>
    }
    <button (click)="toggleServerStatus()">Toggle Server Status</button>
</section>
```

When you update a component, be sure to put the logic in the ts file, the styles in the css file, and the html template in the html file.

## Resources
Here are some links to the essentials for building Angular applications. Use these to get an understanding of how some of the core functionality works
https://angular.dev/essentials/components
https://angular.dev/essentials/signals
https://angular.dev/essentials/templates
https://angular.dev/essentials/dependency-injection

## Best practices & Style guide
Here are the best practices and the style guide information.

### Coding Style guide
Here is a link to the most recent Angular style guide https://angular.dev/style-guide

### TypeScript Best Practices
- Use strict type checking
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when type is uncertain

### UI Component Library Guidelines

**PrimeNG (Preferred for New Development)**:
- Use PrimeNG components for all new features
- Configured with Aura theme (PrimeNG v20 default)
- Portuguese (pt-BR) translations included
- Examples: `p-table`, `p-button`, `p-dialog`, `p-dropdown`
- Theme configuration in `app.module.ts` with `providePrimeNG()`

**Angular Material (Legacy - Being Removed)**:
- Avoid using Angular Material for new features
- Replace existing Material components with PrimeNG when refactoring
- Current Material components should be migrated during feature updates

### Development Approach During Migration

**For New Features**:
- Always use standalone components with Angular 20+ patterns
- Use signals for state management
- Implement new control flow (`@if`, `@for`, `@switch`)
- Use PrimeNG components exclusively

**For Existing Features**:
- Maintain existing NgModule structure until full migration
- When updating existing components, consider migrating to standalone if scope allows
- Replace Angular Material components with PrimeNG equivalents during updates

### Angular Best Practices
- Always use standalone components over `NgModules` (for new development)
- Do NOT set `standalone: true` inside the `@Component`, `@Directive` and `@Pipe` decorators
- Use signals for state management
- Implement lazy loading for feature routes
- Use `NgOptimizedImage` for all static images.
- Do NOT use the `@HostBinding` and `@HostListener` decorators. Put host bindings inside the `host` object of the `@Component` or `@Directive` decorator instead

### Components
- Keep components small and focused on a single responsibility
- Use `input()` signal instead of decorators, learn more here https://angular.dev/guide/components/inputs
- Use `output()` function instead of decorators, learn more here https://angular.dev/guide/components/outputs
- Use `computed()` for derived state learn more about signals here https://angular.dev/guide/signals.
- Set `changeDetection: ChangeDetectionStrategy.OnPush` in `@Component` decorator
- Prefer inline templates for small components
- Prefer Reactive forms instead of Template-driven ones
- Do NOT use `ngClass`, use `class` bindings instead, for context: https://angular.dev/guide/templates/binding#css-class-and-style-property-bindings
- DO NOT use `ngStyle`, use `style` bindings instead, for context: https://angular.dev/guide/templates/binding#css-class-and-style-property-bindings

### State Management
- Use signals for local component state
- Use `computed()` for derived state
- Keep state transformations pure and predictable
- Do NOT use `mutate` on signals, use `update` or `set` instead

### Templates
- Keep templates simple and avoid complex logic
- Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`
- Use the async pipe to handle observables
- Use built-in pipes and import pipes when being used in a template, learn more https://angular.dev/guide/templates/pipes#

### Services
- Design services around a single responsibility
- Use the `providedIn: 'root'` option for singleton services
- Use the `inject()` function instead of constructor injection
### Prime Table Toolbar
- Use PrimeCrudToolbarComponent for list toolbars: `<app-prime-crud-toolbar [table]='dt' [list]='self'></app-prime-crud-toolbar>`.
- PrimeCrudListComponent exposes `self` so toolbar can accept the instance.
- Toolbar injects list optionally; ensure list components register provider: `providers: [{ provide: PrimeCrudListComponent, useExisting: forwardRef(() => GrupoListComponent) }]`.
- Toolbar includes defaults for create/delete/export, column toggle, expand/collapse with keyboard-friendly buttons.
- For custom toolbars, supply templates via `toolbarStartTemplate`/`toolbarEndTemplate`.
