import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { HttpServer, HttpResponse, HeaderSanitizer, InvalidHeaderError } from '../index.js';

describe('HeaderSanitizer & CRLF Protection', () => {
  let server: HttpServer;
  const TEST_PORT = 3893;

  beforeEach(async () => {
    server = new HttpServer(
      (_req, rawRes) => {
        const res = new HttpResponse(rawRes);
        res.header('X-Clean-Header', 'Value\r\nInjected-Header: malicious');
        res.send('OK');
      },
      { port: TEST_PORT, host: '127.0.0.1' },
    );

    await server.listen();
  });

  afterEach(async () => {
    if (server && server.isRunning()) {
      await server.close();
    }
  });

  it('should strip CRLF characters (\\r\\n) from header values', () => {
    const maliciousValue = 'Bearer token123\r\nX-Injected: true\n';
    const cleanValue = HeaderSanitizer.sanitizeValue(maliciousValue);

    assert.equal(cleanValue, 'Bearer token123X-Injected: true');
  });

  it('should throw InvalidHeaderError if header name contains illegal control characters or spaces', () => {
    assert.throws(
      () => {
        HeaderSanitizer.validateName('Bad Header Name');
      },
      (err: unknown) => {
        assert.ok(err instanceof InvalidHeaderError);
        return true;
      },
    );

    assert.throws(
      () => {
        HeaderSanitizer.validateName('Header\r\nName');
      },
      (err: unknown) => {
        assert.ok(err instanceof InvalidHeaderError);
        return true;
      },
    );
  });

  it('should prevent HTTP Response Splitting when sending headers through HttpResponse', async () => {
    const response = await new Promise<{ statusCode: number; headers: http.IncomingHttpHeaders }>(
      (resolve, reject) => {
        http.get(`http://127.0.0.1:${TEST_PORT}/`, (res) => {
          resolve({ statusCode: res.statusCode ?? 0, headers: res.headers });
          res.on('error', reject);
        });
      },
    );

    assert.equal(response.statusCode, 200);
    assert.equal(response.headers['x-clean-header'], 'ValueInjected-Header: malicious');
    assert.equal(response.headers['injected-header'], undefined);
  });
});
