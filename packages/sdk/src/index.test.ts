import * as core from "@orbit/core";
import { describe, expect, it } from "vitest";
import * as sdk from "./index.js";

describe("@orbit/sdk", () => {
  it("exposes exactly core's runtime exports", () => {
    expect(Object.keys(sdk).sort()).toEqual([
      "BelowAbsoluteZeroError",
      "IncompatibleDimensionError",
      "UnknownUnitError",
      "convert",
      "listUnitSymbols",
      "listUnits",
    ]);
    expect(Object.keys(sdk).sort()).toEqual(
      [...Object.keys(core), "listUnitSymbols"].sort(),
    );
  });

  it.each([
    [
      "length",
      ["nm", "µm", "mm", "cm", "m", "km", "Mm", "in", "ft", "yd", "mi", "nmi"],
    ],
    ["mass", ["µg", "mg", "g", "kg", "Mg", "t", "gr", "oz", "lb", "st"]],
    ["temperature", ["°C", "°F", "K"]],
    ["volume", ["L", "mL", "gal"]],
  ] as const)("listUnitSymbols(%s) lists its symbols", (dimension, symbols) => {
    expect(sdk.listUnitSymbols(dimension)).toEqual(symbols);
  });

  it("listUnitSymbols returns a fresh array each call", () => {
    const a = sdk.listUnitSymbols("volume");
    a.push("x");
    expect(sdk.listUnitSymbols("volume")).toEqual(["L", "mL", "gal"]);
  });

  it("re-exports the same bindings as core", () => {
    for (const key of Object.keys(core) as (keyof typeof core)[]) {
      expect(sdk[key]).toBe(core[key]);
    }
  });

  it("converts and lists volume units", () => {
    expect(sdk.convert(1, "gal", "L")).toBe(3.785411784);
    expect(sdk.listUnits("volume").map((u) => u.symbol)).toEqual([
      "L",
      "mL",
      "gal",
    ]);
  });

  it("converts through the re-exported function", () => {
    expect(sdk.convert(1, "mi", "km")).toBe(1.609344);
  });

  it.each([
    [100, "c", "f", 212],
    [-40, "°C", "°F", -40],
    [0, "K", "°C", -273.15],
    [212, "fahrenheit", "celsius", 100],
  ])("converts %d %s -> %s exactly to %d", (v, from, to, expected) => {
    expect(sdk.convert(v, from, to)).toBe(expected);
  });

  it("rejects a temperature below absolute zero", () => {
    expect(() => sdk.convert(-300, "°C", "K")).toThrow(
      sdk.BelowAbsoluteZeroError,
    );
  });

  it("rejects temperature against another dimension", () => {
    expect(() => sdk.convert(1, "c", "m")).toThrow(
      sdk.IncompatibleDimensionError,
    );
  });
});
