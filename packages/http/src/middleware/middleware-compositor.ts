import type { HttpRequest } from '../context/http-request.js';
import type { HttpResponse } from '../context/http-response.js';
import type { MiddlewareHandler, NextFunction } from '../types/middleware.js';

/**
 * Asynchronous onion-style middleware composition engine.
 */
export class MiddlewareCompositor {
  private readonly middlewares: MiddlewareHandler[] = [];

  /**
   * Appens one or multiple middlewares handlers to the pipeline.
   *
   * @param middlewares - Middleware function or array of functions.
   * @returns Current MiddlewareCompositor instance for chaining.
   */
  public use(...middlewares: MiddlewareHandler[]): this {
    this.middlewares.push(...middlewares);
    return this;
  }

  /**
   * Compose registered middlewares into a single executable pipeline function.
   *
   * @returns Composed execution accepting HttpRequest, HttpResponse and an optional final handler.
   */
  public compose(): (
    req: HttpRequest,
    res: HttpResponse,
    finalHandler?: () => Promise<void> | void,
  ) => Promise<void> {
    return (
      req: HttpRequest,
      res: HttpResponse,
      finalHandler?: () => Promise<void> | void,
    ): Promise<void> => {
      let index = -1;

      const dispatch = async (i: number): Promise<void> => {
        if (i <= index) {
          throw new Error('next() called multiple times in the same middleware');
        }
        index = i;

        const handler: MiddlewareHandler | undefined = this.middlewares[i];

        if (i === this.middlewares.length) {
          if (finalHandler) {
            await finalHandler();
          }
          return;
        }

        if (!handler) {
          return;
        }

        const next: NextFunction = async (err?: unknown): Promise<void> => {
          if (err) {
            throw err;
          }
          await dispatch(i + 1);
        };

        await handler(req, res, next);
      };

      return dispatch(0);
    };
  }

  public get length(): number {
    return this.middlewares.length;
  }
}
