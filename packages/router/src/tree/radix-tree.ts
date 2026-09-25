/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { RadixNode } from '../nodes/radix-node.js';
import { NodeType } from '../types/node-type.js';
import type { MatchedRoute } from '../types/matched-route.js';

/**
 * Radix Tree route storage and lookup structure.
 */
export class RadixTree<T = unknown> {
  private readonly root = new RadixNode<T>('/', NodeType.STATIC);

  /**
   * Gets the root node of the Radix Tree.
   */
  public getRoot(): RadixNode<T> {
    return this.root;
  }

  /**
   * Inserts a route path and method handler into the Radix Tree.
   *
   * @param method - HTTP method string in uppercase (e.g., 'GET', 'POST').
   * @param path - URL route path string (e.g., '/users/:id').
   * @param handler - Associated route handler payload.
   */
  public insert(method: string, path: string, handler: T): void {
    const normalizedPath = this.normalizePath(path);
    const upperMethod = method.toUpperCase();

    let currentNode = this.root;
    let searchPath = normalizedPath;

    // Handle root path registration
    if (searchPath === '/') {
      currentNode.addHandler(upperMethod, handler);
      return;
    }

    // Trim leading slash for processing
    if (searchPath.startsWith('/')) {
      searchPath = searchPath.slice(1);
    }

    while (searchPath.length > 0) {
      // Check for Parametric segment (:param)
      const paramIndex = searchPath.indexOf(':');
      const wildcardIndex = searchPath.indexOf('*');

      if (paramIndex === 0) {
        const nextSlash = searchPath.indexOf('/');
        const paramSegment = nextSlash === -1 ? searchPath : searchPath.slice(0, nextSlash);
        const paramName = paramSegment.slice(1);

        if (!currentNode.paramChild) {
          currentNode.paramChild = new RadixNode<T>(':' + paramName, NodeType.PARAM);
          currentNode.paramChild.paramName = paramName;
        }

        currentNode = currentNode.paramChild;

        if (nextSlash === -1) {
          searchPath = '';
        } else {
          searchPath = searchPath.slice(nextSlash + 1);
        }
        continue;
      }

      // Check for wildcard segment (*wildcard)
      if (wildcardIndex === 0) {
        const wildcardName = searchPath.slice(1);

        if (!currentNode.wildcardChild) {
          currentNode.wildcardChild = new RadixNode<T>('*' + wildcardName, NodeType.WILDCARD);
          currentNode.wildcardChild.paramName = wildcardName;
        }

        currentNode = currentNode.wildcardChild;
        searchPath = '';
        continue;
      }

      // Process Static path segment until next special character (: or *) or slash
      let staticSegmentLength = searchPath.length;
      if (paramIndex > 0) staticSegmentLength = Math.min(staticSegmentLength, paramIndex);
      if (wildcardIndex > 0) staticSegmentLength = Math.min(staticSegmentLength, wildcardIndex);

      const staticChunk = searchPath.slice(0, staticSegmentLength);
      const firstChar = staticChunk[0]!;

      let child = currentNode.getStaticChild(firstChar);

      if (!child) {
        // No static child starting with firstChar: create new node
        child = new RadixNode<T>(staticChunk, NodeType.STATIC);
        currentNode.addStaticChild(firstChar, child);
        currentNode = child;
        searchPath = searchPath.slice(staticChunk.length);
        continue;
      }

      // Find common prefix length between child.prefix and staticChunk
      const commonPrefixLen = this.getCommonPrefixLength(child.prefix, staticChunk);

      if (commonPrefixLen < child.prefix.length) {
        // Node splitting required
        const splitChild = new RadixNode<T>(child.prefix.slice(commonPrefixLen), child.type);

        // Move handlers and children to split child
        splitChild.handlers = child.handlers;
        child.staticChildren.forEach((val, key) => splitChild.staticChildren.set(key, val));
        splitChild.paramChild = child.paramChild;
        splitChild.wildcardChild = child.wildcardChild;

        // Truncate child node prefix to common prefix
        child.prefix = child.prefix.slice(0, commonPrefixLen);
        child.handlers = new Map();
        child.staticChildren.clear();
        child.paramChild = undefined;
        child.wildcardChild = undefined;

        child.addStaticChild(splitChild.prefix[0]!, splitChild);
      }

      if (commonPrefixLen < staticChunk.length) {
        // Remaining portion of staticChunk becomes a new child
        const remainingStatic = staticChunk.slice(commonPrefixLen);
        let newSubChild = child.getStaticChild(remainingStatic[0]!);

        if (!newSubChild) {
          newSubChild = new RadixNode<T>(remainingStatic, NodeType.STATIC);
          child.addStaticChild(remainingStatic[0]!, newSubChild);
        }

        currentNode = newSubChild;
      } else {
        currentNode = child;
      }

      searchPath = searchPath.slice(staticChunk.length);
    }

    currentNode.addHandler(upperMethod, handler);
  }

