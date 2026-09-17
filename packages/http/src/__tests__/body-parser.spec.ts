import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { safeJsonParse } from '../parser/safe-json-parse.js';
import { parseUrlEncoded } from '../parser/url-encoded-parse.js';
import { BodyParser } from '../parser/body-parser.js';
import { BadRequestError } from '../errors/bad-request.error.js';

describe('BodyParser & Security Protections', () => {
  it('should safely parse JSON and remove prototype pollution keys (__proto__, constructor)', () => {
    const maliciousJson =
      '{"title":"Clean","__proto__":{"polluted":true},"constructor":{"prototype":{"admin":true}}}';

    const result = safeJsonParse<Record<string, unknown>>(maliciousJson);

    assert.equal(result['title'], 'Clean');
    assert.equal((Object.prototype as Record<string, unknown>)['polluted'], undefined);
    assert.equal((Object.prototype as Record<string, unknown>)['admin'], undefined);
  });

  it('should throw BadRequestError on invalid JSON input', () => {
    const malformedJson = '{"title": InvalidJSON}';

    assert.throws(
      () => {
        safeJsonParse(malformedJson);
      },
      (err: unknown) => {
        assert.ok(err instanceof BadRequestError);
        assert.equal(err.statusCode, 400);
        return true;
      },
    );
  });

  it('should safely parse x-www-form-urlencoded payloads without prototype pollution', () => {
    const formString = 'name=John&age=30&__proto__[polluted]=true';

    const result = parseUrlEncoded(formString);

    assert.equal(result['name'], 'John');
    assert.equal(result['age'], '30');
    assert.equal((Object.prototype as Record<string, unknown>)['polluted'], undefined);
  });

  it('should automatically parse JSON body when Content-Type is application/json', async () => {
    const jsonStream = Readable.from([
      Buffer.from(JSON.stringify({ active: true, role: 'admin' })),
    ]);

    const result = (await BodyParser.parse(jsonStream, 'application/json')) as Record<
      string,
      unknown
    >;

    assert.equal(result['active'], true);
    assert.equal(result['role'], 'admin');
  });

  it('should parse text bodies when Content-Type is text/plain', async () => {
    const textStream = Readable.from([Buffer.from('Hello plain text')]);

    const result = await BodyParser.parse(textStream, 'text/plain; charset=utf-8');

    assert.equal(result, 'Hello plain text');
  });
});
