import type { LogLevelName } from './log-level.js';

/**
 * Configuration options for Logger instances.
 */
export interface LoggerOptions {
	/**
	 * Minimum active log level name. Messages below this level will be filtered out.
	 * @default 'info'
	 */
	level?: LogLevelName;

	/**
	 * Optional global context object merged into every log entry.
	 */
	defaultContext?: Record<string, unknown>;

	/**
	 * Enable structured JSON formatting instead of plain text.
	 * @default true
	 */
	json?: boolean;

	/**
	 * Include ISO 8601 timestamp in emitted logs.
	 * @default true
	 */
	timestamp?: boolean;
}
