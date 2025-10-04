# CLAUDE.md

Este arquivo fornece orientações para Claude Code (claude.ai/code) ao trabalhar com código neste repositório.

## Migration Status ✅

**Material Design → PrimeNG Migration: COMPLETE**

- ✅ Todos os componentes migrados de Material Design para PrimeNG v20
- ✅ `@angular/material` removido de `package.json` e código
- ✅ Bottom sheets substituídos por Popover (context menus)
- ✅ Bootstrap CSS removido - apenas Tailwind CSS utilities
- ✅ Reactive forms com PrimeNG components
- ✅ Componentes standalone com lazy loading
- ✅ 100% PrimeNG + Tailwind CSS

**Stack Atual**:
- **UI Library**: PrimeNG v20 (tema Aura)
- **Styling**: Tailwind CSS v3.4+
- **Forms**: Reactive Forms com signals
- **State**: RxJS + Angular Signals
- **Change Detection**: OnPush em todos os componentes

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

6. **Gerenciar ciclo de vida de charts corretamente**
   - Sempre dispor charts amCharts antes de recriar instâncias
   - Prevenir memory leaks com disposal adequado
   - Ver seção "Chart Management" para detalhes

## Chart Management (amCharts4)

O projeto utiliza amCharts4 para visualização de dados. É **crítico** gerenciar corretamente o ciclo de vida dos charts para prevenir memory leaks.

### Memory Leak Prevention

**Problema**: amCharts cria instâncias que consomem memória e recursos. Sem disposal adequado, charts antigos permanecem na memória mesmo após recriação, gerando warnings "Chart was not disposed" e degradando performance.

**Solução**: Sempre dispor charts antes de recriar instâncias:

```typescript
// home.component.ts - Padrão correto
buildDashboards() {
  // Dispose existing charts BEFORE rebuilding
  this.disposeAllCharts();

  const ini = this.getDateIni();
  const fim = this.getDateFim();
  // ... carregar dados e recriar charts
}

private disposeAllCharts(): void {
  this.disposeChart(this.chartLineRef);
  this.chartLineRef = null;
  this.disposeChart(this.chartBarRef);
  this.chartBarRef = null;
  // ... dispor outros charts
}

private disposeChart(ref: am4core.BaseObject | null | undefined) {
  try {
    if (ref) {
      ref.dispose();
    }
  } catch { /* ignore */ }
}
```

### Chart Update Pattern

**Padrão para atualizar charts com novos dados**:

1. **Primeira renderização**: Criar chart se não existir ou estiver disposed
2. **Atualizações subsequentes**: Reutilizar instância existente apenas atualizando `chart.data`
3. **Rebuild completo**: Dispor charts antes de recriar (ex: mudança de filtros)

```typescript
private updateXYChartLine(elementId: string, data: any[], dateField: string, valueField: string) {
  let chartLine = this.chartLineRef;

  // Criar apenas se não existir ou foi disposed
  if (!chartLine || chartLine.isDisposed()) {
    chartLine = am4core.create(elementId, am4charts.XYChart);
    // ... configurar chart ...
    this.chartLineRef = chartLine;
  }

  // Atualizar dados na instância existente
  chartLine.data = data;
  chartLine.invalidateRawData();
}
```

### Component Lifecycle Integration

**ngOnDestroy**: Sempre dispor todos os charts para limpeza adequada:

```typescript
ngOnDestroy() {
  this.destroyed = true;
  this.disposeChart(this.chartLineRef);
  this.chartLineRef = null;
  // ... dispor outros charts
}
```

**Verificação de destroyed**: Prevenir operações em componentes destruídos:

```typescript
if (this.destroyed || requestToken !== this.latestRequestToken) {
  return; // Não processar se componente foi destruído
}
```

## PrimeNG Dialog Best Practices

### Autofocus Management

PrimeNG dialogs têm autofocus automático por padrão, que pode causar conflitos com elementos já focados.

**Problema**: Console warning "Autofocus processing was blocked because a document already has a focused element"

**Solução**: Desabilitar autofocus quando não necessário:

```html
<p-dialog header="Filtro"
  [(visible)]="dialogVisible"
  [modal]="true"
  [focusOnShow]="false">  <!-- Previne autofocus automático -->
  <!-- conteúdo do dialog -->
</p-dialog>
```

