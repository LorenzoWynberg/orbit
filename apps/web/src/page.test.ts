// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import indexHtml from "../index.html?raw";
import packageJson from "../package.json?raw";
import config from "../vite.config.js";

const sources = import.meta.glob<string>(["./**/*.ts", "!./**/*.test.ts"], {
  query: "?raw",
  import: "default",
  eager: true,
});
const stylesheets = import.meta.glob<string>("./styles/*.css", {
  query: "?raw",
  import: "default",
  eager: true,
});
const css = (name: string): string => stylesheets[`./styles/${name}.css`] ?? "";

const page = new DOMParser().parseFromString(indexHtml, "text/html");
const COLOUR_LITERAL =
  /#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color|color-mix)\(|:[^;{}]*\b(?:white|black|red|green|blue|gray|grey|orange|yellow|purple|pink|silver|navy|teal)\b/i;
const THIRD_PARTY = /(?:https?:)?\/\/[a-z0-9-]+\.[a-z]{2,}/i;

describe("index.html", () => {
  it("has a language, a descriptive title, one h1 and a main landmark", () => {
    expect(page.documentElement.lang).toBe("en");
    expect(page.title.length).toBeGreaterThan(10);
    expect(page.querySelectorAll("h1")).toHaveLength(1);
    expect(page.querySelectorAll("main")).toHaveLength(1);
    expect(page.querySelectorAll("main form")).toHaveLength(1);
  });

  it("labels every input and select", () => {
    const controls = [...page.querySelectorAll("input, select")];
    expect(controls.length).toBe(4);
    for (const control of controls) {
      expect(page.querySelector(`label[for="${control.id}"]`)).not.toBeNull();
    }
  });

  it("makes the skip link the first focusable element, targeting the form", () => {
    const first = page.querySelector(
      'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    expect(first?.classList.contains("skip-link")).toBe(true);
    expect(first?.getAttribute("href")).toBe("#converter");
    expect(page.getElementById("converter")?.tagName).toBe("FORM");
  });

  it("has a hidden formula line right after the result", () => {
    const formula = page.getElementById("formula");
    expect(formula?.hidden).toBe(true);
    expect(page.getElementById("result")?.nextElementSibling).toBe(formula);
  });

  it("announces the result politely and names the swap button", () => {
    expect(page.querySelector("output")?.getAttribute("aria-live")).toBe(
      "polite",
    );
    expect(page.getElementById("swap")?.getAttribute("aria-label")).toBe(
      "Swap units",
    );
  });

  it("loads the app from one external module and has no inline script or handler", () => {
    const scripts = [...page.querySelectorAll("script")];
    expect(scripts).toHaveLength(1);
    expect(scripts[0]?.type).toBe("module");
    expect(scripts[0]?.getAttribute("src")).toBe("/src/main.ts");
    expect(scripts[0]?.textContent.trim()).toBe("");
    for (const el of page.querySelectorAll("*")) {
      const handlers = el.getAttributeNames().filter((n) => /^on/i.test(n));
      expect(handlers).toEqual([]);
    }
  });

  it("loads nothing from a third-party host", () => {
    expect(indexHtml).not.toMatch(THIRD_PARTY);
  });
});

describe("package", () => {
  const pkg = JSON.parse(packageJson) as {
    name: string;
    private: boolean;
    dependencies: Record<string, string>;
    devDependencies: Record<string, string>;
  };

  it("is the private @orbit/web, built on @orbit/core via the workspace", () => {
    expect(pkg.name).toBe("@orbit/web");
    expect(pkg.private).toBe(true);
    expect(pkg.dependencies["@orbit/core"]).toBe("workspace:*");
  });

  it("lists no UI framework", () => {
    const names = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
    expect(
      names.filter((n) =>
        /^(react|react-dom|vue|svelte|solid-js|preact|lit)$/.test(n),
      ),
    ).toEqual([]);
  });

  it("builds for the GitHub Pages project path", () => {
    const resolve = config as (env: { mode: string }) => { base: string };
    expect(resolve({ mode: "production" }).base).toBe("/orbit/");
    expect(resolve({ mode: "extension" }).base).toBe("./");
  });

  it("defines no unit tables or error classes of its own", () => {
    const files = Object.entries(sources);
    expect(files.length).toBeGreaterThan(2);
    for (const [file, text] of files) {
      expect(text, file).not.toMatch(/extends\s+\w*Error\b/);
      expect(text, file).not.toMatch(/\bfactor\b/);
    }
  });
});

describe("stylesheets", () => {
  it("keeps colour literals in tokens.css alone", () => {
    expect(css("tokens")).toMatch(COLOUR_LITERAL);
    for (const [file, text] of Object.entries(stylesheets)) {
      if (file.endsWith("/tokens.css")) continue;
      expect(text, file).not.toMatch(COLOUR_LITERAL);
    }
    expect(css("app").length).toBeGreaterThan(0);
  });

  it("has dark values under prefers-color-scheme", () => {
    expect(css("tokens")).toContain("@media (prefers-color-scheme: dark)");
  });

  it("styles focus, the 480px and 768px layouts, and reduced motion", () => {
    const app = css("app");
    expect(app).toContain(":focus-visible");
    expect(app).toContain("@media (min-width: 480px)");
    expect(app).toContain("@media (min-width: 768px)");
    expect(app).toMatch(
      /@media \(prefers-reduced-motion: reduce\)[^@]*transition: none/,
    );
  });

  it("loads nothing from a third-party host", () => {
    for (const [file, text] of Object.entries(stylesheets)) {
      expect(text, file).not.toMatch(THIRD_PARTY);
      expect(text, file).not.toMatch(/@font-face|@import/);
    }
  });
});
