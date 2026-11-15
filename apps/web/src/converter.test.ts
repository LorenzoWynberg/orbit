// @vitest-environment happy-dom
import { listUnits } from "@orbit/core";
import { afterEach, describe, expect, it, vi } from "vitest";
import indexHtml from "../index.html?raw";
import { mountConverter } from "./converter.js";

/** The real page body, minus its module script, mounted at `/orbit/<search>`. */
function load(search = ""): void {
  history.replaceState(null, "", `/orbit/${search}`);
  const body = /<body[^>]*>([\s\S]*)<\/body>/.exec(indexHtml)?.[1] ?? "";
  document.body.innerHTML = body.replace(/<script[\s\S]*?<\/script>/g, "");
  mountConverter(document);
}

function field<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`#${id} missing`);
  return el as T;
}

function type(value: string): void {
  const input = field<HTMLInputElement>("value");
  input.value = value;
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

function pick(id: "from" | "to", symbol: string): void {
  const select = field<HTMLSelectElement>(id);
  select.value = symbol;
  select.dispatchEvent(new Event("change", { bubbles: true }));
}

const result = (): string => field("result").textContent;
const message = (): HTMLElement => field("converter-error");

afterEach(() => {
  vi.restoreAllMocks();
});

describe("units", () => {
  it.each(["from", "to"] as const)(
    "%s holds one option per unit, grouped by dimension",
    (id) => {
      load();
      const groups = [...field(id).querySelectorAll("optgroup")];
      expect(groups.map((g) => g.label)).toEqual(["length", "mass"]);
      const options = groups.flatMap((g) => [...g.querySelectorAll("option")]);
      expect(options.map((o) => o.value)).toEqual(
        listUnits().map((u) => u.symbol),
      );
      expect(field(id).querySelectorAll("option")).toHaveLength(
        listUnits().length,
      );
      expect(options[0]?.textContent).toBe("nm — nanometre");
    },
  );
});

describe("live conversion", () => {
  it("converts as you type and as the units change, with no submit", () => {
    load();
    type("5");
    expect(result()).toBe("3.10686");
    pick("to", "m");
    expect(result()).toBe("5000");
  });

  it("shows no result and no error for an empty value", () => {
    load();
    type("   ");
    expect(result()).toBe("");
    expect(message().hidden).toBe(true);
  });

  it("does not submit the form", () => {
    load();
    const submit = new Event("submit", { bubbles: true, cancelable: true });
    field("converter").dispatchEvent(submit);
    expect(submit.defaultPrevented).toBe(true);
  });
});

describe("URL state", () => {
  it("rewrites the query on every change without adding history entries", () => {
    load();
    const replace = vi.spyOn(history, "replaceState");
    const entries = history.length;
    type("5");
    expect(replace).toHaveBeenCalledTimes(1);
    expect(location.search).toBe("?value=5&from=km&to=mi");
    pick("to", "m");
    expect(replace).toHaveBeenCalledTimes(2);
    expect(location.search).toBe("?value=5&from=km&to=m");
    expect(history.length).toBe(entries);
  });

  it("restores value, from, to and the result from the query", () => {
    load("?value=7&from=m&to=ft");
    expect(field<HTMLInputElement>("value").value).toBe("7");
    expect(field<HTMLSelectElement>("from").value).toBe("m");
    expect(field<HTMLSelectElement>("to").value).toBe("ft");
    expect(result()).toBe("22.9659");
  });

  it("falls back to 1 km → mi with no query", () => {
    load();
    expect(field<HTMLInputElement>("value").value).toBe("1");
    expect(field<HTMLSelectElement>("from").value).toBe("km");
    expect(field<HTMLSelectElement>("to").value).toBe("mi");
    expect(result()).toBe("0.621371");
  });

  it("reports an unknown unit inline, falls back, and clears on the next event", () => {
    load("?from=xyz");
    const from = field<HTMLSelectElement>("from");
    expect(from.value).toBe("km");
    expect(message().hidden).toBe(false);
    expect(message().textContent).toBe('Unknown unit "xyz"');
    expect(from.getAttribute("aria-invalid")).toBe("true");
    expect(from.getAttribute("aria-describedby")).toBe("converter-error");
    expect(result()).toBe("");
    expect(location.search).toBe("?from=xyz");

    type("2");
    expect(message().hidden).toBe(true);
    expect(from.hasAttribute("aria-invalid")).toBe(false);
    expect(result()).toBe("1.24274");
  });
});

describe("errors", () => {
  it("flags a value that is not a number", () => {
    load();
    type("abc");
    const input = field<HTMLInputElement>("value");
    expect(message().textContent).toBe("Enter a number");
    expect(message().hidden).toBe(false);
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.getAttribute("aria-describedby")).toBe(message().id);
    expect(result()).toBe("");

    type("3");
    expect(input.hasAttribute("aria-invalid")).toBe(false);
    expect(input.hasAttribute("aria-describedby")).toBe(false);
    expect(message().hidden).toBe(true);
  });

  it("flags units of different dimensions on both selects", () => {
    load();
    type("5");
    pick("to", "kg");
    expect(message().textContent).toBe(
      "Cannot convert length (km) to mass (kg)",
    );
    for (const id of ["from", "to"]) {
      const select = field(id);
      expect(select.getAttribute("aria-invalid")).toBe("true");
      expect(select.getAttribute("aria-describedby")).toBe(message().id);
    }
    expect(field("value").hasAttribute("aria-invalid")).toBe(false);
    expect(result()).toBe("");
  });
});

describe("overflow", () => {
  it("reports a result too large instead of showing Infinity", () => {
    load("?value=1e308&from=km&to=m");
    expect(message().textContent).toBe("Result is too large to represent");
    expect(field("value").getAttribute("aria-invalid")).toBe("true");
    expect(result()).toBe("");
  });
});

describe("swap", () => {
  it("exchanges from and to and recomputes", () => {
    load("?value=5&from=km&to=mi");
    expect(result()).toBe("3.10686");
    const swap = document.querySelector<HTMLButtonElement>(
      'button[aria-label="Swap units"]',
    );
    swap?.click();
    expect(field<HTMLSelectElement>("from").value).toBe("mi");
    expect(field<HTMLSelectElement>("to").value).toBe("km");
    expect(result()).toBe("8.04672");
    expect(location.search).toBe("?value=5&from=mi&to=km");
  });
});
