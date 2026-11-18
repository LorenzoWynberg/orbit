# @orbit/sdk

Unit conversion for TypeScript and JavaScript. Length, mass, temperature, volume and speed, exact factors, no dependencies. Ships ESM, CommonJS and bundled type declarations.

## Install

```sh
npm install @orbit/sdk
```

## `convert(value, from, to)`

Converts a number between two units of the same dimension. Units are matched exactly, by symbol or by alias.

```ts
import { convert } from "@orbit/sdk";

convert(1, "mi", "km"); // 1.609344
convert(1000, "g", "kg"); // 1
convert(2, "miles", "km"); // 3.218688
convert(100, "c", "f"); // 212
convert(0, "K", "°C"); // -273.15
```

CommonJS works the same way:

```js
const { convert } = require("@orbit/sdk");
```

## `listUnits(dimension?)`

Returns every known unit as a `UnitInfo`, or only those of one dimension (`"length"`, `"mass"`, `"temperature"`, `"volume"` or `"speed"`).

```ts
import { listUnits } from "@orbit/sdk";

listUnits().length; // every unit
listUnits("mass").map((u) => u.symbol); // ["µg", "mg", "g", "kg", "Mg", "t", "gr", "oz", "lb", "st"]
listUnits("temperature").map((u) => u.symbol); // ["°C", "°F", "K"]
listUnits("volume").map((u) => u.symbol); // ["L", "mL", "gal"]
listUnits("speed").map((u) => u.symbol); // ["km/h", "mph", "m/s", "kn"]
convert(1, "gal", "L"); // 3.785411784 (aliases: "l", "litre", "ml", "gallon", …)
```

## `listUnitSymbols(dimension)`

Returns the symbols of the units in one dimension, in table order. Each call returns a new array.

```ts
import { listUnitSymbols } from "@orbit/sdk";

listUnitSymbols("volume"); // ["L", "mL", "gal"]
listUnitSymbols("temperature"); // ["°C", "°F", "K"]
listUnitSymbols("speed"); // ["km/h", "mph", "m/s", "kn"]
```

## Errors

### `UnknownUnitError`

Thrown when a unit name is neither a known symbol nor an alias. `unit` holds the name that was not recognised.

```ts
import { convert, UnknownUnitError } from "@orbit/sdk";

try {
  convert(1, "xyz", "m");
} catch (error) {
  if (error instanceof UnknownUnitError) {
    console.error(error.unit); // "xyz"
  }
}
```

### `IncompatibleDimensionError`

Thrown when the two units measure different things. `from` and `to` are the unit symbols, and `fromDimension` and `toDimension` their dimensions.

```ts
import { convert, IncompatibleDimensionError } from "@orbit/sdk";

try {
  convert(1, "kg", "m");
} catch (error) {
  if (error instanceof IncompatibleDimensionError) {
    console.error(error.fromDimension, error.toDimension); // "mass" "length"
  }
}
```

### `BelowAbsoluteZeroError`

Thrown when a temperature is below absolute zero in its own unit (-273.15 °C, -459.67 °F or 0 K). `value`, `unit` and `absoluteZero` hold the offending reading, its unit symbol and that unit's absolute zero. Exactly absolute zero is valid.

```ts
import { convert, BelowAbsoluteZeroError } from "@orbit/sdk";

try {
  convert(-300, "°C", "K");
} catch (error) {
  if (error instanceof BelowAbsoluteZeroError) {
    console.error(error.value, error.unit, error.absoluteZero); // -300 "°C" -273.15
  }
}
```

## Types

```ts
import type { Dimension, UnitInfo } from "@orbit/sdk";

type Dimension = "length" | "mass" | "temperature" | "volume" | "speed";

interface UnitInfo {
  symbol: string;
  name: string;
  dimension: Dimension;
  factor: number; // exact factor to the base unit (metre, kilogram or litre, metre per second for speed; one degree for temperature)
  offset: number; // added before scaling; 0 for length and mass
  aliases: readonly string[];
}
```

## License

MIT
