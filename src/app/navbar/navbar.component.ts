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
      TieredMenuModule
    ]
})
export class NavbarComponent implements OnInit {
  private readonly loginService = inject(LoginService);
  private readonly sidenavService = inject(SidenavService);
  private readonly router = inject(Router);
  private readonly logger = inject(LoggerService);

  items: MenuItem[] = [];

  ngOnInit() {
    this.optionDropdown();
  }

  logout() {
    this.loginService.logout();
  }

  toggleSidenav() {
    this.sidenavService.toggle();
  }

  optionDropdown() {
    this.items = [
      {
        label: "Meus dados",
        icon: "pi pi-user-edit",
        command: () => this.openEditForm(),
      },
      {
        label: "Sair",
        icon: "pi pi-external-link",
        command: () => this.logout(),
      },
    ];
  }

  getUserLogado() {
    return localStorage.getItem("username");
  }

  openEditForm() {
    const userLogged = localStorage.getItem("userLogged");
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
