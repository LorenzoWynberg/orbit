import { describe, expect, it } from "vitest";
import {
  BelowAbsoluteZeroError,
  IncompatibleDimensionError,
  UnknownUnitError,
  convert,
  listUnits,
} from "./index.js";

function close(actual: number, expected: number, tol = 1e-12): void {
  const scale = Math.max(Math.abs(actual), Math.abs(expected));
  expect(Math.abs(actual - expected) <= tol * scale).toBe(true);
}

describe("golden conversions", () => {
  it.each([
    [1, "in", "m", 0.0254],
    [1, "ft", "m", 0.3048],
    [1, "yd", "m", 0.9144],
    [1, "mi", "m", 1609.344],
    [1, "nmi", "m", 1852],
    [1, "lb", "kg", 0.45359237],
    [1, "oz", "g", 28.349523125],
    [1, "gr", "mg", 64.79891],
    [1, "st", "kg", 6.35029318],
    [1, "mi", "km", 1.609344],
    [1, "lb", "g", 453.59237],
    [1, "mm", "m", 0.001],
    [1, "Mm", "m", 1e6],
    [1, "nm", "m", 1e-9],
    [1, "µm", "m", 1e-6],
    [1, "cm", "m", 0.01],
    [1, "µg", "kg", 1e-9],
    [1, "mg", "kg", 1e-6],
    [1, "Mg", "kg", 1000],
    [1, "t", "kg", 1000],
  ])("%d %s -> %s = %d", (v, from, to, expected) => {
    close(convert(v, from, to), expected);
  });

  it("converts 5 km to 3.10686 mi (6 significant digits)", () => {
    expect(convert(5, "km", "mi")).toBeCloseTo(3.10686, 5);
  });
});

