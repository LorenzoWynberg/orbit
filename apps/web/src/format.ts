/** Six significant digits, trailing zeros dropped — the same as the CLI. */
export function formatResult(n: number): string {
  return String(Number(n.toPrecision(6)));
}
