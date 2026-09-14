import type { InjectionToken } from '../types/injection-token.js';

/**
 * Stores and manages request-scoped instances bound to a specific execution context.
 */
export class RequestScopeManager {
  private readonly instances = new Map<InjectionToken, unknown>();

  /**
   * Retrieves a cached request-scoped instance by token.
   *
   * @param token - Target InjectionToken lookup key.
   * @returns Cached instance of type T or undefined.
   */
  public get<T>(token: InjectionToken<T>): T | undefined {
    return this.instances.get(token) as T | undefined;
  }

  /**
   * Caches a resolved request-scoped instance.
   *
   * @param token - Target InjectionToken lookup key,
   * @param instance - Instance value to store.
   */
  public set<T>(token: InjectionToken<T>, instance: T): void {
    this.instances.set(token, instance);
  }

  /**
   * Check if a request-scoped instance is cached for a token.
   *
   * @param token - Target InjectionToken lookup key.
   */
  public has<T>(token: InjectionToken<T>): boolean {
    return this.instances.has(token);
  }

  /**
   * Clears all cached request-scoped instances, allowing GC disposal.
   */
  public clear(): void {
    this.instances.clear();
  }
}
