import type { Readable } from 'node:stream';
import { PayloadTooLargeError } from '../errors/payload-too-large.error.js';

/**
 * Configuration options for StreamCollector execution.
 */
export interface StreamCollectorOptions {
  /**
   * Maximum allowed body size in bytes.
   * @default 1048576 (1 MB)
   */
  maxBodySize?: number;
}

/**
 * Native stream collector utility that safely accumulates chunks from readable HTTP streams with byte size limits.
 */
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class StreamCollector {
  /**
   * Reads a Readable stream to completion and returns the aggregated raw Buffer.
   *
   * @param stream - Native Readable stream (e.g., http.IncomingMessage).
   * @param options - Collector configuration options.
   * @returns Promise resolving to the complete raw Buffer.
   * @throws {PayloadTooLargeError} If stream size exceeds maxBodySize.
   */
  public static collect(stream: Readable, options: StreamCollectorOptions = {}): Promise<Buffer> {
    const maxBodySize = options.maxBodySize ?? 1048576; // Default 1 MB

    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      let totalBytes = 0;

      let isCleanedUp = false;

      // Performance optimization: Guard cleanup so event listeners are removed only once,
      // avoiding redundant removeListener calls when 'end' and 'close' fire sequentially.
      const cleanup = (): void => {
        if (isCleanedUp) return;
        isCleanedUp = true;
        stream.removeListener('data', onData);
        stream.removeListener('end', onEnd);
        stream.removeListener('error', onError);
        stream.removeListener('close', onClose);
      };

      const onData = (chunk: Buffer | string): void => {
        // Performance optimization: Avoid Buffer.isBuffer method call overhead for every chunk.
        // In HTTP request streams, chunks are almost always Buffer instances.
        const bufferChunk = typeof chunk === 'string' ? Buffer.from(chunk) : chunk;
        totalBytes += bufferChunk.length;

        if (totalBytes > maxBodySize) {
          cleanup();
          stream.destroy();
          reject(new PayloadTooLargeError(maxBodySize, totalBytes));
          return;
        }

        chunks.push(bufferChunk);
      };

      const onEnd = (): void => {
        cleanup();
        resolve(Buffer.concat(chunks, totalBytes));
      };

      const onError = (err: Error): void => {
        cleanup();
        reject(err);
      };

      const onClose = (): void => {
        cleanup();
      };

      stream.on('data', onData);
      stream.on('end', onEnd);
      stream.on('error', onError);
      stream.on('close', onClose);

      // Resume stream in case it was paused
      if (stream.isPaused()) {
        stream.resume();
      }
    });
  }
}
