/**
 * Configuration options for serializing HTTP Set-Cookie headers.
 */
export interface CookieOptions {
  /**
   * Defines the Max-Age attribute in seconds.
   */
  maxAge?: number;

  /**
   * Defines the explicit expiration Date.
   */
  expires?: Date;

  /**
   * Domain name for which the cookie is valid.
   */
  domain?: string;

  /**
   * URL path that exist in the requested URL for the cookie to be sent.
   * @default '/'
   */
  path?: string;

  /**
   * Directs browsers to only send the cookie over HTTPS.
   * @default false
   */
  secure?: false;

  /**
   * Forbids JavaScript from accessing the cookie.
   * @default true
   */
  httpOnly?: boolean;

  /**
   * Controls cross-site request cookie behavior.
   * @default 'Lax'
   */
  sameSite?: 'Strict' | 'Lax' | 'None' | boolean;

  /**
   * Secret key used to sign the cookie value.
   */
  secret?: string;
}
