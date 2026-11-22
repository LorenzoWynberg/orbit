import { describe, expect, it } from "vitest";
import { formatFactor, formatFixed, formatResult } from "./format.js";

describe("formatResult", () => {
  it("rounds to six significant digits and drops trailing zeros", () => {
    expect(formatResult(5 / 1.609344)).toBe("3.10686");
    expect(formatResult(5000)).toBe("5000");
    expect(formatResult(0.1 + 0.2)).toBe("0.3");
  });
});

describe("formatFixed", () => {
  it("pads with zeros to the requested places", () => {
    expect(formatFixed(1.5, 3)).toBe("1.500");
    expect(formatFixed(160.9344, 6)).toBe("160.934400");
  });
  it("has no decimal point at 0 places", () => {
    expect(formatFixed(2.4, 0)).toBe("2");
  });
});

describe("formatFactor", () => {
  it.each([
    [0.621371192, "0.621371"],
    [1.609344, "1.609344"],
    [1e-12, "1e-12"],
    [1000, "1000"],
    [1, "1"],
    [4e-7, "4e-7"],
    [0, "0"],
  ])("formats %s as %s", (n, expected) => {
    expect(formatFactor(n)).toBe(expected);
  });
});
