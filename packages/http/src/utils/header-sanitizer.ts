import { InvalidHeaderError } from '../errors/invalid-header.error.js';

/**
 * Utility for sanitizing and validating HTTP header names and values to prevent CRLF injection.
 */
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class HeaderSanitizer {
  // Alphanumeric and !#$%&'*+-.^_`|~
  private static readonly INVALID_KEY_REGEX = /[^a-zA-Z0-9!#$%&'*+-.^_`|~]/;
  private static readonly CRLF_REGEX = /[\r\n\x00]/g;

  /**
   * Validates that a header name conforms to RFC 9110 token specifications.
   *
   * @param name - Header field name.
   * @throws {InvalidHeaderError}  If name contains invalid control characters or whitespace.
   */
  public static validateName(name: string): void {
    if (!name || this.INVALID_KEY_REGEX.test(name)) {
      throw new InvalidHeaderError(
        `Invalid HTTP header name containing illegal characters: "${name}"`,
      );
    }
  }

  /**
   * Sanitizes a header value by stripping carriage return (\r), line feed (\n), and null bytes (\0).
   *
   * @param value - Raw header value string.
   * @returns Cleaned header value string.
   */
  public static sanitizeValue(value: string): string {
    if (!value) {
      return '';
    }

    return value.replace(this.CRLF_REGEX, '');
  }
}
