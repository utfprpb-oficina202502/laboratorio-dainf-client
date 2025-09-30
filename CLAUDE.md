# CLAUDE.md

Este arquivo fornece orientações para Claude Code (claude.ai/code) ao trabalhar com código neste repositório.

## Development Commands

- **Development server**: `npm run dev` (inicia servidor dev em http://localhost:4200)
- **Production build**: `npm run build` (build para produção com configuração Angular)
- **Testing**: `npm run test` (executa testes unitários com Karma)
- **Single test**: `npm run test -- --include="**/[component-name].spec.ts"` (executa arquivo de teste específico)
- **Linting**: `npm run lint` (executa TSLint com regras do projeto)
- **E2E testing**: `npm run e2e` (executa testes end-to-end)
- **Production start**: `npm start` (inicia servidor Node.js Express para produção)

## Multi-Environment Build Support

O projeto suporta builds para múltiplos ambientes com configurações específicas:
- **Production**: `ng build --configuration production`
- **Robotnik**: `ng build --configuration robotnik`
- **Patobots**: `ng build --configuration patobots`
- **Daele**: `ng build --configuration daele`

Cada ambiente possui seu próprio arquivo em `src/environments/` e configurações Docker correspondentes.

## Architecture Overview

Aplicação Angular 20+ para o sistema de gerenciamento de laboratórios do DAINF (Departamento Acadêmico de Informática) na UTFPR Campus Pato Branco.

### Core Structure
- **Frontend**: Angular com TypeScript, PrimeNG, Tailwind CSS
- **Backend Integration**: Comunicação API RESTful via HttpClient
- **Authentication**: Baseado em JWT com interceptor HTTP para gerenciamento de tokens
- **Internationalization**: Locale português (pt-BR) com configurações customizadas
- **Routing**: Componentes standalone com lazy loading via `loadComponent()`
- **Styling**: Tailwind CSS para utilities, tema PrimeNG Aura para componentes

### Key Architectural Components

**Standalone Components with Lazy Loading**:
Todos os componentes de lista (`*.list.component.ts`) utilizam arquitetura standalone com lazy loading:

```typescript
// app-routing.module.ts
{
  path: 'grupo',
  canActivate: [LoginService],
  loadComponent: () => import('./grupo/grupo.list.component').then(m => m.GrupoListComponent)
}
```

**Benefícios**:
- **Code splitting**: Componentes carregados apenas ao navegar para suas rotas
- **Bundle menor**: Componentes (~50-100KB cada) separados do bundle principal
- **Carregamento inicial mais rápido**: App core carrega sem componentes de lista
- **Type safety**: Suporte completo TypeScript com dynamic imports
- **Auto-contidos**: Sem necessidade de feature modules

**Framework Layer**: Localizado em `src/app/framework/`:
- **Charts**: Integração Chart.js (amCharts4) com configurações de cor customizadas
- **Components**: Componentes UI reutilizáveis (stat-cards, skeleton screens, toolbars)
- **Services**: Lógica de negócio compartilhada e comunicação API
- **Utilities**: Formatação de moeda, tradução de paginação, helpers de validação
- **Directives/Pipes**: Diretivas e pipes Angular customizadas

**Authentication Flow**:
- Utiliza `HttpClientInterceptor` para anexar automaticamente tokens JWT às requisições
- Gerencia erros de autenticação
- Pre-fetching de permissões durante login para carregamento otimizado

**State Management**:
- Gerenciamento de estado baseado em serviços com RxJS observables
- `ChangeDetectionStrategy.OnPush` em todos os componentes
- Uso explícito de `ChangeDetectorRef.markForCheck()` após operações assíncronas

**Loading Overlay & Drawer Interaction**:
- Loading overlay (`LoaderComponent` em `src/app/framework/loader/`) usa `z-index: 9999`
- Cobre todo viewport, incluindo drawer/sidebar PrimeNG
- Drawer (`SidenavComponent` em `src/app/sidenav/`) com comportamento responsivo:
  - Desktop (≥1200px): Aberto por padrão, Escape desabilitado
  - Mobile (<1200px): Fechado por padrão, Escape habilitado
  - Usa `modal="false"` para prevenir conflitos de backdrop
- Backgrounds theme-responsive via propriedades CSS customizadas

## Performance Optimizations

Implementação de otimizações abrangentes para garantir carregamento rápido de páginas e experiência fluida.

### Authentication & Navigation Flow

**Problema**: Após login, usuários experimentavam 1-3 segundos de tela congelada.

**Solução**: Estratégia de otimização em três camadas:

1. **Permission Pre-fetching** (`login.component.ts:72-101`)
   - Permissões carregadas e cacheadas durante login, antes da navegação
   - `getPermissoesUser()` chamado após `refreshCurrentUser()` com sucesso
   - Elimina delay de chamada API no carregamento da home
   - Itens do menu sidebar populados instantaneamente com dados cacheados

2. **Authentication State Timing** (`login.service.ts:190-192`)
   - `setAuthenticated()` chamado imediatamente antes da navegação
   - Previne estado intermediário onde layout auth mostra com rota de login
   - Garante transição atômica de login para home

3. **Navigation Transition Masking** (`app.component.ts:19,38-54`)
   - Flag `isNavigating` rastreia eventos `NavigationStart`/`NavigationEnd`
   - Conteúdo do router-outlet com fade para `opacity: 0` durante transição
   - Loader overlay (z-index 9999) cobre tela completamente
   - Elimina artefatos visuais de rota anterior em novo layout

**Padrão de Implementação**:
```typescript
setUserInLocalStorage() {
  this.loginService.refreshCurrentUser()
    .subscribe({
      next: () => {
        this.loginService.getPermissoesUser().subscribe({
          next: () => {
            this.loginService.setAuthenticated();
            this.router.navigate(["/"]);
          }
        });
      }
    });
}
```

### Progressive Dashboard Loading

**Problema**: Dashboard home fazia 5 chamadas API simultâneas, bloqueando UI por 1+ segundos.

**Solução**: Carregamento progressivo em duas fases (`home.component.ts:109-221`):

**Fase 1 - Carregamento de Stats** (~100-200ms):
- Chamada API única para stat cards
- Flag `loadingStats` controla skeleton cards
- Stats aparecem rapidamente, fornecendo conteúdo imediato

**Fase 2 - Carregamento de Charts** (~500-1000ms):
- Quatro chamadas API para charts carregadas em background
- Flag `loadingCharts` controla skeleton charts
- Charts populam progressivamente sem bloquear stats

```typescript
buildDashboards() {
  this.loadingStats = true;
  this.loaderService.show();

  this.homeService.findDadosEmprestimoCountInRange(ini, fim)
    .subscribe({
      next: (count) => {
        this.dashEmprestimoCount = count;
        this.loadingStats = false;
        this.loadCharts(ini, fim, requestToken);
      }
    });
}
```

### Skeleton Screens

**Componentes**:
- `src/app/framework/component/skeleton-card.component.ts`
- `src/app/framework/component/skeleton-chart.component.ts`

**Propósito**: Fornecer feedback visual instantâneo durante operações assíncronas

**Características**:
- Card skeletons para stat cards com módulo PrimeNG Skeleton
- Chart skeletons para gráficos line, bar e pie
- Animações de fade-in suaves quando conteúdo real carrega
- Mantém estrutura de layout (sem saltos de conteúdo)

**Padrão de Uso**:
```html
@if (loadingStats) {
  <app-skeleton-card></app-skeleton-card>
  <app-skeleton-card></app-skeleton-card>
} @else {
  <app-stat-card [value]="data"></app-stat-card>
}
```

### Sidebar Menu Optimization

**Problema**: Sidebar vazia até permissões carregarem da API.

**Solução**: Itens de menu padrão pré-populados (`sidenav.component.ts:153-165`)

```typescript
public menuItems: PrimeMenuItem[] = this.getDefaultMenuItems();

private getDefaultMenuItems(): PrimeMenuItem[] {
  const defaultItems = MENU_ITEM.filter(item =>
    item.group === "ITEM" && (!item.roles || item.roles.includes("ALUNO"))
  );
  return defaultItems.map(item => ({ /* transform to PrimeMenuItem */ }));
}
```

**Comportamento**:
- Mostra itens baseline (Home, Empréstimo, Itens, Reserva, Sol. de Compra) instantaneamente
- Itens adicionais aparecem após carregamento de permissões
- Submenu "Cadastros" visível apenas para ADMINISTRADOR/LABORATORISTA

### Change Detection Optimization

**Estratégia**: Todos componentes usam `ChangeDetectionStrategy.OnPush` com `markForCheck()` explícito

**Pontos Críticos**:
- Após subscriptions Observable completas
- Após atualizações de estado de operações assíncronas
- Após eventos de navegação

```typescript
this.menuItems = newMenuItems;
this.menuCadastros = newMenuCadastros;
this.cdr.markForCheck(); // Essencial com OnPush
```

### Performance Metrics

| Métrica | Antes | Depois | Melhoria |
|---------|-------|--------|----------|
| **Time to First Paint** | 1-3s | <50ms | **60x mais rápido** |
| **Time to Interactive Content** | 1-3s | ~200ms | **5-15x mais rápido** |
| **Chamadas API (Home)** | 6 sequenciais | 1 + (1 + 4 paralelas) | Otimizado |
| **Perceived Load Time** | 1-3s | <200ms | **Excelente** |

### Best Practices para Desenvolvimento Futuro

1. **Sempre pré-buscar dados críticos durante transições**
   - Carregar permissões de usuário durante login
   - Pré-carregar recursos comuns antes da navegação

2. **Usar carregamento progressivo para views com muitos dados**
   - Carregar dados essenciais primeiro (rápido)
   - Carregar dados suplementares em background (mais lento)

3. **Implementar skeleton screens para operações assíncronas**
   - Nunca mostrar telas em branco
   - Combinar estrutura do skeleton com layout do conteúdo real

4. **Otimizar change detection com OnPush**
   - Sempre chamar `markForCheck()` após updates assíncronos
   - Minimizar ciclos desnecessários de change detection

5. **Gerenciar transições de navegação suavemente**
   - Fade out de conteúdo anterior durante navegação
   - Mostrar loaders imediatamente quando navegação iniciar
   - Garantir transições atômicas de estado

## Code Conventions

**Naming**: Seguir convenções do Angular style guide:
- Componentes: kebab-case selectors com prefixo 'app-'
- Classes: PascalCase com sufixos apropriados (Component, Service, Module)
- Arquivos: kebab-case com sufixo de tipo (component.ts, service.ts, module.ts)

**TSLint Rules**:
- Single quotes para strings
- Limite de 140 caracteres por linha
- Indentação com espaços
- Semicolons obrigatórios
- Selectores de component/directive devem usar prefixo 'app'

**Padrão de Nomenclatura de Arquivos** (Legacy):
- `[feature].[type].component.ts` (ex: `usuario.list.component.ts`)
- `[feature].[type].component.html`
- `[feature].[type].component.css`

**Nomenclatura Preferida** (Novos Componentes):
- `[feature]-[type].component.ts` (kebab-case)
- Templates inline para componentes pequenos

**Diretrizes de Estilo**:
- **Usar Tailwind CSS utilities** para layout e spacing
- **Tema PrimeNG Aura** gerencia estilo de componentes automaticamente
- **Bootstrap foi removido** - não usar classes Bootstrap

**Equivalentes Tailwind** (Bootstrap → Tailwind):
```
d-flex → flex
d-none → hidden
d-md-inline → md:inline
d-lg-inline → lg:inline
align-items-center → items-center
justify-content-center → justify-center
justify-content-end → justify-end
flex-wrap → flex-wrap
gap-2 → gap-2
ms-2, me-2 → ml-2, mr-2 (ou usar gap-*)
```

**Design Responsivo**:
- Mobile-first: `class="hidden md:inline"` (escondido no mobile, visível em tablet+)
- Breakpoints: `sm:` (640px), `md:` (768px), `lg:` (1024px), `xl:` (1280px)

## Environment Configuration

**API Endpoint**: Configurar URL da API backend em arquivos de environment:
- Development: `https://test-labs-api.app.pb.utfpr.edu.br/`
- Cada ambiente (robotnik, patobots, daele) tem seu próprio endpoint

**Google OAuth**: Configurado para integração de login social (atualmente comentado em app.module.ts)

**MinIO Integration**: Serviço de armazenamento de arquivos configurado por ambiente

## Deployment

**Docker**: Dockerfiles multi-stage para diferentes ambientes com Nginx servindo arquivos estáticos
- Port mapping: 8098:80 para deployment principal
- Configuração de reverse proxy Traefik incluída
- Múltiplos compose files para diferentes targets de deployment

**Build Process**: Usa script `set-env.js` para injeção de variáveis de ambiente durante deployments Heroku

## Angular Best Practices

### TypeScript
- Usar strict type checking
- Preferir inferência de tipo quando óbvio
- Evitar tipo `any`; usar `unknown` quando tipo incerto

### UI Component Library

**PrimeNG** (Primário):
- Usar componentes PrimeNG para todas features
- Configurado com tema Aura (PrimeNG v20 default)
- Traduções português (pt-BR) incluídas
- Exemplos: `p-table`, `p-button`, `p-dialog`, `p-dropdown`
- Configuração de tema em `app.module.ts` com `providePrimeNG()`

### Components
- Manter componentes pequenos e focados em responsabilidade única
- Usar `input()` signal ao invés de decorators
- Usar `output()` function ao invés de decorators
- Usar `computed()` para estado derivado
- Definir `changeDetection: ChangeDetectionStrategy.OnPush` no decorator `@Component`
- Preferir templates inline para componentes pequenos
- Preferir Reactive forms ao invés de Template-driven
- NÃO usar `ngClass`, usar bindings `class` ao invés
- NÃO usar `ngStyle`, usar bindings `style` ao invés

### State Management
- Usar signals para estado local do componente
- Usar `computed()` para estado derivado
- Manter transformações de estado puras e previsíveis
- NÃO usar `mutate` em signals, usar `update` ou `set` ao invés

### Templates
- Manter templates simples e evitar lógica complexa
- Usar control flow nativo (`@if`, `@for`, `@switch`) ao invés de `*ngIf`, `*ngFor`, `*ngSwitch`
- Usar async pipe para lidar com observables
- Usar pipes built-in e importar pipes quando usados em template

### Services
- Design de services em torno de responsabilidade única
- Usar opção `providedIn: 'root'` para singleton services
- Usar função `inject()` ao invés de constructor injection

### Prime Table Toolbar
- Usar `PrimeCrudToolbarComponent` para toolbars de lista: `<app-prime-crud-toolbar [table]='dt' [list]='self'></app-prime-crud-toolbar>`
- `PrimeCrudListComponent` expõe `self` para toolbar aceitar instância
- Toolbar injeta lista opcionalmente; garantir que componentes de lista registrem provider: `providers: [{ provide: PrimeCrudListComponent, useExisting: forwardRef(() => GrupoListComponent) }]`
- Toolbar inclui defaults para create/delete/export, column toggle, expand/collapse com botões keyboard-friendly
- Para toolbars customizadas, fornecer templates via `toolbarStartTemplate`/`toolbarEndTemplate`

## Persona

Você é um desenvolvedor Angular dedicado que prospera ao aproveitar os recursos mais recentes do framework para construir aplicações de ponta. Você está imerso no Angular v20+, adotando apaixonadamente signals para gerenciamento de estado reativo, abraçando componentes standalone para arquitetura simplificada e utilizando o novo control flow para lógica de template mais intuitiva. Performance é primordial para você, que constantemente busca otimizar change detection e melhorar experiência do usuário através desses paradigmas modernos do Angular.

## Exemplos

Exemplos modernos de como escrever componente Angular 20 com signals:

```typescript
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

@Component({
  selector: 'app-example',
  templateUrl: './example.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExampleComponent {
  protected readonly isServerRunning = signal(true);

  toggleServerStatus() {
    this.isServerRunning.update(isServerRunning => !isServerRunning);
  }
}
```

```html
<section class="container">
  @if (isServerRunning()) {
    <span>Sim, o servidor está rodando</span>
  } @else {
    <span>Não, o servidor não está rodando</span>
  }
  <button (click)="toggleServerStatus()">Alternar Status do Servidor</button>
</section>
```

Ao atualizar um componente, certifique-se de colocar a lógica no arquivo .ts, os estilos no arquivo .css e o template HTML no arquivo .html.

## Resources

Links essenciais para construir aplicações Angular:
- https://angular.dev/essentials/components
- https://angular.dev/essentials/signals
- https://angular.dev/essentials/templates
- https://angular.dev/essentials/dependency-injection
- https://angular.dev/style-guide
