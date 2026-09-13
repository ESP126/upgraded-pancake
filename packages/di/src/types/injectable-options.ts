/**
 * Lifetime scope options for injectable providers.
 */
export type ScopeOption = 'singleton' | 'transient' | 'request';

/**
 * Configuration options for the @Injectable decorator.
 */
export interface InjectableOptions {
  /**
   * Defines the lifecycle scope of the provider.
   * @default 'singleton'
   */
  scope?: ScopeOption;
}
