import {inject, Injectable, signal} from '@angular/core';
import {Subject} from 'rxjs';
import {LoggerService} from './logger.service';

/**
 * BFCache (Back/Forward Cache) Service
 *
 * Manages browser back/forward cache optimization for improved navigation performance.
 * Listens for page visibility events and provides hooks for cleanup and restoration.
 *
 * BFCache allows browsers to keep pages in memory when navigating back/forward,
 * providing instant page loads without re-fetching resources or re-executing JavaScript.
 *
 * @see https://web.dev/bfcache/
 */
@Injectable({
  providedIn: 'root'
})
export class BFCacheService {
  private readonly logger = inject(LoggerService);

  /**
   * Signal indicating if the page was restored from BFCache
   */
  readonly isRestoredFromCache = signal<boolean>(false);

  /**
   * Observable for page hide events (page is being cached)
   */
  readonly pageHide$ = new Subject<PageTransitionEvent>();

  /**
   * Observable for page show events (page is being displayed)
   */
  readonly pageShow$ = new Subject<PageTransitionEvent>();

  /**
   * Observable for BFCache restoration events (page restored from cache)
   */
  readonly restored$ = new Subject<PageTransitionEvent>();

  /**
   * Indicates if BFCache is supported by the browser
   */
  readonly isSupported = signal<boolean>(false);

  constructor() {
    this.initialize();
  }

  /**
   * Register a cleanup handler for when the page is being cached
   * Use this to clean up resources (timers, connections, etc.)
   *
   * @param handler Cleanup function to execute on pagehide
   * @returns Unsubscribe function
   *
   * @example
   * const unsubscribe = bfCacheService.onPageHide(() => {
   *   clearInterval(myTimer);
   *   myWebSocket.close();
   * });
   */
  onPageHide(handler: (event: PageTransitionEvent) => void): () => void {
    const subscription = this.pageHide$.subscribe(handler);
    return () => subscription.unsubscribe();
  }

  /**
   * Register a restoration handler for when the page is restored from cache
   * Use this to refresh stale data or re-establish connections
   *
   * @param handler Restoration function to execute on pageshow with persisted=true
   * @returns Unsubscribe function
   *
   * @example
   * const unsubscribe = bfCacheService.onRestored(() => {
   *   refreshUserData();
   *   reconnectWebSocket();
   * });
   */
  onRestored(handler: (event: PageTransitionEvent) => void): () => void {
    const subscription = this.restored$.subscribe(handler);
    return () => subscription.unsubscribe();
  }

  /**
   * Get BFCache compatibility issues
   * Returns array of reasons why page might not be cached
   *
   * ⚠️ LIMITAÇÃO: Não é possível detectar programaticamente todos os bloqueadores de BFCache.
   * Alguns bloqueadores comuns (unload/beforeunload listeners) não podem ser detectados via JavaScript.
   * Use Chrome DevTools → Application → Back/forward cache para diagnóstico completo.
   *
   * @returns Array of compatibility warnings (limitado a casos detectáveis)
   *
   * @see https://web.dev/bfcache/#optimize-your-pages-for-bfcache
   * @see https://developer.chrome.com/docs/devtools/application/back-forward-cache/
   */
  getCompatibilityIssues(): string[] {
    const issues: string[] = [];

    if (typeof globalThis === 'undefined') {
      return issues;
    }

    // Verifica se a página está offline
    // Nota: Páginas offline podem não ser elegíveis para BFCache em alguns browsers
    if (typeof navigator !== 'undefined' && 'onLine' in navigator && !navigator.onLine) {
      issues.push('Page is offline');
    }

    // NOTA: Outros bloqueadores comuns não podem ser detectados programaticamente:
    // - unload event listeners (uso de addEventListener('unload'))
    // - beforeunload event listeners
    // - Conexões abertas (WebSocket, IndexedDB transactions, fetch em andamento)
    // - Cache-Control: no-store
    //
    // Para diagnóstico completo, use Chrome DevTools:
    // Application → Back/forward cache → "Test back/forward cache"

    return issues;
  }

  /**
   * Log BFCache status and compatibility
   * Useful for debugging BFCache issues
   *
   * ⚠️ Para diagnóstico completo de bloqueadores, use Chrome DevTools:
   * Application → Back/forward cache → "Test back/forward cache"
   */
  logStatus(): void {
    this.logger.debug('🔍 BFCache Status');
    this.logger.debug('Supported:', this.isSupported());
    this.logger.debug('Currently restored from cache:', this.isRestoredFromCache());

    const issues = this.getCompatibilityIssues();
    if (issues.length > 0) {
      this.logger.warn('⚠️ Compatibility issues detected:', issues);
    } else {
      this.logger.debug('✅ No detectable compatibility issues (use DevTools for complete analysis)');
    }

    // Dica de diagnóstico
    this.logger.debug('💡 Tip: Use Chrome DevTools → Application → Back/forward cache for complete diagnostic');
  }

  /**
   * Test if BFCache is working
   * Navigate to another page and use browser back button to test
   *
   * @returns Instructions for testing
   */
  getTestInstructions(): string {
    return `
BFCache Test Instructions:

📋 Método 1 - Console Log (básico):
1. Open DevTools Console
2. Navigate to another page (e.g., click a link)
3. Use browser back button to return
4. Check console for "🔄 Page restored from BFCache" message
5. Run bfCacheService.logStatus() to see current status

🔧 Método 2 - Chrome DevTools (completo e recomendado):
1. Open DevTools → Application tab
2. Click "Back/forward cache" in sidebar
3. Click "Test back/forward cache" button
4. DevTools will show ALL blockers preventing BFCache
5. This is the ONLY way to detect unload/beforeunload listeners

⚠️ Limitação: JavaScript não pode detectar todos os bloqueadores.
Use sempre o DevTools para diagnóstico completo!
    `.trim();
  }

  /**
   * Initialize BFCache event listeners
   */
  private initialize(): void {
    if (typeof globalThis === 'undefined') {
      return;
    }

    // Check if BFCache is supported
    // PageTransitionEvent.persisted indicates BFCache support
    this.isSupported.set('PageTransitionEvent' in globalThis);

    // Listen for pagehide events (page is being cached)
    globalThis.addEventListener('pagehide', (event: PageTransitionEvent) => {
      this.handlePageHide(event);
    }, {passive: true});

    // Listen for pageshow events (page is being displayed)
    globalThis.addEventListener('pageshow', (event: PageTransitionEvent) => {
      this.handlePageShow(event);
    }, {passive: true});

    // Log BFCache support status
    if (this.isSupported()) {
      this.logger.info('✅ BFCache supported and initialized');
    } else {
      this.logger.warn('⚠️ BFCache not supported in this browser');
    }
  }

  /**
   * Handle pagehide event (page is being cached)
   * @param event PageTransitionEvent
   */
  private handlePageHide(event: PageTransitionEvent): void {
    if (event.persisted) {
      // Page is being stored in BFCache
      this.logger.debug('📦 Page stored in BFCache');
      this.pageHide$.next(event);
    }
  }

  /**
   * Handle pageshow event (page is being displayed)
   * @param event PageTransitionEvent
   */
  private handlePageShow(event: PageTransitionEvent): void {
    if (event.persisted) {
      // Page was restored from BFCache
      this.logger.info('🔄 Page restored from BFCache');
      this.isRestoredFromCache.set(true);
      this.restored$.next(event);
      this.pageShow$.next(event);

      // Reset flag after a short delay
      setTimeout(() => {
        this.isRestoredFromCache.set(false);
      }, 100);
    } else {
      // Normal page load
      this.pageShow$.next(event);
    }
  }
}
