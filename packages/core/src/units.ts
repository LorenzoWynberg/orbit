export type Dimension = "length" | "mass" | "temperature";

export interface UnitInfo {
  symbol: string;
  name: string;
  dimension: Dimension;
  /** Exact factor to the base unit (metre for length, kilogram for mass). */
  factor: number;
  /**
   * Added to a value before it is scaled, so that `0` of the scale lines up
   * with the shared zero point of its dimension. Always 0 for length and mass.
   */
  offset: number;
  aliases: readonly string[];
}

export const ALIASES: Readonly<Record<string, readonly string[]>> = {
  µm: ["um"],
  µg: ["ug"],
  m: ["metre", "metres", "meter", "meters"],
  km: ["kilometre", "kilometres", "kilometer", "kilometers"],
  in: ["inch", "inches"],
  ft: ["foot", "feet"],
  yd: ["yard", "yards"],
  mi: ["mile", "miles"],
  g: ["gram", "grams"],
  kg: ["kilogram", "kilograms"],
  t: ["tonne", "tonnes"],
  oz: ["ounce", "ounces"],
  lb: ["pound", "pounds", "lbs"],
  st: ["stone"],
  gr: ["grain", "grains"],
  "°C": ["c", "celsius"],
  "°F": ["f", "fahrenheit"],
  K: ["k", "kelvin"],
};

type Row = [symbol: string, name: string, factor: number];

const LENGTH: Row[] = [
  ["nm", "nanometre", 1e-9],
  ["µm", "micrometre", 1e-6],
  ["mm", "millimetre", 0.001],
  ["cm", "centimetre", 0.01],
  ["m", "metre", 1],
  ["km", "kilometre", 1000],
  ["Mm", "megametre", 1e6],
  ["in", "inch", 0.0254],
  ["ft", "foot", 0.3048],
  ["yd", "yard", 0.9144],
  ["mi", "mile", 1609.344],
  ["nmi", "nautical mile", 1852],
];

const MASS: Row[] = [
  ["µg", "microgram", 1e-9],
  ["mg", "milligram", 1e-6],
  ["g", "gram", 0.001],
  ["kg", "kilogram", 1],
  ["Mg", "megagram", 1000],
  ["t", "tonne", 1000],
  ["gr", "grain", 0.00006479891],
  ["oz", "ounce", 0.028349523125],
  ["lb", "pound", 0.45359237],
  ["st", "stone", 6.35029318],
];

/**
 * Exact integer description of a temperature scale, kept out of `UnitInfo`:
 * one degree is `num / den` of a kelvin, `offset` shifts the scale's zero onto
 * the kelvin-degree axis' zero, and `absoluteZero` is the scale's own reading
 * at 0 K. Conversion multiplies by integers before it divides, so the
 * published cases (100 °C → 212 °F, 0 K → -273.15 °C) stay exact.
 */
export interface TemperatureScale {
  num: number;
  den: number;
  offset: number;
  absoluteZero: number;
}

type TemperatureRow = [symbol: string, name: string, scale: TemperatureScale];

const TEMPERATURE: TemperatureRow[] = [
  ["°C", "celsius", { num: 1, den: 1, offset: 0, absoluteZero: -273.15 }],
  ["°F", "fahrenheit", { num: 5, den: 9, offset: -32, absoluteZero: -459.67 }],
  ["K", "kelvin", { num: 1, den: 1, offset: -273.15, absoluteZero: 0 }],
];

/** Temperature scales by unit symbol. Internal: not part of the public API. */
export const TEMPERATURE_SCALES: ReadonlyMap<string, TemperatureScale> =
  new Map(TEMPERATURE.map(([symbol, , scale]) => [symbol, scale]));

function build(dimension: Dimension, rows: Row[]): UnitInfo[] {
  return rows.map(([symbol, name, factor]) => ({
    symbol,
    name,
    dimension,
    factor,
    offset: 0,
    aliases: ALIASES[symbol] ?? [],
  }));
}

function buildTemperature(rows: TemperatureRow[]): UnitInfo[] {
  return rows.map(([symbol, name, { num, den, offset }]) => ({
    symbol,
    name,
    dimension: "temperature",
    factor: num / den,
    offset,
    aliases: ALIASES[symbol] ?? [],
  }));
}

export const UNITS: readonly UnitInfo[] = [
  ...build("length", LENGTH),
  ...build("mass", MASS),
  ...buildTemperature(TEMPERATURE),
];

/** Exact-match lookup of symbols and aliases (a Map avoids prototype keys). */
export const UNIT_INDEX: ReadonlyMap<string, UnitInfo> = new Map(
  UNITS.flatMap((u) => [u.symbol, ...u.aliases].map((k) => [k, u] as const)),
);
