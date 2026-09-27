import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { MiddlewareCompositor } from '../index.js';
import type { HttpRequest } from '../index.js';
import type { HttpResponse } from '../index.js';

describe('MiddlewareCompositor & Async Pipeline Execution', () => {
  const mockReq = {} as HttpRequest;
  const mockRes = {} as HttpResponse;

  it('should execute middlewares sequentially in onion order', async () => {
    const compositor = new MiddlewareCompositor();
    const order: string[] = [];

    compositor.use(async (_req, _res, next) => {
      order.push('m1-start');
      await next();
      order.push('m1-end');
    });

    compositor.use(async (_req, _res, next) => {
      order.push('m2-start');
      await next();
      order.push('m2-end');
    });

    const pipeline = compositor.compose();
    await pipeline(mockReq, mockRes, async () => {
      order.push('controller');
    });

    assert.deepEqual(order, ['m1-start', 'm2-start', 'controller', 'm2-end', 'm1-end']);
  });

  it('should prevent double invocation of next() in the same middleware', async () => {
    const compositor = new MiddlewareCompositor();

    compositor.use(async (_req, _res, next) => {
      await next();
      await next(); // Illegal second invocation
    });

    const pipeline = compositor.compose();

    await assert.rejects(
      async () => {
        await pipeline(mockReq, mockRes);
      },
      (err: unknown) => {
        assert.ok(err instanceof Error);
        assert.ok(err.message.includes('next() called multiple times'));
        return true;
      },
    );
  });

  it('should stop pipeline execution if a middleware does not call next()', async () => {
    const compositor = new MiddlewareCompositor();
    const executed: string[] = [];

    compositor.use((_req, _res, _next) => {
      executed.push('m1-short-circuit');
      // next() is NOT called
    });

    compositor.use((_req, _res, next) => {
      executed.push('m2');
      return next();
    });

    const pipeline = compositor.compose();
    await pipeline(mockReq, mockRes, () => {
      executed.push('final');
    });

    assert.deepEqual(executed, ['m1-short-circuit']);
  });

  it('should forward thrown errors down the execution chain', async () => {
    const compositor = new MiddlewareCompositor();

    compositor.use(async (_req, _res, _next) => {
      throw new Error('Middleware auth failed');
    });

    const pipeline = compositor.compose();

    await assert.rejects(
      async () => {
        await pipeline(mockReq, mockRes);
      },
      (err: unknown) => {
        assert.ok(err instanceof Error);
        assert.equal(err.message, 'Middleware auth failed');
        return true;
      },
    );
  });
});
