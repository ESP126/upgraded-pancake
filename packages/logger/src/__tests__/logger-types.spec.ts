import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { LogLevel, LOG_LEVEL_VALUES } from '../index.js';

describe('Logger Types & Priorities', () => {
  it('should maintain strict numeric order across log severity levels', () => {
    assert.ok(LogLevel.TRACE < LogLevel.DEBUG);
    assert.ok(LogLevel.DEBUG < LogLevel.INFO);
    assert.ok(LogLevel.INFO < LogLevel.WARN);
    assert.ok(LogLevel.WARN < LogLevel.ERROR);
    assert.ok(LogLevel.ERROR < LogLevel.FATAL);
    assert.ok(LogLevel.FATAL < LogLevel.OFF);
  });

  it('should accurately map level string names to numeric values', () => {
    assert.equal(LOG_LEVEL_VALUES.trace, 10);
    assert.equal(LOG_LEVEL_VALUES.debug, 20);
    assert.equal(LOG_LEVEL_VALUES.info, 30);
    assert.equal(LOG_LEVEL_VALUES.warn, 40);
    assert.equal(LOG_LEVEL_VALUES.error, 50);
    assert.equal(LOG_LEVEL_VALUES.fatal, 60);
    assert.equal(LOG_LEVEL_VALUES.off, 100);
  });
});
