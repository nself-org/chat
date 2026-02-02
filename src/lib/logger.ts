/**
 * Centralized Logger Utility
 * Provides structured logging with Sentry integration for production
 *
 * Replaces console.log statements across the codebase
 */

import * as Sentry from '@sentry/nextjs'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogContext {
  [key: string]: unknown
}

/**
 * Logger class for structured logging
 */
class Logger {
  private get isProduction(): boolean {
    return process.env.NODE_ENV === 'production'
  }

  private get isDevelopment(): boolean {
    return process.env.NODE_ENV === 'development'
  }

  /**
   * Debug logging - only shown in development
   */
  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.debug(`[DEBUG] ${message}`, context || '')
    }
  }

  /**
   * Info logging - shown in development, sent to Sentry in production
   */
  info(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.info(`[INFO] ${message}`, context || '')
    } else if (this.isProduction && context) {
      Sentry.addBreadcrumb({
        level: 'info',
        message,
        data: context,
      })
    }
  }

  /**
   * Warning logging - shown in all environments, sent to Sentry in production
   */
  warn(message: string, context?: LogContext): void {
    console.warn(`[WARN] ${message}`, context || '')

    if (this.isProduction) {
      Sentry.captureMessage(message, {
        level: 'warning',
        extra: context,
      })
    }
  }

  /**
   * Error logging - shown in all environments, sent to Sentry in production
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorObj = error instanceof Error ? error : new Error(String(error))

    console.error(`[ERROR] ${message}`, errorObj, context || '')

    if (this.isProduction) {
      Sentry.captureException(errorObj, {
        extra: {
          message,
          ...context,
        },
      })
    }
  }

  /**
   * Log with custom level
   */
  log(level: LogLevel, message: string, context?: LogContext): void {
    switch (level) {
      case 'debug':
        this.debug(message, context)
        break
      case 'info':
        this.info(message, context)
        break
      case 'warn':
        this.warn(message, context)
        break
      case 'error':
        this.error(message, undefined, context)
        break
    }
  }

  /**
   * Create a scoped logger with a prefix
   */
  scope(prefix: string): ScopedLogger {
    return new ScopedLogger(this, prefix)
  }
}

/**
 * Scoped logger with automatic prefix
 */
class ScopedLogger {
  constructor(
    private logger: Logger,
    private prefix: string
  ) {}

  debug(message: string, context?: LogContext): void {
    this.logger.debug(`[${this.prefix}] ${message}`, context)
  }

  info(message: string, context?: LogContext): void {
    this.logger.info(`[${this.prefix}] ${message}`, context)
  }

  warn(message: string, context?: LogContext): void {
    this.logger.warn(`[${this.prefix}] ${message}`, context)
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    this.logger.error(`[${this.prefix}] ${message}`, error, context)
  }

  log(level: LogLevel, message: string, context?: LogContext): void {
    this.logger.log(level, `[${this.prefix}] ${message}`, context)
  }
}

/**
 * Default logger instance
 */
export const logger = new Logger()

/**
 * Create a scoped logger for a specific module
 *
 * @example
 * ```ts
 * const log = createLogger('BotRuntime')
 * log.info('Bot started', { botId: 'hello-bot' })
 * log.error('Bot failed', error, { botId: 'hello-bot' })
 * ```
 */
export function createLogger(scope: string): ScopedLogger {
  return logger.scope(scope)
}

/**
 * Export logger as default
 */
export default logger
