/**
 * Custom error thrown when an incoming HTTP request body exceeds the maximum allowed size limit.
 */
export class PayloadTooLargeError extends Error {
  public readonly statusCode = 413;
  public readonly maxBodySize: number;
  public readonly receivedSize: number;

  /**
   * Creates a new PayloadTooLargeError instance.
   *
   * @param maxBodySize - Maximum configured size limit in bytes.
   * @param receivedSize - Number of bytes received when the threshold was breached.
   */
  constructor(maxBodySize: number, receivedSize: number) {
    super(
      `Payload size of ${receivedSize} bytes exceeds maximum allowed limit of ${maxBodySize} bytes`,
    );
    this.name = 'PayloadTooLargeError';
    this.maxBodySize = maxBodySize;
    this.receivedSize = receivedSize;

    Object.setPrototypeOf(this, new.target.prototype);
  }
}
