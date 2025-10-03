import { Component, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
import {LoginService} from './login/login.service';
import {Subject, Subscription} from 'rxjs';
import {NavigationCancel, NavigationEnd, NavigationStart, NavigationError, Router} from '@angular/router';
import {LoaderService} from './framework/loader/loader.service';

export const browserChange = new Subject<boolean>();

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
    standalone: false,
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
