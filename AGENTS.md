<!-- TRINITY-MANAGED-START -->

## Documentation

`orbit` is a repo of the orbit project. Trinity generates this section from the project packages and rewrites it whenever they change, so write your own notes outside it.

Each package in this repo carries its own `AGENTS.md`, and its documentation starts at:

- `packages/sdk/` (npm): [`packages/sdk/.trinity/docs/index.md`](packages/sdk/.trinity/docs/index.md)
- `apps/cli/` (npm): [`apps/cli/.trinity/docs/index.md`](apps/cli/.trinity/docs/index.md)
- `apps/web/` (GitHub Pages, Chrome Web Store): [`apps/web/.trinity/docs/index.md`](apps/web/.trinity/docs/index.md)

<!-- TRINITY-MANAGED-END -->

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

Every workspace package lives at `packages/<name>/` or `apps/<name>/` with its own `package.json`. Each package or folder declares itself in its own folder (a `trinity` object in its manifest or a `trinity.json`). `.trinity/structure.json` holds only the `builds` discovery globs and declares no package.

## Layering rule

Conversion, the unit set, aliases and the error types are implemented only in `packages/core`. `packages/core` imports no other workspace package. `@orbit/sdk` re-exports core, `@orbit/cli` imports only `@orbit/sdk`, and `@orbit/web` imports `@orbit/core`. No package reimplements conversion, units or errors.

## Tests beside subject

Each test file sits next to the source it tests as `<name>.test.ts`.

## SDK package

`packages/sdk` (`@orbit/sdk`) is re-exports only; tsup inlines `@orbit/core` into `dist`, so core is a devDependency, never a dependency. After `pnpm build`, `pnpm --filter @orbit/sdk pack:check` packs the tarball and imports it over ESM and CJS from a scratch install.

Versions stay `0.0.0`; Trinity's release writes versions and publishes.
