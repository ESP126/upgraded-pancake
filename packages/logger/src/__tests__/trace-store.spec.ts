import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { AsyncTraceStore, ConsoleLogger } from '../index.js';

describe('AsyncTraceStore & Context Propagation', () => {
  let stdoutOutput: string[] = [];
  let originalStdoutWrite: typeof process.stdout.write;

  beforeEach(() => {
    stdoutOutput = [];
    originalStdoutWrite = process.stdout.write;
    process.stdout.write = (chunk: Uint8Array | string): boolean => {
      stdoutOutput.push(chunk.toString());
      return true;
    };
  });

  afterEach(() => {
    process.stdout.write = originalStdoutWrite;
  });

  it('should propagate correlationId across nested async calls', async () => {
    const correlationId = 'test-trace-12345';

    await AsyncTraceStore.run({ correlationId }, async () => {
      assert.equal(AsyncTraceStore.getCorrelationId(), correlationId);

      await new Promise((resolve) => setTimeout(resolve, 10));

      assert.equal(AsyncTraceStore.getCorrelationId(), correlationId);
    });

    assert.equal(AsyncTraceStore.getCorrelationId(), undefined);
  });

  it('should automatically inject correlationId into structured JSON logs', async () => {
    const logger = new ConsoleLogger({ level: 'info', json: true, timestamp: false });
    const correlationId = 'req-abc-999';

    AsyncTraceStore.run({ correlationId, attributes: { tenantId: 'tenant-42' } }, () => {
      logger.info('Processing order');
    });

    assert.equal(stdoutOutput.length, 1);

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const parsed = JSON.parse(stdoutOutput[0]!.trim()) as Record<string, unknown>;
    assert.equal(parsed['correlationId'], correlationId);
    assert.equal(parsed['tenantId'], 'tenant-42');
    assert.equal(parsed['message'], 'Processing order');
  });
});
