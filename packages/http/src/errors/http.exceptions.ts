import { HttpException } from './http.exception.js';
import { HttpStatus } from './http-status.enum.js';

/**
 * 400 Bad Request Exception.
 */
export class BadRequestException extends HttpException {
  constructor(response: string | Record<string, unknown> = 'Bad Request') {
    super(response, HttpStatus.BAD_REQUEST);
  }
}

/**
 * 401 Unauthorized Exception.
 */
export class UnauthorizedException extends HttpException {
  constructor(response: string | Record<string, unknown> = 'Unauthorized') {
    super(response, HttpStatus.UNAUTHORIZED);
  }
}

/**
 * 403 Forbidden Exception.
 */
export class ForbiddenException extends HttpException {
  constructor(response: string | Record<string, unknown> = 'Forbidden') {
    super(response, HttpStatus.FORBIDDEN);
  }
}

/**
 * 404 Not Found Exception.
 */
export class NotFoundException extends HttpException {
  constructor(response: string | Record<string, unknown> = 'Not Found') {
    super(response, HttpStatus.NOT_FOUND);
  }
}

/**
 * 409 Conflict Exception.
 */
export class ConflictException extends HttpException {
  constructor(response: string | Record<string, unknown> = 'Conflict') {
    super(response, HttpStatus.CONFLICT);
  }
}

/**
 * 422 Unprocessable Entity Exception.
 */
export class UnprocessableEntityException extends HttpException {
  constructor(response: string | Record<string, unknown> = 'Unprocessable Entity') {
    super(response, HttpStatus.UNPROCESSABLE_ENTITY);
  }
}

/**
 * 500 Internal Server Error Exception.
 */
export class InternalServerErrorException extends HttpException {
  constructor(response: string | Record<string, unknown> = 'Internal Server Error') {
    super(response, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
