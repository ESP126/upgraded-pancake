import type { HttpRequest } from '../context/http-request.js';
import type { HttpResponse } from '../context/http-response.js';

/**
 * Next function callback type for triggering the next middleware in the pipeline.
 */
export type NextFunction = (error?: unknown) => Promise<void>;

/**
 * Middleware function signature handling request, response and pipeline execution flow.
 */
export type MiddlewareHandler = (
  req: HttpRequest,
  res: HttpResponse,
  next: NextFunction,
) => void | Promise<void>;
