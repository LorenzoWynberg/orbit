import * as core from "@orbit/core";
import { describe, expect, it } from "vitest";
import * as sdk from "./index.js";

describe("@orbit/sdk", () => {
  it("exposes exactly core's runtime exports", () => {
    expect(Object.keys(sdk).sort()).toEqual([
      "IncompatibleDimensionError",
      "UnknownUnitError",
      "convert",
      "listUnits",
    ]);
    expect(Object.keys(sdk).sort()).toEqual(Object.keys(core).sort());
  });

  it("re-exports the same bindings as core", () => {
    for (const key of Object.keys(core) as (keyof typeof core)[]) {
      expect(sdk[key]).toBe(core[key]);
    }
  });

  it("converts through the re-exported function", () => {
    expect(sdk.convert(1, "mi", "km")).toBe(1.609344);
  });
});
