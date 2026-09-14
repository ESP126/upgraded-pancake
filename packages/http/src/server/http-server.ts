import http from 'node:http';
import type net from 'node:net';
import type { HttpServerOptions, RequestHandler } from '../types/server-options.js';

/**
 * Native Node.js HTTP/1.1 server wrapper featuring active socket lifecycle tracking and graceful shutdown.
 */
export class HttpServer {
  private readonly server: http.Server;
  private readonly activeSockets = new Set<net.Socket>();
  private readonly options: Required<HttpServerOptions>;
  private isListening = false;

  /**
   * Creates a new HttpServer instance.
   *
   * @param handler - Request listener function for raw HTTP requests.
   * @param options - Server configuration options.
   */
  constructor(handler: RequestHandler, options: HttpServerOptions = {}) {
    this.options = {
      port: options.port ?? 3000,
      host: options.host ?? '0.0.0.0',
      headersTimeout: options.headersTimeout ?? 60000,
      requestTimeout: options.requestTimeout ?? 300000,
      keepAliveTimeout: options.keepAliveTimeout ?? 5000,
      shutdownTimeout: options.shutdownTimeout ?? 10000,
    };

    this.server = http.createServer((req, res) => {
      void handler(req, res);
    });

    this.configureTimeouts();
    this.trackSocketLifecycle();
  }

  /**
   * Starts listening for HTTP connections on the configured port and host.
   *
   * @returns Promise resolving when the server is ready to accept connections.
   */
  public listen(port?: number, host?: string): Promise<void> {
    const targetPort = port ?? this.options.port;
    const targetHost = host ?? this.options.host;

    return new Promise((resolve, reject) => {
      if (this.isListening) {
        return resolve();
      }

      this.server.once('error', (err) => {
        this.isListening = false;
        reject(err);
      });

      this.server.listen(targetPort, targetHost, () => {
        this.isListening = true;
        resolve();
      });
    });
  }

  /**
   * Gracefully shuts down the HTTP server, closing all tracked sockets.
   *
   * @returns Promise resolving when all connections are closed.
   */
  public close(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isListening) {
        return resolve();
      }

      this.isListening = false;

      // Forcefully terminate remaining sockets if graceful timeout expires
      const timer = setTimeout(() => {
        for (const socket of this.activeSockets) {
          socket.destroy();
        }
        this.activeSockets.clear();
      }, this.options.shutdownTimeout);

      // Unref timer to prevent keeping event look alive unnecessarily
      timer.unref();

      this.server.close((err) => {
        clearTimeout(timer);
        this.activeSockets.clear();

        if (err) {
          return reject(err);
        }
        resolve();
      });

      // Destroy idle sockets immediately
      for (const socket of this.activeSockets) {
        if ((socket as unknown as { _idle?: boolean })._idle) {
          socket.destroy();
          this.activeSockets.delete(socket);
        }
      }
    });
  }

  /**
   * Gets the underlying raw Node.js http.Server instance.
   */
  public getRawServer(): http.Server {
    return this.server;
  }

  /**
   * Cheks if the server is currently listening for requests.
   */
  public isRunning(): boolean {
    return this.isListening;
  }

  private configureTimeouts(): void {
    this.server.headersTimeout = this.options.headersTimeout;
    this.server.requestTimeout = this.options.requestTimeout;
    this.server.keepAliveTimeout = this.options.keepAliveTimeout;
  }

  private trackSocketLifecycle(): void {
    this.server.on('connection', (socket: net.Socket) => {
      this.activeSockets.add(socket);

      socket.once('close', () => {
        this.activeSockets.delete(socket);
      });
    });
  }
}
