# Changelog

## [Unreleased]

### 0.1.1-rc.2

#### Highlights: volume conversion

Orbit now converts volume. It supports **litre** (`L`), **millilitre** (`mL`) and **US gallon** (`gal`), with exact conversion factors: one US gallon is exactly 3.785411784 litres.

##### SDK

`@orbit/sdk` handles volume through the `convert` call you already use, with no change to the API. `convert(1, 'gal', 'L')` returns `3.785411784`.

##### CLI

The `orbit` CLI converts between the new units, for example `orbit 1 gal l --precision 10` prints `3.785411784`. The units appear in `--list` and `--help`. Default precision and output format are unchanged, so existing scripts keep working.

##### Web converter and extension

The web converter (GitHub Pages and the Chrome extension) is unchanged. Volume was kept out of it on purpose, so it still shows only length and mass.

### 0.1.1-rc.1

#### Highlights

**Temperature conversion arrives in the SDK and CLI.** `@orbit/sdk` now converts exactly between celsius, fahrenheit and kelvin. Temperature scales need an offset as well as a scale factor, and the shared core now supports that. `convert(100, "°C", "°F")` returns `212`, and `listUnits("temperature")` lists `°C`, `°F` and `K`. From the terminal, `orbit 100 c f` prints `212`, with `c`, `f` and `k` working like any other unit.

#### Changed

**Readings below absolute zero are rejected.** A temperature strictly below absolute zero in its own unit (below -273.15 °C, below -459.67 °F or below 0 K) is now an error. Exactly absolute zero is still valid. The SDK throws the new `BelowAbsoluteZeroError`, which carries `value`, `unit` and `absoluteZero`. The CLI uses its existing conversion-error exit code `2` for this case, and its other exit codes are unchanged.

#### Unchanged

**Existing conversions and the web converter.** Every length and mass conversion returns exactly the same result as before. The web converter on GitHub Pages and the Chrome extension run on the updated core, but their unit list is pinned. Temperature does not appear there yet, and both work exactly as they did.

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
