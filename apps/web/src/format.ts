/** Six significant digits, trailing zeros dropped — the same as the CLI. */
export function formatResult(n: number): string {
  return String(Number(n.toPrecision(6)));
}

/** Fixed decimal places, zero-padded: `formatFixed(1.5, 3)` is `"1.500"`. */
export function formatFixed(n: number, places: number): string {
  return n.toFixed(places);
}
