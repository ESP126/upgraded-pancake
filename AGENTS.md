# Repository Guidelines

## Project Overview

**Hades** (`@framework/monorepo`) is a zero-dependency modular TypeScript web framework built on top of Node.js native APIs. It provides high-performance HTTP server abstractions, dependency injection, and structured logging without external runtime dependencies.

The project follows a monorepo structure with three independent packages:

- `@framework/http` - HTTP server abstraction
- `@framework/di` - Dependency injection container
- `@framework/logger` - Structured logger

## Architecture & Data Flow

### High-Level Structure

```
packages/
├── http/          # HTTP server wrapper (Node:http native)
│   ├── src/
│   │   ├── server/http-server.ts        # Core server class with socket tracking
│   │   ├── context/                      # Request/Response wrappers
│   │   │   ├── http-request.ts           # Typed HTTP request abstraction
│   │   │   └── http-response.ts          # Fluent response builder
│   │   ├── parser/                       # Body parsing (JSON, URL-encoded)
│   │   ├── stream/stream-collector.ts    # Stream body collection
│   │   ├── errors/                       # Custom HTTP errors
│   │   ├── types/                        # Server options, request handlers
│   │   └── utils/                        # Header sanitization
│   └── __tests__/                         # Native node:test specs
│
├── di/            # Dependency injection container
│   ├── src/
│   │   ├── container/                     # Core Container & ScopedContainer
│   │   ├── graph/                         # Dependency graph + topological sort
│   │   ├── providers/                     # Provider types (class/value/factory)
│   │   ├── decorators/                    # @Injectable, @Inject decorators
│   │   ├── scopes/                        # Singleton & Request scope managers
│   │   ├── metadata/                      # Runtime metadata storage
│   │   ├── errors/                        # DI-specific errors
│   │   └── types/                         # InjectionToken, provider interfaces
│   └── __tests__/                         # DI container specs
│
└── logger/        # Structured logging utilities
    ├── src/
    │   ├── console-logger.ts              # Console output formatter
    │   ├── context/trace-store.ts         # Trace context propagation
    │   ├── diagnostics/                   # Performance metrics collection
    │   ├── interfaces/                    # ILogger interface
    │   └── types/                         # LogLevel, logger options
    └── __tests__/                         # Logger specs
```

### Key Modules & Data Flow

#### HTTP Module

- **HttpServer**: Wraps Node's native `http.Server`, tracks active sockets for graceful shutdown
- **HttpRequest**: Typed wrapper over `IncomingMessage` with body parsing (`parseBody()`)
- **HttpResponse**: Fluent API builder pattern for status, headers, and body serialization
- **BodyParser**: Parses JSON and URL-encoded request bodies with prototype pollution guards
- **StreamCollector**: Buffers streaming request bodies within size limits

#### DI Module

- **Container**: Core DI container supporting three lifetimes: `singleton`, `request`, `transient`
- **ScopedContainer**: Request-scoped child container for per-request dependency resolution
- **ProviderRegistry**: Normalizes constructor classes and provider objects
- **DependencyGraph**: Builds topological sort of dependencies for correct instantiation order
- **Decorators**: `@Injectable()` marks classes for DI; `@Inject()` resolves tokens

#### Logger Module

- **ConsoleLogger**: Formatted console output with ANSI color support
- **TraceContext**: Propagates trace IDs across async boundaries
- **PerformanceDiagnostics**: Collects latency metrics for performance monitoring
  \

### Package Interactions

```
┌─────────────┐     ┌──────────────┐
│   http      │◄───►│    di        │
└─────────────┘     └──────┬───────┘
                           │
                     ┌─────▼─────┐
                     │  logger   │
                     └───────────┘
```

- HTTP module uses DI for service injection (e.g., middleware, body parsers)
- Logger module provides structured logging for all packages
- All packages are zero-dependency on each other except for Node.js built-ins

## Key Directories

| Directory                      | Purpose                                         |
| ------------------------------ | ----------------------------------------------- |
| `packages/http/src/`           | HTTP server implementation and utilities        |
| `packages/di/src/container/`   | Core DI container with singleton/request scopes |
| `packages/di/src/graph/`       | Dependency graph for topological resolution     |
| `packages/di/src/providers/`   | Provider type definitions and registry          |
| `packages/di/src/decorators/`  | Injectable/Inject decorators                    |
| `packages/logger/src/context/` | Trace context propagation utilities             |
| `packages/http/src/parser/`    | Request body parsing (JSON, form)               |

