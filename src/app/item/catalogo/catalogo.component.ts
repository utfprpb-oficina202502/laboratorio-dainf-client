import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal
} from '@angular/core';

import {FormsModule} from '@angular/forms';
import {Router} from '@angular/router';

import {Item} from '../item';
import {ItemService} from '../item.service';
import {ItemCardComponent} from './components/item-card';
import {CartService} from '../../framework/service/cart.service';
import {GrupoService} from '../../grupo/grupo.service';
import {Grupo} from '../../grupo/grupo';
import {PageResponse} from '../../framework/service/crud.service';
import {BreakpointService} from '../../framework/service/breakpoint.service';
import {LoggerService} from '../../framework/service/logger.service';
import {NAVIGATION} from '../../framework/constants';

import {ButtonModule} from 'primeng/button';
import {InputTextModule} from 'primeng/inputtext';
import {SelectModule} from 'primeng/select';
import {ProgressSpinnerModule} from 'primeng/progressspinner';
import {PaginatorModule, PaginatorState} from 'primeng/paginator';
import {MessageModule} from 'primeng/message';
import {SkeletonModule} from 'primeng/skeleton';
import {TooltipModule} from 'primeng/tooltip';
import {IconFieldModule} from 'primeng/iconfield';
import {InputIconModule} from 'primeng/inputicon';
import {CardModule} from 'primeng/card';

import {ItemViewModeToggleComponent} from '../components/item-view-mode-toggle.component';

/**
 * Componente de catálogo de itens em formato de cards.
 *
 * Exibe itens disponíveis para reserva em um grid responsivo,
 * com filtros por busca e grupo, e paginação.
 *
 * @example
 * ```html
 * <!-- Rota: /item/catalogo -->
 * <app-catalogo />
 * ```
 */
@Component({
  selector: 'app-catalogo',
  templateUrl: './catalogo.component.html',
  styleUrl: './catalogo.component.css',
  imports: [
    FormsModule,
    ItemCardComponent,
    ItemViewModeToggleComponent,
    ButtonModule,
    InputTextModule,
    SelectModule,
    ProgressSpinnerModule,
    PaginatorModule,
    MessageModule,
    SkeletonModule,
    TooltipModule,
    IconFieldModule,
    InputIconModule,
    CardModule
  ],
  providers: [ItemService, GrupoService],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CatalogoComponent implements OnInit {
  protected readonly cartService = inject(CartService);
  protected readonly breakpointService = inject(BreakpointService);
  /**
   * Lista de itens carregados.
   */
  protected readonly items = signal<Item[]>([]);
  /**
   * Lista de grupos para filtro.
   */
  protected readonly grupos = signal<Grupo[]>([]);
  /**
   * Estado de carregamento.
   */
  protected readonly loading = signal(true);
  /**
   * Termo de busca.
   */
  protected readonly searchTerm = signal('');
  /**
   * Grupo selecionado para filtro.
   */
  protected readonly selectedGrupo = signal<Grupo | null>(null);
  /**
   * Paginação - página atual (0-indexed).
   */
  protected readonly currentPage = signal(0);
  /**
   * Paginação - itens por página.
   */
  protected readonly pageSize = signal(12);
  /**
   * Total de elementos no backend.
   */
  protected readonly totalRecords = signal(0);
  /**
   * Erro ao carregar dados.
   */
  protected readonly error = signal<string | null>(null);
  /**
   * Opções de itens por página.
   */
  protected readonly rowsPerPageOptions = [12, 24, 48];
  /**
   * Indica se está em modo mobile.
   */
  protected readonly isMobile = computed(() => this.breakpointService.isMobile());
  /**
   * Quantidade de itens no carrinho.
   */
  protected readonly cartItemCount = computed(() => this.cartService.totalItems());
  /**
   * Opções de grupo com opção "Todos".
   */
  protected readonly grupoOptions = computed(() => {
    const grupos = this.grupos();
    return [{id: 0, descricao: 'Todos os grupos'} as Grupo, ...grupos];
  });
  private readonly itemService = inject(ItemService);
  private readonly grupoService = inject(GrupoService);
  private readonly router = inject(Router);
  private readonly logger = inject(LoggerService);
  private readonly destroyRef = inject(DestroyRef);
  /**
   * Controle de debounce para navegação ao carrinho.
   */
  private navigatingToReserva = false;
  /**
   * Timer ID para cleanup do debounce de navegação.
   */
  private navigationTimerId: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.loadGrupos();
    this.loadItems();

    // Cleanup do timer de navegação ao destruir componente
    this.destroyRef.onDestroy(() => {
      if (this.navigationTimerId) {
        clearTimeout(this.navigationTimerId);
      }
    });
  }

  /**
   * Carrega itens com filtros e paginação.
   */
  loadItems(): void {
    this.loading.set(true);
    this.error.set(null);

    const page = this.currentPage();
    const size = this.pageSize();
    const filter = this.searchTerm();
    const grupoId = this.selectedGrupo()?.id || undefined;

    this.itemService.findAllPagedByGrupo(page, size, filter, grupoId).subscribe({
      next: (response: PageResponse<Item>) => {
        this.items.set(response.content || []);
        this.totalRecords.set(response.totalElements);
        this.loading.set(false);
      },
      error: (err) => {
        this.logger.error('Erro ao carregar itens', err);
        this.error.set('Erro ao carregar itens. Tente novamente.');
        this.loading.set(false);
      }
    });
  }

  /**
   * Handler de mudança de página.
   */
  onPageChange(event: PaginatorState): void {
    const page = event.page ?? 0;
    const rows = event.rows ?? this.pageSize();

    this.currentPage.set(page);
    this.pageSize.set(rows);
    this.loadItems();
  }

  /**
   * Handler de busca (debounced no template).
   */
  onSearch(): void {
    this.currentPage.set(0);
    this.loadItems();
  }

  /**
   * Handler de mudança de grupo.
   */
  onGrupoChange(): void {
    this.currentPage.set(0);
    this.loadItems();
  }

  /**
   * Navega para detalhes do item.
   */
  onViewDetails(item: Item): void {
    this.router.navigate(['/item/form', item.id]);
  }

  /**
   * Navega para a reserva com itens do carrinho.
   * Inclui proteção contra cliques múltiplos (debounce).
   */
  goToReserva(): void {
    if (this.navigatingToReserva) return;

    this.navigatingToReserva = true;
    this.router.navigate(['/reserva/new'], {
      state: {cartItems: this.cartService.items()}
    });

    // Reset após navegação para permitir uso futuro (caso volte)
    this.navigationTimerId = setTimeout(() => {
      this.navigatingToReserva = false;
      this.navigationTimerId = null;
    }, NAVIGATION.DEBOUNCE_MS);
  }

  /**
   * Limpa filtros e recarrega.
   */
  clearFilters(): void {
    this.searchTerm.set('');
    this.selectedGrupo.set(null);
    this.currentPage.set(0);
    this.loadItems();
  }

  /**
   * Retorna array para skeleton loading.
   */
  getSkeletonArray(): number[] {
    return Array.from({length: this.pageSize()}, (_, i) => i);
  }

  /**
   * Carrega lista de grupos para filtro.
   */
  private loadGrupos(): void {
    this.grupoService.findAll().subscribe({
      next: (grupos) => this.grupos.set(grupos),
      error: (err) => this.logger.error('Erro ao carregar grupos', err)
    });
  }
}
