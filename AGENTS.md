# Repository Guidelines

Zero-dependency modular TypeScript web framework, distributed as a pnpm monorepo (`@framework/*`).

## Project Overview

Framework primitives for building HTTP servers: a Node `http.Server` wrapper, request/response abstractions, body parsing, a radix-tree router, a dependency-injection container, and a structured logger. **Zero runtime dependencies** — every module is hand-rolled over Node's standard library.

## Architecture & Data Flow

### Packages (independent, no inter-dependencies)

- **`@framework/http`** — core HTTP layer. `HttpServer` wraps `node:http.Server`; `HttpRequest`/`HttpResponse` wrap `IncomingMessage`/`ServerResponse`; `BodyParser` + `StreamCollector` handle request bodies; security utilities guard cookies, headers, and payload size.
- **`@framework/di`** — dependency-injection container. `@Injectable`/`@Inject` decorators record metadata into a `WeakMap` engine; `ProviderRegistry` holds providers; `DependencyGraph` builds edges + detects cycles; `Container`/`ScopedContainer` resolve instances by scope.
- **`@framework/router`** — radix-tree router. `RadixNode` is the tree node; `NodeType` classifies edges (STATIC / PARAM / WILDCARD).
- **`@framework/logger`** — structured logger. `ConsoleLogger` implements `ILogger` (JSON/text modes); `AsyncTraceStore` and `PerformanceDiagnostics` provide tracing and metric counters.

**Data flow (request):** `HttpServer.listen()` → `requestHandler(req, res)` → `HttpRequest.parseBody()` routes the stream to `BodyParser` by `Content-Type` → handler returns → `HttpResponse` writes → `HttpServer.close()` drains sockets. The router (`RadixNode`) matches a path to a handler; DI resolves handler dependencies from the `Container`.

### Key modules & responsibilities

| Path                                                         | Responsibility                                                                                                |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| `packages/http/src/server/http-server.ts`                    | `HttpServer`: socket tracking, `listen`/`close`, `getRawServer`, `isRunning`, timeout config                  |
| `packages/http/src/context/http-request.ts`                  | `HttpRequest`: typed wrappers (`method`, `body`, `url`, `query`, `getCookie`, `parseBody`, `getHeader`, `ip`) |
| `packages/http/src/context/http-response.ts`                 | `HttpResponse`: typed `ServerResponse` wrapper                                                                |
| `packages/http/src/parser/body-parser.ts`                    | `BodyParser.parse`: dispatches JSON / urlencoded / text / raw by `Content-Type`                               |
| `packages/http/src/stream/stream-collector.ts`               | `StreamCollector`: chunked reader with `maxBodySize`                                                          |
| `packages/http/src/utils/header-sanitizer.ts`                | `HeaderSanitizer`: CRLF-injection protection                                                                  |
| `packages/http/src/utils/cookie-serializer.ts`               | `CookieSerializer`: HMAC-SHA256 signed cookies                                                                |
| `packages/http/src/errors/*.error.ts`                        | `BadRequestError`, `InvalidHeaderError`, `PayloadTooLargeError`                                               |
| `packages/di/src/decorators/injectable.decorator.ts`         | `@Injectable(options)` — class decorator, scope config                                                        |
| `packages/di/src/decorators/inject.decorator.ts`             | `@Inject(token)` — parameter/property decorator                                                               |
| `packages/di/src/providers/provider-registry.ts`             | `ProviderRegistry`; provider kinds below                                                                      |
| `packages/di/src/graph/dependency-graph.ts`                  | `DependencyGraph`: node map, `getTopologicalOrder`, edge resolution                                           |
| `packages/di/src/graph/circular-dependency-detector.ts`      | `CircularDependencyDetector`: DFS cycle detection                                                             |
| `packages/di/src/container/container.ts`                     | `Container`: root resolver, singleton instantiation, `createScope`                                            |
| `packages/di/src/container/scoped-container.ts`              | `ScopedContainer`: request-scoped + transient resolution                                                      |
| `packages/di/src/metadata/metadata-storage.ts`               | `MetadataStorage`: `WeakMap`-based decorator metadata                                                         |
| `packages/router/src/nodes/radix-node.ts`                    | `RadixNode`: tree insert/lookup, method→handler map                                                           |
| `packages/logger/src/console-logger.ts`                      | `ConsoleLogger`                                                                                               |
| `packages/logger/src/context/trace-store.ts`                 | `AsyncTraceStore`                                                                                             |
| `packages/logger/src/diagnostics/performance-diagnostics.ts` | `PerformanceDiagnostics`                                                                                      |

