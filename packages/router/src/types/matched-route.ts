/**
 * Represents the result of successful route lookup in the Radix Tree.
 */
export interface MatchedRoute<T = unknown> {
  /**
   * Registered route handler payload.
   */
  handler: T;

  /**
   * Extracted dynamic route parameter key-value pairs (e.g., { id: '123' }).
   */
  params: Record<string, string>;
}
