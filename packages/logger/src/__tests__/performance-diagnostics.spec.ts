import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PerformanceDiagnostics } from '../index.js';

describe('PerformanceDiagnostics', () => {
  it('should measure duration between start and end calls', async () => {
    PerformanceDiagnostics.start('test-op');
    await new Promise((resolve) => setTimeout(resolve, 20));
    const metric = PerformanceDiagnostics.end('test-op');

    assert.ok(metric !== undefined);
    assert.equal(metric.name, 'test-op');
    assert.ok(metric.durationMs >= 15);
  });

  it('should measure execution time of a synchronous function', () => {
    const { result, metric } = PerformanceDiagnostics.measureSync('sync-op', () => {
      let sum = 0;
      for (let i = 0; i < 1000; i++) {
        sum += i;
      }
      return sum;
    });

    assert.equal(result, 499500);
    assert.equal(metric.name, 'sync-op');
    assert.ok(metric.durationMs >= 0);
  });

  it('should measure execution time of an asynchronous function', async () => {
    const { result, metric } = await PerformanceDiagnostics.measureAsync('async-op', async () => {
      await new Promise((resolve) => setTimeout(resolve, 15));
      return 'done';
    });

    const res = result;
    assert.equal(res, 'done');
    assert.ok(metric.durationMs >= 10);
  });
});
