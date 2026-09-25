import { NodeType } from '../types/node-type.js';

/**
 * Individual node within the Radix Tree routing hierarchy.
 */
export class RadixNode<T = unknown> {
  public prefix: string;
  public type: NodeType;
  public readonly staticChildren = new Map<string, RadixNode<T>>();
  public paramChild?: RadixNode<T> | undefined;
  public wildcardChild?: RadixNode<T> | undefined;
  public paramName?: string | undefined;
  public handlers = new Map<string, T>();

  /**
   * Creates a new RadixNode instance.
   *
   * @param prefix - Route path segment prefix stored in this node.
   * @param type - Classification type (STATIC, PARAM, WILDCARD).
   */
  constructor(prefix = '', type: NodeType = NodeType.STATIC) {
    this.prefix = prefix;
    this.type = type;
  }

  /**
   * Adds or registers a static child node indexed by its first prefix character.
   *
   * @param char - First character of the child edge prefix.
   * @param childNode - RadixNode instance to attach.
   */
  public addStaticChild(char: string, childNode: RadixNode<T>): void {
    this.staticChildren.set(char, childNode);
  }

  /**
   * Looks up a static child node by its initial character.
   *
   * @param char - First character of the target edge.
   * @returns The matching RadixNode or undefined.
   */
  public getStaticChild(char: string): RadixNode<T> | undefined {
    return this.staticChildren.get(char);
  }

  /**
   * Binds a route handler or metadata payload to an HTTP method on this node.
   *
   * @param method - HTTP method string in uppercase (e.g., 'GET', 'POST').
   * @param handler - Associated route handler payload.
   */
  public addHandler(method: string, handler: T): void {
    this.handlers.set(method.toUpperCase(), handler);
  }

  /**
   * Retrieves the route handler registered for a specific HTTP method.
   *
   * @param method - HTTP method string in uppercase.
   * @returns Registered handler payload of type T or undefined.
   */
  public getHandler(method: string): T | undefined {
    return this.handlers.get(method.toUpperCase());
  }
}
