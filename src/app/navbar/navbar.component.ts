import { Component, OnInit, ChangeDetectionStrategy, inject } from "@angular/core";
import { RouterLink, RouterLinkActive, Router } from "@angular/router";
import { LoginService } from "../login/login.service";
import { SidenavService } from "../sidenav/sidenav.service";
import { MenuItem } from "primeng/api";
import { ToolbarModule as PrimeToolbarModule } from 'primeng/toolbar';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { TieredMenuModule } from 'primeng/tieredmenu';

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
    // Just toggle the service - the sidebar component handles its own state
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
    const id = JSON.parse(localStorage.getItem("userLogged")).id;
    this.router.navigate([`/usuario/edit/${id}`]);
  }
}
