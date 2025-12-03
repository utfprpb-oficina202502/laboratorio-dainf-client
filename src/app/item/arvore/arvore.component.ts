import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Router} from '@angular/router';

import {Item} from '../item';
import {ItemService} from '../item.service';
import {GrupoService} from '../../grupo/grupo.service';
import {Grupo} from '../../grupo/grupo';
import {CartService} from '../../framework/services/cart.service';
import {BreakpointService} from '../../framework/services/breakpoint.service';
import {LoggerService} from '../../framework/services/logger.service';
import {ItemAvailabilityUtil} from '../../framework/utils/item-availability.util';
import {IMAGE, NAVIGATION} from '../../framework/constants';
import {environment} from '../../../environments/environment';

import {TreeModule, TreeNodeExpandEvent} from 'primeng/tree';
import {TreeNode} from 'primeng/api';
import {ButtonModule} from 'primeng/button';
import {TooltipModule} from 'primeng/tooltip';
import {TagModule} from 'primeng/tag';
import {ProgressSpinnerModule} from 'primeng/progressspinner';
import {MessageModule} from 'primeng/message';
import {InputNumberModule} from 'primeng/inputnumber';
import {FormsModule} from '@angular/forms';
import {CardModule} from 'primeng/card';
import {SkeletonModule} from 'primeng/skeleton';

import {ItemViewModeToggleComponent} from '../components/item-view-mode-toggle.component';

/**
 * Interface para dados do nó da árvore.
 */
interface TreeNodeData {
  type: 'grupo' | 'item';
  grupo?: Grupo;
  item?: Item;
  itemCount?: number;
  loaded?: boolean;
}

/**
 * Componente de visualização de itens em árvore por grupo.
 *
 * Organiza itens hierarquicamente agrupados por categoria,
 * com lazy loading - carrega itens apenas quando o grupo é expandido.
 *
 * @example
 * ```html
 * <!-- Rota: /item/arvore -->
 * <app-arvore />
 * ```
 */
