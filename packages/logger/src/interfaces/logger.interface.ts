import type { LogLevelName } from '../types/log-level.js';

/**
 * Core contract interface implemented by framework loggers.
 */
export interface ILogger {
  /**
   * Emits a TRACE level log entry.
   *
   * @param message - Primary log message or structured payload.
   * @param context - Optional additional contextual metadata.
   */
  trace(message: unknown, context?: Record<string, unknown>): void;

  /**
   * Emits a DEBUG level log entry.
   *
   * @param message - Primary log message or structured payload.
   * @param context - Optional additional contextual metadata.
   */
  debug(message: unknown, context?: Record<string, unknown>): void;

  /**
   * Emits a INFO level log entry.
   *
   * @param message - Primary log message or structured payload.
   * @param context - Optional additional contextual metadata.
   */
  info(message: unknown, context?: Record<string, unknown>): void;

  /**
   * Emits a WARN level log entry.
   *
   * @param message - Primary log message or structured payload.
   * @param context - Optional additional contextual metadata.
   */
  warn(message: unknown, context?: Record<string, unknown>): void;

  /**
   * Emits a ERROR level log entry.
   *
   * @param message - Primary log message or structured payload.
   * @param trace - Optional stack trace or raw error string.
   * @param context - Optional additional contextual metadata.
   */
  error(message: unknown, trace?: string, context?: Record<string, unknown>): void;

  /**
   * Emits a FATAL level log entry.
   *
   * @param - Primary log message or structured payload.
   * @param trace - Optional stack trace or raw error string.
   * @param context - Optional additional contextual metadata.
   */
  fatal(message: unknown, trace?: string, context?: Record<string, unknown>): void;

  /**
   * Checks whether a specific log level is currently enabled on the logger.
   *
   * @param level - The log level name to evaluate.
   * @returns `true` if the log will be processed; otherwise `false`.
   */
  isLevelEnabled(level: LogLevelName): boolean;
}
