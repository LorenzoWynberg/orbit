# Changelog

## 0.1.1 - 2026-11-15

### Highlights

This release makes the SDK and CLI packages ready to publish to npm.

### Fixed

The `@orbit/sdk` and CLI tarballs now include their compiled `dist/` output. An earlier attempt to publish `@orbit/sdk@0.1.0` failed because the tarball had no `dist/` folder: nothing built it during `pnpm pack`. Each package now builds its own `dist/` as part of packing, so a fresh clone produces a complete, installable tarball.

### Improved

The pre-publish tarball check now starts with no `dist/` folder on disk and fails if any entry point the manifest declares is missing from the tarball. Before, it passed only because an earlier build had left `dist/` in place. A package that would install without its code is now caught before it reaches the registry.

## 0.1.0 - 2026-11-15

### Highlights

This is orbit's first release: one length and mass conversion engine, available four ways. Use it as a TypeScript library, as a command-line tool, as a web page, or as a Chrome extension.

### New

**A verified conversion core.** Every orbit product reads its units, conversion logic and error rules from one engine, checked by golden tests. All four products give the same answers.

**`@orbit/sdk` on npm.** Call `convert(value, from, to)` from TypeScript. The engine ships inside the package, and the packed tarball is installed in a clean location outside the workspace to check that it works on its own.

**`@orbit/cli` on npm.** `orbit 5 km mi` prints only the number, so you can pipe it into other tools. `--precision` sets decimal places and `--list` shows every supported unit. Exit codes are `0` for success, `1` for a usage error and `2` for a conversion error.

**A live web converter.** Results update as you type, and the URL keeps the value and both units, so any link reproduces the conversion. It is the first screen in the Orbit design system's Instrument theme. Each release on `main` publishes it to GitHub Pages; `dev` and pull requests never do.

**A Chrome extension.** The same converter runs as a toolbar popup with the same code and styling. The build produces a zip ready for Chrome Web Store review.

### Improved

The web converter's dev server now starts on the port given in the `PORT` environment variable. Before, it ignored `PORT` and always started on 5173.
