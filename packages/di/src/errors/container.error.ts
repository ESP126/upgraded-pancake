import type { InjectionToken } from '../types/injection-token.js';

/**
 * Custom error thrown when the DI container fails to resolve a token or process a provider.
 */
export class ContainerError extends Error {
  public readonly token: InjectionToken | undefined;

  /**
   * Creates a new ContainerError instance.
   *
   * @param message - Error description.
   * @param token - Optional InjectionToken related to the failure.
   */
  constructor(message: string, token?: InjectionToken) {
    super(message);
    this.name = 'ContainerError';
    this.token = token;

    Object.setPrototypeOf(this, new.target.prototype);
  }
}
