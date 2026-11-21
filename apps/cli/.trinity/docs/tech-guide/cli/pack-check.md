# Pack check and `check:pack`

The repo root script `pnpm check:pack` runs `pnpm --filter @orbit/sdk pack:check` and then `pnpm --filter @orbit/cli pack:check`; the second only runs if the first passes.

`apps/cli/scripts/pack-check.mjs` packs both tarballs and verifies, besides the file list equalling the built `dist`:

- no `src/`, `scripts/` or `.test.` files are packed;
- no `dependencies`, `peerDependencies` or `optionalDependencies` entry in the cli manifest still starts with `workspace:`;
- the cli's `@orbit/sdk` dependency equals the packed sdk's own version;
- both tarballs install into a scratch project outside the workspace, where the installed `orbit` bin runs:
  - `orbit 100 c f` prints 212;
  - `orbit 100 kmh mph --json` exits 0 and prints JSON with `value` 100, `from` `kmh`, `to` `mph`, `result` 62.1371;
  - `orbit 5 km kg --json` exits 2 with empty stdout and a JSON object with a string `error` on stderr;
  - `orbit 5 km kg` exits 2 with empty stdout and a message on stderr.

Any failure sets exit code 1.