## Development Commands

```bash
# Build all packages
pnpm build

# Run tests (uses native node:test via tsx)
pnpm test

# Watch mode for tests
pnpm test:watch

# Lint codebase
pnpm lint

# Auto-fix lint issues
pnpm lint:fix

# Format with Prettier
pnpm format

# Clean build artifacts
pnpm clean
```

## Code Conventions & Common Patterns

### TypeScript Configuration

- **Target**: ES2022
- **Module**: `nodenext` with `moduleResolution: nodenext`
- **Strict Mode**: Full strict mode enabled (`strict: true`)
- **Key Options**:
  - `noImplicitAny: true`
  - `strictNullChecks: true`
  - `noUncheckedIndexedAccess: true`
  - `exactOptionalPropertyTypes: true`
  - `declaration: true` (generates .d.ts files)

### Naming Patterns

**Classes**: PascalCase with descriptive purpose

```typescript
export class HttpServer { ... }
export class HttpRequest { ... }
export class Container { ... }
export class ScopedContainer { ... }
```

**Functions/Methods**: camelCase

```typescript
public listen(port?: number, host?: string): Promise<void>
public resolve<T>(token: InjectionToken<T>): T
public parseBody<T = unknown>(options?: StreamCollectorOptions): Promise<T>
```

**Types/Interfaces**: PascalCase

```typescript
export type { HttpServerOptions, RequestHandler }
export interface ILogger { ... }
export type Provider<T> = ...
```

**Constants/Enums**: UPPER_SNAKE_CASE

```typescript
export enum LogLevel {
  DEBUG,
  INFO,
  WARN,
  ERROR,
}
export const METADATA_KEYS = { INJECTABLE: Symbol('injectable') };
```

### Error Handling

Custom error classes extend native `Error` with specific error types:

- HTTP: `BadRequestError`, `PayloadTooLargeError`, `InvalidHeaderError`
- DI: `CircularDependencyError`, `ContainerError`

All errors have descriptive message templates and no internal state mutation.

### Async Patterns

**Promise-based APIs**: All async operations return `Promise<T>`

```typescript
public listen(port?: number, host?: string): Promise<void>
public close(): Promise<void>
public parseBody<T = unknown>(options?: StreamCollectorOptions): Promise<T>
```

**Fluent API Pattern**: Response builder returns `this` for chaining

```typescript
public status(code: number): this { ... }
public header(name: string, value: string | string[]): this { ... }
public json(data: unknown): void { ... }
```

### Dependency Injection Patterns

**Lifetime Scopes**:

- `singleton`: Single instance per container (default)
- `request`: New instance per `ScopedContainer` (per HTTP request)
- `transient`: Always new instance on resolution

**Provider Types**:

```typescript
// Class provider (auto-wraps constructor)
register(MyService);

// Factory provider
register({ provide: MyService, useFactory: () => createService() });

// Value provider
register({ provide: Config, useValue: { port: 3000 } });
```

**Decorators**:

```typescript
@Injectable({ scope: 'singleton' })
export class DatabaseService { ... }

@Injectable({ scope: 'request' })
export class RequestHandler { ... }
```

### Module Pattern

Each package exports from `index.ts` using ES module syntax:

```typescript
// packages/http/src/index.ts
export { HttpServer } from './server/http-server.js';
export type { HttpServerOptions, RequestHandler } from './types/server-options.js';
export { HttpRequest } from './context/http-request.js';
```

## Important Files

| File                                                 | Purpose                                  |
| ---------------------------------------------------- | ---------------------------------------- |
| `package.json`                                       | Root monorepo config, build/test scripts |
| `tsconfig.base.json`                                 | Shared TypeScript configuration          |
| `packages/http/src/index.ts`                         | HTTP module entry point                  |
| `packages/di/src/container/container.ts`             | Core DI container implementation         |
| `packages/di/src/decorators/injectable.decorator.ts` | Injectable decorator                     |
| `packages/logger/src/index.ts`                       | Logger module exports                    |

## Runtime/Tooling Preferences

### Required Runtime

- **Node.js**: `>=22` (required for native test runner)
- **pnpm**: `>=12.4.2` (monorepo package manager)

### Package Manager

- **pnpm** exclusively (configured in root `package.json`)

### Tooling Stack

| Tool       | Purpose                                   |
| ---------- | ----------------------------------------- |
| `tsx`      | TypeScript execution + native test runner |
| `tsup`     | Build tool (zero-config TypeScript → JS)  |
| `eslint`   | Linting with TypeScript support           |
| `prettier` | Code formatting                           |

