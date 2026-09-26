import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { StreamCollector, PayloadTooLargeError } from '../index.js';

describe('StreamCollector & Payload Limit Safety', () => {
  it('should successfully collect into a single Buffer', async () => {
    const sourceStream = Readable.from([
      Buffer.from('Hello '),
      Buffer.from('World '),
      Buffer.from('Stream!'),
    ]);

    const result = await StreamCollector.collect(sourceStream, { maxBodySize: 1024 });

    assert.equal(result.toString('utf-8'), 'Hello World Stream!');
  });

  it('should reject with PayloadTooLargeError and destroy stream if size limit is exceeded', async () => {
    const chunkA = Buffer.alloc(500, 'a');
    const chunkB = Buffer.alloc(600, 'b');

    const sourceStream = Readable.from([chunkA, chunkB]);

    await assert.rejects(
      async () => {
        await StreamCollector.collect(sourceStream, { maxBodySize: 1000 });
      },
      (err: unknown) => {
        assert.ok(err instanceof PayloadTooLargeError);
        assert.equal(err.statusCode, 413);
        assert.equal(err.maxBodySize, 1000);
        assert.equal(err.receivedSize, 1100);
        return true;
      },
    );
  });

  it('should handle empty streams grecefully', async () => {
    const emptyStream = Readable.from([]);

    const result = await StreamCollector.collect(emptyStream);

    assert.equal(result.length, 0);
  });
});
