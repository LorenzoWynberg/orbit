export type Dimension = "length" | "mass";

export interface UnitInfo {
  symbol: string;
  name: string;
  dimension: Dimension;
  /** Exact factor to the base unit (metre for length, kilogram for mass). */
  factor: number;
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

function build(dimension: Dimension, rows: Row[]): UnitInfo[] {
  return rows.map(([symbol, name, factor]) => ({
    symbol,
    name,
    dimension,
    factor,
    aliases: ALIASES[symbol] ?? [],
  }));
}

export const UNITS: readonly UnitInfo[] = [
  ...build("length", LENGTH),
  ...build("mass", MASS),
];

/** Exact-match lookup of symbols and aliases (a Map avoids prototype keys). */
export const UNIT_INDEX: ReadonlyMap<string, UnitInfo> = new Map(
  UNITS.flatMap((u) => [u.symbol, ...u.aliases].map((k) => [k, u] as const)),
);
