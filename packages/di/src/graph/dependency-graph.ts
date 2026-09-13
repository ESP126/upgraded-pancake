import type { InjectionToken } from '../types/injection-token.js';
import type { ProviderRegistry } from '../providers/provider-registry.js';
import {
  isClassProvider,
  isFactoryProvider,
  isExistingProvider,
} from '../providers/provider.interface.js';
import { MetadataStorage } from '../metadata/metadata-storage.js';
import { METADATA_KEYS } from '../metadata/metadata-keys.js';
import { DependencyGraphNode } from './dependency-graph.node.js';

/**
 * Directed graph building and topological sorting engine for Dependency Injection.
 */
export class DependencyGraph {
  private readonly nodes = new Map<InjectionToken, DependencyGraphNode>();

  /**
   * Builds the dependency graphs from a ProviderRegistry instance.
   *
   * @param registry - Populated ProviderRegistry containing registered tokens.
   */
  public build(registry: ProviderRegistry): void {
    this.nodes.clear();
    const tokens = registry.getTokens();

    // Instantiate graph nodes all registered tokens.
    for (const token of tokens) {
      const provider = registry.get(token);
      if (provider) {
        this.nodes.set(token, new DependencyGraphNode(token, provider));
      }
    }

    // Discover and record directed dependency edges for each node
    for (const node of this.nodes.values()) {
      this.resolveNodeDependencies(node);
    }
  }

  /**
   * Retrieves a node by its InjectionToken.
   *
   * @param token - Target InjectionToken lookup key.
   */
  public getNode<T>(token: InjectionToken<T>): DependencyGraphNode<T> | undefined {
    return this.nodes.get(token) as DependencyGraphNode<T> | undefined;
  }

  /**
   * Returns all nodes currently held in the graph.
   */
  public getNodes(): IterableIterator<DependencyGraphNode> {
    return this.nodes.values();
  }

  /**
   * Performs a topological sort of the graph to determine valid resolution order.
   *
   * @returns Array of InjectionTokens ordered from independent dependencies to dependent consumers.
   */
  public getTopologicalOrder(): InjectionToken[] {
    const visited = new Set<InjectionToken>();
    const order: InjectionToken[] = [];

    const visit = (token: InjectionToken): void => {
      if (visited.has(token)) {
        return;
      }

      visited.add(token);
      const node = this.nodes.get(token);

      if (node) {
        for (const depToken of node.dependencies) {
          visit(depToken);
        }
      }

      order.push(token);
    };

    for (const token of this.nodes.keys()) {
      visit(token);
    }

    return order;
  }

  private resolveNodeDependencies(node: DependencyGraphNode): void {
    const provider = node.provider;

    if (isClassProvider(provider)) {
      const targetClass = provider.useClass;

      // Extract constructor parameters decorated with @Inject
      const paramMetadata = MetadataStorage.getMetadata<{ index: number; token: InjectionToken }[]>(
        METADATA_KEYS.PARAM_INJECTIONS,
        targetClass,
      );

      if (paramMetadata) {
        for (const param of paramMetadata) {
          node.addDependency(param.token);
        }
      }

      // Extract properties decorated with @Inject
      const propMetadata = MetadataStorage.getMetadata<
        { propertykey: string | symbol; token: InjectionToken }[]
      >(METADATA_KEYS.PROPERTY_INJECTIONS, targetClass.prototype as object);

      if (propMetadata) {
        for (const prop of propMetadata) {
          node.addDependency(prop.token);
        }
      }
    } else if (isFactoryProvider(provider)) {
      if (provider.inject && Array.isArray(provider.inject)) {
        for (const depToken of provider.inject) {
          node.addDependency(depToken);
        }
      }
    } else if (isExistingProvider(provider)) {
      node.addDependency(provider.useExisting);
    }
  }
}
