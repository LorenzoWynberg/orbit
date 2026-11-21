# @orbit/cli

The `orbit` command: converts length, mass, temperature and volume units from the terminal using `@orbit/sdk`. Published to npm as `@orbit/cli`; the binary is `dist/bin.js`.

## Rules for every change

- Conversion output on stdout is a bare number; see [Output and exit codes](rules/output-contract.md).

## Commands

- `pnpm build` (tsup), `pnpm typecheck` (tsc --noEmit), `pnpm pack:check` (verifies the packed tarball); tests run with the repo's vitest config.

## Pages

- [Output and exit codes](rules/output-contract.md)
- [Argument handling](tech-guide/cli/arguments.md)
- [Pack check and check:pack](tech-guide/cli/pack-check.md)
- [Using orbit](user-guide/usage/commands.md)
