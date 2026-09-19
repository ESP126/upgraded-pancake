import { createHmac, timingSafeEqual } from 'node:crypto';
import type { CookieOptions } from '../types/cookie-options.js';

/**
 * Utility for serializing, parsing, and cryptographically signing HTTP cookies.
 */
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class CookieSerializer {
  /**
   * Signs a cookie value using HMAC-SHA256.
   *
   * @param value - Plain text value string.
   * @param secret - Secret cryptographic key.
   * @returns Signed string formatted as 's:{value}.{signature}'.
   */
  public static sign(value: string, secret: string): string {
    const signature = createHmac('sha256', secret)
      .update(value)
      .digest('base64')
      .replace(/=+$/, '');

    return `s:${value}.${signature}`;
  }

  /**
   * Validates and unsigns a signedcookie value using timing-safe comparison.
   *
   * @param signedValue - Signed string formatted as 's:{value}.{signature}'.
   * @param secret - Secret cryptographic key.
   * @returns Unsigned value string or false if signature is invalid or tampered with.
   */
  public static unsign(signedValue: string, secret: string): string | false {
    if (!signedValue.startsWith('s:')) {
      return false;
    }

    const raw = signedValue.slice(2);
    const lastDotIndex = raw.lastIndexOf('.');

    if (lastDotIndex === -1) {
      return false;
    }

    const value = raw.slice(0, lastDotIndex);
    const expectedSigned = this.sign(value, secret);

    const actualBuffer = Buffer.from(signedValue);
    const expectedBuffer = Buffer.from(expectedSigned);

    if (actualBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return timingSafeEqual(actualBuffer, expectedBuffer) ? value : false;
  }

  /**
   * Serializes a name-value pair with options into a valid Set-Cookie header string.
   *
   * @param name - Cookie name string.
   * @param value - Cookie raw value string.
   * @param options - Cookie attribute configuration options.
   * @returns Serialized Set-Cookie header value string.
   */
  public static serialize(name: string, value: string, options: CookieOptions = {}): string {
    let activeValue = value;

    if (options.secret) {
      activeValue = this.sign(value, options.secret);
    }

    const pairs: string[] = [`${encodeURIComponent(name)}=${encodeURIComponent(activeValue)}`];

    if (options.maxAge != undefined) {
      pairs.push(`Max-Age=${Math.floor(options.maxAge)}`);
    }

    if (options.expires) {
      pairs.push(`Expires=${options.expires.toUTCString()}`);
    }

    if (options.domain) {
      pairs.push(`Domain=${options.domain}`);
    }

    const path = options.path ?? '/';
    pairs.push(`Path=${path}`);

    if (options.secure) {
      pairs.push('Secure');
    }

    if (options.httpOnly ?? true) {
      pairs.push('HttpOnly');
    }

    const sameSite = options.sameSite ?? 'Lax';
    if (typeof sameSite === 'string') {
      pairs.push(`SameSite=${sameSite}`);
    } else if (sameSite === true) {
      pairs.push('SameSite=Strict');
    }

    return pairs.join('; ');
  }

  /**
   * Parses a raw Cookie harded string into a key-value dictionary.
   *
   * @param cookieHeader - Raw Cookie header value.
   * @param secret - Optional secret key to automatically verify and unsign cookies.
   * @returns Dictionary of parsed cookie key-value pairs.
   */
  public static parse(cookieHeader?: string, secret?: string): Record<string, string> {
    const result: Record<string, string> = Object.create(null);

    if (!cookieHeader || cookieHeader === '') {
      return result;
    }

    const pairs = cookieHeader.split(';');

    for (const pair of pairs) {
      const eqIdx = pair.indexOf('=');
      if (eqIdx === -1) {
        continue;
      }

      const name = decodeURIComponent(pair.slice(0, eqIdx).trim());
      let val = decodeURIComponent(pair.slice(eqIdx + 1).trim());

      if (secret && val.startsWith('s:')) {
        const unsigned = this.unsign(val, secret);
        if (unsigned !== false) {
          val = unsigned;
        }
      }

      result[name] = val;
    }

    return result;
  }
}
