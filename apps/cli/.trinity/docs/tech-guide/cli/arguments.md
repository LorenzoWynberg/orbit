# Argument handling

`src/main.ts` exports `main(argv, io)`. It splits arguments, parses them with `node:util` `parseArgs` (strict), then converts with `convert` from `@orbit/sdk`.

- A negative number is lifted out before `parseArgs` (which would read it as an option), but only in the leading value slot. `km -5 mi` or `5 -3 km` is a usage error.
- `--precision`/`-p` takes an integer 1 to 21 (default 6); the result is rounded with `toPrecision` and printed as a plain number.
- `--list [length|mass]` prints units per dimension via `listUnits`.
- `UsageError` maps to exit 1 with a hint to run `orbit --help`. `UnknownUnitError`, `IncompatibleDimensionError` and a non-finite result (for example `1e308 km mm`) map to exit 2. Other errors propagate to Node.
