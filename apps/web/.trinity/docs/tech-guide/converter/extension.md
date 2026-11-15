# Chrome extension build

The converter page is also built as a Chrome MV3 popup for the Web Store.

- `public/manifest.json` declares manifest version 3, the popup `index.html` as the action, and 16/48/128 px icons under `public/icons/`.
- `vite.config.ts` switches on mode: the default build uses base `/orbit/` for GitHub Pages; `--mode extension` uses base `./` and writes to `dist-extension`, so the popup loads assets by relative URL.
- `pnpm build:extension` runs that Vite build.
- `pnpm zip:extension` runs `scripts/zip-extension.mjs`: it builds in extension mode, exits 1 if `dist-extension/manifest.json` is missing, then zips the folder with `fflate` into `orbit-chrome-extension.zip`.
- The script calls `pnpm` through `execFileSync`, which does not work on Windows (unverified there).
- `dist-extension` is ignored by ESLint, Prettier and git.
