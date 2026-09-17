import { BadRequestError } from '../errors/bad-request.error.js';

/**
 * Safely parses a JSON string into a JavaScript object with strict Prototype Pollution protection.
 *
 * @param jsonString - Raw JSON text payload.
 * @returns Parsed object or primitive value of type T.
 * @throws {BadRequestError} If the JSON string is malformed or invalid.
 */
export function safeJsonParse<T = unknown>(jsonString: string): T {
  if (!jsonString || jsonString.trim() === '') {
    return {} as T;
  }

  try {
    return JSON.parse(jsonString, (key, value) => {
      // Strp malicious object keys
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        return undefined;
      }
      return value;
    }) as T;
  } catch {
    throw new BadRequestError('Invalid or malformed JSON payload');
  }
}
