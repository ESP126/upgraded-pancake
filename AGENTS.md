# AGENTS.md

`@framework/monorepo` — a zero-dependency, modular TypeScript web framework. ESM-only, Node ≥ 22.

## Layout

pnpm workspace with four packages under `packages/*`, each a standalone library:

- `@framework/http` — HTTP server abstraction, request/response, body parsing, streaming
- `@framework/router` — Radix Tree HTTP router
- `@framework/logger` — structured logger + performance diagnostics
- `@framework/di` — dependency injection container (decorators, scopes, graph)

Each package exposes a single entry at `src/index.ts` and builds to `dist/`.

## Commands (run from repo root)

- `pnpm test` — run all tests (57, all passing). Uses `node:test` + `node:assert/strict` via `tsx` with `tsconfig.test.json`.
- `pnpm lint` / `pnpm lint:fix` — ESLint (`typescript-eslint` strict + stylistic).
- `pnpm format` / `pnpm format:check` — Prettier.
- `pnpm build` — build every package with tsup (`pnpm --recursive run build`).
- Build a single package: `pnpm --filter @framework/http build`.

Per package: `build` (tsup → `dist/`) and `clean` (`rimraf dist`).

## Conventions & gotchas

- **ESM + NodeNext resolution**: all imports use explicit `.js` extensions (e.g. `import { X } from './foo.js'`).
- **Tests are co-located** in `src/__tests__/*.spec.ts`. The test `tsconfig.test.json` enables `experimentalDecorators` + `emitDecoratorMetadata`, which the `di` package needs — do not disable those for tests.
- **TypeScript is very strict**: `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noUnusedLocals`/`noUnusedParameters`, `no-explicit-any`. Keep types precise.
- **ESLint rules**: explicit function return types, no `any`, `consistent-type-imports` with `separate-type-imports`.
- **Prettier**: printWidth 100, 2-space tabs, semicolons, single quotes, trailing commas, `arrowParens: always`.
- **Pre-commit (husky)** runs `lint-staged` (Prettier on staged files) then `pnpm test`. Commits will fail if a file is unformatted or a test fails — format and test before committing.
- **pnpm dependency policy** (`pnpm-workspace.yaml`): `allowBuilds` permits `@swc/core`/`esbuild` as deps; `blockExoticSubdeps` + `minimumReleaseAge` enforce peer/dependency hygiene. Add new deps with these constraints in mind.

## Verification order

`format:check` → `lint` → `test` → `build` before finishing work.
