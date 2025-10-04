import {ChangeDetectionStrategy, ChangeDetectorRef, Component, inject} from '@angular/core';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
  RouterOutlet
} from '@angular/router';
import {LoginService} from './login/login.service';
import {Subject, Subscription} from 'rxjs';
import {LoaderService} from './framework/loader/loader.service';
import {NavbarComponent} from './navbar/navbar.component';
import {SidenavComponent} from './sidenav/sidenav.component';
import {LoaderComponent} from './framework/loader/loader.component';
import {ToastModule} from 'primeng/toast';
import {ConfirmDialogModule} from 'primeng/confirmdialog';
import {ScrollPanelModule} from 'primeng/scrollpanel';

export const browserChange = new Subject<boolean>();

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
  imports: [
    RouterOutlet,
    NavbarComponent,
    SidenavComponent,
    LoaderComponent,
    ToastModule,
    ConfirmDialogModule,
    ScrollPanelModule
  ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
  private readonly loginService = inject(LoginService);
  private readonly router = inject(Router);
  private readonly loaderService = inject(LoaderService);
  private readonly cdr = inject(ChangeDetectorRef);

  title = 'tcc-client';
  isAuthenticated = false;
  isNavigating = false;
  subscription: Subscription;

  constructor() {
    const loginService = this.loginService;

    loginService.isAuthenticated.asObservable()
      .subscribe(e => {
        this.isAuthenticated = e;
        this.cdr.markForCheck();
      });
    this.buildSubscriptionEvent();
  }

  verifyAccess(role: string): boolean {
    return this.loginService.hasAnyRole(role);
  }

  buildSubscriptionEvent() {
    this.subscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.isNavigating = true;
        this.loaderService.show();
        this.cdr.markForCheck();
      } else if (event instanceof NavigationEnd || event instanceof NavigationCancel || event instanceof NavigationError) {
        if (event instanceof NavigationError) {
          console.error('[NavigationError]', event.error);
        }
        this.isNavigating = false;
        this.loaderService.hide();
        this.cdr.markForCheck();
        browserChange.next(true);
      }
    });
  }
}
