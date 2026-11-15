# Using orbit

```
orbit <value> <from> <to> [--precision <n>] [--json]
orbit --list [length|mass|temperature|volume]
orbit --help
```

```
$ orbit 5 km mi
3.10686
$ orbit 12 in cm --precision 3
30.5
$ orbit 100 c f
212
```

Temperature units (`c`, `f`, `k`) convert too; a value below absolute zero exits 2.

Volume units (`L`, `mL`, `gal`) convert too, e.g. `orbit 1 gal l --precision 10` prints `3.785411784`.

Add `--json` for machine-readable output: `orbit 5 km mi --json` prints `{"value":5,"from":"km","to":"mi","result":3.10686}`, and errors print `{"error":"..."}` on stderr with the same exit codes.

Units are given by symbol, name or alias. Output is just the number, so it pipes cleanly. Exit codes: 0 success, 1 usage error, 2 conversion error. Set `NO_COLOR` to disable colour in `--list` and error messages.
