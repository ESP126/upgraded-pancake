/**
 * Safely parses x-www-form-urlencoded payload strings with Prototype Pollution protection.
 *
 * @param bodyString - Form encoded string (e.g., 'name=John&age=30').
 * @return Key-value dictionary object.
 */
export function parseUrlEncoded(bodyString: string): Record<string, string> {
  const result: Record<string, string> = Object.create(null);

  if (!bodyString || bodyString.trim() === '') {
    return result;
  }

  const searchParams = new URLSearchParams(bodyString);
  searchParams.forEach((value, key) => {
    // Prototype Pollution Prevention
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      return;
    }
    result[key] = value;
  });

  return result;
}
