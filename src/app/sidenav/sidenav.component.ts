import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  HostListener,
  inject,
  OnInit
} from "@angular/core";
import {RouterLink, RouterLinkActive} from "@angular/router";
import {SidenavService} from "./sidenav.service";
import {LoginService} from "../login/login.service";
import {MenuItem as PrimeMenuItem} from 'primeng/api';
import {ThemeToggleComponent} from '../framework/component/theme-toggle.component';

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
export class SidenavComponent implements OnInit {
  private readonly sidenavService = inject(SidenavService);
  private readonly loginService = inject(LoginService);
  private readonly cdr = inject(ChangeDetectorRef);

  public menuItems: PrimeMenuItem[] = this.getDefaultMenuItems();
  public menuCadastros: PrimeMenuItem[] = [];
  display = false;
  showSubMenuCadastro = true;
  showCadastros = false;
  private readonly desktopBreakpoint = 1200;
  private viewportInitialized = false;
  isDesktopView = true;
  sidebarVisible = true;

  ngOnInit(): void {
    this.buildMenu();
    this.updateViewportFlags();
    // Initialize service state to match viewport (mobile starts minimized)
    if (!this.isDesktopView) {
      this.sidenavService.minimizar(true);
    }
    this.initObservableDrawer();
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

  @HostListener("window:resize")
  onWindowResize(): void {
    this.updateViewportFlags();
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

  initObservableDrawer() {
    this.sidenavService.observable().subscribe((hide) => {
      this.updateViewportFlags();
      if (this.isDesktopView) {
        this.sidebarVisible = true;
      } else {
        this.sidebarVisible = !hide;
      }
      this.cdr?.markForCheck();
    });
  }

  toggleSubMenuCadastro() {
    this.showSubMenuCadastro = !this.showSubMenuCadastro;
    this.cdr?.markForCheck();
  }

  closeSidebar() {
    if (!this.isDesktopView) {
      // Use service to maintain state sync
      this.sidenavService.minimizar(true);
    }
  }

  private updateViewportFlags(): void {
    if (typeof globalThis === 'undefined') {
      return;
    }

    const width = globalThis.innerWidth;
    const wasDesktop = this.isDesktopView;
    const isDesktop = width >= this.desktopBreakpoint;

    this.isDesktopView = isDesktop;

    if (!this.viewportInitialized) {
      this.sidebarVisible = isDesktop;
      this.viewportInitialized = true;
      this.cdr?.markForCheck();
      return;
    }

    if (!wasDesktop && isDesktop) {
      this.sidebarVisible = true;
      this.cdr?.markForCheck();
    } else if (wasDesktop && !isDesktop) {
      this.sidebarVisible = false;
      this.cdr?.markForCheck();
    }
  }
}
