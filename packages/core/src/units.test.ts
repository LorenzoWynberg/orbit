import { describe, expect, it } from "vitest";
import { listUnits } from "./index.js";
import {
  ALIASES,
  ALIAS_INDEX_FOLDED,
  MIN_FOLDED_ALIAS_LENGTH,
} from "./units.js";

const LENGTH = "nm µm mm cm m km Mm in ft yd mi nmi".split(" ");
const MASS = "µg mg g kg Mg t gr oz lb st".split(" ");
const TEMPERATURE = ["°C", "°F", "K"];
const VOLUME = ["L", "mL", "gal"];

describe("listUnits", () => {
  it("lists length, mass, temperature then volume in table order", () => {
    expect(listUnits().map((u) => u.symbol)).toEqual([
      ...LENGTH,
      ...MASS,
      ...TEMPERATURE,
      ...VOLUME,
    ]);
  });

  it("filters by dimension", () => {
    expect(listUnits("mass").map((u) => u.symbol)).toEqual(MASS);
    expect(listUnits("length")).toHaveLength(12);
    expect(listUnits("temperature").map((u) => u.symbol)).toEqual(TEMPERATURE);
  });

  it("gives length and mass a zero offset and temperature its own", () => {
    for (const u of [...listUnits("length"), ...listUnits("mass")])
      expect(u.offset).toBe(0);
    const t = Object.fromEntries(
      listUnits("temperature").map((u) => [u.symbol, u]),
    );
    expect(t["°C"]).toMatchObject({ name: "celsius", offset: 0, factor: 1 });
    expect(t["°F"]).toMatchObject({ name: "fahrenheit", offset: -32 });
    expect(t["K"]).toMatchObject({ name: "kelvin", offset: -273.15 });
    expect(Object.keys(t["K"] ?? {}).sort()).toEqual([
      "aliases",
      "dimension",
      "factor",
      "name",
      "offset",
      "symbol",
    ]);
  });

  it("lists volume units with a zero offset", () => {
    const v = listUnits("volume");
    expect(v.map((u) => u.symbol)).toEqual(VOLUME);
    for (const u of v) {
      expect(u.dimension).toBe("volume");
      expect(u.offset).toBe(0);
    }
    expect(v.map((u) => [u.name, u.factor])).toEqual([
      ["litre", 1],
      ["millilitre", 0.001],
      ["US gallon", 3.785411784],
    ]);
  });

  it("resolves the volume aliases", () => {
    expect(ALIASES["L"]).toEqual(["l", "litre", "litres", "liter", "liters"]);
    expect(ALIASES["mL"]).toEqual([
      "ml",
      "millilitre",
      "millilitres",
      "milliliter",
      "milliliters",
    ]);
    expect(ALIASES["gal"]).toEqual(["gallon", "gallons"]);
  });

  it("resolves the temperature aliases", () => {
    expect(ALIASES["°C"]).toEqual(["c", "celsius"]);
    expect(ALIASES["°F"]).toEqual(["f", "fahrenheit"]);
    expect(ALIASES["K"]).toEqual(["k", "kelvin"]);
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

  it("folds only spelled-out aliases, none onto another unit's symbol", () => {
    const symbols = new Set(listUnits().map((u) => u.symbol.toLowerCase()));
    for (const [key, unit] of ALIAS_INDEX_FOLDED) {
      expect(key.length).toBeGreaterThanOrEqual(MIN_FOLDED_ALIAS_LENGTH);
      expect(unit.aliases.map((a) => a.toLowerCase())).toContain(key);
      expect(symbols.has(key)).toBe(false);
    }
  });
});
