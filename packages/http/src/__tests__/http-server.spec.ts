import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { HttpServer } from '../index.js';

describe('HttpServer Wrapper & Socker Lifecycle', () => {
  let server: HttpServer;
  const TEST_PORT = 3891;

  beforeEach(() => {
    server = new HttpServer(
      (_req, res) => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok' }));
      },
      { port: TEST_PORT, host: '127.0.0.1' },
    );
  });

  afterEach(async () => {
    if (server && server.isRunning()) {
      await server.close();
    }
  });

  it('should start listening and process HTTP requests', async () => {
    await server.listen();
    assert.equal(server.isRunning(), true);

    const response = await new Promise<{ statusCode: number; body: string }>((resolve, reject) => {
      http.get(`http://127.0.0.1:${TEST_PORT}`, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve({ statusCode: res.statusCode ?? 0, body: data }));
        res.on('error', reject);
      });
    });

    assert.equal(response.statusCode, 200);
    const parsed = JSON.parse(response.body) as Record<string, unknown>;
    assert.equal(parsed['status'], 'ok');
  });

  it('should perform a graceful shutdown and close active sockets', async () => {
    await server.listen();
    assert.equal(server.isRunning(), true);

    await server.close();
    assert.equal(server.isRunning(), false);
  });
});
