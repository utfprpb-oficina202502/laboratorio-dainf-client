# CLAUDE.md

## Stack

Angular 20+ (standalone default) • PrimeNG v20 (Aura) • Tailwind CSS • Reactive Forms + signals • OnPush • Lazy loading • amCharts5 • Spring Boot REST + JWT • pt-BR

## Commands

`npm run dev` • `npm run build` • `npm run lint` • `npm test`
Multi-env: `ng build --configuration [production|robotnik|patobots|daele]`

## Architecture

DAINF/UTFPR lab management system

- Auth: JWT interceptor, permission pre-fetch during login
- Routing: Lazy load via `loadComponent()` for lists
- Framework: `src/app/framework/` (charts, components, services, utils)
  - **Services**: Table services (5), Form services (3), Logger, Loader
  - **Components**: Base classes for CRUD lists/forms, wrappers, utilities
- State: OnPush + `cdr.markForCheck()` after async, signals for local state
- Loading: `LoaderComponent` z-index 9999

## Key Patterns

**Performance:** Permission pre-fetch → `setAuthenticated()` → navigate | Skeleton screens | Progressive data load | BFCache: `@HostListener('pageshow')` + `event.persisted` | PWA: `SwUpdate.checkForUpdate()`
**Skeleton Loading:** Use `PrimeCrudTableWrapperComponent` with `[loading]="loading()"` signal | Toolbar stays visible with `[table]="dataTable()"` | WCAG 2.1 AA: `[attr.aria-busy]` on container + ARIA live region for screen readers | Wrapper eliminates template duplication | Example: `src/app/item/item.list.component.html`
**Charts (amCharts5):** ALWAYS `disposeAllCharts()` before rebuild | `ngOnDestroy()` disposal | Update: change `chart.data` only
**PrimeNG:** `[focusOnShow]="false"` for dialogs | `[lazy]="true"` + `[totalRecords]` for server pagination | `PrimeCrudListComponent` + `PrimeCrudToolbarComponent` base classes
**Forms:** Extend `PrimeReactiveCrudFormComponent` | Use `FormFieldComponent` wrapper | `LoaderService`: `show()`, `hide()`, `showWithCancel()`
**Form Services:** `inject(FormValidationService)` for validation/errors | `inject(FormStateManagerService)` for state ops | `inject(FormBusinessRulesService)` for domain logic | All services in `framework/services/` with JSDoc pt-BR
**Optimized Search:** `minQueryLength="2"` on `p-autoComplete` for database searches | Hint: "Digite pelo menos 2 caracteres para buscar" | Prevents empty/single-char queries
**Responsive Breakpoints:** Use `BreakpointService` system (Mobile ≤768px, Tablet 768-1024px, Desktop ≥1024px) | Tailwind responsive typography: `text-xs md:text-sm lg:text-base` NOT `text-xs sm:text-sm` | Pattern aligns with `isMobile()`, `isTablet()`, `isDesktop()` signals | `md:` = 768px, `lg:` = 1024px | Example: empty states, helper text, responsive labels
**Route Params:** `extractRouteParam()` from `framework/utils/route-params.operators` | Converters: `parseNumericId`, `parseStringParam`, `parseCodeParam`, `parsePositiveId`, `parseBooleanParam` | Auto-unsubscribe `take(1)` | Type-safe generics
**Paginated Backend:** Backend returns Spring `PageResponse<T>` | Service extracts `content[]` with `.pipe(map(response => response?.content || []))` | Keep signature `Observable<T[]>` | Components receive clean arrays
**Reactive Form Disable:** NO `[disabled]` on `formControlName` | Use `effect()` + `control.disable({emitEvent: false})` / `control.enable({emitEvent: false})` | Prevents ExpressionChangedAfterItHasBeenCheckedError
**Permission-Based Form Disable:** NEW records → never disable for admins | EXISTING records → disable only if aluno/professor viewing their own | FINISHED records → always disable if has completion marker | Check `isNewRecord = !obj || !obj.id`
**Testing:** Jest NOT Jasmine | Helpers: `framework/testing/test-helpers.ts` (`createServiceMock`, `setupTestBed`, `queryFormControls`, `getDirective`, `mockConfirmAccept`) | Factories: `*.test-factory.ts` with semantic methods (`createAtrasado()`, `createPendente()`) | Dates ALWAYS `dd/mm/yyyy` NEVER `yyyy-mm-dd` | `undefined` NOT `null` for optionals | Spy on component methods NOT service (`jest.spyOn(component, 'method')`) | ViewChild: `Object.defineProperty(component, 'viewChild', {value: mock, writable: true})` | PageResponse: all 5 fields `{content, totalElements, totalPages, size, number}` | Jest syntax: `createServiceMock<T>(['method'])`, `.mockReturnValue()`, `expect.objectContaining()` | Remove time-dependent/duplicate tests | Example: `src/app/emprestimo/emprestimo.{list.component.spec,test-factory}.ts`

## Code Rules

**Quality:** Complexity ≤15 | `?.` NOT `&&` chains | `Object.hasOwn()` | `??=` | `replaceAll()` | `substring()` NOT `substr()` | `<button>` NOT `role="button"`
**Documentation:** JSDoc pt-BR for services/public methods | Include `@param`, `@returns`, `@example` | Usage examples in class-level docs | Comments in pt-BR
**Testing:** Jest for unit tests | Test edge cases (null, undefined, empty arrays) | Integration tests for complex flows | Run `npm test -- service-name.spec.ts`
**Simplification:** Truthy/falsy checks NOT explicit comparisons | `i.id` NOT `i.id !== null && i.id !== 0` | Leverage `??` `?.` `??=` | Remove redundant conditions
**Loops:** `for...of` when need `break`/`continue` or type narrowing | `forEach` OK for simple side-effects
**Style:** Single quotes | 140 chars max | Semicolons | 'app-' prefix
**Angular:** `input()`/`output()` NOT `@Input`/`@Output` | `@if`/`@for` NOT `*ngIf`/`*ngFor` | `inject()` NOT constructor DI | NO `standalone: true` (default in v20)
**CSS:** Tailwind only, NO Bootstrap | `flex` `hidden` `items-center` `justify-center` `gap-2`
**Naming:** kebab-case selectors | PascalCase classes | `feature-type.component.ts` format

## Critical Info

- All components OnPush
- Server pagination: `lazy: true`, `lazyLoadOnInit: false`, `preloadData: true`
- Chart disposal mandatory to prevent memory leaks
- Locale pt-BR throughout (forms, errors, pagination)
- See ARCHITECTURE_REPORT.md for detailed patterns

## Framework Services

**Table Services** (`framework/services/`):

- `TableFilterService`: Filter operations, search, multi-column filtering
- `TableSortService`: Sort operations, multi-column sorting
- `TablePaginationService`: Pagination state, page calculations
- `TableSelectionService`: Row selection, bulk operations
- `TableExportService`: CSV/Excel export with encoding handling

**Form Services** (`framework/services/`):

- `FormValidationService`: Validation, error messages (pt-BR), touched state
- `FormStateManagerService`: State operations (patch, merge, reset, clone, changes detection)
- `FormBusinessRulesService`: Domain logic (user assignment, totals, saldo validation, item management)

All services: `@Injectable({providedIn: 'root'})` | Use `inject()` | JSDoc pt-BR

## Related Projects

- **Backend:** `C:\Users\rodiz\IdeaProjects\laboratorio-dainf-server` (Spring Boot 3.5.6 + Java 21 + PostgreSQL + MinIO)
