import type { InjectionToken } from '../types/injection-token.js';

/**
 * Custom error thrown when a circular dependency loop is detected in the DI graph.
 */
export class CircularDependencyError extends Error {
  public readonly path: InjectionToken[];

  /**
   * Creates a new CircularDependencyError instance.
   *
   * @param path - Array of InjectionTokens forming the cycle path.
   */
  constructor(path: InjectionToken[]) {
    const formattedPath = path
      ? path.map((token) => (typeof token === 'function' ? token.name : String(token))).join(' -> ')
      : 'Unknown';

    super(`Circular dependency detected in DI graph: ${formattedPath}`);
    this.name = 'CircularDependencyError';
    this.path = path;

    // Restone prototype chain for custom Error instance is ES2022
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
