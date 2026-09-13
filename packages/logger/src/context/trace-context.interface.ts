/**
 * Contextual trace information stored within an asynchronous execution scope.
 */
export interface TraceContext {
	/**
	 * Unique correlation or request ID for tracing requests across microservices and internal calls.
	 */
	correlationId: string;

	/**
	 * Optional key-value store for request-scoped context metadata (e.g., tenantId, userId).
	 */
	attributes?: Record<string, unknown>;
}
