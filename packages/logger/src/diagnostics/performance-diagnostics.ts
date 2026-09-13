import { performance } from 'node:perf_hooks';
import type { ILogger } from '../interfaces/logger.interface.js';
import type { PerformanceMetricResult } from './performance-metric.interface.js';

/**
 * Low-overhead performance measurement utility based on native node:perf_hooks.
 */
// eslint-disable-next-line
export class PerformanceDiagnostics {
  private static readonly activeTimers = new Map<string, number>();

  /**
   * Starts a high-resolution timer for a named operation.
   *
   * @param name - Unique timer identifier.
   */
  public static start(name: string): void {
    this.activeTimers.set(name, performance.now());
  }

  /**
   * Stops a high-resolution timer and returns the calculated duration metric.
   *
   * @param name - Identifier of the active timer.
   * @param logger - Optional ILogger instance to emit a debug log entry.
   * @returns The calculated PerformanceMetricResult or undefined if timer was not started.
   */
  public static end(name: string, logger?: ILogger): PerformanceMetricResult | undefined {
    const startTime = this.activeTimers.get(name);
    if (startTime === undefined) {
      return undefined;
    }

    const endTime = performance.now();
    this.activeTimers.delete(name);

    const durationMs = Number((endTime - startTime).toFixed(3));
    const result: PerformanceMetricResult = {
      name,
      durationMs,
      startTime,
      endTime,
    };

    if (logger && logger.isLevelEnabled('debug')) {
      logger.debug(`[Performance] ${name} executed in ${durationMs}ms`, {
        metric: name,
        durationMs,
      });
    }

    return result;
  }

  /**
   * Measures the execution duration of a synchronous function.
   *
   * @param name - Metric identifier.
   * @param fn - Synchronous callback to execute.
   * @param logger - Optional ILogger instance to log metrics.
   * @returns Object containing the callback result and execution metrics.
   */
  public static measureSync<T>(
    name: string,
    fn: () => T,
    logger?: ILogger,
  ): { result: T; metric: PerformanceMetricResult } {
    const startTime = performance.now();
    const result = fn();
    const endTime = performance.now();
    const durationMs = Number((endTime - startTime).toFixed(3));

    const metric: PerformanceMetricResult = {
      name,
      durationMs,
      startTime,
      endTime,
    };

    if (logger && logger.isLevelEnabled('debug')) {
      logger.debug(`[Performance] ${name} executed in ${durationMs}ms`, {
        metric: name,
        durationMs,
      });
    }

    return { result, metric };
  }

  /**
   * Measures the execution duration of an asynchronous function.
   *
   * @param name - Metric identifier.
   * @param fn - Asynchronous callback to execute.
   * @param logger - Optional ILogger instance to log metrics.
   * @returns Object containing the resolved callback result and execution metrics.
   */
  public static async measureAsync<T>(
    name: string,
    fn: () => Promise<T>,
    logger?: ILogger,
  ): Promise<{ result: T; metric: PerformanceMetricResult }> {
    const startTime = performance.now();
    const result = await fn();
    const endTime = performance.now();
    const durationMs = Number((endTime - startTime).toFixed(3));

    const metric: PerformanceMetricResult = {
      name,
      durationMs,
      startTime,
      endTime,
    };

    if (logger && logger.isLevelEnabled('debug')) {
      logger.debug(`[Performance] ${name} executed in ${durationMs}ms`, {
        metric: name,
        durationMs,
      });
    }

    return { result, metric };
  }
}
