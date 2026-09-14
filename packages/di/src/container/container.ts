import type { InjectionToken } from '../types/injection-token.js';
import type { Provider, CustomProvider } from '../providers/provider.interface.js';
import {
  isClassProvider,
  isValueProvider,
  isFactoryProvider,
  isExistingProvider,
} from '../providers/provider.interface.js';
import { ProviderRegistry } from '../providers/provider-registry.js';
import { DependencyGraph } from '../graph/dependency-graph.js';
import { SingletonScopeManager } from '../scopes/singleton-scope.js';
import { ContainerError } from '../errors/container.error.js';
import { MetadataStorage } from '../metadata/metadata-storage.js';
import { METADATA_KEYS } from '../metadata/metadata-keys.js';
import type { InjectableOptions, ScopeOption } from '../types/injectable-options.js';
import { ScopedContainer } from './scoped-container.js';

/**
 * Core Dependency Injection container providing registration, resolution, and lifetime management.
 */
export class Container {
  private readonly registry = new ProviderRegistry();
  private readonly graph = new DependencyGraph();
  private readonly singletonScope = new SingletonScopeManager();
  private isBuilt = false;

  /**
   * Registers one or multiple providers in the container.
   *
   * @param providers - Single provider or array of providers to register.
   */
  public register<T>(providers: Provider<T> | Provider<T>[]): void {
    const list = Array.isArray(providers) ? providers : [providers];

    for (const provider of list) {
      this.registry.register(provider);
    }

    this.isBuilt = false;
  }

  /**
   * Builds the internal dependency graph and validates cycle integrity.
   */
  public build(): void {
    this.graph.build(this.registry);
    this.isBuilt = true;
  }

  /**
   * Creates a new ScopedContainer instance tied to a specific request lifecycle.
   */
  public createScope(): ScopedContainer {
    if (!this.isBuilt) {
      this.build();
    }
    return new ScopedContainer(this);
  }

  /**
   * Gets the internal ProviderRegistry instance.
   */
  public getRegistry(): ProviderRegistry {
    return this.registry;
  }

  /**
   * Resolves the configured lifetime scope of a provider.
   *
   * @param - CustomProvider definition.
   */
  public resolveScope(provider: CustomProvider): ScopeOption {
    if ('scope' in provider && provider.scope) {
      return provider.scope;
    }

    if (isClassProvider(provider)) {
      const metadataOptions = MetadataStorage.getMetadata<InjectableOptions>(
        METADATA_KEYS.INJECTABLE,
        provider.useClass,
      );
      if (metadataOptions?.scope) {
        return metadataOptions.scope;
      }
    }

    return 'singleton';
  }

  /**
   * Resolves an instance associated with the specified InjectionToken.
   *
   * @param token - InjectionToken lookup key.
   * @returns Resolved instance of type T.
   * @throws {ContainerError} If the token is not registered or cannot be resolved.
   */
  public resolve<T>(token: InjectionToken<T>): T {
    if (!this.isBuilt) {
      this.build();
    }

    const provider = this.registry.get(token);
    if (!provider) {
      const tokenName = typeof token === 'function' ? token.name : String(token);
      throw new ContainerError(`No provider registered for token: ${tokenName}`, token);
    }

    // Determine lifecycle scope
    const scope = this.resolveProviderScope(provider);

    // If scope is singleton and instance exists in cache, return immediately
    if (scope === 'singleton' && this.singletonScope.has(token)) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return this.singletonScope.get(token)!;
    }

    // Instantiate provider
    const instance = this.instantiateProvider<T>(provider);

    // Cache if singleton
    if (scope === 'singleton') {
      this.singletonScope.set(token, instance);
    }

    return instance;
  }

  /**
   * Instantiates all registered singleton providers in topological dependency order.
   */
  public initSingletons(): void {
    if (!this.isBuilt) {
      this.build();
    }

    const order = this.graph.getTopologicalOrder();
    for (const token of order) {
      this.resolve(token);
    }
  }

  /**
   * Clears all registered providers, graph structures, and cached singleton instances.
   */
  public clear(): void {
    this.registry.clear();
    this.singletonScope.clear();
    this.isBuilt = false;
  }

  private resolveProviderScope(provider: CustomProvider): 'singleton' | 'transient' | 'request' {
    if ('scope' in provider && provider.scope) {
      return provider.scope;
    }

    if (isClassProvider(provider)) {
      const metadataOptions = MetadataStorage.getMetadata<InjectableOptions>(
        METADATA_KEYS.INJECTABLE,
        provider.useClass,
      );
      if (metadataOptions?.scope) {
        return metadataOptions.scope;
      }
    }

    return 'singleton';
  }

  private instantiateProvider<T>(provider: CustomProvider<T>): T {
    if (isValueProvider(provider)) {
      return provider.useValue;
    }

    if (isExistingProvider(provider)) {
      return this.resolve<T>(provider.useExisting as InjectionToken<T>);
    }

    if (isFactoryProvider(provider)) {
      const injectTokens = provider.inject ?? [];
      const args = injectTokens.map((depToken) => this.resolve(depToken));
      return provider.useFactory(...(args as never[])) as T;
    }

    if (isClassProvider(provider)) {
      const targetClass = provider.useClass;

      // Resolve contructor parameter dependencies
      const paramMetadata = MetadataStorage.getMetadata<{ index: number; token: InjectionToken }[]>(
        METADATA_KEYS.PARAM_INJECTIONS,
        targetClass,
      );

      const args: unknown[] = [];
      if (paramMetadata) {
        // Sort parameter injections by argument index
        const sortedParams = [...paramMetadata].sort((a, b) => a.index - b.index);
        for (const param of sortedParams) {
          args[param.index] = this.resolve(param.token);
        }
      }

      // Instantiate target class
      const instance = new targetClass(...(args as never[])) as T;

      // Inject property dependencies
      const propMetadata = MetadataStorage.getMetadata<
        { propertyKey: string | symbol; token: InjectionToken }[]
      >(METADATA_KEYS.PROPERTY_INJECTIONS, targetClass.prototype as object);

      if (propMetadata) {
        for (const prop of propMetadata) {
          const value = this.resolve(prop.token);
          (instance as Record<string | symbol, unknown>)[prop.propertyKey] = value;
        }
      }

      return instance;
    }

    throw new ContainerError('Invalid provider definition encountered during instantiation.');
  }
}
