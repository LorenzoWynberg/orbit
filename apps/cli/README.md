# @orbit/cli

Convert length and mass units from the command line.

```sh
orbit 5 km mi                      # 3.10686
orbit 12 in cm --precision 3       # 30.5
orbit --list mass
```

## Usage

`orbit <value> <from> <to> [--precision <n>]`

- `-p, --precision <n>`: significant digits, 1 to 21 (default 6).
- `-l, --list [length|mass]`: list units, optionally for one dimension.
- `-h, --help`: show help.

Negative values (`orbit -5 km m`) and exponents (`1e3`) are accepted. Colour is used only on a terminal, and never when `NO_COLOR` is set.

## Exit codes

- `0` success
- `1` usage error
- `2` conversion error (unknown unit or incompatible dimensions)

Built on [`@orbit/sdk`](../../packages/sdk). MIT licensed.
