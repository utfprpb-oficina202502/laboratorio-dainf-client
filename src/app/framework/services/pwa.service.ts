import {ApplicationRef, computed, inject, Injectable, signal} from '@angular/core';
import {SwUpdate, VersionReadyEvent} from '@angular/service-worker';
import {concat, filter, first, interval} from 'rxjs';
import Swal from 'sweetalert2';
import {LoggerService} from './logger.service';

/**
 * PWA Service - Progressive Web App Update Management
 *
 * Handles service worker updates and provides reactive update status.
 * Integrates with Angular 20 signals for modern state management.
 *
 * Features:
 * - Automatic update detection
 * - User-friendly update prompts
 * - Online/offline status tracking
 * - Signal-based reactive API
 * - Periodic update checks
 *
 * Usage:
 * ```typescript
 * constructor(private pwaService: PwaService) {
 *   // Service initializes automatically
 *   // Update prompts show automatically when available
 * }
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class PwaService {
  private readonly swUpdate = inject(SwUpdate);
  private readonly appRef = inject(ApplicationRef);
  private readonly logger = inject(LoggerService);

  // Signal-based reactive state
  private readonly updateAvailableSignal = signal<boolean>(false);
  // Public computed signals
  public readonly isUpdateAvailable = computed(() => this.updateAvailableSignal());
  private readonly onlineSignal = signal<boolean>(typeof navigator === 'undefined' ? true : navigator.onLine);
  public readonly isOnline = computed(() => this.onlineSignal());
  private readonly updateCheckInProgressSignal = signal<boolean>(false);
  public readonly isUpdateCheckInProgress = computed(() => this.updateCheckInProgressSignal());

  // Latest version info
  private readonly latestVersionHash = signal<string>('');

  constructor() {
    this.initializeServiceWorker();
  }

  /**
   * Manually check for updates
   * @returns Promise<boolean> true if update available
   */
  public async checkForUpdate(): Promise<boolean> {
    if (!this.swUpdate.isEnabled) {
      return false;
    }

    if (this.updateCheckInProgressSignal()) {
      this.logger.debug('⏳ Update check already in progress');
      return false;
    }

    try {
      this.updateCheckInProgressSignal.set(true);
      this.logger.debug('🔍 Checking for updates...');

      const updateAvailable = await this.swUpdate.checkForUpdate();

      if (updateAvailable) {
        this.logger.info('✅ Update check: Update available');
      } else {
        this.logger.info('✅ Update check: Already on latest version');
      }

      return updateAvailable;
    } catch (error) {
      this.logger.error('❌ Update check failed', error);
      return false;
    } finally {
      this.updateCheckInProgressSignal.set(false);
    }
  }

  /**
   * Activate pending update and reload
   */
  public async activateUpdate(): Promise<void> {
    if (!this.swUpdate.isEnabled) {
      this.logger.warn('⚠️ Cannot activate update - service worker not enabled');
      return;
    }

    try {
      this.logger.info('🔄 Activating update...');

      // Show loading indicator
      Swal.fire({
        title: 'Atualizando...',
        text: 'Por favor, aguarde enquanto instalamos a atualização.',
        icon: 'info',
        allowOutsideClick: false,
        showConfirmButton: false,
        willOpen: () => {
          Swal.showLoading();
        }
      });

      // Activate the update
      await this.swUpdate.activateUpdate();

      this.logger.info('✅ Update activated - reloading application');

      // Reload the page to use new version
      globalThis.location.reload();
    } catch (error) {
      this.logger.error('❌ Update activation failed', error);

      Swal.fire({
        title: 'Erro na Atualização',
        text: 'Não foi possível instalar a atualização. Por favor, recarregue a página manualmente.',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    }
  }

  /**
   * Get current version information
   */
  public getCurrentVersion(): string {
    return this.latestVersionHash() || 'unknown';
  }

  /**
   * Force check for update (for manual refresh button)
   */
  public async forceUpdateCheck(): Promise<void> {
    const updateAvailable = await this.checkForUpdate();

    if (!updateAvailable) {
      Swal.fire({
        title: 'Versão Atual',
        text: 'Você já está usando a versão mais recente do sistema.',
        icon: 'success',
        confirmButtonText: 'OK',
        timer: 3000
      });
    }
  }

  /**
   * Initialize service worker and update mechanisms
   */
  private initializeServiceWorker(): void {
    if (!this.swUpdate.isEnabled) {
      this.logger.warn('⚠️ Service Worker not enabled - PWA features disabled');
      this.logger.info('   Run production build to enable: npm run build');
      return;
    }

    this.logger.info('✅ PWA Service Worker enabled');

    // Check for updates immediately after app stabilizes
    this.checkForUpdatesOnStable();

    // Listen for available updates
    this.listenForUpdates();

    // Setup periodic update checks (every 6 hours)
    this.setupPeriodicUpdateChecks();

    // Setup online/offline detection
    this.setupOnlineDetection();

    // Log unrecoverable state
    this.logUnrecoverableState();
  }

  /**
   * Check for updates when app stabilizes
   */
  private checkForUpdatesOnStable(): void {
    // Wait for app to stabilize before first update check
    // This prevents update checks during initial load
    const appIsStable$ = this.appRef.isStable.pipe(
      first(isStable => isStable === true)
    );

    // Check for updates 30 seconds after app stabilizes
    const everySixHours$ = interval(6 * 60 * 60 * 1000); // 6 hours

    concat(appIsStable$, everySixHours$).subscribe(() => {
      this.checkForUpdate();
    });
  }

  /**
   * Listen for available updates
   */
  private listenForUpdates(): void {
    this.swUpdate.versionUpdates
    .pipe(
      filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY')
    )
    .subscribe(event => {
      this.logger.info('🆕 New version available:', event.latestVersion.hash);
      this.latestVersionHash.set(event.latestVersion.hash);
      this.updateAvailableSignal.set(true);
      this.promptUserForUpdate();
    });
  }

  /**
   * Setup periodic update checks
   */
  private setupPeriodicUpdateChecks(): void {
    // Check for updates every 6 hours
    interval(6 * 60 * 60 * 1000).subscribe(() => {
      if (this.onlineSignal()) {
        this.checkForUpdate();
      }
    });
  }

  /**
   * Setup online/offline detection
   */
  private setupOnlineDetection(): void {
    if (typeof globalThis === 'undefined') {
      return;
    }

    globalThis.addEventListener('online', () => {
      this.logger.info('🌐 Application online');
      this.onlineSignal.set(true);
      this.checkForUpdate(); // Check for updates when coming back online
    });

    globalThis.addEventListener('offline', () => {
      this.logger.info('📴 Application offline');
      this.onlineSignal.set(false);
    });
  }

  /**
   * Log unrecoverable state (service worker broken)
   */
  private logUnrecoverableState(): void {
    this.swUpdate.unrecoverable.subscribe(event => {
      this.logger.error('❌ Service worker in unrecoverable state', event.reason);
      Swal.fire({
        title: 'Erro Crítico',
        text: 'A aplicação está em estado inconsistente. Por favor, recarregue a página.',
        icon: 'error',
        confirmButtonText: 'Recarregar',
        allowOutsideClick: false
      }).then((result) => {
        if (result.isConfirmed) {
          globalThis.location.reload();
        }
      });
    });
  }

  /**
   * Prompt user to update application
   */
  private promptUserForUpdate(): void {
    Swal.fire({
      title: 'Atualização Disponível',
      html: `
        <p>Uma nova versão do sistema está disponível.</p>
        <p class="text-sm text-gray-600 mt-2">A atualização inclui melhorias de desempenho e correções.</p>
      `,
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'Atualizar Agora',
      cancelButtonText: 'Depois',
      confirmButtonColor: '#1976d2',
      cancelButtonColor: '#6c757d',
      allowOutsideClick: false,
      customClass: {
        popup: 'pwa-update-popup',
        confirmButton: 'p-button p-button-primary',
        cancelButton: 'p-button p-button-secondary'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.activateUpdate();
      } else {
        this.logger.info('ℹ️ User deferred update');
        // Update will be available on next page reload
      }
    });
  }
}
