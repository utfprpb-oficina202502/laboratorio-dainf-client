import {Injectable, signal} from '@angular/core';
import {Subject} from 'rxjs';

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
   * @returns Array of compatibility warnings
   */
  getCompatibilityIssues(): string[] {
    const issues: string[] = [];

    if (typeof globalThis === 'undefined') {
      return issues;
    }

    // Check for BFCache blockers
    if ('unload' in globalThis) {
      const hasUnloadListener = (globalThis as any).__hasUnloadListener;
      if (hasUnloadListener) {
        issues.push('unload event listener detected (blocks BFCache)');
      }
    }

    // Check for beforeunload
    if ('beforeunload' in globalThis) {
      const hasBeforeUnloadListener = (globalThis as any).__hasBeforeUnloadListener;
      if (hasBeforeUnloadListener) {
        issues.push('beforeunload event listener detected (may block BFCache)');
      }
    }

    // Check for open connections (IndexedDB transactions, fetch, etc.)
    // This is informational only - we can't detect all cases
    if (navigator.onLine === false) {
      issues.push('Page is offline');
    }

    return issues;
  }

  /**
   * Log BFCache status and compatibility
   * Useful for debugging BFCache issues
   */
  logStatus(): void {
    console.group('🔍 BFCache Status');
    console.log('Supported:', this.isSupported());
    console.log('Currently restored from cache:', this.isRestoredFromCache());

    const issues = this.getCompatibilityIssues();
    if (issues.length > 0) {
      console.warn('Compatibility issues:', issues);
    } else {
      console.log('✅ No known compatibility issues');
    }

    console.groupEnd();
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
1. Open DevTools Console
2. Navigate to another page (e.g., click a link)
3. Use browser back button to return
4. Check console for "🔄 Page restored from BFCache" message
5. If seen, BFCache is working! If not, check compatibility issues.

Run bfCacheService.logStatus() to see current status.
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
      console.log('✅ BFCache supported and initialized');
    } else {
      console.warn('⚠️ BFCache not supported in this browser');
    }
  }

  /**
   * Handle pagehide event (page is being cached)
   * @param event PageTransitionEvent
   */
  private handlePageHide(event: PageTransitionEvent): void {
    if (event.persisted) {
      // Page is being stored in BFCache
      console.log('📦 Page stored in BFCache');
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
      console.log('🔄 Page restored from BFCache');
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
