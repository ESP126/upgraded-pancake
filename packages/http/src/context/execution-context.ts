import type { HttpRequest } from './http-request.js';
import type { HttpResponse } from './http-response.js';

/**
 * Encapsulates execution details for a request pipeline run, including HTTP wrappers,
 * target controller class, and handler method references.
 */
export class ExecutionContext {
  /**
   * Creates a new ExecutionContext instance.
   *
   * @param request - Active HttpRequest wrapper.
   * @param response - Active HttpResponse wrapper.
   * @param handler - Optional target route handler method reference.
   * @param targetClass - Optional target controller class reference.
   */
  constructor(
    public readonly request: HttpRequest,
    public readonly response: HttpResponse,
    private readonly handler?: (...args: unknown[]) => unknown,
    private readonly targetClass?: new (...args: unknown[]) => unknown,
  ) {}

  /**
   * Retrieves the underlying HTTP request and response wrapper.
   */
  public switchToHttp(): { request: HttpRequest; response: HttpResponse } {
    return {
      request: this.request,
      response: this.response,
    };
  }

  /**
   * Gets the target route handler function reference.
   */
  public getHandler(): ((...args: unknown[]) => unknown) | undefined {
    return this.handler;
  }

  /**
   * Gets the target controller class constructor reference.
   */
  public getClass(): (new (...args: unknown[]) => unknown) | undefined {
    return this.targetClass;
  }
}
