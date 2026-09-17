/* eslint-disable @typescript-eslint/no-non-null-assertion */

import type http from 'node:http';
import { BodyParser } from '../parser/body-parser.js';
import type { StreamCollectorOptions } from '../stream/stream-collector.js';

/**
 * High-level. type-safe wrapper over native Node.js http.IncomingMessage.
 */
export class HttpRequest {
  private parsedUrl?: URL;
  private queryParams?: Record<string, string>;
  private parsedBody?: unknown;

  /**
   * Creates a new HttpRequest wrapper instance.
   *
   * @param rawRequest - Native Node.js IncomingMessage instance.
   */
  constructor(public readonly rawRequest: http.IncomingMessage) {}

  /**
   * Gets the HTTP request method in uppercase (e.g., 'GET', 'POST'
   */
  public get method(): string {
    return (this.rawRequest.method ?? 'GET').toUpperCase();
  }

  /**
   * Gets the parsed body payload if parseBody() was invoked.
   */
  public get body(): unknown {
    return this.parsedBody;
  }

  /**
   * Gets the raw request path and query string (e.g., '/api/users?page=1').
   */
  public get url(): string {
    return this.rawRequest.url ?? '/';
  }

  /**
   * Gets the headers object sent by the client.
   */
  public get headers(): http.IncomingHttpHeaders {
    return this.rawRequest.headers;
  }

  /**
   * Reads and parses the incoming request body using BodyParser.
   *
   * @param options - Collector and limit configuration options.
   * @returns Promise resolving to the parsed body.
   */
  public async parseBody<T = unknown>(options?: StreamCollectorOptions): Promise<T> {
    if (this.parseBody !== undefined) {
      return this.parseBody as T;
    }

    const contentType = this.getHeader('content-type');
    this.parsedBody = await BodyParser.parse(this.rawRequest, contentType, options);
    return this.parsedBody as T;
  }

  /**
   * Retrieves a specific header value by name.
   *
   * @param name - Header name (case-insensitive).
   * @returns Header value string or undefined if nor present.
   */
  public getHeader(name: string): string | undefined {
    const value = this.rawRequest.headers[name.toLowerCase()];
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    return value;
  }

  /**
   * Gets the pathname component of the URL (e.g., '/api/users').
   */
  public get pathname(): string {
    this.ensureParsedUrl();
    return this.parsedUrl!.pathname;
  }

  /**
   * Gets parsed query parameter key-value pairs.
   */
  public get query(): Record<string, string> {
    if (!this.queryParams) {
      this.ensureParsedUrl();
      const params: Record<string, string> = {};
      this.parsedUrl!.searchParams.forEach((value, key) => {
        params[key] = value;
      });
      this.queryParams = params;
    }
    return this.queryParams!;
  }

  /**
   * Extracts the client IP address from proxy headers or remote socket.
   */
  public get ip(): string {
    const forwarded = this.getHeader('x-forwarded-for');
    if (forwarded) {
      return forwarded.split(',')[0]!.trim();
    }
    return this.rawRequest.socket.remoteAddress ?? '127.0.0.1';
  }

  private ensureParsedUrl(): void {
    if (!this.parsedUrl) {
      const host = this.getHeader('host') ?? 'localhost';
      const protocol = (this.rawRequest.socket as { encrypted?: boolean }).encrypted
        ? 'https'
        : 'http';
      this.parsedUrl = new URL(this.url, `${protocol}://${host}`);
    }
  }
}
