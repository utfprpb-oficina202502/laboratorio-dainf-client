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
- State: OnPush + `cdr.markForCheck()` after async, signals for local state
- Loading: `LoaderComponent` z-index 9999

## Key Patterns

**Performance:** Permission pre-fetch → `setAuthenticated()` → navigate | Skeleton screens | Progressive data load | BFCache: `@HostListener('pageshow')` + `event.persisted` | PWA: `SwUpdate.checkForUpdate()`
**Charts (amCharts5):** ALWAYS `disposeAllCharts()` before rebuild | `ngOnDestroy()` disposal | Update: change `chart.data` only
**PrimeNG:** `[focusOnShow]="false"` for dialogs | `[lazy]="true"` + `[totalRecords]` for server pagination | `PrimeCrudListComponent` + `PrimeCrudToolbarComponent` base classes
**Forms:** Extend `PrimeReactiveCrudFormComponent` | Use `FormFieldComponent` wrapper | `LoaderService`: `show()`, `hide()`, `showWithCancel()`
**Examples:** `src/app/grupo/grupo.{list,form}.component.ts`

## Code Rules

**Quality:** Complexity ≤15 | `?.` not `&&` chains | `Object.hasOwn()` | `??=` | `replaceAll()` | `substring()` not `substr()` | `<button>` not `role="button"` | **Comments in pt-BR**
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
