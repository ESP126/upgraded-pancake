import type { ExecutionContext } from '../context/execution-context.js';

/**
 * Interface that custom Guards must implement to control route access.
 */
export interface CanActivate {
  /**
   * Evaluates if the current request pipeline is authorized to proceed.
   *
   * @param context - Execution instance for the active request.
   * @returns boolean or Promise<void> indicating access permission.
   */
  canActivate(context: ExecutionContext): boolean | Promise<boolean>;
}

/**
 * Type representing either a CanActivate instance or class constructor.
 */
export type GuardType = CanActivate | (new (...args: [unknown]) => CanActivate);
