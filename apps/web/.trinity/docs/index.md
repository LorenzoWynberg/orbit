# @orbit/web

The browser converter page of Orbit, built with Vite and shipped to GitHub Pages. It converts between units using `@orbit/core`.

## Rules

- Styles use design tokens only through `var(--…)`; see [Design tokens](rules/design-tokens.md).

## Commands

- `pnpm dev`, `pnpm build`, `pnpm preview`: Vite dev server, build, preview.
- `pnpm typecheck`: `tsc --noEmit`.

## Pages

- [Design tokens](rules/design-tokens.md)
- [Converter](tech-guide/converter/converter.md)
- [Chrome extension build](tech-guide/converter/extension.md)
- [Using the converter](user-guide/converter/using.md)