@Component({
  selector: 'app-arvore',
  templateUrl: './arvore.component.html',
  styleUrl: './arvore.component.css',
  imports: [
    CommonModule,
    FormsModule,
    TreeModule,
    ButtonModule,
    TooltipModule,
    TagModule,
    ProgressSpinnerModule,
    MessageModule,
    InputNumberModule,
    CardModule,
    SkeletonModule,
    ItemViewModeToggleComponent
  ],
  providers: [ItemService, GrupoService],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ArvoreComponent implements OnInit {
  protected readonly cartService = inject(CartService);
  protected readonly breakpointService = inject(BreakpointService);
  /**
   * Nós da árvore.
   */
  protected readonly treeNodes = signal<TreeNode<TreeNodeData>[]>([]);
  /**
   * Estado de carregamento inicial.
   */
  protected readonly loading = signal(true);
  /**
   * Erro ao carregar dados.
   */
  protected readonly error = signal<string | null>(null);
  /**
   * Mapa de quantidades selecionadas para cada item.
   */
  protected readonly quantities = signal<Map<number, number>>(new Map());
  /**
   * Mapa de grupos em carregamento.
   */
  protected readonly loadingGroups = signal<Set<number>>(new Set());
  /**
   * Indica se está em modo mobile.
   */
  protected readonly isMobile = computed(() => this.breakpointService.isMobile());
  /**
   * Quantidade de itens no carrinho.
   */
  protected readonly cartItemCount = computed(() => this.cartService.totalItems());
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
    this.loadGroups();

    // Cleanup do timer de navegação ao destruir componente
    this.destroyRef.onDestroy(() => {
      if (this.navigationTimerId) {
        clearTimeout(this.navigationTimerId);
      }
    });
  }

  /**
   * Handler para expansão de nó - carrega itens do grupo sob demanda.
   */
  onNodeExpand(event: TreeNodeExpandEvent): void {
    const node = event.node as TreeNode<TreeNodeData>;

    // Só carrega itens de nós de grupo que ainda não foram carregados
    if (node.data?.type === 'grupo' && !node.data.loaded && node.data.grupo) {
      this.loadItemsForGroup(node);
    }
  }

  /**
   * Verifica se um nó é do tipo item.
   */
  isItemNode(node: TreeNode<TreeNodeData>): boolean {
    return node.data?.type === 'item' && !!node.data?.item;
  }

  /**
   * Retorna o item de um nó (se for nó de item).
   */
  getNodeItem(node: TreeNode<TreeNodeData>): Item | undefined {
    return node.data?.item;
  }

  /**
   * Constrói a URL completa para uma imagem do MinIO.
   */
  getItemImageUrl(item: Item): string {
    if (item.imagemUrl) {
      // Se já for URL absoluta, retorna como está
      if (item.imagemUrl.startsWith('http://') || item.imagemUrl.startsWith('https://')) {
        return item.imagemUrl;
      }
      // Adiciona prefixo do MinIO
      return `${environment.minio_url}${item.imagemUrl}`;
    }

    // Fallback para base64 da primeira imagem
    if (item.imageItem?.length > 0) {
      const cover = item.imageItem.find(img => img.isCover) || item.imageItem[0];
      if (cover.base64) {
        return `data:${cover.contentType};base64,${cover.base64}`;
      }
    }

    // Placeholder
    return IMAGE.PLACEHOLDER;
  }

  /**
   * Retorna a disponibilidade de um item.
   */
  getItemDisponibilidade(item: Item): number {
    return ItemAvailabilityUtil.getDisponibilidade(item);
  }

  /**
   * Retorna a severity do badge de disponibilidade.
   */
  getAvailabilitySeverity(item: Item): 'danger' | 'warn' | 'success' {
    return ItemAvailabilityUtil.getAvailabilitySeverity(item);
  }

  /**
   * Verifica se item está no carrinho.
   */
  isInCart(item: Item): boolean {
    return this.cartService.isInCart(item.id);
  }

  /**
   * Retorna quantidade do item no carrinho.
   */
  getCartQuantity(item: Item): number {
    return this.cartService.getItemQuantity(item.id);
  }

  /**
   * Retorna quantidade selecionada para um item.
   */
  getQuantity(item: Item): number {
    return this.quantities().get(item.id) ?? 1;
  }

  /**
   * Atualiza quantidade selecionada para um item.
   */
  setQuantity(item: Item, value: number): void {
    const quantities = new Map(this.quantities());
    quantities.set(item.id, Math.max(1, value));
    this.quantities.set(quantities);
  }

  /**
   * Máximo que pode ser adicionado de um item.
   */
  getMaxToAdd(item: Item): number {
    const disponivel = this.getItemDisponibilidade(item);
    const inCart = this.getCartQuantity(item);
    return Math.max(0, disponivel - inCart);
  }

  /**
   * Verifica se há disponibilidade para adicionar.
   */
  hasAvailability(item: Item): boolean {
    return this.getMaxToAdd(item) > 0;
  }

  /**
   * Adiciona item ao carrinho.
   */
  addToCart(item: Item): void {
    const qtde = this.getQuantity(item);
    const maxToAdd = this.getMaxToAdd(item);

    if (qtde > 0 && qtde <= maxToAdd) {
      this.cartService.addItem(item, qtde);
      // Reset quantidade para 1
      this.setQuantity(item, 1);
    }
  }

  /**
   * Remove item do carrinho.
   */
  removeFromCart(item: Item): void {
    this.cartService.removeItem(item.id);
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
   * Expande todos os nós e carrega seus itens.
   */
  expandAll(): void {
    const nodes = this.treeNodes().map(node => {
      // Dispara carregamento se ainda não foi carregado
      if (node.data?.type === 'grupo' && !node.data.loaded) {
        this.loadItemsForGroup(node);
      }
      return {...node, expanded: true};
    });
    this.treeNodes.set(nodes);
  }

  /**
   * Colapsa todos os nós.
   */
  collapseAll(): void {
    const nodes = this.treeNodes().map(node => ({
      ...node,
      expanded: false
    }));
    this.treeNodes.set(nodes);
  }

  /**
   * Recarrega dados (limpa cache).
   */
  refresh(): void {
    this.quantities.set(new Map());
    this.loadGroups();
  }

  /**
   * Carrega apenas os grupos inicialmente (lazy loading).
   */
  private loadGroups(): void {
    this.loading.set(true);
    this.error.set(null);

    this.grupoService.findAll().subscribe({
      next: (grupos) => {
        this.buildTreeWithGroups(grupos);
        this.loading.set(false);
      },
      error: (err) => {
        this.logger.error('Erro ao carregar grupos', err);
        this.error.set('Erro ao carregar grupos. Tente novamente.');
        this.loading.set(false);
      }
    });
  }

  /**
   * Constrói a árvore apenas com nós de grupo (sem itens ainda).
   */
  private buildTreeWithGroups(grupos: Grupo[]): void {
    const nodes: TreeNode<TreeNodeData>[] = grupos.map(grupo => ({
      key: `grupo-${grupo.id}`,
      label: grupo.descricao,
      data: {type: 'grupo' as const, grupo, loaded: false},
      leaf: false,
      expanded: false,
      children: []
    }));

    this.treeNodes.set(nodes);
  }

  /**
   * Carrega itens de um grupo específico.
   */
  private loadItemsForGroup(node: TreeNode<TreeNodeData>): void {
    const grupo = node.data?.grupo;
    if (!grupo) return;

    // Marca como carregando
    const loadingGroups = new Set(this.loadingGroups());
    loadingGroups.add(grupo.id);
    this.loadingGroups.set(loadingGroups);

    // Adiciona nó de skeleton temporário para feedback de carregamento
    node.children = [
      {key: `loading-${grupo.id}`, label: '', data: {type: 'item' as const}, leaf: true}
    ];

    // Força atualização da árvore
    this.treeNodes.set([...this.treeNodes()]);

    // Busca itens do grupo (usando filtro no cliente por enquanto)
    this.itemService.findAllPaged(0, 100, '').subscribe({
      next: (response) => {
        const items = (response.content || []).filter(item => item.grupo?.id === grupo.id);

        // Cria nós de item ou nó de estado vazio
        if (items.length > 0) {
          node.children = items.map(item => this.createItemNode(item));
        } else {
          node.children = [
            {key: `empty-${grupo.id}`, label: '', data: {type: 'item' as const}, leaf: true}
          ];
        }
        if (node.data) {
          node.data.loaded = true;
          node.data.itemCount = items.length;
        }

        // Inicializa quantidades para os itens carregados
        const quantities = new Map(this.quantities());
        items.forEach(item => {
          if (!quantities.has(item.id)) {
            quantities.set(item.id, 1);
          }
        });
        this.quantities.set(quantities);

        // Remove do set de loading
        const updatedLoading = new Set(this.loadingGroups());
        updatedLoading.delete(grupo.id);
        this.loadingGroups.set(updatedLoading);

        // Força atualização da árvore
        this.treeNodes.set([...this.treeNodes()]);
      },
      error: (err) => {
        this.logger.error(`Erro ao carregar itens do grupo ${grupo.descricao}`, err);
        node.children = [{
          key: `error-${grupo.id}`,
          label: '',
          data: {type: 'item' as const},
          leaf: true
        }];

        const updatedLoading = new Set(this.loadingGroups());
        updatedLoading.delete(grupo.id);
        this.loadingGroups.set(updatedLoading);

        this.treeNodes.set([...this.treeNodes()]);
      }
    });
  }

  /**
   * Cria um nó de item para a árvore.
   */
  private createItemNode(item: Item): TreeNode<TreeNodeData> {
    return {
      key: `item-${item.id}`,
      label: item.nome,
      data: {type: 'item' as const, item},
      leaf: true
    };
  }
}
