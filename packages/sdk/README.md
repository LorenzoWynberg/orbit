# @orbit/sdk

Unit conversion for TypeScript and JavaScript. Length and mass, exact factors, no dependencies. Ships ESM, CommonJS and bundled type declarations.

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
```

CommonJS works the same way:

```js
const { convert } = require("@orbit/sdk");
```

## `listUnits(dimension?)`

Returns every known unit as a `UnitInfo`, or only those of one dimension (`"length"` or `"mass"`).

```ts
import { listUnits } from "@orbit/sdk";

listUnits().length; // every unit
listUnits("mass").map((u) => u.symbol); // ["µg", "mg", "g", "kg", "Mg", "t", "gr", "oz", "lb", "st"]
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

## Types

```ts
import type { Dimension, UnitInfo } from "@orbit/sdk";

type Dimension = "length" | "mass";

interface UnitInfo {
  symbol: string;
  name: string;
  dimension: Dimension;
  factor: number; // exact factor to the base unit (metre or kilogram)
  aliases: readonly string[];
}
```

## License

MIT
