/**
 * Native ANSI Escape Codes for CLI coloring in development mode.
 */
export const ANSI_CODES = {
	reset: '\x1b[0m',
	bold: '\x1b[1m',
	dim: '\x1b[2m',
	gray: '\x1b[90m',
	cyan: '\x1b[36m',
	blue: '\x1b[34m',
	green: '\x1b[32m',
	yellow: '\x1b[33m',
	red: '\x1b[31m',
	magenta: '\x1b[35m',
} as const;

/**
 * Wraps text with an ANSI color code sequence.
 *
 * @param colorCode - ANSI color string.
 * @param text - Input text string.
 * @returns Colorized string.
 */
export function colorize(colorCode: string, text: string): string {
	return `${colorCode}${text}${ANSI_CODES.reset}`;
}