  /**
   * Finds and matches a route by HTTP method and URL path, extracting dynamic parameters.
   *
   * @param method - HTTP method string in uppercase (e.g., 'GET', 'POST').
   * @param path - Incoming request URL path string.
   * @returns MatchedRoute object containing the handler and extracted params, or undefined.
   */
  public find(method: string, path: string): MatchedRoute<T> | undefined {
    const normalizedPath = this.normalizePath(path);
    const upperMethod = method.toUpperCase();

    const params: Record<string, string> = {};
    const searchPath = normalizedPath === '/' ? '/' : normalizedPath.slice(1);

    const matchedNode = this.matchNode(this.root, searchPath, params);

    if (!matchedNode) {
      return undefined;
    }

    const handler = matchedNode.getHandler(upperMethod);
    if (!handler) {
      return undefined;
    }

    return { handler, params };
  }

  private matchNode(
    node: RadixNode<T>,
    path: string,
    params: Record<string, string>,
  ): RadixNode<T> | undefined {
    if (path === '/' && node.prefix === '/') {
      return node;
    }

    if (node.prefix !== '/' && !path.startsWith(node.prefix)) {
      return undefined;
    }

    const remainingPath = node.prefix === '/' ? path : path.slice(node.prefix.length);

    if (remainingPath.length === 0) {
      return node;
    }

    // Try static child match
    const firstChar = remainingPath[0]!;
    const staticChild = node.getStaticChild(firstChar);

    if (staticChild) {
      const matched = this.matchNode(staticChild, remainingPath, params);
      if (matched) {
        return matched;
      }
    }

    // Try parametric child match (:param)
    if (node.paramChild) {
      const nextSlashIndex = remainingPath.indexOf('/');
      const paramValue =
        nextSlashIndex === -1 ? remainingPath : remainingPath.slice(0, nextSlashIndex);
      const restPath = nextSlashIndex === -1 ? '' : remainingPath.slice(nextSlashIndex);

      if (node.paramChild.paramName) {
        params[node.paramChild.paramName] = decodeURIComponent(paramValue);
      }

      if (restPath.length === 0) {
        return node.paramChild;
      }

      if (restPath.startsWith('/')) {
        const afterSlash = restPath.slice(1);
        const nextChar = afterSlash[0];
        if (nextChar && node.paramChild.getStaticChild(nextChar)) {
          const matched = this.matchNode(
            node.paramChild.getStaticChild(nextChar)!,
            afterSlash,
            params,
          );
          if (matched) return matched;
        }
      }
    }

    // Try wildcard child matched (*wildcard)
    if (node.wildcardChild) {
      if (node.wildcardChild.paramName) {
        params[node.wildcardChild.paramName] = decodeURIComponent(remainingPath);
      }
      return node.wildcardChild;
    }

    return undefined;
  }

  private normalizePath(path: string): string {
    if (!path || path === '/') {
      return '/';
    }
    const cleanPath = path.startsWith('/') ? path : '/' + path;
    return cleanPath.endsWith('/') && cleanPath.length > 1 ? cleanPath.slice(0, -1) : cleanPath;
  }

  private getCommonPrefixLength(a: string, b: string): number {
    let i = 0;
    const max = Math.min(a.length, b.length);
    while (i < max && a[i] === b[i]) {
      i++;
    }
    return i;
  }
}
