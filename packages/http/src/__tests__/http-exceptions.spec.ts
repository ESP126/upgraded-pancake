import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  HttpStatus,
  HttpException,
  NotFoundException,
  UnauthorizedException,
  ForbiddenException,
} from '../index.js';

describe('HttpException Hierarchy & HttpStatus Enum', () => {
  it('should instantiate base HttpException with status code and custom response object', () => {
    const error = new HttpException({ details: 'Invalid token' }, HttpStatus.UNAUTHORIZED);

    assert.equal(error.statusCode, 401);
    assert.deepEqual(error.getResponse(), {
      statusCode: 401,
      details: 'Invalid token',
    });
  });

  it('should instantiate NotFoundException with default 404 status and error payload', () => {
    const error = new NotFoundException('User not found');

    assert.equal(error.statusCode, 404);
    assert.equal(error instanceof HttpException, true);
    assert.deepEqual(error.getResponse(), {
      statusCode: 404,
      message: 'User not found',
      error: 'NotFound',
    });
  });

  it('should correctly format responses for ForbiddenException and UnauthorizedException', () => {
    const forbidden = new ForbiddenException();
    const unauthorized = new UnauthorizedException('Token expired');

    assert.equal(forbidden.statusCode, 403);
    assert.equal(unauthorized.statusCode, 401);
    assert.equal(unauthorized.message, 'Token expired');
  });
});
