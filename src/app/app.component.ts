import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy
} from '@angular/core';
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
import {ThemeService} from './framework/services/theme.service';
import {BFCacheService} from './framework/services/bfcache.service';
import {PwaService} from './framework/services/pwa.service';
import {Z_INDEX} from './framework/constants';
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
export class AppComponent implements OnDestroy {
  private readonly loginService = inject(LoginService);
  private readonly router = inject(Router);
  private readonly loaderService = inject(LoaderService);
  // Constants for template
  protected readonly Z_INDEX = Z_INDEX;
  private readonly themeService = inject(ThemeService);
  private readonly bfCacheService = inject(BFCacheService);
  private readonly cdr = inject(ChangeDetectorRef);

  title = 'tcc-client';
  isAuthenticated = false;
  isNavigating = false;
  subscription!: Subscription;
  private readonly pwaService = inject(PwaService);
  // BFCache cleanup subscriptions
  private readonly bfCacheCleanupHandlers: (() => void)[] = [];

  constructor() {
    // NOSONAR: void operator usado intencionalmente para inicialização precoce de serviços com side-effects
    void this.themeService;
    // NOSONAR: Mesmo acima
    void this.pwaService;

    this.loginService.isAuthenticated.asObservable()
    .subscribe({
      next: (authenticated) => {
        this.isAuthenticated = authenticated;
        this.cdr?.markForCheck();
      }
    });
    this.buildSubscriptionEvent();
    this.setupBFCache();
    this.setupPWA();
  }

  verifyAccess(role: string): boolean {
    return this.loginService.hasAnyRole([role]);
  }

  buildSubscriptionEvent() {
    this.subscription = this.router.events.subscribe({
      next: (event) => {
        if (event instanceof NavigationStart) {
          this.isNavigating = true;
          this.cdr?.markForCheck();
        } else if (event instanceof NavigationEnd || event instanceof NavigationCancel || event instanceof NavigationError) {
          this.isNavigating = false;
          this.cdr?.markForCheck();
          browserChange.next(true);
        }
      }
    });
  }

  ngOnDestroy(): void {
    // Clean up router subscription
    if (this.subscription) {
      this.subscription.unsubscribe();
    }

    // Clean up BFCache handlers
    this.bfCacheCleanupHandlers.forEach(cleanup => cleanup());
  }

  /**
   * Setup PWA (Progressive Web App) capabilities
   * Enables automatic update detection and management
   */
  private setupPWA(): void {
    // PWA service handles everything automatically:
    // - Update detection and user prompts
    // - Online/offline status tracking
    // - Service worker lifecycle management
  }

  /**
   * Setup BFCache (Back/Forward Cache) optimization
   * Handles page restoration and cleanup for browser navigation cache
   */
  private setupBFCache(): void {
    // Handle page restoration from BFCache
    const restoredHandler = this.bfCacheService.onRestored(() => {
      // Refresh authentication state if needed
      if (this.isAuthenticated) {
        // Re-trigger authentication check to ensure session is still valid
        this.loginService.refreshCurrentUser().subscribe({
          next: () => {
            this.cdr?.markForCheck();
          },
          error: () => {
            this.cdr?.markForCheck();
          }
        });
      }

      // Trigger change detection to refresh UI
      this.cdr?.markForCheck();
    });
    this.bfCacheCleanupHandlers.push(restoredHandler);

    // Handle page being stored in BFCache (cleanup)
    const hideHandler = this.bfCacheService.onPageHide(() => {
      // Hide loader to prevent frozen UI state
      this.loaderService.hide();

      // No need to close HTTP connections - browser handles this
      // Just ensure no active UI state that would confuse users
    });
    this.bfCacheCleanupHandlers.push(hideHandler);
  }
}
