# @orbit/core

Units, conversion and errors for orbit.

## Unit lookup

`convert(value, from, to)` resolves each unit name in this order:

1. **Exact match** on a symbol or alias. An exact match always wins.
2. **Case-insensitive match** on spelled-out aliases (4 or more characters, e.g. `Litre`, `GALLONS`, `Kilometer`).

Symbols and short aliases (under 4 characters: `ml`, `c`, `lbs`) match exactly, because case-distinct symbols exist (`mm`/`Mm`, `mg`/`Mg`). So `ML`, `C` and `MM` throw `UnknownUnitError`.
