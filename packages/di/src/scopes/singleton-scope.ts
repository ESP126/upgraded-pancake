import type { InjectionToken } from '../types/injection-token.js';

/**
 * Stores and manages singleton instances resolved by the DI container.
 */
export class SingletonScopeManager {
  private readonly instances = new Map<InjectionToken, unknown>();

  /**
   * Retrieves a cached singleton instance by token.
   *
   * @param token - Target InjectionToken lookup key.
   * @returns Cached instance of type T or undefined.
   */
  public get<T>(token: InjectionToken<T>): T | undefined {
    return this.instances.get(token) as T | undefined;
  }

  /**
   * Cache a resolved singleton instance.
   *
   * @param token - Target InjectionToken lookup key.
   * @param instance - Instance value to store.
   */
  public set<T>(token: InjectionToken<T>, instance: T): void {
    this.instances.set(token, instance);
  }

  /**
   * Checks if a singleton instance is already cached for a token.
   *
   * @param token - Target InjectionToken lookup key.
   */
  public has<T>(token: InjectionToken<T>): boolean {
    return this.instances.has(token);
  }

  /**
   * Clears all cached singleton instances.
   */
  public clear(): void {
    this.instances.clear();
  }
}
