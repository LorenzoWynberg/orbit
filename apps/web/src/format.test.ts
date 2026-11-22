import { describe, expect, it } from "vitest";
import { formatFixed, formatResult } from "./format.js";

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
