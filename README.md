# orbit

A unit-conversion toolkit (length and mass): a TypeScript SDK, a small web converter and a CLI, all built on one verified core, `@orbit/core`.

## Gate

Node.js 22 (`.nvmrc`) and pnpm. After `pnpm install`:

- `pnpm test` — Vitest, run once
- `pnpm typecheck` — `tsc --noEmit` in every package
- `pnpm lint` — ESLint
- `pnpm format:check` — Prettier check (`pnpm format` writes)
- `pnpm build` — builds every package that has a `build` script

## Deployment

The web converter deploys to GitHub Pages on every push to `main` through `.github/workflows/pages.yml`. The repository's Pages source (Settings → Pages) must be set to **GitHub Actions**.

## License

MIT

## Deploy

`@orbit/web` is published to GitHub Pages by `.github/workflows/pages.yml` on every push to `main`.
