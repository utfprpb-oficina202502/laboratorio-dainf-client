import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  effect,
  inject,
  OnDestroy,
  OnInit
} from "@angular/core";
import {RouterLink, RouterLinkActive} from "@angular/router";
import {SidenavService} from "./sidenav.service";
import {LoginService} from "../login/login.service";
import {MenuItem as PrimeMenuItem} from 'primeng/api';
import {ThemeToggleComponent} from '../framework/component/theme-toggle.component';
import {BreakpointService} from '../framework/service/breakpoint.service';
import {Subject, takeUntil} from 'rxjs';

export interface MenuItem {
  path: string;
  title: string;
  icon: string;
  id: string;
  roles?: string[];
  group?: string;
}

export const MENU_ITEM: MenuItem[] = [
  {
    path: "/",
    title: "Home",
    icon: "home",
    id: "home",
    group: "ITEM",
  },
  {
    path: "/emprestimo",
    title: "Empréstimo",
    icon: "arrow-right-arrow-left",
    id: "emprestimo",
    group: "ITEM",
  },
  {
    path: "/item",
    title: "Item",
    icon: "box",
    id: "item-cadastro",
    roles: ["ADMINISTRADOR", "LABORATORISTA"],
    group: "CADASTRO",
  },
  {
    path: "/grupo",
    title: "Grupo",
    icon: "objects-column",
    id: "grupo",
    roles: ["ADMINISTRADOR", "LABORATORISTA"],
    group: "CADASTRO",
  },
  {
    path: "/fornecedor",
    title: "Fornecedor",
    icon: "briefcase",
    id: "fornecedor",
    roles: ["ADMINISTRADOR", "LABORATORISTA"],
    group: "CADASTRO",
  },
  {
    path: "/usuario",
    title: "Usuário",
    icon: "users",
    id: "usuario",
    roles: ["ADMINISTRADOR"],
    group: "CADASTRO",
  },
  {
    path: "/saida",
    title: "Saída",
    icon: "arrow-down",
    id: "saida",
    roles: ["ADMINISTRADOR", "LABORATORISTA"],
    group: "ITEM",
  },
  {
    path: "/reserva",
    title: "Reserva",
    icon: "calendar",
    id: "reserva",
    group: "ITEM",
  },
  {
    path: "/item",
    title: "Itens",
    icon: "box",
    id: "item-aluno",
    roles: ["ALUNO"],
    group: "ITEM",
  },
  {
    path: "/solicitacao-compra",
    title: "Sol. de Compra",
    icon: "list",
    id: "solicitacao",
    group: "ITEM",
    roles: ["ADMINISTRADOR", "LABORATORISTA"],
  },
  {
    path: "/compra",
    title: "Compra",
    icon: "shopping-cart",
    id: "compra",
    roles: ["ADMINISTRADOR", "LABORATORISTA"],
    group: "ITEM",
  },
  {
    path: "/relatorio",
    title: "Relatórios",
    icon: "chart-line",
    id: "relatorios",
    roles: ["ADMINISTRADOR", "LABORATORISTA"],
    group: "ITEM",
  },
  {
    path: "/nada-consta",
    title: "Nada Consta",
    icon: "file-check",
    id: "nada-consta",
    group: "ITEM",
    roles: ["ADMINISTRADOR", "LABORATORISTA"],
  },
];

@Component({
    selector: "app-sidenav",
    templateUrl: "./sidenav.component.html",
    styleUrls: ["./sidenav.component.css"],
    changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    RouterLinkActive,
    ThemeToggleComponent
  ]
})
export class SidenavComponent implements OnInit, OnDestroy {
  private readonly sidenavService = inject(SidenavService);
  private readonly loginService = inject(LoginService);
  private readonly cdr = inject(ChangeDetectorRef);
  protected readonly breakpointService = inject(BreakpointService);

