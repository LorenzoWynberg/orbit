/** Six significant digits, trailing zeros dropped — the same as the CLI. */
export function formatResult(n: number): string {
  return String(Number(n.toPrecision(6)));
}

/** Fixed decimal places, zero-padded: `formatFixed(1.5, 3)` is `"1.500"`. */
export function formatFixed(n: number, places: number): string {
  return n.toFixed(places);
}

/** The ratio shown in the formula line: six decimals, trailing zeros dropped; tiny factors keep six significant digits. */
export function formatFactor(n: number): string {
  const s = String(Number(n.toFixed(6)));
  if (s === "0" && n !== 0) return String(Number(n.toPrecision(6)));
  return s;
}
