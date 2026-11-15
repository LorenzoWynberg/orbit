# Bundling and pack check

## Build

`tsup.config.ts` builds `src/index.ts` to `dist/index.js` (ESM), `dist/index.cjs` (CJS) and declarations. `noExternal: ["@orbit/core"]` inlines the core unit tables, so no output imports `@orbit/core`. The package manifest lists `@orbit/core` only under `devDependencies` and declares it in `trinity.embeds`. Only `dist` is in `files`; `package.json`, `README.md` and `LICENSE` are always packed.

## Pack check

`scripts/pack-check.mjs` runs `pnpm pack`, then:

1. compares the tarball file list to `package.json`, `README.md`, `LICENSE` plus every file under `dist/`, and rejects `src/`, `scripts/` and test files;
2. rejects `@orbit/core` in `dependencies` or `peerDependencies`;
3. installs the tarball offline into a scratch project in the OS temp directory and, from both ESM `import` and CJS `require`, asserts `convert(1, "mi", "km") === 1.609344` and that `convert(1, "xyz", "m")` throws `UnknownUnitError`.

It sets exit code 1 on any failure. Verification status: the script was not run in this story (`pnpm install` failed with a store lock error).
