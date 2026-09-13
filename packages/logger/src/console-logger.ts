import type { ILogger } from './interfaces/logger.interface.js';
import { LOG_LEVEL_VALUES, type LogLevelName } from './types/log-level.js';
import type { LoggerOptions } from './types/logger-options.js';
import { formatJsonLog, formatTextLog } from './utils/format-log.js';

/**
 * High-performance, zero-dependency console logger implementation.
 * Outputs structured JSON or formatted text directly to native Node.js stdout and sterr.
 */
export class ConsoleLogger implements ILogger {
	private readonly minLevelValue: number;
	private readonly minLevelName: LogLevelName;
	private readonly jsonMode: boolean;
	private readonly includeTimestamp: boolean;
	private readonly defaultContext?: Record<string, unknown> | undefined;

	/**
	 * Creates a new ConsoleLogger instance.
	 *
	 * @param options - Configuration options for the logger.
	 */
	constructor(options: LoggerOptions = {}) {
		this.minLevelName = options.level ?? 'info';
		this.minLevelValue = LOG_LEVEL_VALUES[this.minLevelName];
		this.jsonMode = options.json ?? true;
		this.includeTimestamp = options.timestamp ?? true;
		this.defaultContext = options.defaultContext;
	}

	public isLevelEnabled(level: LogLevelName): boolean {
		const targetValue = LOG_LEVEL_VALUES[level];
		return targetValue >= this.minLevelValue && this.minLevelValue < LOG_LEVEL_VALUES.off;
	}

	public trace(message: unknown, context?: Record<string, unknown>): void {
		this.writeLog('trace', message, undefined, context, process.stdout);
	}

	public debug(message: unknown, context?: Record<string, unknown>): void {
		this.writeLog('debug', message, undefined, context, process.stdout);
	}

	public info(message: unknown, context?: Record<string, unknown>): void {
		this.writeLog('info', message, undefined, context, process.stdout);
	}

	public warn(message: unknown, context?: Record<string, unknown>): void {
		this.writeLog('warn', message, undefined, context, process.stderr);
	}

	public error(message: unknown, trace?: string, context?: Record<string, unknown>): void {
		this.writeLog('error', message, trace, context, process.stderr);
	}

	public fatal(message: unknown, trace?: string, context?: Record<string, unknown>): void {
		this.writeLog('fatal', message, trace, context, process.stderr);
	}

	private writeLog(
		level: LogLevelName,
		message: unknown,
		trace: string | undefined,
		context: Record<string, unknown> | undefined,
		stream: NodeJS.WriteStream,
	): void {
		if (!this.isLevelEnabled(level)) {
			return;
		}

		const formattedOutput = this.jsonMode
			? formatJsonLog(level, message, trace, context, this.defaultContext, this.includeTimestamp)
			: formatTextLog(level, message, trace, context, this.defaultContext, this.includeTimestamp);

		stream.write(formattedOutput + '\n');
	}
}
