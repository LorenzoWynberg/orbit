import { IncompatibleDimensionError, UnknownUnitError } from "./errors.js";
import { UNIT_INDEX, UNITS, type Dimension, type UnitInfo } from "./units.js";

function resolve(name: string): UnitInfo {
  const unit = UNIT_INDEX.get(name);
  if (!unit) throw new UnknownUnitError(name);
  return unit;
}

export function convert(value: number, from: string, to: string): number {
  const a = resolve(from);
  const b = resolve(to);
  if (a.dimension !== b.dimension) {
    throw new IncompatibleDimensionError(
      a.symbol,
      b.symbol,
      a.dimension,
      b.dimension,
    );
  }
  if (a === b) return value;
  return (value * a.factor) / b.factor;
}

export function listUnits(dimension?: Dimension): UnitInfo[] {
  return UNITS.filter(
    (u) => dimension === undefined || u.dimension === dimension,
  ).map((u) => ({ ...u, aliases: [...u.aliases] }));
}
