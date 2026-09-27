import type { ExecutionContext } from '../context/execution-context.js';
import type { CanActivate, GuardType } from './can-active.interface.js';
import { ForbiddenException } from '../errors/http.exceptions.js';

/**
 * Evaluator engine for executing route and controller access guards.
 */
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class GuardEvaluator {
  /**
   * Evaluates an array of guards sequentially against an ExecutionContext.
   *
   * @param guards - Array of CanActivate instances or class constructors.
   * @param context - The ExecutionContent for the active request.
   * @throws {ForbiddenException} If any guard explicitly returns false.
   */
  public static async evaluate(guards: GuardType[], context: ExecutionContext): Promise<void> {
    if (!guards || guards.length === 0) {
      return;
    }

    for (const guard of guards) {
      const instance: CanActivate =
        typeof guard === 'function' ? new (guard as new () => CanActivate)() : guard;

      const allowed = await instance.canActivate(context);

      if (!allowed) {
        throw new ForbiddenException('Access denied by guard evaluation');
      }
    }
  }
}
