// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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

function pickPrecision(value: string): void {
  const select = field<HTMLSelectElement>("precision");
  select.value = value;
  select.dispatchEvent(new Event("change", { bubbles: true }));
}

const result = (): string => field("result").textContent;
const formula = (): HTMLElement => field("formula");
const message = (): HTMLElement => field("converter-error");

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
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
        "nm µm mm cm m km Mm in ft yd mi nmi µg mg g kg Mg t gr oz lb st".split(
          " ",
        ),
      );
      expect(field(id).querySelectorAll("option")).toHaveLength(22);
      expect(options[0]?.textContent).toBe("nm — nanometre");
    },
  );
});

describe("temperature units", () => {
  it("are not offered, and a URL naming them falls back inline", () => {
    load("?from=°C&to=K");
    expect(field<HTMLSelectElement>("from").value).toBe("km");
    expect(field<HTMLSelectElement>("to").value).toBe("mi");
    expect(message().textContent).toBe('Unknown unit "°C". Unknown unit "K"');
    expect(result()).toBe("");
  });
});

describe("volume units", () => {
  it("are not offered, and a URL naming them falls back inline", () => {
    load("?from=gal&to=L");
    expect(field<HTMLSelectElement>("from").value).toBe("km");
    expect(field<HTMLSelectElement>("to").value).toBe("mi");
    expect(message().textContent).toBe('Unknown unit "gal". Unknown unit "L"');
    for (const id of ["from", "to"])
      for (const o of field<HTMLSelectElement>(id).options)
        expect(["L", "mL", "gal"]).not.toContain(o.value);
  });
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

describe("unit memory", () => {
  const KEY = "orbit:web:units";
  const selected = (): string[] => [
    field<HTMLSelectElement>("from").value,
    field<HTMLSelectElement>("to").value,
  ];

  it("stores the pair when either unit changes", () => {
    load();
    pick("from", "lb");
    pick("to", "kg");
    expect(JSON.parse(localStorage.getItem(KEY) ?? "null")).toEqual({
      from: "lb",
      to: "kg",
    });
  });

  it("stores the swapped pair", () => {
    load();
    document.querySelector<HTMLButtonElement>("#swap")?.click();
    expect(JSON.parse(localStorage.getItem(KEY) ?? "null")).toEqual({
      from: "mi",
      to: "km",
    });
  });

  it("reopens on a stored pair with no query and shows a result", () => {
    localStorage.setItem(KEY, JSON.stringify({ from: "lb", to: "kg" }));
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    load();
    expect(selected()).toEqual(["lb", "kg"]);
    expect(result()).toBe("0.453592");
    expect(message().hidden).toBe(true);
    expect(setItem).not.toHaveBeenCalled();
  });

  it("lets a query with units win over storage", () => {
    localStorage.setItem(KEY, JSON.stringify({ from: "lb", to: "kg" }));
    load("?to=m");
    expect(selected()).toEqual(["km", "m"]);
  });

  it.each([
    ["bad JSON", "{nope"],
    ["a non-object", "7"],
    ["a null", "null"],
    ["a missing to", '{"from":"lb"}'],
    ["a non-string from", '{"from":3,"to":"kg"}'],
    ["a temperature", '{"from":"°C","to":"kg"}'],
    ["an unknown from", '{"from":"xyz","to":"kg"}'],
    ["an unknown to", '{"from":"lb","to":"xyz"}'],
    ["mixed dimensions", '{"from":"km","to":"kg"}'],
  ])("falls back silently on %s", (_name, stored) => {
    localStorage.setItem(KEY, stored);
    load();
    expect(selected()).toEqual(["km", "mi"]);
    expect(message().hidden).toBe(true);
    expect(result()).toBe("0.621371");
  });

  it("falls back when nothing is stored", () => {
    load();
    expect(selected()).toEqual(["km", "mi"]);
    expect(message().hidden).toBe(true);
  });

  it("survives getItem throwing", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(() => load()).not.toThrow();
    expect(selected()).toEqual(["km", "mi"]);
    expect(message().hidden).toBe(true);
  });

  it("survives the localStorage getter throwing", () => {
    const original = Object.getOwnPropertyDescriptor(window, "localStorage");
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get() {
        throw new Error("denied");
      },
    });
    try {
      expect(() => load()).not.toThrow();
      expect(selected()).toEqual(["km", "mi"]);
      pick("to", "m");
      expect(result()).toBe("1000");
    } finally {
      if (original) Object.defineProperty(window, "localStorage", original);
      else Reflect.deleteProperty(window, "localStorage");
    }
  });

  it("keeps converting when setItem throws", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    const logged = vi.spyOn(console, "error");
    load("?value=5");
    expect(() => pick("to", "m")).not.toThrow();
    expect(result()).toBe("5000");
    expect(location.search).toBe("?value=5&from=km&to=m");
    document.querySelector<HTMLButtonElement>("#swap")?.click();
    expect(result()).toBe("0.005");
    expect(message().hidden).toBe(true);
    expect(logged).not.toHaveBeenCalled();
  });
});

