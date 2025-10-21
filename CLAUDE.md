# CLAUDE.md

## Stack

Angular 20+ • PrimeNG v20 (Aura) • Tailwind CSS • Reactive Forms + signals • OnPush • Standalone + lazy loading • amCharts5 • Spring Boot REST + JWT • pt-BR

## Commands

`npm run dev` • `npm run build` • `npm run lint` • `npm run test`
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
**PrimeNG:** `[focusOnShow]="false"` for dialogs | `[lazy]="true"` + `[totalRecords]` for server pagination | `PrimeCrudListComponent` + `PrimeCrudToolbarComponent` base classes | **v20 Deprecation:** Use `class=` NOT `[styleClass]=` for all PrimeNG components (p-table, p-button, p-dialog, etc.) | Static classes: `class="my-class"` | Dynamic: `[class]="expression"` | Never use `[styleClass]`
**Forms:** Extend `PrimeReactiveCrudFormComponent` | Use `FormFieldComponent` wrapper | `LoaderService`: `show()`, `hide()`, `showWithCancel()`
**Form Services:** `inject(FormValidationService)` for validation/errors | `inject(FormStateManagerService)` for state ops | `inject(FormBusinessRulesService)` for domain logic | All services in `framework/services/` with JSDoc pt-BR
**Optimized Search:** Use `minQueryLength="2"` on `p-autoComplete` for database searches | Add hint text: "Digite pelo menos 2 caracteres para buscar" | Prevents empty/single-char queries reducing backend load | Example: `src/app/compra/compra.form.component.html:109-130` | Pattern: `<p-autoComplete minQueryLength="2" placeholder="Digite para buscar...">` with `hint="Digite pelo menos 2 caracteres para buscar"`
**Route Params:** Use `extractRouteParam()` from `framework/utils/route-params.operators` | Converters: `parseNumericId`, `parseStringParam`, `parseCodeParam`, `parsePositiveId`, `parseBooleanParam` | Auto-unsubscribe with `take(1)` | Type-safe with generics | Error callbacks: `onError: (value) => logger.warn()` | Example: `this.route.params.pipe(extractRouteParam({paramName: 'id', converter: parseNumericId})).subscribe(id => {...})`
**Paginated Backend:** Some backend endpoints return Spring `PageResponse<T>` | Service must extract `content[]` internally with `.pipe(map(response => response?.content || []))` | Keep service signature as `Observable<T[]>` for API consistency | Components receive clean arrays | Import: `import {map} from 'rxjs'` and `import {PageResponse} from '../framework/service/crud.service'` | Example: `src/app/usuario/usuario.service.ts:30-38`
**Reactive Form Disable:** Never use `[disabled]` on `formControlName` elements | Use `effect()` to watch signals and enable/disable programmatically: `control.disable({emitEvent: false})` / `control.enable({emitEvent: false})` | Prevents "changed after checked" errors | Example: `src/app/emprestimo/emprestimo.form.component.ts:118-135`
**Permission-Based Form Disable:** Distinguish: (1) NEW records → never disable for admins (2) EXISTING records → disable only if aluno/professor viewing their own (3) FINISHED records → always disable if has completion marker | Check `isNewRecord = !obj || !obj.id` before applying permission logic | Example: `src/app/emprestimo/emprestimo.form.component.ts:342-363`
**Examples:** `src/app/grupo/grupo.{list,form}.component.ts`

## Code Rules

**Quality:** Complexity ≤15 | `?.` not `&&` chains | `Object.hasOwn()` | `??=` | `replaceAll()` | `substring()` not `substr()` | `<button>` not `role="button"`
**Documentation:** JSDoc pt-BR for services/public methods | Include `@param`, `@returns`, `@example` | Usage examples in class-level docs | Comments in pt-BR
**Testing:** Jest for unit tests | 50+ tests per service expected | Test edge cases (null, undefined, empty arrays) | Integration tests for complex flows | Run `npm test -- service-name.spec.ts`
**Simplification:** Prefer truthy/falsy checks over explicit comparisons | `i.id` not `i.id !== null && i.id !== 0` | Leverage TS operators: `??` `?.` `??=` | Remove redundant conditions
**Loops:** `for...of` when need `break`/`continue` or type narrowing | `forEach` OK for simple side-effects
**Style:** Single quotes | 140 chars max | Semicolons | 'app-' prefix
**Angular:** `input()`/`output()` not decorators | `@if`/`@for` not `*ngIf`/`*ngFor` | NO `ngClass`/`ngStyle` | `inject()` not constructor DI
**CSS:** Tailwind only, NO Bootstrap | `flex` `hidden` `items-center` `justify-center` `gap-2`
**Naming:** kebab-case selectors | PascalCase classes | Legacy: `feature.type.component.ts` | Prefer: `feature-type.component.ts`

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

All services: `@Injectable({providedIn: 'root'})` | Use `inject()` | JSDoc pt-BR | 40-50+ tests per service
