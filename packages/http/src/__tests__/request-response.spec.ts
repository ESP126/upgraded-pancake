import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { HttpServer } from '../server/http-server.js';
import { HttpRequest } from '../context/http-request.js';
import { HttpResponse } from '../context/http-response.js';

describe('HttpRequest & HttpResponse Wrappers', () => {
  let server: HttpServer;
  const TEST_PORT = 3892;

  beforeEach(async () => {
    server = new HttpServer(
      (rawReq, rawRes) => {
        const req = new HttpRequest(rawReq);
        const res = new HttpResponse(rawRes);

        if (req.pathname === '/json') {
          res.status(201).header('x-custom-header', 'test-value').json({
            method: req.method,
            queryParam: req.query['search'],
          });
          return;
        }

        res.status(200).send('Hello World');
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

  it('should correctly parse request method, pathname, and query parameters', async () => {
    const response = await new Promise<{
      statusCode: number;
      headers: http.IncomingHttpHeaders;
      body: string;
    }>((resolve, reject) => {
      http.get(`http://127.0.0.1:${TEST_PORT}/json?search=typescript`, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () =>
          resolve({ statusCode: res.statusCode ?? 0, headers: res.headers, body: data }),
        );
        res.on('error', reject);
      });
    });

    assert.equal(response.statusCode, 201);
    assert.equal(response.headers['x-custom-header'], 'test-value');
    assert.equal(response.headers['content-type'], 'application/json; charset=utf-8');

    const parsed = JSON.parse(response.body);
    assert.equal(parsed['method'], 'GET');
    assert.equal(parsed['queryParam'], 'typescript');
  });

  it('should send text responses with default text/plain content-type', async () => {
    const response = await new Promise<{
      statusCode: number;
      headers: http.IncomingHttpHeaders;
      body: string;
    }>(async (resolve, reject) => {
      const req = http.request(
        `http://127.0.0.1:${TEST_PORT}/`,
        {
          method: 'GET',
          agent: false,
          headers: { connection: 'close' },
          timeout: 5000,
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () =>
            resolve({ statusCode: res.statusCode ?? 0, headers: res.headers, body: data }),
          );
          res.on('error', reject);
        },
      );

      req.on('error', reject);
      req.end();
    });

    assert.equal(response.statusCode, 200);
    assert.equal(response.headers['content-type'], 'text/plain; charset=utf-8');
    assert.equal(response.body, 'Hello World');
  });
});