### Dependency-injection design

- **Providers** (`packages/di/src/providers/provider.interface.ts`): `ClassProvider`, `ValueProvider`, `FactoryProvider`, `ExistingProvider`, `CustomProvider`. Register via `{ provide: token, useClass/useValue/useFactory/useExisting }`.
- **Scopes** (`ScopeOption`): `singleton` (cached, reused), `request` (per-`ScopedContainer`), `transient` (new instance each resolve).
- **Resolution order**: `Container.build()` → `DependencyGraph` maps tokens to nodes and records edges → `CircularDependencyDetector.detect()` (DFS, throws `CircularDependencyError` with the cycle path) → `getTopologicalOrder()` yields instantiation order → `initSingletons()` builds singletons.
- **Metadata**: `@Injectable`/`@Inject` write into `MetadataStorage` `WeakMap`s keyed by `METADATA_KEYS`; `emitDecoratorMetadata` provides the design-time type info the container reads.

## Key Directories

- `packages/{http,di,router,logger}/src` — package source, each rooted at `src/index.ts` (public API).
- `packages/{http,di,router,logger}/src/__tests__` — spec files.
- `packages/{http,di,router,logger}/tsup.config.ts` — per-package build config (extends base).
- `docs/agents` — (currently empty) intended home for AI-agent guidance.

## Development Commands

Run from the repo root. Node ≥22, pnpm ≥12.4.2 (`pnpm-lock.yaml`), `nvmrc`=22.

- `pnpm install` — install. Workspace uses `trustPolicy: no-downgrade`, `blockExoticSubdeps`, `minimumReleaseAge: 10080` (1 year).
- `pnpm lint` / `pnpm lint:fix` — ESLint (`.`; `--fix` autofix).
- `pnpm format` / `pnpm format:check` — Prettier.
- `pnpm test` — run all specs via `tsx --tsconfig tsconfig.test.json --test`.
- `pnpm build` — build every package with `tsup` (`--recursive` inside root build). Per package: `pnpm build` runs `tsup`.
- `pnpm clean` — `rimraf dist` in every package plus root `dist`.

### Package scripts

Each `packages/*` has `build` (`tsup`) and `clean` (`rimraf dist`). Output to `dist/`, published via `exports`/`main`/`module`/`types` → `./dist/index.js` / `./dist/index.d.ts`.

## Code Conventions & Common Patterns

### Formatting

- **Prettier** (`.prettierrc`): `printWidth: 100`, `singleQuote`, `semi`, `trailingComma: "all"`, `arrowParens: "always"`.
- **ESLint**: `typescript-eslint` `strict` + `stylistic` + `eslint-config-prettier`. Hard errors: `explicit-function-return-type`, `no-explicit-any`, `consistent-type-imports` (prefer type imports, `fixStyle: separate-type-imports`). `no-unused-vars` ignores `_`-prefixed names/args.

### TypeScript