**Quando usar `[focusOnShow]="false"`**:
- Dialogs abertos programaticamente
- Quando há elementos com foco antes de abrir dialog
- Formulários complexos onde foco manual é preferível

**Quando manter `[focusOnShow]="true"`** (padrão):
- Dialogs simples com um único input
- Quando foco automático melhora UX
- Modals de confirmação com botão primário

### Dialog Z-Index Hierarchy

Usar `[baseZIndex]` para garantir hierarquia correta de overlays:

```html
<p-dialog [baseZIndex]="10000">  <!-- Acima de outros overlays -->
```

**Hierarquia de Z-Index no projeto**:
- Loading overlay: 9999
- Modals/Dialogs: 10000+
- Tooltips/Dropdowns: Gerenciados automaticamente pelo PrimeNG

## PrimeNG Table & Pagination

### Server-Side Pagination Configuration

O projeto usa paginação server-side com Spring Data Page. Configuração correta é essencial para exibir totais corretos.

**Backend Response Structure** (Spring Data Page):
```json
{
  "totalPages": 10,
  "totalElements": 95,
  "size": 10,
  "number": 0,
  "content": [ /* array de dados */ ]
}
```

**Configuração Correta da Tabela**:

```html
<p-table
  [value]="objects"
  [rows]="rows"
  [totalRecords]="totalElements"  <!-- Vincula ao total do backend -->
  [paginator]="true"
  [lazy]="true"                    <!-- IMPORTANTE: true para server-side -->
  (onPage)="onPageChange($event)"
  currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} registros">
</p-table>
```

**Component TypeScript**:

```typescript
export class ListComponent extends PrimeCrudListComponent<T, ID> {
  configureTable() {
    this.tableConfig = {
      ...this.tableConfig,
      lazy: true,              // Habilita server-side pagination
      lazyLoadOnInit: false,   // Previne double-load no init
      preloadData: true        // Carrega dados manualmente no ngOnInit
    };
  }
}
```

### Lazy vs Non-Lazy Modes

**`[lazy]="true"`** (Server-Side - Recomendado):
- ✅ PrimeNG respeita `[totalRecords]` binding
- ✅ Mostra total correto de registros no paginator
- ✅ Cada mudança de página chama `(onPage)` event
- ✅ Componente controla carregamento de dados

**`[lazy]="false"`** (Client-Side):
- ❌ PrimeNG ignora `[totalRecords]` binding
- ❌ Calcula total a partir de `[value]` array length
- ❌ Assume todos os dados estão em memória
- ⚠️ Usar apenas para conjuntos pequenos de dados

### PrimeNG Translation (pt-BR)

Todas as traduções PrimeNG são configuradas em `src/locale/pt-BR.ts`:

```typescript
// src/locale/pt-BR.ts
export const ptBR = {
  // Calendar
  dayNames: ["Domingo", "Segunda", ...],
  monthNames: ["Janeiro", "Fevereiro", ...],

  // MultiSelect
  emptyMessage: 'Nenhum resultado encontrado',
  emptyFilterMessage: 'Nenhum resultado encontrado',
  selectionMessage: '{0} itens selecionados',

  // Aria labels
  aria: {
    selectRow: 'Linha Selecionada',
    rowsPerPageLabel: 'Linhas por página',
    // ... mais labels
  }
};
```

Aplicar no `app.module.ts`:

```typescript
providePrimeNG({
  theme: { preset: PrimeUTFPRPreset },
  translation: ptBR  // Aplica traduções pt-BR
})
```

### Prime CRUD Framework

**PrimeCrudListComponent** (`src/app/framework/component/prime-crud.list.component.ts`):
- Base class abstrata para componentes de lista
- Gerencia paginação, ordenação, filtros e seleção
- Integrado com `OnPush` change detection
- Stateful table com localStorage/sessionStorage

**PrimeCrudToolbarComponent** (`src/app/framework/component/prime-crud-toolbar.component.ts`):
- Toolbar reutilizável com ações CRUD
- Column toggle multiselect com traduções pt-BR
- Botões para adicionar, deletar, exportar (Excel/CSV)
- Expand/collapse para tabelas expandíveis

