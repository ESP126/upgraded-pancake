import { colorize, ANSI_CODES } from './ansi-colors.js';
import type { LogLevelName } from '../types/log-level.js';
import { AsyncTraceStore } from '../context/trace-store.js';

const LEVEL_COLORS: Readonly<Record<LogLevelName, string>> = {
  trace: ANSI_CODES.gray,
  debug: ANSI_CODES.blue,
  info: ANSI_CODES.green,
  warn: ANSI_CODES.yellow,
  error: ANSI_CODES.red,
  fatal: ANSI_CODES.magenta,
  off: ANSI_CODES.reset,
};

/**
 * Formats a log payload as a structured JSON string.
 */
export function formatJsonLog(
  level: LogLevelName,
  message: unknown,
  trace?: string,
  context?: Record<string, unknown>,
  defaultContext?: Record<string, unknown>,
  timestamp = true,
): string {
  const logEntry: Record<string, unknown> = {};

  if (timestamp) {
    logEntry['timestamp'] = new Date().toISOString();
  }

  logEntry['level'] = level;

  // Merge active AsyncLocalStore context if available
  const activeTraceContext = AsyncTraceStore.getContext();
  if (activeTraceContext) {
    logEntry['correlationId'] = activeTraceContext.correlationId;
    if (activeTraceContext.attributes) {
      Object.assign(logEntry, activeTraceContext.attributes);
    }
  }

  if (defaultContext && Object.keys(defaultContext).length > 0) {
    Object.assign(logEntry, defaultContext);
  }

  if (context && Object.keys(context).length > 0) {
    Object.assign(logEntry, context);
  }

  if (message instanceof Error) {
    logEntry['message'] = message.message;
    logEntry['stack'] = trace ?? message.stack;
  } else if (typeof message === 'object' && message !== null) {
    Object.assign(logEntry, message);
  } else {
    logEntry['message'] = String(message);
  }

  if (trace && !logEntry['stack']) {
    logEntry['stack'] = trace;
  }

  return JSON.stringify(logEntry);
}

/**
 * Formats a log payload as human-readable text for console development mode.
 */
export function formatTextLog(
  level: LogLevelName,
  message: unknown,
  trace?: string,
  context?: Record<string, unknown>,
  defaultContext?: Record<string, unknown>,
  timestamp = true,
): string {
  const parts: string[] = [];

  if (timestamp) {
    const timeStr = new Date().toISOString();
    parts.push(colorize(ANSI_CODES.gray, `[${timeStr}]`));
  }

  const levelColor = LEVEL_COLORS[level] ?? ANSI_CODES.reset;
  const uppercaseLevel = level.toUpperCase().padEnd(5, ' ');
  parts.push(colorize(levelColor, `[${uppercaseLevel}]`));

  // Merge active correlationId into text output
  const activeCorrelationId = AsyncTraceStore.getCorrelationId();
  if (activeCorrelationId) {
    parts.push(colorize(ANSI_CODES.magenta, `[${activeCorrelationId}]`));
  }

  const mergedContext = {
    ...AsyncTraceStore.getContext()?.attributes,
    ...defaultContext,
    ...context,
  };

  if (Object.keys(mergedContext).length > 0) {
    parts.push(colorize(ANSI_CODES.dim, JSON.stringify(mergedContext)));
  }

  if (message instanceof Error) {
    parts.push(message.message);
  } else if (typeof message === 'object' && message !== null) {
    parts.push(JSON.stringify(message));
  } else {
    parts.push(String(message));
  }

  let line = parts.join(' ');

  const activeStack = trace ?? (message instanceof Error ? message.stack : undefined);
  if (activeStack) {
    line += `\n${colorize(ANSI_CODES.red, activeStack)}`;
  }

  return line;
}
