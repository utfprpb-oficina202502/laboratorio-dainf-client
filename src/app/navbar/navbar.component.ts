import {ChangeDetectionStrategy, Component, inject, OnInit} from "@angular/core";
import {Router, RouterLink, RouterLinkActive} from "@angular/router";
import {LoginService} from "../login/login.service";
import {SidenavService} from "../sidenav/sidenav.service";
import {MenuItem} from "primeng/api";
import {ToolbarModule as PrimeToolbarModule} from 'primeng/toolbar';
import {ButtonModule} from 'primeng/button';
import {TooltipModule} from 'primeng/tooltip';
import {TieredMenuModule} from 'primeng/tieredmenu';

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

  items: MenuItem[];

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
          console.error('ID do usuário não encontrado');
          this.logout();
        }
      } catch (error) {
        console.error('Erro ao processar dados do usuário', error);
        this.logout();
      }
    } else {
      console.error('Dados do usuário não encontrados');
      this.logout();
    }
  }
}
