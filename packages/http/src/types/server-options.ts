import type http from 'node:http';

/**
 * Handler function signature for incoming HTTP raw request listener.
 */
export type RequestHandler = (
  req: http.IncomingMessage,
  res: http.ServerResponse,
) => void | Promise<void>;

/**
 * Configuration options for the native HttpServer wrapper.
 */
export interface HttpServerOptions {
  /**
   * Port number to listen on.
   * @default 3000
   */
  port?: number;

  /**
   * Host IP address or hostname to bind.
   * @default '0.0.0.0'
   */
  host?: string;

  /**
   * Timeout in milliseconds for receiving complete HTTP headers.
   * @default 60000
   */
  headersTimeout?: number;

  /**
   * Timeout in milliseconds for receiving complete HTTP requests.
   * @default 60000
   */
  requestTimeout?: number;

  /**
   * Milliseconds of inactivity before a keep-alive socket is closed.
   * @default 5000
   */
  keepAliveTimeout?: number;

  /**
   * Graceful shutdown timeout in milliseconds before forcefully destroying sockets.
   * @default 10000
   */
  shutdownTimeout?: number;
}
