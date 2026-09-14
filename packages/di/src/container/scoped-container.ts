import type { InjectionToken } from '../types/injection-token.js';
import type { Container } from './container.js';
import type { CustomProvider } from '../providers/provider.interface.js';
import {
  isClassProvider,
  isValueProvider,
  isFactoryProvider,
  isExistingProvider,
} from '../providers/provider.interface.js';
import { RequestScopeManager } from '../scopes/request-scope.js';
import { ContainerError } from '../errors/container.error.js';
import { MetadataStorage } from '../metadata/metadata-storage.js';
import { METADATA_KEYS } from '../metadata/metadata-keys.js';

/**
 * Child container instance dedicated to resolving request-scoped and transient dependencies.
 */
export class ScopedContainer {
  private readonly requestScope = new RequestScopeManager();

  /**
   * Creates a new ScopedContainer linked to a root Container.
   *
   * @param rootContainer - The parent root Container instance.
   */
  constructor(private readonly rootContainer: Container) {}

  /**
   * Resolves a dependency token within this request scope.
   *
   * @param token - Target InjectionToken lookup key.
   * @returns Resolved instance of type T.
   */
  public resolve<T>(token: InjectionToken<T>): T {
    const provider = this.rootContainer.getRegistry().get(token);

    if (!provider) {
      const tokenName = typeof token === 'function' ? token.name : String(token);
      throw new ContainerError(`No provider registered for token: ${tokenName}`, token);
    }

    const scope = this.rootContainer.resolveScope(provider);

    // Delegate to root container
    if (scope === 'singleton') {
      return this.rootContainer.resolve(token);
    }

    // Check local request scope cache
    if (scope === 'request') {
      if (this.requestScope.has(token)) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return this.requestScope.get(token)!;
      }

      const instance = this.instantiate<T>(provider);
      this.requestScope.set(token, instance);
      return instance;
    }

    // Always instantiatie a new instance
    return this.instantiate<T>(provider);
  }

  /**
   * Disposes of all request-scoped instances held within this scope.
   */
  public clear(): void {
    this.requestScope.clear();
  }

  private instantiate<T>(provider: CustomProvider<T>): T {
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

      // Resolve constructor parameters
      const paramMetadata = MetadataStorage.getMetadata<{ index: number; token: InjectionToken }[]>(
        METADATA_KEYS.PARAM_INJECTIONS,
        targetClass,
      );

      const args: unknown[] = [];
      if (paramMetadata) {
        const sortedParams = [...paramMetadata].sort((a, b) => a.index - b.index);
        for (const param of sortedParams) {
          args[param.index] = this.resolve(param.token);
        }
      }

      const instance = new targetClass(...(args as never[])) as T;

      // Inject properties
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

    throw new ContainerError(
      'Invalid provider definition encountering during scoped instantiation',
    );
  }
}
