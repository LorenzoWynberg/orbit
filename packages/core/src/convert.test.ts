import { describe, expect, it } from "vitest";
import {
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
    for (const a of listUnits())
      for (const b of listUnits(a.dimension))
        for (const v of values)
          close(convert(convert(v, a.symbol, b.symbol), b.symbol, a.symbol), v);
  });

  it("is identity for the same unit", () => {
    for (const u of listUnits())
      expect(convert(1.2345, u.symbol, u.symbol)).toBe(1.2345);
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
