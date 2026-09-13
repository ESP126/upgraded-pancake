/* eslint-disable @typescript-eslint/no-non-null-assertion */

import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { ConsoleLogger } from '../console-logger.js';

describe('ConsoleLogger Implementation', () => {
	let stdoutOutput: string[] = [];
	let stderrOutput: string[] = [];
	let originalStdoutWrite: typeof process.stdout.write;
	let originalStderrWrite: typeof process.stderr.write;

	beforeEach(() => {
		stdoutOutput = [];
		stderrOutput = [];

		originalStdoutWrite = process.stdout.write;
		originalStderrWrite = process.stderr.write;

		process.stdout.write = (chunk: Uint8Array | string): boolean => {
			stdoutOutput.push(chunk.toString());
			return true;
		};

		process.stderr.write = (chunk: Uint8Array | string): boolean => {
			stderrOutput.push(chunk.toString());
			return true;
		};
	});

	afterEach(() => {
		process.stdout.write = originalStdoutWrite;
		process.stderr.write = originalStderrWrite;
	});

	it('should filter logs below active minimum log level', () => {
		const logger = new ConsoleLogger({ level: 'warn', json: true });

		logger.debug('Debug message');
		logger.info('Info message');

		assert.equal(stdoutOutput.length, 0);
		assert.equal(stderrOutput.length, 0);

		logger.warn('Warning message');
		assert.equal(stderrOutput.length, 1);
	});

	it('should emit JSON logs to stdout for info level', () => {
		const logger = new ConsoleLogger({ level: 'info', json: true, timestamp: false });

		logger.error('Database failure', 'Error: Connection Timeout\n at Pool.connect');

		assert.equal(stderrOutput.length, 1);
		const parsed = JSON.parse(stderrOutput[0]!.trim()) as Record<string, unknown>;
		assert.equal(parsed['level'], 'error');
		assert.equal(parsed['message'], 'Database failure');
		assert.equal(parsed['stack'], 'Error: Connection Timeout\n at Pool.connect');
	});

	it('should format human-readable text logs when json option is false', () => {
		const logger = new ConsoleLogger({ level: 'info', json: false, timestamp: false });

		logger.info('Server started');

		assert.equal(stdoutOutput.length, 1);
		assert.ok(stdoutOutput[0]!.includes('[INFO ]'));
		assert.ok(stdoutOutput[0]!.includes('Server started'));
	});
});
