import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';
import type { TraceContext } from './trace-context.interface.js';

/**
 * Native AsyncLocalStorage store wrapper for prapagating trace context across asynchronous tasks.
 */
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class AsyncTraceStore {
	private static readonly storage = new AsyncLocalStorage<TraceContext>();

	/**
	 * Runs a function within the scope of a new trace context.
	 *
	 * @param context - Trace context object or correlation ID string. If omitted, a new UUIDv4 will be generated.
	 * @param fn - The callback function to execute within the context scope.
	 * @returns The return value of the callback function.
	 */
	public static run<T>(context: TraceContext | string | undefined, fn: () => T): T {
		const traceContext: TraceContext =
			typeof context === 'string'
				? { correlationId: context }
				: (context ?? { correlationId: randomUUID() });

		return this.storage.run(traceContext, fn);
	}

	/**
	 * Retrieves the current active trace context if present in the execution scope.
	 *
	 * @returns Active TraceContext object or undefined if executed outside a trace scope.
	 */
	public static getContext(): TraceContext | undefined {
		return this.storage.getStore();
	}

	/**
	 * Retrieves the active correlationId or undefined.
	 *
	 * @returns Active correlationId string or undefined.
	 */
	public static getCorrelationId(): string | undefined {
		return this.storage.getStore()?.correlationId;
	}
}
