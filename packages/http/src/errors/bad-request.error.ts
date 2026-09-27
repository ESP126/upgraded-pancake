import { HttpException } from './http.exception.js';
import { HttpStatus } from './http-status.enum.js';

export class BadRequestError extends HttpException {
  constructor(message = 'Bad Request') {
    super(message, HttpStatus.BAD_REQUEST);
  }
}
