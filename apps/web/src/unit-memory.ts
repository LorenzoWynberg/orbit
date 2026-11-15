/** Where the last-used unit pair is kept in the page's localStorage. */
export const UNITS_KEY = "orbit:web:units";

export interface StoredUnits {
  from: string;
  to: string;
}

/** The remembered pair, or null when storage is unavailable or holds anything else. */
export function readUnits(doc: Document): StoredUnits | null {
  try {
    const raw = doc.defaultView?.localStorage.getItem(UNITS_KEY);
    if (raw === null || raw === undefined) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;
    const { from, to } = parsed as Record<string, unknown>;
    if (typeof from !== "string" || typeof to !== "string") return null;
    return { from, to };
  } catch {
    return null;
  }
}

/** Remembers the pair. Storage that is missing, full or blocked is ignored. */
export function writeUnits(doc: Document, from: string, to: string): void {
  try {
    doc.defaultView?.localStorage.setItem(
      UNITS_KEY,
      JSON.stringify({ from, to }),
    );
  } catch {
    // Remembering units is best effort; the converter works without it.
  }
}
