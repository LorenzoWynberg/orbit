# orbit

A pnpm monorepo for unit conversion (length and mass). `packages/core` (`@orbit/core`) holds the units, conversion and errors; later packages build on it.

The package manifests and `pnpm-lock.yaml` are the record of the stack.

## Gate commands

- `pnpm test`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm format:check` (`pnpm format` to fix)
- `pnpm build`

## Discovery rule

Every workspace package lives at `packages/<name>/` or `apps/<name>/` with its own `package.json`, is discovered by the globs in `.trinity/structure.json`, and gets a declaration there when it is added.

## Layering rule

Conversion, the unit set, aliases and the error types are implemented only in `packages/core`. `packages/core` imports no other workspace package. `@orbit/sdk` re-exports core, `@orbit/cli` imports only `@orbit/sdk`, and `@orbit/web` imports `@orbit/core`. No package reimplements conversion, units or errors.

## Tests beside subject

Each test file sits next to the source it tests as `<name>.test.ts`.

Versions stay `0.0.0`; Trinity's release writes versions and publishes.
