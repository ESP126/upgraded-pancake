import type { InjectionToken } from '../types/injection-token.js';
import {
  type Provider,
  type CustomProvider,
  isClassProvider,
  isValueProvider,
  isFactoryProvider,
  isExistingProvider,
} from './provider.interface.js';

/**
 * Regisrty storing raw and normalized provider definitions indexed by InjectionToken.
 */
export class ProviderRegistry {
  private readonly providers = new Map<InjectionToken, CustomProvider>();

  /**
   * Registers a provider definition into the registry.
   *
   * @param provider - Raw constructor class or CustomProvider object.
   * @returns The normalized InjectionToken associated with the registered provider.
   */
  public register<T>(provider: Provider<T>): InjectionToken<T> {
    if (typeof provider === 'function') {
      const classProvider: CustomProvider<T> = {
        provide: provider,
        useClass: provider,
      };
      this.providers.set(provider, classProvider as CustomProvider);
      return provider;
    }

    this.providers.set(provider.provide, provider as CustomProvider);
    return provider.provide;
  }

  /**
   * Retrieves a registered provider definition by token.
   *
   * @param token - InjectionToken lookup key.
   * @returns Registered CustomProvider definition or undefined.
   */
  public get<T>(token: InjectionToken<T>): CustomProvider<T> | undefined {
    return this.providers.get(token) as CustomProvider<T> | undefined;
  }

  /**
   * Checks if a provider is registered for a given token.
   *
   * @param token - InjectionToken lookup key.
   * @returns `true` if registered, otherwise `false`.
   */
  public has<T>(token: InjectionToken<T>): boolean {
    return this.providers.has(token);
  }

  /**
   * Clears all registered providers from the registry.
   */
  public clear(): void {
    this.providers.clear();
  }

  /**
   * Returns all registered tokens in the registry.
   */
  public getTokens(): InjectionToken[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Determines the provider type variant for a registered token.
   *
   * @param token - InjectionToken key.
   */
  public getProviderType<T>(
    token: InjectionToken<T>,
  ): 'class' | 'value' | 'factory' | 'existing' | undefined {
    const provider = this.get(token);
    if (!provider) {
      return undefined;
    }

    if (isClassProvider(provider)) return 'class';
    if (isValueProvider(provider)) return 'value';
    if (isFactoryProvider(provider)) return 'factory';
    if (isExistingProvider(provider)) return 'existing';

    return undefined;
  }
}
