/**
 * Log severity levels mapped to immutable integer values for O(1) level comparison.
 */
export const LogLevel = {
  TRACE: 10,
  DEBUG: 20,
  INFO: 30,
  WARN: 40,
  ERROR: 50,
  FATAL: 60,
  OFF: 100,
} as const;

/**
 * Union type representing string names of log levels.
 */
export type LogLevelName = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal' | 'off';

/**
 * Type representing numeric log level values.
 */
export type LogLevelValue = (typeof LogLevel)[keyof typeof LogLevel];

/**
 * Constant mapping string level names to their numeric values.
 */
export const LOG_LEVEL_VALUES: Readonly<Record<LogLevelName, LogLevelValue>> = {
  trace: LogLevel.TRACE,
  debug: LogLevel.DEBUG,
  info: LogLevel.INFO,
  warn: LogLevel.WARN,
  error: LogLevel.ERROR,
  fatal: LogLevel.FATAL,
  off: LogLevel.OFF,
};
