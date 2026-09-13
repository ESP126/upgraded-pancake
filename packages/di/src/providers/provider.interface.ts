import type { InjectionToken, Newable } from '../types/injection-token.js';
import type { ScopeOption } from '../types/injectable-options.js';

/**
 * Interface for Class-based providers.
 */
export interface ClassProvider<T = unknown> {
  provide: InjectionToken<T>;
  useClass: Newable<T>;
  scope?: ScopeOption;
}

/**
 * Interface for Value-based providers.
 */
export interface ValueProvider<T = unknown> {
  provide: InjectionToken<T>;
  useValue: T;
}

/**
 * Interface for Factorty-based providers.
 */
export interface FactoryProvider<T = unknown> {
  provide: InjectionToken<T>;
  useFactory: (...args: never[]) => T | Promise<T>;
  inject?: InjectionToken[];
  scope?: ScopeOption;
}

/**
 * Interface for Alias/Existing-based providers.
 */
export interface ExistingProvider<T = unknown> {
  provide: InjectionToken<T>;
  useExisting: InjectionToken<T>;
}

/**
 * Union type representing all valid providers.
 */
export type CustomProvider<T = unknown> =
  ClassProvider<T> | ValueProvider<T> | FactoryProvider<T> | ExistingProvider<T>;

/**
 * Universal Provider type (accepts either a raw Class or a CustomProvider object).
 */
export type Provider<T = unknown> = Newable<T> | CustomProvider<T>;

/**
 * Type guard for ClassProvider.
 */
export function isClassProvider<T>(provider: CustomProvider<T>): provider is ClassProvider<T> {
  return typeof (provider as ClassProvider<T>).useClass === 'function';
}

/**
 * Type guard for ValueProvider.
 */
export function isValueProvider<T>(provider: CustomProvider<T>): provider is ValueProvider<T> {
  return 'useValue' in provider;
}

/**
 * Type guard for FactoryProvider.
 */
export function isFactoryProvider<T>(provider: CustomProvider<T>): provider is FactoryProvider<T> {
  return typeof (provider as FactoryProvider<T>).useFactory === 'function';
}

/**
 * Type guard for ExistingProvider.
 */
export function isExistingProvider<T>(
  provider: CustomProvider<T>,
): provider is ExistingProvider<T> {
  return 'useExisting' in provider;
}