describe("decimal places", () => {
  it("leaves the default output unchanged", () => {
    load("?value=100&from=mi&to=km");
    expect(field<HTMLSelectElement>("precision").value).toBe("");
    expect(result()).toBe("160.934");
    expect(location.search).not.toContain("precision");
  });

  it.each([
    ["4", "160.9344"],
    ["0", "161"],
    ["6", "160.934400"],
  ])("shows 100 mi in km at %s places as %s", (places, expected) => {
    load("?value=100&from=mi&to=km");
    pickPrecision(places);
    expect(result()).toBe(expected);
  });

  it("writes precision to the URL and removes it on No rounding", () => {
    load("?value=100&from=mi&to=km");
    pickPrecision("4");
    expect(new URLSearchParams(location.search).get("precision")).toBe("4");
    pickPrecision("");
    expect(new URLSearchParams(location.search).has("precision")).toBe(false);
    expect(result()).toBe("160.934");
  });

  it("restores precision from the link", () => {
    load("?value=100&from=mi&to=km&precision=3");
    expect(field<HTMLSelectElement>("precision").value).toBe("3");
    load("?value=1.5&from=km&to=km&precision=3");
    expect(result()).toBe("1.500");
  });

  it.each(["7", "-1", "2.5", "abc"])(
    "falls back to No rounding for precision=%s without an error",
    (bad) => {
      load(`?value=100&from=mi&to=km&precision=${bad}`);
      expect(field<HTMLSelectElement>("precision").value).toBe("");
      expect(result()).toBe("160.934");
      expect(message().hidden).toBe(true);
      expect(message().textContent).toBe("");
      expect(field("precision").hasAttribute("aria-invalid")).toBe(false);
    },
  );
});

describe("formula", () => {
  it.each([
    ["mi", "km", "1 mi = 1.609344 km"],
    ["km", "mi", "1 km = 0.621371 mi"],
    ["nm", "km", "1 nm = 1e-12 km"],
    ["km", "m", "1 km = 1000 m"],
    ["km", "km", "1 km = 1 km"],
  ])("shows %s to %s", (from, to, text) => {
    load(`?value=7&from=${from}&to=${to}`);
    expect(formula().textContent).toBe(text);
    expect(formula().hidden).toBe(false);
  });

  it("ignores the value and the precision", () => {
    load("?value=1&from=mi&to=km");
    const text = formula().textContent;
    const exact = result();
    pickPrecision("2");
    expect(result()).not.toBe(exact);
    pickPrecision("0");
    expect(result()).toBe("2");
    type("5");
    expect(formula().textContent).toBe(text);
  });

  it("follows a swap", () => {
    load("?value=1&from=mi&to=km");
    field<HTMLButtonElement>("swap").click();
    expect(formula().textContent).toBe("1 km = 0.621371 mi");
  });

  it("hides a shown formula when the input turns invalid, and shows it again on recovery", () => {
    load("?value=1&from=km&to=mi");
    expect(formula().hidden).toBe(false);
    type("");
    expect(formula().hidden).toBe(true);
    expect(formula().textContent).toBe("");
    type("abc");
    expect(formula().hidden).toBe(true);
    pick("to", "kg");
    expect(formula().hidden).toBe(true);
    expect(formula().textContent).toBe("");
    type("2");
    pick("to", "m");
    expect(formula().hidden).toBe(false);
    expect(formula().textContent).toBe("1 km = 1000 m");
  });

  it.each([
    ["empty value", "?value=&from=km&to=mi"],
    ["non-number", "?value=abc&from=km&to=mi"],
    ["incompatible units", "?value=1&from=km&to=kg"],
    ["unknown unit", "?value=1&from=zz&to=mi"],
  ])("is hidden and empty for %s", (_name, search) => {
    load(search);
    expect(formula().hidden).toBe(true);
    expect(formula().textContent).toBe("");
  });
});
