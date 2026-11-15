import { describe, expect, it } from "vitest";
import { formatResult } from "./format.js";

describe("formatResult", () => {
  it("rounds to six significant digits and drops trailing zeros", () => {
    expect(formatResult(5 / 1.609344)).toBe("3.10686");
    expect(formatResult(5000)).toBe("5000");
    expect(formatResult(0.1 + 0.2)).toBe("0.3");
  });
});
