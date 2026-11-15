import {
  BelowAbsoluteZeroError,
  IncompatibleDimensionError,
  UnknownUnitError,
} from "./errors.js";
import {
  ALIAS_INDEX_FOLDED,
  TEMPERATURE_SCALES,
  UNIT_INDEX,
  UNITS,
  type Dimension,
  type UnitInfo,
} from "./units.js";

/**
 * Exact match on symbols and aliases first (so `mm`/`Mm` stay distinct), then
 * a case-insensitive match on spelled-out aliases (4+ characters).
 */
function resolve(name: string): UnitInfo {
  const unit =
    UNIT_INDEX.get(name) ?? ALIAS_INDEX_FOLDED.get(name.toLowerCase());
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
  const source = TEMPERATURE_SCALES.get(a.symbol);
  const target = TEMPERATURE_SCALES.get(b.symbol);
  if (source && target) {
    if (value < source.absoluteZero) {
      throw new BelowAbsoluteZeroError(value, a.symbol, source.absoluteZero);
    }
    if (a === b) return value;
    // Multiply by integers before dividing, and never pivot through kelvin:
    // either would turn 100 °C into 211.99999999999997 °F.
    return (
      ((value + source.offset) * (source.num * target.den)) /
        (source.den * target.num) -
      target.offset
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
