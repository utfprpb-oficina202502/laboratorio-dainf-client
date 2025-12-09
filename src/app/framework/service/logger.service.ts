import {Injectable} from '@angular/core';
import {environment} from '../../../environments/environment';

/**
 * Log levels for the logger service
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4
}

/**
 * Centralized logging service for the application
 *
 * Features:
 * - Environment-aware logging (disabled in production by default)
 * - Log level filtering
 * - Structured logging with timestamps
 * - Type-safe logging methods
 *
 * Usage:
 * ```typescript
 * constructor(private logger: LoggerService) {}
 *
 * this.logger.debug('Debug message', { data });
 * this.logger.info('Info message');
 * this.logger.warn('Warning message', error);
 * this.logger.error('Error occurred', error);
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  private logLevel: LogLevel;
  private enableLogging: boolean;

  constructor() {
    // In production, only log warnings and errors by default
    this.logLevel = environment.production ? LogLevel.WARN : LogLevel.DEBUG;
    this.enableLogging = !environment.production || this.isLoggingEnabled();
  }

  /**
   * Log debug messages (development only)
   */
  debug(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      // eslint-disable-next-line no-console
      console.debug(`[DEBUG] ${this.formatMessage(message)}`, ...args);
    }
  }

  /**
   * Log informational messages
   */
  info(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LogLevel.INFO)) {
      // eslint-disable-next-line no-console
      console.info(`[INFO] ${this.formatMessage(message)}`, ...args);
    }
  }

  /**
   * Log warning messages
   */
  warn(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(`[WARN] ${this.formatMessage(message)}`, ...args);
    }
  }

  /**
   * Log error messages
   */
  error(message: string, error?: unknown, ...args: unknown[]): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      if (error) {
        console.error(`[ERROR] ${this.formatMessage(message)}`, error, ...args);
      } else {
        console.error(`[ERROR] ${this.formatMessage(message)}`, ...args);
      }
    }
  }

  /**
   * Set the minimum log level
   */
  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  /**
   * Enable or disable logging
   */
  setLoggingEnabled(enabled: boolean): void {
    this.enableLogging = enabled;
    try {
      localStorage.setItem('enableLogging', enabled.toString());
    } catch {
      // Ignore localStorage errors
    }
  }

  /**
   * Check if logging is explicitly enabled via localStorage
   * Useful for debugging in production
   */
  private isLoggingEnabled(): boolean {
    try {
      return localStorage.getItem('enableLogging') === 'true';
    } catch {
      return false;
    }
  }

  /**
   * Check if a log level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    return this.enableLogging && level >= this.logLevel;
  }

  /**
   * Format message with timestamp
   */
  private formatMessage(message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] ${message}`;
  }
}