  public menuItems: PrimeMenuItem[] = this.getDefaultMenuItems();
  public menuCadastros: PrimeMenuItem[] = [];
  display = false;
  showSubMenuCadastro = true;
  showCadastros = false;
  sidebarVisible = true;
  /**
   * Computed signal for template usage - optimized for OnPush change detection
   * Automatically updates when BreakpointService viewport signals change
   * Usage in template: @if (isDesktopView()) { ... }
   */
  protected readonly isDesktopView = computed(() => this.breakpointService.isDesktop());
  private readonly destroy$ = new Subject<void>();

  constructor() {
    // Initialize effect in constructor to maintain injection context
    this.initSidenavEffect();
  }

  ngOnInit(): void {
    this.buildMenu();
    // Initialize sidebar visibility based on breakpoint
    this.sidebarVisible = this.breakpointService.isDesktop();
    // Initialize service state to match viewport (mobile starts minimized)
    if (!this.breakpointService.isDesktop()) {
      this.sidenavService.minimizar(true);
    }
    this.setupBreakpointObserver();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  buildMenu() {
    this.loginService.getPermissoesUser().subscribe((permissoes) => {
      const userRoles = new Set(permissoes.map((x) => x.nome.replaceAll("ROLE_", "")));
      this.showCadastros = userRoles.has("ADMINISTRADOR") || userRoles.has("LABORATORISTA");
      const items: MenuItem[] = [];

      MENU_ITEM.forEach((menu) => {
        if (!menu.roles || menu.roles.some((value) => userRoles.has(value))) {
          items.push(menu);
        }
      });

      const newMenuItems: PrimeMenuItem[] = [];
      const newMenuCadastros: PrimeMenuItem[] = [];

      items.forEach((value) => {
        const primeMenuItem: PrimeMenuItem = {
          label: value.title,
          icon: `pi pi-${value.icon}`,
          routerLink: value.path,
          id: value.id,
          styleClass: 'sidebar-menu-item'
        };

        if (value.group === "ITEM") {
          newMenuItems.push(primeMenuItem);
        } else if (value.group === "CADASTRO") {
          newMenuCadastros.push(primeMenuItem);
        }
      });

      this.menuItems = newMenuItems;
      this.menuCadastros = newMenuCadastros;
      this.cdr?.markForCheck();
    });
  }

  private getDefaultMenuItems(): PrimeMenuItem[] {
    const defaultItems = MENU_ITEM.filter(item =>
      item.group === "ITEM" && (!item.roles || item.roles.includes("ALUNO"))
    );

    return defaultItems.map(item => ({
      label: item.title,
      icon: `pi pi-${item.icon}`,
      routerLink: item.path,
      id: item.id,
      styleClass: 'sidebar-menu-item'
    }));
  }

  // Usa effect() para reagir automaticamente às mudanças do signal
  private initSidenavEffect(): void {
    effect(() => {
      const isMinimized = this.sidenavService.isMinimized();

      if (this.breakpointService.isDesktop()) {
        this.sidebarVisible = true;
      } else {
        this.sidebarVisible = !isMinimized;
      }
      this.cdr?.markForCheck();
    });
  }

  toggleSubMenuCadastro() {
    this.showSubMenuCadastro = !this.showSubMenuCadastro;
    this.cdr?.markForCheck();
  }

  closeSidebar() {
    if (!this.breakpointService.isDesktop()) {
      // Use service to maintain state sync
      this.sidenavService.minimizar(true);
    }
  }

  private setupBreakpointObserver(): void {
    // Subscribe to breakpoint changes for desktop/mobile transitions
    this.breakpointService.observe('(min-width: 1024px)')
    .pipe(takeUntil(this.destroy$))
    .subscribe((result) => {
      const isDesktop = result.matches;
      // Update sidebar visibility on breakpoint change
      if (isDesktop) {
        this.sidebarVisible = true;
      } else {
        // On mobile, check if sidebar should be hidden
        this.sidebarVisible = false;
        this.sidenavService.minimizar(true);
      }
      this.cdr?.markForCheck();
    });
  }
}