describe("round trip", () => {
  it("returns the input for every same-dimension pair", () => {
    let s = 12345;
    const rand = () =>
      (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
    const values = [0, 1, -1];
    for (let i = 0; i < 20; i++) {
      const mag = 10 ** (-6 + Math.floor(rand() * 16));
      values.push(mag * (1 + rand()), -mag * (1 + rand()));
    }
    for (const a of [
      ...listUnits("length"),
      ...listUnits("mass"),
      ...listUnits("volume"),
    ])
      for (const b of listUnits(a.dimension))
        for (const v of values)
          close(convert(convert(v, a.symbol, b.symbol), b.symbol, a.symbol), v);
  });

  it("returns the input for every temperature pair at or above absolute zero", () => {
    const zero: Record<string, number> = { "°C": -273.15, "°F": -459.67, K: 0 };
    for (const a of listUnits("temperature"))
      for (const b of listUnits("temperature"))
        for (const v of [0, 1, 37.5, 100, 1e6, (zero[a.symbol] ?? 0) + 1])
          expect(
            Math.abs(
              convert(convert(v, a.symbol, b.symbol), b.symbol, a.symbol) - v,
            ),
          ).toBeLessThanOrEqual(1e-9 * Math.max(1, Math.abs(v)));
  });

  it("is identity for the same unit", () => {
    for (const u of listUnits())
      expect(convert(1.2345, u.symbol, u.symbol)).toBe(1.2345);
  });
});

describe("length and mass keep the factor formula", () => {
  it("matches (value * from.factor) / to.factor bit for bit", () => {
    const values = [0, 1, -1, 5, 1e-6, 1e9];
    for (const dimension of ["length", "mass"] as const)
      for (const a of listUnits(dimension))
        for (const b of listUnits(dimension))
          for (const v of values) {
            const expected =
              a.symbol === b.symbol ? v : (v * a.factor) / b.factor;
            expect(Object.is(convert(v, a.symbol, b.symbol), expected)).toBe(
              true,
            );
          }
  });
});

describe("temperature", () => {
  it.each([
    [100, "c", "f", 212],
    [-40, "c", "f", -40],
    [-40, "f", "c", -40],
    [0, "k", "c", -273.15],
    [32, "f", "c", 0],
    [0, "c", "k", 273.15],
    [-273.15, "c", "k", 0],
    [212, "f", "c", 100],
    [273.15, "k", "c", 0],
    [0, "°C", "°F", 32],
    [0, "celsius", "kelvin", 273.15],
  ])("converts %d %s -> %s exactly to %d", (v, from, to, expected) => {
    expect(Object.is(convert(v, from, to), expected)).toBe(true);
  });

  it("returns the same unit unchanged", () => {
    expect(convert(21.5, "°C", "celsius")).toBe(21.5);
  });

  it("throws below absolute zero in the source unit, with the details", () => {
    try {
      convert(-300, "°C", "K");
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(BelowAbsoluteZeroError);
      const err = e as BelowAbsoluteZeroError;
      expect([err.value, err.unit, err.absoluteZero]).toEqual([
        -300,
        "°C",
        -273.15,
      ]);
      expect(err.name).toBe("BelowAbsoluteZeroError");
      expect(err.message).toBe("-300 °C is below absolute zero (-273.15 °C)");
    }
  });

  it("guards every source unit, including a same-unit conversion", () => {
    expect(() => convert(-300, "c", "c")).toThrow(BelowAbsoluteZeroError);
    expect(() => convert(-459.68, "f", "c")).toThrow(BelowAbsoluteZeroError);
    expect(() => convert(-0.001, "k", "c")).toThrow(BelowAbsoluteZeroError);
  });

  it("accepts exactly absolute zero, and passes NaN through", () => {
    expect(convert(-273.15, "c", "c")).toBe(-273.15);
    expect(convert(0, "k", "k")).toBe(0);
    expect(() => convert(-459.67, "f", "k")).not.toThrow();
    expect(convert(NaN, "c", "f")).toBeNaN();
  });

  it("rejects temperature against another dimension", () => {
    expect(() => convert(1, "c", "m")).toThrow(IncompatibleDimensionError);
    expect(() => convert(1, "kg", "k")).toThrow(IncompatibleDimensionError);
  });
});

describe("volume", () => {
  it("converts exactly", () => {
    expect(convert(1, "gal", "L")).toBe(3.785411784);
    expect(convert(1, "L", "mL")).toBe(1000);
    expect(convert(1, "gal", "mL")).toBe(3785.411784);
  });

  it("resolves every alias", () => {
    for (const a of ["l", "litre", "litres", "liter", "liters"])
      expect(convert(1, a, "L")).toBe(1);
    for (const a of [
      "ml",
      "millilitre",
      "millilitres",
      "milliliter",
      "milliliters",
    ])
      expect(convert(1, a, "mL")).toBe(1);
    for (const a of ["gallon", "gallons"]) expect(convert(1, a, "gal")).toBe(1);
  });

  it("is case sensitive", () => {
    expect(() => convert(1, "GAL", "L")).toThrow(UnknownUnitError);
  });

  it("rejects other dimensions", () => {
    for (const [f, t] of [
      ["gal", "kg"],
      ["L", "m"],
      ["mL", "°C"],
    ] as const) {
      expect(() => convert(1, f, t)).toThrow(IncompatibleDimensionError);
    }
    try {
      convert(1, "gal", "kg");
    } catch (e) {
      expect((e as IncompatibleDimensionError).fromDimension).toBe("volume");
    }
  });
});

describe("resolution and errors", () => {
  it("rejects case variants as unknown", () => {
    expect(() => convert(1, "KM", "m")).toThrow(UnknownUnitError);
    expect.assertions(3);
    try {
      convert(1, "m", "MI");
    } catch (e) {
      expect((e as UnknownUnitError).unit).toBe("MI");
      expect((e as Error).name).toBe("UnknownUnitError");
    }
  });

  it("rejects prototype-key names", () => {
    expect(() => convert(1, "constructor", "m")).toThrow(UnknownUnitError);
  });

  it("rejects cross-dimension conversion", () => {
    try {
      convert(1, "km", "kg");
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(IncompatibleDimensionError);
      const err = e as IncompatibleDimensionError;
      expect([err.fromDimension, err.toDimension]).toEqual(["length", "mass"]);
      expect(err.message).toBe("Cannot convert length (km) to mass (kg)");
    }
  });

  it("resolves aliases exactly", () => {
    expect(convert(1, "miles", "km")).toBe(convert(1, "mi", "km"));
    expect(convert(1, "um", "m")).toBe(convert(1, "µm", "m"));
    expect(() => convert(1, "Miles", "km")).toThrow(UnknownUnitError);
  });

  it("passes NaN through", () => {
    expect(convert(NaN, "m", "km")).toBeNaN();
  });
});