**Padrão de Uso**:

```typescript
@Component({
  providers: [{
    provide: PrimeCrudListComponent,
    useExisting: forwardRef(() => MyListComponent)
  }]
})
export class MyListComponent extends PrimeCrudListComponent<Entity, number> {
  constructor(service: EntityService, injector: Injector) {
    super(service, injector, ['id', 'nome', 'actions'], 'entity/form');
  }

  protected override getEntityName(): string { return 'Entidade'; }
  protected override getEntityPluralName(): string { return 'Entidades'; }
}
```

```html
<!-- my-list.component.html -->
<app-prime-crud-toolbar [table]="dt" [list]="self"></app-prime-crud-toolbar>
<p-table #dt [value]="objects" ...></p-table>
```

## Form Migration Guide

Este guia documenta o processo de migração de forms legados (template-driven, Material Design) para forms modernos (reactive forms, PrimeNG, Angular v20 signals).

### Framework de Forms Reutilizável

**PrimeReactiveCrudFormComponent** (`src/app/framework/component/prime-reactive-crud.form.component.ts`):
- Base class abstrata para todos os forms CRUD reativos
- Gerenciamento de estado com signals
- Lifecycle hooks para customização
- Integrado com `LoaderService` para feedback visual
- Suporte a validação automática

**FormFieldComponent** (`src/app/framework/component/form-field.component.ts`):
- Componente standalone reutilizável para campos de formulário
- Exibição automática de validação e mensagens de erro
- Suporte a labels, hints e campos obrigatórios
- Estilização consistente com tema PrimeNG
- Totalmente type-safe com signals

### Padrão de Implementação

#### 1. Component TypeScript

```typescript
import { Component, Injector, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PrimeReactiveCrudFormComponent } from '../framework/component/prime-reactive-crud.form.component';

@Component({
  selector: 'app-form-entity',
  templateUrl: './entity.form.component.html',
  styleUrls: ['./entity.form.component.css'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EntityFormComponent extends PrimeReactiveCrudFormComponent<Entity, number> {
  private readonly fb = this.injector.get(FormBuilder);

  // Custom signals for component-specific state
  protected readonly customSignal = signal<string>('');

  // Computed signals for derived state
  protected readonly isSpecialCase = computed(() => {
    const obj = this.object();
    return obj && obj.someField === 'special';
  });

  constructor(
    protected entityService: EntityService,
    protected injector: Injector
  ) {
    super(entityService, injector, '/entity', Entity);
  }

  /**
   * Build the reactive form with validators
   */
  protected override buildForm(): FormGroup {
    return this.fb.group({
      id: [{ value: null, disabled: true }],
      nome: ['', [Validators.required, Validators.maxLength(255)]],
      email: ['', [Validators.email]],
      valor: [null, [Validators.min(0)]]
    });
  }

  /**
   * Override to prepare form value before saving (optional)
   */
  protected override prepareFormValue(formValue: Partial<Entity>): Partial<Entity> {
    const formGroup = this.form();
    const id = formGroup?.get('id')?.value;

    // Include disabled fields or transform data
    return {
      ...formValue,
      ...(id && { id })
    };
  }

  /**
   * Override to patch form with custom logic (optional)
   */
  protected override patchFormWithObject(object: Entity): void {
    const formGroup = this.form();
    if (formGroup) {
      formGroup.patchValue({
        id: object.id,
        nome: object.nome,
        email: object.email,
        valor: object.valor
      });
    }
  }
}
```

#### 2. Component Template

