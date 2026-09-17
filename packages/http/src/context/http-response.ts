import type http from 'node:http';
import { HeaderSanitizer } from '../utils/header-sanitizer.js';

/**
 * High-level, fluent HTTP response wrapper over native Node.js http.ServerResponse.
 */
export class HttpResponse {
  private statusCodeValue = 200;

  /**
   * Creates a HttpResponse wrapper instance
   *
   * @param rawResponse - Native Node.js ServerResponse instance.
   */
  constructor(public readonly rawResponse: http.ServerResponse) {}

  /**
   * Sets the HTTP status code number.
   *
   * @param code - HTTP status code number.
   * @returns Current HttpResponse instance for chaining.
   */
  public status(code: number): this {
    this.statusCodeValue = code;
    this.rawResponse.statusCode = code;
    return this;
  }

  /**
   * Gets the current HTTP status code.
   */
  public get statusCode(): number {
    return this.statusCodeValue;
  }

  /**
   * Sets a single response header.
   *
   * @param name - Header name.
   * @param value - Header value string or array of strings.
   * @returns Current HttpResponse instance for chaining.
   */
  public header(name: string, value: string | string[]): this {
    if (!this.rawResponse.headersSent) {
      HeaderSanitizer.validateName(name);

      const sanitizedValue = Array.isArray(value)
        ? value.map((val) => HeaderSanitizer.sanitizeValue(val))
        : HeaderSanitizer.sanitizeValue(value);

      this.rawResponse.setHeader(name, sanitizedValue);
    }
    return this;
  }

  /**
   * Checks if response headers have already been sent to the client.
   */
  public get isSent(): boolean {
    return this.rawResponse.headersSent;
  }

  /**
   * Sends a plain text, Buffer, or general response payload to the client.
   *
   * @param body - Response body payload.
   */
  public send(body: string | Buffer | Uint8Array): void {
    if (this.rawResponse.headersSent) {
      return;
    }

    if (typeof body === 'string' && !this.rawResponse.hasHeader('content-type')) {
      this.rawResponse.setHeader('Content-Type', 'text/plain; charset=utf-8');
    } else if (
      (body instanceof Buffer || body instanceof Uint8Array) &&
      !this.rawResponse.hasHeader('content-type')
    ) {
      this.rawResponse.setHeader('Content-Type', 'application/octet-stream');
    }

    this.rawResponse.statusCode = this.statusCodeValue;
    this.rawResponse.end(body);
  }

  /**
   * Serializes and seeds a JSON payload with application/json Content-Type.
   *
   * @param data - Any serializable JavaScript data structure.
   */
  public json(data: unknown): void {
    if (this.rawResponse.headersSent) {
      return;
    }

    this.rawResponse.setHeader('Content-Type', 'application/json; charset=utf-8');
    this.rawResponse.statusCode = this.statusCodeValue;
    this.rawResponse.end(JSON.stringify(data));
  }
}
