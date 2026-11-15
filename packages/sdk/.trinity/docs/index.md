# @orbit/sdk

Unit conversion (length and mass) for TypeScript and JavaScript, published to npm as a library with ESM, CJS and type output.

## Commands

- `pnpm build`: bundle `src/index.ts` with tsup into `dist/`
- `pnpm typecheck`: `tsc --noEmit`
- `pnpm pack:check`: verify the packed tarball (run after a build)

## Rules

- `@orbit/core` is a dev dependency inlined into the bundle; it never appears in the published `dependencies` or `peerDependencies`.

## Guide

- [Bundling and pack check](tech-guide/packaging/bundling.md)
