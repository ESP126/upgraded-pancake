# AGENTS.md

`@framework/monorepo` — a zero-dependency, modular TypeScript web framework. ESM-only, Node ≥ 22.

## Layout

pnpm workspace with four independent packages under `packages/*` (no inter-dependencies), each a standalone library rooted at `src/index.ts` (public API) and building to `dist/`:

- `@framework/http` — HTTP server abstraction: `HttpServer` wraps `node:http.Server`; `HttpRequest`/`HttpResponse` wrap the streams; `BodyParser` + `StreamCollector` handle bodies; security utilities guard cookies, headers, and payload size.
- `@framework/di` — DI container. `@Injectable`/`@Inject` record metadata into a `WeakMap` engine (`MetadataStorage`, keyed by `METADATA_KEYS`); `ProviderRegistry` holds providers; `DependencyGraph` builds edges + detects cycles; `Container`/`ScopedContainer` resolve by scope.
- `@framework/router` — radix-tree router. `RadixNode` is the tree node; `NodeType` classifies edges (`STATIC` / `PARAM` / `WILDCARD`).
- `@framework/logger` — structured logger. `ConsoleLogger` implements `ILogger` (JSON/text modes); `AsyncTraceStore` + `PerformanceDiagnostics` provide tracing and metric counters.

**Data flow (request):** `HttpServer.listen()` → `requestHandler(req, res)` → `HttpRequest.parseBody()` routes the stream to `BodyParser` by `Content-Type` → handler returns → `HttpResponse` writes → `HttpServer.close()` drains sockets. The router matches a path to a handler; DI resolves handler deps from the `Container`.

### Key modules

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

### DI specifics

- **Providers** (`provider.interface.ts`): `ClassProvider`, `ValueProvider`, `FactoryProvider`, `ExistingProvider`, `CustomProvider`. Register via `{ provide: token, useClass/useValue/useFactory/useExisting }`.
- **Scopes** (`ScopeOption`): `singleton` (cached/reused), `request` (per-`ScopedContainer`), `transient` (new instance each resolve).
- **Resolution order**: `Container.build()` → `DependencyGraph` maps tokens to nodes + records edges → `CircularDependencyDetector.detect()` (DFS, throws `CircularDependencyError` with the cycle path) → `getTopologicalOrder()` → `initSingletons()` builds singletons.
- `@Injectable`/`@Inject` write into `MetadataStorage` `WeakMap`s; `emitDecoratorMetadata` supplies the design-time type info the container reads.

## Commands (repo root)

Node ≥ 22, pnpm ≥ 12.4.2 (`packageManager` pins `pnpm@12.4.2`).

- `pnpm test` — all specs (via `tsx --tsconfig tsconfig.test.json --test`). Uses `node:test` + `node:assert/strict`.
- `pnpm lint` / `pnpm lint:fix` — ESLint (`.`; `--fix` autofix).
- `pnpm format` / `pnpm format:check` — Prettier.
- `pnpm build` — build every package with tsup (`pnpm --recursive run build`). Single package: `pnpm --filter @framework/http build`.
- `pnpm clean` — `rimraf dist` across every package + root.

Per package: `build` (`tsup`, config extends `../../tsup.config.base.ts`) and `clean` (`rimraf dist`). Publishes via `exports`/`main`/`module`/`types` → `./dist/index.js` / `./dist/index.d.ts`.

## Conventions & gotchas

- **ESM + NodeNext**: imports/exports must use explicit `.js` extensions in `.ts` source (e.g. `import { X } from './foo.js'`). Enforced at compile and lint time.
- **Test-only config**: `tsconfig.test.json` enables `experimentalDecorators` + `emitDecoratorMetadata` (required for DI), sets `noEmit`, and `include: packages/**/*.ts`. Use it when running/typing tests — the base config lacks these.
- **Strict TypeScript**: `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `strictPropertyInitialization`, `noUnusedLocals`/`noUnusedParameters`, `declaration` + `declarationMap` + `sourceMap`, `isolatedModules`, `esModuleInterop`, `skipLibCheck`.
- **ESLint hard errors**: explicit function return types, no `any`, `consistent-type-imports` (type imports, `separate-type-imports`); `no-unused-vars` ignores `_`-prefixed names/args.
- **Prettier**: `printWidth: 100`, 2-space tabs, semicolons, single quotes, `trailingComma: "all"`, `arrowParens: "always"`.
- **Pre-commit (husky)** runs `lint-staged` (Prettier on staged files) then `pnpm test`. Commits fail on unformatted files or failing tests — format and test before committing.
- **Zero runtime dependencies**: hand-roll over Node's stdlib. Add tooling deps only when required, respecting `blockExoticSubdeps` + `minimumReleaseAge: 10080` (1 year). `@swc/core` and `esbuild` are allowed builds (`allowBuilds` in `pnpm-workspace.yaml`).

## Patterns

- **Error handling**: prefer typed error classes. New errors: add a class in the relevant `errors/*.error.ts`, export from `index.ts`, reference in `throws`/`instanceof` sites.
- **Async**: `HttpRequest.parseBody()` / `BodyParser.parse()` return `Promise`; handlers await the body before responding. `HttpServer.close()` returns a `Promise` resolving when all tracked sockets close (graceful shutdown).
- **Testing**: `*.spec.ts` colocated in `packages/<pkg>/src/__tests__/`. Real-server tests (e.g. `http-server.spec.ts`) start a listening `HttpServer` on a fixed port and close it in `afterEach`.

```ts
import { Container, Injectable, Inject } from '@framework/di';

@Injectable()
class DatabaseService {
  public readonly id = Math.random();
}

@Injectable()
class UserRepository {
  constructor(@Inject(Symbol('DB')) public db: DatabaseService) {}
}

const container = new Container();
container.register({ provide: Symbol('DB'), useClass: DatabaseService });
container.register(UserRepository);
const repo = container.resolve<UserRepository>(Symbol('DB'));
```

```ts
import { ConsoleLogger } from '@framework/logger';

const logger = new ConsoleLogger({
  level: 'info', // trace | debug | info | warn | error | fatal | off
  json: true, // structured JSON; set false for text
  defaultContext: { service: 'api' },
});
logger.info('request', { userId: 42 });
```

## Verification order

`format:check` → `lint` → `test` → `build` before finishing work.
