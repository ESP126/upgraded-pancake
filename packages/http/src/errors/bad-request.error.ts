/**
 * Custom HTTP 400 Bad Request exception thrown when a request payload is malformed or invalid.
 */
export class BadRequestError extends Error {
  public readonly statusCode = 400;

  /**
   * Creates a new BadRequestError instance.
   *
   * @param message - Error description message.
   */
  constructor(message = 'Bad Request') {
    super(message);
    this.name = 'BadRequestError';

    Object.setPrototypeOf(this, new.target.prototype);
  }
}
