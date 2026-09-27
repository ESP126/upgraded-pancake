import { HttpException } from './http.exception.js';
import { HttpStatus } from './http-status.enum.js';

export class PayloadTooLargeError extends HttpException {
  public readonly maxBodySize: number;
  public readonly receivedSize: number;

  constructor(maxBodySize: number, receivedSize: number) {
    super(
      `Payload size of ${receivedSize} bytes exceeds maximum allowed limit of ${maxBodySize} bytes`,
      HttpStatus.PAYLOAD_TOO_LARGE,
    );
    this.maxBodySize = maxBodySize;
    this.receivedSize = receivedSize;
  }
}
