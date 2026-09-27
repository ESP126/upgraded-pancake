import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ExecutionContext } from '../index.js';
import { GuardEvaluator } from '../index.js';
import type { CanActivate } from '../index.js';
import type { HttpRequest } from '../index.js';
import type { HttpResponse } from '../index.js';
import { ForbiddenException, UnauthorizedException } from '../index.js';

describe('ExecutionContext & GuardEvaluator', () => {
  const mockReq = {} as HttpRequest;
  const mockRes = {} as HttpResponse;
  const context = new ExecutionContext(mockReq, mockRes);

  it('should pass evaluation when all guards return true', async () => {
    class AllowGuard implements CanActivate {
      public canActivate(): boolean {
        return true;
      }
    }

    class AsyncAllowGuard implements CanActivate {
      public async canActivate(): Promise<boolean> {
        return true;
      }
    }

    await assert.doesNotReject(async () => {
      await GuardEvaluator.evaluate([AllowGuard, new AsyncAllowGuard()], context);
    });
  });

  it('should throw ForbiddenException when a huard returns false', async () => {
    class DenyGuard implements CanActivate {
      public canActivate(): boolean {
        return false;
      }
    }

    await assert.rejects(
      async () => {
        await GuardEvaluator.evaluate([DenyGuard], context);
      },
      (err: unknown) => {
        assert.ok(err instanceof ForbiddenException);
        assert.equal(err.statusCode, 403);
        return true;
      },
    );
  });

  it('should propagate thrown HTTP exceptions from within a guard', async () => {
    class AuthGuard implements CanActivate {
      public canActivate(): boolean {
        throw new UnauthorizedException('Missing bearer token');
      }
    }

    await assert.rejects(
      async () => {
        await GuardEvaluator.evaluate([AuthGuard], context);
      },
      (err: unknown) => {
        assert.ok(err instanceof UnauthorizedException);
        assert.equal(err.statusCode, 401);
        assert.equal(err.message, 'Missing bearer token');
        return true;
      },
    );
  });
});
