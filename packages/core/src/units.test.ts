import { describe, expect, it } from "vitest";
import { listUnits } from "./index.js";
import { ALIASES } from "./units.js";

const LENGTH = "nm µm mm cm m km Mm in ft yd mi nmi".split(" ");
const MASS = "µg mg g kg Mg t gr oz lb st".split(" ");

describe("listUnits", () => {
  it("lists length then mass in table order", () => {
    expect(listUnits().map((u) => u.symbol)).toEqual([...LENGTH, ...MASS]);
  });

  it("filters by dimension", () => {
    expect(listUnits("mass").map((u) => u.symbol)).toEqual(MASS);
    expect(listUnits("length")).toHaveLength(12);
  });

  it("holds exact defining factors", () => {
    const f = Object.fromEntries(listUnits().map((u) => [u.symbol, u.factor]));
    expect(f).toMatchObject({
      in: 0.0254,
      mi: 1609.344,
      nmi: 1852,
      lb: 0.45359237,
      oz: 0.028349523125,
      gr: 0.00006479891,
      st: 6.35029318,
    });
  });

  it("never lets an alias equal a unit symbol", () => {
    const symbols = new Set(listUnits().map((u) => u.symbol));
    const aliases = Object.values(ALIASES).flat();
    expect(aliases.filter((a) => symbols.has(a))).toEqual([]);
    expect(new Set(aliases).size).toBe(aliases.length);
  });
});
