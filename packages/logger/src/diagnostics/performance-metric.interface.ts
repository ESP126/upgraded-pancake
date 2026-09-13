/**
 * Represents the execution timing metric result of a measured operation.
 */
export interface PerformanceMetricResult {
  /**
   * Name or identifier of the measured operation.
   */
  name: string;

  /**
   * Measured duration in milliseconds (sub-millisecond precision).
   */
  durationMs: number;

  /**
   * High-resolution timestamp when the measurement started.
   */
  startTime: number;

  /**
   * High-resolution timestamp when the measurement ended.
   */
  endTime: number;
}
