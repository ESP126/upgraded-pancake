import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CookieSerializer } from '../utils/cookie-serializer.js';

describe('CookieSerializer &  Cryptographic Signatures', () => {
  const SECRET = 'super-secret-key-123';

  it('should serialize cookit with default HttpOnly, Path, and SameSite attributes', () => {
    const serialized = CookieSerializer.serialize('session_id', 'abc123xyz');

    assert.ok(serialized.includes('session_id=abc123xyz'));
    assert.ok(serialized.includes('Path=/'));
    assert.ok(serialized.includes('HttpOnly'));
    assert.ok(serialized.includes('SameSite=Lax'));
  });

  it('should sign an unsign cookie values correctly', () => {
    const rawValue = 'user-session-999';
    const signedValue = CookieSerializer.sign(rawValue, SECRET);

    assert.ok(signedValue.startsWith('s:user-session-999.'));

    const unsignedValue = CookieSerializer.unsign(signedValue, SECRET);
    assert.equal(unsignedValue, rawValue);
  });

  it('should reject tampered signed cookies and return false', () => {
    const rawValue = 'user-session-999';
    const signedValue = CookieSerializer.sign(rawValue, SECRET);

    const tamperedValue = signedValue.replace('999', '888');

    const result = CookieSerializer.unsign(tamperedValue, SECRET);
    assert.equal(result, false);
  });

  it('should parse raw Cookie header string into key-value map and using signed cookies', () => {
    const signedSession = CookieSerializer.sign('valid-session', SECRET);
    const rawCookieHeader = `theme=dark; session=${signedSession}; user=JohnDoe`;

    const parsed = CookieSerializer.parse(rawCookieHeader, SECRET);

    assert.equal(parsed['theme'], 'dark');
    assert.equal(parsed['session'], 'valid-session');
    assert.equal(parsed['user'], 'JohnDoe');
  });
});
