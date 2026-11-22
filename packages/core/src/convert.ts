import {
  BelowAbsoluteZeroError,
  IncompatibleDimensionError,
  UnknownUnitError,
} from "./errors.js";
import {
  ALIAS_INDEX_FOLDED,
  SPEED_SCALES,
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

export interface ConvertOptions {
  /** Decimal places to round the result to (integer 0-100), half away from zero. */
  precision?: number;
}

/** Shift the decimal exponent of `n` by `k` without float multiplication. */
function shift(n: number, k: number): number {
  const [mantissa, exp = "0"] = String(n).split("e");
  return Number(`${mantissa}e${Number(exp) + k}`);
}

function roundTo(x: number, p: number): number {
  if (!Number.isFinite(x) || Math.abs(x) >= 2 ** 53) return x;
  const r = shift(Math.round(shift(Math.abs(x), p)), -p);
  return r === 0 ? 0 : x < 0 ? -r : r;
}

export function convert(
  value: number,
  from: string,
  to: string,
  options?: ConvertOptions,
): number {
  const result = convertRaw(value, from, to);
  const p = options?.precision;
  if (p === undefined) return result;
  if (!Number.isInteger(p) || p < 0 || p > 100) {
    throw new RangeError(
      `precision must be an integer between 0 and 100, got ${p}`,
    );
  }
  return roundTo(result, p);
}

function convertRaw(value: number, from: string, to: string): number {
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
  const from_ = SPEED_SCALES.get(a.symbol);
  const to_ = SPEED_SCALES.get(b.symbol);
  if (from_ && to_) {
    if (a === b) return value;
    // Integers first: 1 kn → km/h is exactly 1.852 only this way round.
    return (value * (from_.num * to_.den)) / (from_.den * to_.num);
  }
  if (a === b) return value;
  return (value * a.factor) / b.factor;
}

export function listUnits(dimension?: Dimension): UnitInfo[] {
  return UNITS.filter(
    (u) => dimension === undefined || u.dimension === dimension,
  ).map((u) => ({ ...u, aliases: [...u.aliases] }));
}