```html
<div class="container-fluid my-3">
  <p-card>
    <ng-template pTemplate="header">
      <div class="flex items-center justify-between p-4">
        <div class="flex items-center gap-3">
          <app-voltar (onClick)="back()"></app-voltar>
          <h2 class="text-xl font-semibold m-0">Cadastro de Entidade</h2>
        </div>
      </div>
    </ng-template>

    <ng-template pTemplate="content">
      @if (form(); as formGroup) {
        <form [formGroup]="formGroup" (ngSubmit)="save()" class="flex flex-col gap-4">
          <div class="grid grid-cols-12 gap-4">
            <!-- ID Field (read-only) -->
            <div class="col-span-12 md:col-span-2">
              <app-form-field
                [control]="formGroup.get('id')"
                label="Código"
                fieldId="id">
                <input
                  pInputText
                  id="id"
                  formControlName="id"
                  class="w-full"
                  readonly />
              </app-form-field>
            </div>

            <!-- Nome Field (required) -->
            <div class="col-span-12 md:col-span-10">
              <app-form-field
                [control]="formGroup.get('nome')"
                label="Nome"
                [required]="true"
                fieldId="nome"
                hint="Digite o nome completo">
                <input
                  pInputText
                  id="nome"
                  formControlName="nome"
                  class="w-full"
                  placeholder="Ex: João Silva" />
              </app-form-field>
            </div>

            <!-- Email Field -->
            <div class="col-span-12 md:col-span-6">
              <app-form-field
                [control]="formGroup.get('email')"
                label="E-mail"
                fieldId="email">
                <input
                  pInputText
                  id="email"
                  type="email"
                  formControlName="email"
                  class="w-full"
                  placeholder="exemplo@email.com" />
              </app-form-field>
            </div>

            <!-- Valor Field (number) -->
            <div class="col-span-12 md:col-span-6">
              <app-form-field
                [control]="formGroup.get('valor')"
                label="Valor"
                fieldId="valor">
                <p-inputNumber
                  inputId="valor"
                  formControlName="valor"
                  mode="currency"
                  currency="BRL"
                  locale="pt-BR"
                  styleClass="w-full">
                </p-inputNumber>
              </app-form-field>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex justify-end gap-2 mt-4">
            <app-cancelar (onClick)="back()"></app-cancelar>
            <app-salvar [typeButton]="'submit'" [disabled]="isLoading()"></app-salvar>
          </div>
        </form>
      }
    </ng-template>
  </p-card>
</div>
```

#### 3. Module Configuration

```typescript
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

// PrimeNG
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';

// Custom components
import { FormFieldComponent } from '../framework/component/form-field.component';
import { VoltarModule } from '../geral/voltar/voltar.module';
import { CancelarModule } from '../geral/cancelar/cancelar.module';
import { SalvarModule } from '../geral/salvar/salvar.module';

import { EntityFormComponent } from './entity.form.component';

@NgModule({
  declarations: [EntityFormComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    // PrimeNG
    CardModule,
    InputTextModule,
    InputNumberModule,
    ButtonModule,
    TooltipModule,
    // Custom
    FormFieldComponent,
    VoltarModule,
    CancelarModule,
    SalvarModule
  ],
  exports: [EntityFormComponent]
})
export class EntityFormModule { }
```

### Validação de Formulários

**Validadores Built-in do Angular**:
```typescript
Validators.required
Validators.minLength(n)
Validators.maxLength(n)
Validators.min(n)
Validators.max(n)
Validators.email
Validators.pattern(/regex/)
```

**Mensagens de Erro Automáticas**:
O `FormFieldComponent` exibe automaticamente mensagens de erro em português baseadas nos validadores:
- `required`: "Este campo é obrigatório"
- `minlength`: "Mínimo de X caracteres"
- `maxlength`: "Máximo de X caracteres"
- `email`: "E-mail inválido"
- `pattern`: "Formato inválido"
- `min`: "Valor mínimo: X"
- `max`: "Valor máximo: X"

### Operações Assíncronas com Cancelamento

Para operações que podem demorar (ex: buscar dados relacionados), use o `LoaderService` com cancelamento:

```typescript
import { Subscription } from 'rxjs';

export class EntityFormComponent extends PrimeReactiveCrudFormComponent<Entity, number> {
  private dataSubscription?: Subscription;

  loadRelatedData(): void {
    // Cancel any existing request
    this.cancelDataRequest();

    // Show loader with cancel button
    this.loaderService.showWithCancel(
      () => this.cancelDataRequest(),
      'Cancelar Busca'
    );

    this.dataSubscription = this.service.getRelatedData(id).subscribe({
      next: (data) => {
        this.loaderService.hide();
        // Process data
      },
      error: (error) => {
        this.loaderService.hide();
        Swal.fire('Erro', 'Erro ao buscar dados.', 'error');
      }
    });
  }

  cancelDataRequest(): void {
    if (this.dataSubscription && !this.dataSubscription.closed) {
      this.dataSubscription.unsubscribe();
      this.loaderService.hide();
    }
  }

  ngOnDestroy(): void {
    this.cancelDataRequest();
  }
}
```

