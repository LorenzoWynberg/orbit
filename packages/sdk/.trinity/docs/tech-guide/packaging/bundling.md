# Bundling and pack check

## Build

`tsup.config.ts` builds `src/index.ts` to `dist/index.js` (ESM), `dist/index.cjs` (CJS) and declarations. `noExternal: ["@orbit/core"]` inlines the core unit tables, so no output imports `@orbit/core`. The package manifest lists `@orbit/core` only under `devDependencies` and declares it in `trinity.embeds`. Only `dist` is in `files`; `package.json`, `README.md` and `LICENSE` are always packed.

## Pack check

Both `@orbit/sdk` and `@orbit/cli` build `dist` while packing: each sets `"prepack": "pnpm build"`, so `pnpm pack` never produces a tarball without `dist/`.

`scripts/pack-check.mjs` deletes `dist/` first, so `prepack` has to rebuild it. It then runs `pnpm pack` and checks, in this order:

1. every path named by `main`, `module`, `types`, `exports` and `bin` is in the tarball;
2. the tarball file list equals `package.json`, `README.md`, `LICENSE` plus every file under the freshly built `dist/`;
3. no `src/`, `scripts/` or test files are packed;
4. `@orbit/core` is not in `dependencies` or `peerDependencies`;
5. the tarball installs offline into a scratch project in the OS temp directory and, from both ESM `import` and CJS `require`, asserts `convert(1, "mi", "km") === 1.609344` and that `convert(1, "xyz", "m")` throws `UnknownUnitError`.

It sets exit code 1 on any failure. `apps/cli/scripts/pack-check.mjs` follows the same flow (delete `dist/`, pack, manifest entry points, file list), but packs the sdk and the cli and runs the installed `orbit` bin instead of importing the library.
