import { describe, expect, it } from "vitest";
import tokensCss from "./styles/tokens.css?raw";

/** oklch(L C H) → WCAG relative luminance, via OKLab → linear sRGB. */
function luminance(oklch: string): number {
  const [l = NaN, c = NaN, h = NaN] = oklch.trim().split(/\s+/).map(Number);
  const a = c * Math.cos((h * Math.PI) / 180);
  const b = c * Math.sin((h * Math.PI) / 180);
  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const clamp = (x: number): number => Math.min(1, Math.max(0, x));
  const r = clamp(4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_);
  const g = clamp(-1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_);
  const bl = clamp(-0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_);
  return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
}

function contrast(x: number, y: number): number {
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

function roles(css: string): Record<string, string> {
  const found: Record<string, string> = {};
  for (const m of css.matchAll(/--([\w-]+):\s*oklch\(([^)]+)\)/g)) {
    found[m[1] ?? ""] = m[2] ?? "";
  }
  return found;
}

const DARK_QUERY = "@media (prefers-color-scheme: dark)";
const [lightCss = "", darkCss = ""] = tokensCss.split(DARK_QUERY);
const light = roles(lightCss);
const dark = roles(darkCss);

function ratio(palette: Record<string, string>, a: string, b: string): number {
  const x = palette[a];
  const y = palette[b];
  if (x === undefined || y === undefined) {
    throw new Error(`role missing: ${a} or ${b}`);
  }
  return contrast(luminance(x), luminance(y));
}

// [text role, ground role]: pairs the stylesheet really uses, plus every
// on-<role> pair, which must be readable on its role.
const TEXT_PAIRS: [string, string][] = [
  ["foreground", "background"],
  ["foreground", "surface"],
  ["foreground", "elevated"],
  ["muted", "background"],
  ["muted", "surface"],
  ["danger", "surface"],
  ["on-primary", "primary"],
  ["on-secondary", "secondary"],
  ["on-accent", "accent"],
  ["on-danger", "danger"],
  ["on-warning", "warning"],
  ["on-success", "success"],
  ["on-info", "info"],
];

// Focus ring and control borders against the grounds they sit on.
const NON_TEXT_PAIRS: [string, string][] = [
  ["ring", "background"],
  ["ring", "surface"],
  ["ring", "elevated"],
  ["secondary", "surface"],
  ["secondary", "elevated"],
  ["danger", "elevated"],
];

describe("tokens.css", () => {
  it("defines the same colour roles for light and dark", () => {
    expect(Object.keys(light).length).toBeGreaterThan(20);
    expect(Object.keys(dark).sort()).toEqual(Object.keys(light).sort());
  });

  const modes: [string, Record<string, string>][] = [
    ["light", light],
    ["dark", dark],
  ];

  describe.each(modes)("%s", (_mode, palette) => {
    it.each(TEXT_PAIRS)("text %s on %s reaches 4.5:1", (fg, bg) => {
      expect(ratio(palette, fg, bg)).toBeGreaterThanOrEqual(4.5);
    });

    it.each(NON_TEXT_PAIRS)("%s against %s reaches 3:1", (fg, bg) => {
      expect(ratio(palette, fg, bg)).toBeGreaterThanOrEqual(3);
    });
  });

  it("measures contrast correctly on the extremes", () => {
    expect(contrast(luminance("1 0 0"), luminance("0 0 0"))).toBeCloseTo(21, 0);
  });
});
