import { Component, HostListener, OnInit, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef, inject } from "@angular/core";
import { SidenavService } from "./sidenav.service";
import { browserChange } from "../app.component";
import { LoginService } from "../login/login.service";
import { UsuarioService } from "../usuario/usuario.service";
import { Router } from "@angular/router";
import { ThemeService } from "../framework/services/theme.service";
import { MenuItem as PrimeMenuItem } from 'primeng/api';
import { Drawer } from 'primeng/drawer';

export interface MenuItem {
  path: string;
  title: string;
  icon: string;
  id: string;
  roles?: any;
  group?: any;
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
    icon: "handshake-o",
    id: "emprestimo",
    group: "ITEM",
  },
  {
    path: "/item",
    title: "Item",
    icon: "microchip",
    id: "item",
    roles: ["ADMINISTRADOR", "LABORATORISTA"],
    group: "CADASTRO",
  },
  {
    path: "/grupo",
    title: "Grupo",
    icon: "sitemap",
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
    icon: "paste",
    id: "reserva",
    group: "ITEM",
  },
  {
    path: "/item",
    title: "Itens",
    icon: "microchip",
    id: "item",
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
    icon: "line-chart",
    id: "relatorios",
    roles: ["ADMINISTRADOR", "LABORATORISTA"],
    group: "ITEM",
  },
];

@Component({
    selector: "app-sidenav",
    templateUrl: "./sidenav.component.html",
    styleUrls: ["./sidenav.component.css"],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class SidenavComponent implements OnInit {
  private readonly sidenavService = inject(SidenavService);
  private readonly loginService = inject(LoginService);
  private readonly usuarioService = inject(UsuarioService);
  private readonly router = inject(Router);
  readonly themeService = inject(ThemeService);
  private readonly cdr = inject(ChangeDetectorRef);

  public menuItems: PrimeMenuItem[] = this.getDefaultMenuItems();
  public menuCadastros: PrimeMenuItem[] = [];
  display = false;
  showSubMenuCadastro = true;
  showCadastros = false;
  private readonly desktopBreakpoint = 1200;
  private viewportInitialized = false;
  private isDesktopView = true;
  closeOnEscape = false;
  sidebarVisible = true;
  @ViewChild("drawer") drawer: Drawer;

  ngOnInit(): void {
    this.buildMenu();
    this.updateViewportFlags();
    this.changeStylesDrawer();
    this.changeColorMenuItem();
    this.initObservableDrawer();
    this.initObservableMenuItem();
  }

  private getDefaultMenuItems(): PrimeMenuItem[] {
    const defaultItems = MENU_ITEM.filter(item =>
      item.group === "ITEM" && (!item.roles || item.roles.includes("ALUNO"))
    );

    return defaultItems.map(item => ({
      label: item.title,
      icon: `fa fa-${item.icon}`,
      routerLink: item.path,
      id: item.id,
      styleClass: 'sidebar-menu-item'
    }));
  }

  @HostListener("window:resize")
  onWindowResize(): void {
    this.updateViewportFlags();
    this.changeStylesDrawer();
  }

  buildMenu() {
    this.loginService.getPermissoesUser().subscribe((permissoes) => {
      const userRoles = permissoes.map((x: any) => x.nome.replace("ROLE_", ""));
      this.showCadastros = userRoles.indexOf("ADMINISTRADOR") >= 0 || userRoles.indexOf("LABORATORISTA") >= 0;
      const items = [];

      MENU_ITEM.forEach((menu: any) => {
        if (menu.roles != null) {
          if (menu.roles.filter((value) => -1 !== userRoles.indexOf(value)).length > 0) {
            items.push(menu);
          }
        } else {
          items.push(menu);
        }
      });

      const newMenuItems: PrimeMenuItem[] = [];
      const newMenuCadastros: PrimeMenuItem[] = [];

      items.forEach((value) => {
        const primeMenuItem: PrimeMenuItem = {
          label: value.title,
          icon: `fa fa-${value.icon}`,
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
      this.cdr.markForCheck();
    });
  }

  initObservableDrawer() {
    this.sidenavService.observable().subscribe((hide) => {
      this.updateViewportFlags();
      if (this.isDesktopView) {
        this.sidebarVisible = true;
      } else {
        this.sidebarVisible = !hide;
      }
      this.changeStylesDrawer();
      this.cdr.markForCheck();
    });
  }

  initObservableMenuItem() {
    browserChange.asObservable().subscribe((value) => {
      if (value) {
        this.changeColorMenuItem();
      }
    });
  }

  toggleSubMenuCadastro() {
    this.showSubMenuCadastro = !this.showSubMenuCadastro;
  }

  private updateViewportFlags(): void {
    if (typeof window === 'undefined') {
      return;
    }

    const width = window.innerWidth;
    const wasDesktop = this.isDesktopView;
    const isDesktop = width >= this.desktopBreakpoint;

    this.isDesktopView = isDesktop;
    this.closeOnEscape = !isDesktop;

    if (!this.viewportInitialized) {
      this.sidebarVisible = isDesktop;
      this.viewportInitialized = true;
      return;
    }

    if (!wasDesktop && isDesktop) {
      this.sidebarVisible = true;
    } else if (wasDesktop && !isDesktop) {
      this.sidebarVisible = false;
    }
  }

  changeColorMenuItem() {
  }

  changeStylesDrawer() {
  }
}