### No External Dependencies

- All packages are **zero-dependency** on external npm packages
- Only use Node.js built-in modules and peer dependencies from workspace
- Build tools (`tsup`, `tsx`) are devDependencies only

## Testing & QA

### Test Framework

- **Native Node.js test runner** (`node:test`) via `tsx`
- No external testing frameworks (Jest, Vitest, etc.)
- Assertions via `node:assert/strict`

### Test Organization

```
packages/<name>/src/__tests__/
├── module-name.spec.ts
└── integration.spec.ts
```

### Running Tests

```bash
# Run all tests
pnpm test

# Watch mode with auto-reload
pnpm test:watch

# Target specific package tests
tsx --test packages/http/src/__tests__/*.spec.ts
```

### Test Patterns

- **Unit tests**: Isolated function/class behavior
- **Integration tests**: Real HTTP server with mocked handlers
- **Decorator tests**: Metadata validation and reflection
- **Error handling**: Exception coverage in error paths

### Coverage Expectations

- Core classes: 95%+ line coverage
- Public APIs: 100% coverage
- Edge cases: All error conditions tested
- Performance: Critical paths have timing assertions

## Package Exports

### @framework/http

```typescript
// Server & Options
export { HttpServer } from './server/http-server.js';
export type { HttpServerOptions, RequestHandler } from './types/server-options.js';

// Request/Response
export { HttpRequest } from './context/http-request.js';
export { HttpResponse } from './context/http-response.js';

// Body Parsing
export { StreamCollector } from './stream/stream-collector.js';
export type { StreamCollectorOptions } from './stream/stream-collector.js';
export { BodyParser } from './parser/body-parser.js';
export { safeJsonParse } from './parser/safe-json-parse.js';
export { parseUrlEncoded } from './parser/url-encoded-parse.js';

// Errors
export { PayloadTooLargeError } from './errors/payload-too-large.error.js';
export { BadRequestError } from './errors/bad-request.error.js';
export { InvalidHeaderError } from './errors/invalid-header.error.js';

// Utilities
export { HeaderSanitizer } from './utils/header-sanitizer.js';
```

### @framework/di

```typescript
// Core Container
export { Container } from './container/container.js';
export { ScopedContainer } from './container/scoped-container.js';

// Providers
export { ProviderRegistry } from './providers/provider-registry.js';
export type {
  Provider,
  ClassProvider,
  ValueProvider,
  FactoryProvider,
} from './providers/provider.interface.js';

// Decorators
export { Injectable } from './decorators/injectable.decorator.js';
export { Inject } from './decorators/inject.decorator.js';

// Graph & Resolution
export { DependencyGraph } from './graph/dependency-graph.js';
export { CircularDependencyDetector } from './graph/circular-dependency-detector.js';

// Types
export type { InjectionToken, Newable } from './types/injection-token.js';
export type { InjectableOptions, ScopeOption } from './types/injectable-options.js';
```

### @framework/logger

```typescript
// Logger Instance
export { ConsoleLogger } from './console-logger.js';

// Levels
export { LogLevel, LOG_LEVEL_VALUES } from './types/log-level.js';

// Trace Context
export { AsyncTraceStore } from './context/trace-store.js';
export type { TraceContext } from './context/trace-context.interface.js';

// Diagnostics
export { PerformanceDiagnostics } from './diagnostics/performance-diagnostics.js';
export type { PerformanceMetricResult } from './diagnostics/performance-metric.interface.js';
```

## Quick Start Example

```typescript
import { HttpServer, HttpRequest, HttpResponse } from '@framework/http';
import { Container, Injectable } from '@framework/di';
import { ConsoleLogger, LogLevel } from '@framework/logger';

@Injectable()
class DatabaseService {
  constructor(@Inject('config') private config: { port: number }) {}
}

@Injectable({ scope: 'request' })
class RequestHandler {
  constructor(
    @Inject(DatabaseService) private db: DatabaseService,
    @Inject(ConsoleLogger) private logger: ConsoleLogger,
  ) {}

  handle(req: HttpRequest): HttpResponse {
    const response = new HttpResponse(req.rawResponse);
    response.json({ message: 'Hello' });
    return response;
  }
}

const container = new Container();
container.register([DatabaseService, RequestHandler]);
container.build();

const server = new HttpServer((req) => new RequestHandler().handle(req), {
  port: 3000,
});

await server.listen(3000);
```