### LoaderService API

**Métodos Disponíveis**:
```typescript
// Show simple loader (no cancel button)
loaderService.show();

// Hide loader
loaderService.hide();

// Show loader with cancel button
loaderService.showWithCancel(
  () => { /* cancel callback */ },
  'Cancel Label'  // optional, default: 'Cancelar'
);

// Track Observable automatically (show/hide loader)
loaderService.track(observable$);
```

### Checklist de Migração

Ao migrar um form existente, seguir este checklist:

- [ ] **Component TypeScript**
  - [ ] Estender `PrimeReactiveCrudFormComponent<Entity, ID>`
  - [ ] Implementar `buildForm()` com `FormBuilder`
  - [ ] Adicionar validadores apropriados
  - [ ] Usar signals para estado local
  - [ ] Definir `ChangeDetectionStrategy.OnPush`
  - [ ] Usar `input()` e `output()` ao invés de decorators

- [ ] **Template HTML**
  - [ ] Substituir `<mat-*>` por `<p-*>` (PrimeNG)
  - [ ] Envolver campos com `<app-form-field>`
  - [ ] Usar `[formGroup]` e `formControlName`
  - [ ] Usar control flow nativo (`@if`, `@for`)
  - [ ] Usar Tailwind classes para layout
  - [ ] Adicionar botões `<app-voltar>`, `<app-cancelar>`, `<app-salvar>`

- [ ] **Module**
  - [ ] Importar `ReactiveFormsModule`
  - [ ] Importar módulos PrimeNG necessários
  - [ ] Importar `FormFieldComponent`
  - [ ] Remover imports de Material Design

- [ ] **Validação**
  - [ ] Passar `[control]` para `app-form-field`
  - [ ] Adicionar `[required]="true"` para campos obrigatórios
  - [ ] Adicionar `hint` para ajudar usuários
  - [ ] Testar mensagens de erro automáticas

- [ ] **Operações Assíncronas**
  - [ ] Usar `loaderService.show()` / `hide()`
  - [ ] Usar `showWithCancel()` para operações canceláveis
  - [ ] Implementar `ngOnDestroy()` para cleanup
  - [ ] Armazenar subscriptions para cancelamento

- [ ] **Build & Teste**
  - [ ] Build sem erros: `npm run build`
  - [ ] Testar criação de novos registros
  - [ ] Testar edição de registros existentes
  - [ ] Testar validação de campos
  - [ ] Testar navegação (voltar, cancelar)
  - [ ] Testar operações assíncronas

### Componentes PrimeNG Comuns em Forms

| Campo | Componente PrimeNG | Import Module |
|-------|-------------------|---------------|
| Text input | `<input pInputText>` | `InputTextModule` |
| Textarea | `<textarea pInputTextarea>` | `InputTextareaModule` |
| Number | `<p-inputNumber>` | `InputNumberModule` |
| Dropdown | `<p-dropdown>` | `DropdownModule` |
| Multi-select | `<p-multiSelect>` | `MultiSelectModule` |
| Calendar | `<p-calendar>` | `CalendarModule` |
| Checkbox | `<p-checkbox>` | `CheckboxModule` |
| Radio | `<p-radioButton>` | `RadioButtonModule` |
| AutoComplete | `<p-autoComplete>` | `AutoCompleteModule` |
| File Upload | `<p-fileUpload>` | `FileUploadModule` |

### Exemplo Completo: Grupo Form

Referência de implementação completa em:
- **Component**: `src/app/grupo/grupo.form.component.ts`
- **Template**: `src/app/grupo/grupo.form.component.html`
- **Module**: `src/app/grupo/grupo.module.ts`

Este exemplo demonstra:
- Form reativo com validação
- Dialog com dados relacionados (itens vinculados)
- Operação assíncrona com cancelamento
- Uso de computed signals
- Cleanup adequado no `ngOnDestroy()`

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
