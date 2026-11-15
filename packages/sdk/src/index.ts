export {
  convert,
  listUnits,
  UnknownUnitError,
  IncompatibleDimensionError,
  BelowAbsoluteZeroError,
} from "@orbit/core";
export type { Dimension, UnitInfo } from "@orbit/core";

import { listUnits } from "@orbit/core";
import type { Dimension } from "@orbit/core";

/** Symbols of the units in one dimension, in table order. Returns a new array on each call. */
export function listUnitSymbols(dimension: Dimension): string[] {
  return listUnits(dimension).map((u) => u.symbol);
}
