import type { Readable } from 'node:stream';
import { StreamCollector, type StreamCollectorOptions } from '../stream/stream-collector.js';
import { safeJsonParse } from './safe-json-parse.js';
import { parseUrlEncoded } from './url-encoded-parse.js';

/**
 * Body parser engine capable of parsing JSON, urlencoded, text, and raw binary streams.
 */
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class BodyParser {
  /**
   * Reads a request stream and parses its body according to the Content-Type header.
   *
   * @param stream - Readable HTTP stream (e.g., http.IncomingMessage).
   * @param contentTypeHeader - Optional Content-Type header value.
   * @param options - Stream collector options ( including maxBodySize).
   * @returns Parsed body payload (object, string, or Buffer).
   */
  public static async parse(
    stream: Readable,
    contentTypeHeader?: string,
    options: StreamCollectorOptions = {},
  ): Promise<unknown> {
    const buffer = await StreamCollector.collect(stream, options);

    if (buffer.length === 0) {
      return undefined;
    }

    const contentType = (contentTypeHeader ?? '').toLowerCase().split(';')[0]?.trim() ?? '';

    if (contentType === 'application/json') {
      const text = buffer.toString('utf-8');
      return safeJsonParse(text);
    }

    if (contentType === 'application/x-www-form-urlencoded') {
      const text = buffer.toString('utf8');
      return parseUrlEncoded(text);
    }

    if (contentType.startsWith('text/')) {
      return buffer.toString('utf-8');
    }

    // Return raw buffer
    return buffer;
  }
}
