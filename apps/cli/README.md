# @orbit/cli

Convert length, mass, temperature and volume units from the command line.

```sh
orbit 5 km mi                      # 3.10686
orbit 12 in cm --precision 3       # 30.5
orbit 100 c f                      # 212
orbit 1 gal l --precision 10       # 3.785411784
orbit --list mass
```

## Usage

`orbit <value> <from> <to> [--precision <n>]`

- `-p, --precision <n>`: significant digits, 1 to 21 (default 6).
- `-l, --list [length|mass|temperature|volume]`: list units, optionally for one dimension.
- `-h, --help`: show help.

Volume units are `L`, `mL` and `gal`.

Negative values (`orbit -5 km m`) and exponents (`1e3`) are accepted. Colour is used only on a terminal, and never when `NO_COLOR` is set.

## Exit codes

- `0` success
- `1` usage error
- `2` conversion error (unknown unit, incompatible dimensions, or below absolute zero)

Built on [`@orbit/sdk`](../../packages/sdk). MIT licensed.
