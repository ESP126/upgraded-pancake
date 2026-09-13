import type { InjectionToken } from '../types/injection-token.js';
import type { CustomProvider } from '../providers/provider.interface.js';

/**
 * Represents a single node within the Dependency Injection graph.
 */
export class DependencyGraphNode<T = unknown> {
  public readonly token: InjectionToken<T>;
  public readonly provider: CustomProvider<T>;
  public readonly dependencies = new Set<InjectionToken>();

  /**
   * Creates a new DependencyGraphNode instance.
   *
   * @param token - Unique injection token identifying this node.
   * @param provider - Associated CustomProvider metadata definition.
   */
  constructor(token: InjectionToken<T>, provider: CustomProvider<T>) {
    this.token = token;
    this.provider = provider;
  }

  /**
   * Adds an injection token dependency to this node.
   *
   * @param dependencyToken - The token this node depends upon.
   */
  public addDependency(dependencyToken: InjectionToken): void {
    this.dependencies.add(dependencyToken);
  }
}
