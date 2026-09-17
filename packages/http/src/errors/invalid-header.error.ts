/**
 * Custom error thrown when a header name contains illegal RFC 9110 characters.
 */
export class InvalidHeaderError extends Error {
  /**
   * Creates a new InvalidHeaderError instance.
   *
   * @param message - Error description message.
   */
  constructor(message: string) {
    super(message);
    this.name = 'InvalidHeaderError';

    Object.setPrototypeOf(this, new.target.prototype);
  }
}
