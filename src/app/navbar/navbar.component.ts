import {ChangeDetectionStrategy, Component, inject, OnInit} from "@angular/core";
import {Router, RouterLink, RouterLinkActive} from "@angular/router";
import {LoginService} from "../login/login.service";
import {SidenavService} from "../sidenav/sidenav.service";
import {MenuItem} from "primeng/api";
import {ToolbarModule as PrimeToolbarModule} from 'primeng/toolbar';
import {ButtonModule} from 'primeng/button';
import {TooltipModule} from 'primeng/tooltip';
import {TieredMenuModule} from 'primeng/tieredmenu';
import {LoggerService} from '../framework/services/logger.service';
import {StorageService} from '../framework/services/storage.service';
import {CartBadgeComponent} from '../geral/cart';

@Component({
    selector: "app-navbar",
    templateUrl: "./navbar.component.html",
    styleUrls: ["./navbar.component.css"],
        changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
      RouterLink,
      RouterLinkActive,
      PrimeToolbarModule,
      ButtonModule,
      TooltipModule,
      TieredMenuModule,
      CartBadgeComponent
    ]
})
export class NavbarComponent implements OnInit {
  private readonly loginService = inject(LoginService);
  private readonly sidenavService = inject(SidenavService);
  private readonly router = inject(Router);
  private readonly logger = inject(LoggerService);
  private readonly storageService = inject(StorageService);

  items: MenuItem[] = [];

  // Flag para prevenir dupla execução em dispositivos touch
  private touchHandled = false;

  ngOnInit() {
    this.optionDropdown();
  }

  logout() {
    this.loginService.logout();
  }

  toggleSidenav() {
    this.sidenavService.toggle();
  }

  /**
   * Manipula evento touch para resposta imediata em mobile.
   * Usa touchend ao invés de touchstart para melhor compatibilidade com gestos.
   * Marca o evento como tratado para prevenir execução duplicada no click handler.
   */
  onHamburgerTouch(event: TouchEvent): void {
    // Previne comportamento padrão (scroll, hover states, etc)
    event.preventDefault();
    // Previne propagação para evitar que o evento click seja disparado
    event.stopPropagation();

    // Executa ação imediatamente
    this.toggleSidenav();

    // Marca como tratado para ignorar click subsequente
    this.touchHandled = true;

    // Reseta flag após delay curto (300ms é o padrão do navegador para tap→click)
    setTimeout(() => {
      this.touchHandled = false;
    }, 400);
  }

  /**
   * Handler de click que ignora eventos se já foram tratados via touch.
   * Garante compatibilidade com mouse/desktop.
   */
  onHamburgerClick(event: MouseEvent): void {
    // Se o evento touch já tratou a ação, ignora o click
    if (this.touchHandled) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    // Em desktop (sem touch), executa normalmente
    this.toggleSidenav();
  }

  optionDropdown() {
    this.items = [
      {
        label: 'Meus dados',
        icon: 'pi pi-user-edit',
        // Corrigido: garante que command não retorna Promise
        command: () => { this.openEditForm(); },
      },
      {
        label: 'Configurações',
        icon: 'pi pi-cog',
        command: () => { this.router.navigate(['/configuracoes']); },
      },
      {
        label: 'Sair',
        icon: 'pi pi-external-link',
        command: () => { this.logout(); },
      },
    ];
  }

  getUserLogado() {
    return this.storageService.getItem("username");
  }

  openEditForm() {
    const userLogged = this.storageService.getItem("userLogged");
    if (userLogged) {
      try {
        const user = JSON.parse(userLogged);
        if (user?.id) {
          this.router.navigate([`/usuario/edit/${user.id}`]);
        } else {
          this.logger.error('ID do usuário não encontrado');
          this.logout();
        }
      } catch (error) {
        this.logger.error('Erro ao processar dados do usuário', error);
        this.logout();
      }
    } else {
      this.logger.error('Dados do usuário não encontrados');
      this.logout();
    }
  }
}
