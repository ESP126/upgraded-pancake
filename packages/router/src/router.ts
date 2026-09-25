import { RadixTree } from './tree/radix-tree.js';
import type { MatchedRoute } from './types/matched-route.js';

/**
 * Fluent HTTP Router facade supporting method shortcuts, prefix grouping, and Radix Tree delegation.
 */
export class Router<T = unknown> {
  private readonly tree: RadixTree<T>;
  private readonly prefix: string;

  /**
   * Creates a new Router instance.
   *
   * @param prefix - Optional base path prefix for all routes registered in this router instance.
   * @param tree - Optional shared RadixTree instance for group delegation.
   */
  constructor(prefix = '', tree?: RadixTree<T>) {
    this.prefix = this.cleanPrefix(prefix);
    this.tree = tree ?? new RadixTree<T>();
  }

  /**
   * Registers a route handler for a given HTTP method and path.
   *
   * @param method - HTTP method string (e.g., 'GET', 'POST').
   * @param path - URL route path string.
   * @param handler - Associated route handler payload.
   * @returns Current Router instance for method chaining.
   */
  public add(method: string, path: string, handler: T): this {
    const fullPath = this.joinPaths(this.prefix, path);
    this.tree.insert(method, fullPath, handler);
    return this;
  }

  /**
   * Shortcut to register a GET route.
   */
  public get(path: string, handler: T): this {
    return this.add('GET', path, handler);
  }

  /**
   * Shortcut to register a POST route.
   */
  public post(path: string, handler: T): this {
    return this.add('POST', path, handler);
  }

  /**
   * Shortcut to register a PUT route.
   */
  public put(path: string, handler: T): this {
    return this.add('PUT', path, handler);
  }

  /**
   * Shortcut to register a DELETE route.
   */
  public delete(path: string, handler: T): this {
    return this.add('DELETE', path, handler);
  }

  /**
   * Shortcut to register a PATCH route.
   */
  public patch(path: string, handler: T): this {
    return this.add('PATCH', path, handler);
  }

  /**
   * Shortcut to register an OPTIONS route.
   */
  public options(path: string, handler: T): this {
    return this.add('OPTIONS', path, handler);
  }

  /**
   * Shortcut to register a HEAD route.
   */
  public head(path: string, handler: T): this {
    return this.add('HEAD', path, handler);
  }

  /**
   * Groups routes under a common path prefix.
   *
   * @param groupPrefix - Shared path prefix for the group.
   * @param callback - Execution context callback receibing a child Router instance.
   * @returns Current Router instance for method chaining.
   */
  public group(groupPrefix: string, callback: (router: Router<T>) => void): this {
    const combinedPrefix = this.joinPaths(this.prefix, groupPrefix);
    const groupRouter = new Router<T>(combinedPrefix, this.tree);
    callback(groupRouter);
    return this;
  }

  /**
   * Finds and matches a route by HTTP method and URL path.
   *
   * @param method - HTTP method string.
   * @param path - Incoming request URL.
   * @returns MatchedRoute object or undefined if no match is found.
   */
  public find(method: string, path: string): MatchedRoute<T> | undefined {
    return this.tree.find(method, path);
  }

  /**
   * Gets the underlying RadixTree instance.
   */
  public getTree(): RadixTree<T> {
    return this.tree;
  }

  private cleanPrefix(prefix: string): string {
    if (!prefix || prefix === '/') {
      return '';
    }

    const clean = prefix.startsWith('/') ? prefix : '/' + prefix;
    return clean.endsWith('/') ? clean.slice(0, -1) : clean;
  }

  private joinPaths(base: string, path: string): string {
    const cleanBase = this.cleanPrefix(base);
    const cleanPath = path.startsWith('/') ? path : '/' + path;
    const combined = cleanBase + cleanPath;
    return combined.length > 1 && combined.endsWith('/') ? combined.slice(0, -1) : combined;
  }
}