- All flags in `tsconfig.base.json`: `target: es2022`, `module`/`moduleResolution: nodenext`, `strict: true` plus `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `strictPropertyInitialization`, `noUnusedLocals`, `noUnusedParameters`, `declaration` + `declarationMap` + `sourceMap`, `isolatedModules`, `esModuleInterop`, `skipLibCheck`.
- **ESM + `nodenext`**: imports/exports must use **`.js` extensions** in `.ts` source (e.g. `import { X } from './foo.js'`). This is enforced at compile and lint time.
- **Decorators** enabled only in `tsconfig.test.json` (`experimentalDecorators` + `emitDecoratorMetadata`), which also sets `noEmit` and `include: packages/**/*.ts`. DI code relies on them. When running/typing tests, use `tsconfig.test.json`, not the base config.

### Error handling

- Prefer typed error classes over thrown plain errors. Existing classes: `ContainerError`, `CircularDependencyError` (DI); `BadRequestError`, `InvalidHeaderError`, `PayloadTooLargeError` (http). New errors: add a dedicated class in the relevant `errors/*.error.ts`, export it from `index.ts`, and reference it in `throws`/`instanceof` sites.

### Async patterns

- HTTP body parsing is async: `HttpRequest.parseBody()` / `BodyParser.parse()` return `Promise`. Handlers await the body before responding.
- `HttpServer.close()` returns a `Promise` that resolves when all tracked sockets are closed (graceful shutdown).

### Dependency injection usage

```ts
import { Container, Injectable, Inject } from '@framework/di';

@Injectable()
class DatabaseService {
  public readonly id = Math.random();
}

@Injectable()
class UserRepository {
  constructor(@Inject(DB_TOKEN) public db: DatabaseService) {}
}

@Injectable()
class UserService {
  @Inject('CONFIG')
  public config!: { appName: string };

  constructor(@Inject(UserRepository) public repo: UserRepository) {}
}

const container = new Container();
container.register({ provide: DB_TOKEN, useClass: DatabaseService });
container.register({ provide: 'CONFIG', useValue: { appName: 'TestFramework' } });
container.register(UserRepository);
container.register(UserService);

const service = container.resolve<UserService>(UserService);
// container.initSingletons(); // optional: pre-build singletons in topological order
```

### Logging

```ts
import { ConsoleLogger } from '@framework/logger';

const logger = new ConsoleLogger({
  level: 'info', // trace | debug | info | warn | error | fatal
  json: true, // default true — structured JSON; set false for text
  timestamp: true, // default true
  defaultContext: { service: 'api' },
});
logger.info('request', { userId: 42 }); // warn+ go to stderr, others to stdout
```

## Important Files

- `packages/*/src/index.ts` — public API surface for each package.
- `tsconfig.base.json` — base compiler options (extend everywhere).
- `tsconfig.test.json` — test config (decorators enabled).
- `tsup.config.base.ts` — shared `baseBuildConfig` used by every package's tsup config.
- `eslint.config.js` — lint rules.
- `pnpm-workspace.yaml` — workspace trust/pinning policy.
- `packages/*/tsup.config.ts` — per-package build (extends `../../tsup.config.base.ts`).

## Runtime/Tooling Preferences

- **Node ≥22**, **pnpm ≥12.4.2** (`packageManager` field pins `pnpm@12.4.2`).
- **ESM only** (`"type": "module"` in root and every package).
- **Zero runtime dependencies** — do not introduce runtime deps; add tooling deps only when required, respecting `blockExoticSubdeps` and `minimumReleaseAge: 10080`.
- `@swc/core` and `esbuild` are allowed builds in `pnpm-workspace.yaml` (`allowBuilds`).

## Testing & QA

- **Framework**: `node:test` (`describe`/`it`) + `node:assert/strict`.
- **File naming**: `*.spec.ts`, colocated in `packages/<pkg>/src/__tests__/`.
- **Runner**: `tsx --tsconfig tsconfig.test.json --test "packages/**/*.spec.ts"` (root `test` script).
- **Real servers**: `http-server.spec.ts` starts a real listening `HttpServer` on a fixed port; close it in `afterEach` (see example below).
- **DI tests**: use `@Injectable`/`@Inject` with `Symbol`/string tokens; assert instance identity for singletons, property injection, and `ContainerError` for unregistered tokens.
- **Test-only config**: `tsconfig.test.json` enables `experimentalDecorators` + `emitDecoratorMetadata` (required for DI).

```ts
import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { HttpServer } from '../server/http-server.js';

describe('HttpServer Wrapper & Socket Lifecycle', () => {
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
      http
        .get(`http://127.0.0.1:${TEST_PORT}`, (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => resolve({ statusCode: res.statusCode ?? 0, body: data }));
          res.on('error', reject);
        })
        .on('error', reject);
    });

    assert.equal(response.statusCode, 200);
    assert.equal((JSON.parse(response.body) as { status: string })['status'], 'ok');
  });
});
```
