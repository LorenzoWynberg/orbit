import {
  convert,
  IncompatibleDimensionError,
  listUnits,
  UnknownUnitError,
  type UnitInfo,
} from "@orbit/core";
import { formatFactor, formatFixed, formatResult } from "./format.js";
import { readUnits, writeUnits } from "./unit-memory.js";

const DEFAULTS = { value: "1", from: "km", to: "mi" } as const;
const ERROR_ID = "converter-error";
/** The dimensions this page offers; core's others (temperature, volume) are not shown yet. */
const WEB_DIMENSIONS = ["length", "mass"] as const;

function webUnits(): UnitInfo[] {
  return WEB_DIMENSIONS.flatMap((dimension) => listUnits(dimension));
}

function required<T extends HTMLElement>(doc: Document, id: string): T {
  const el = doc.getElementById(id);
  if (!el) throw new Error(`#${id} is missing from the page`);
  return el as T;
}

function populate(doc: Document, select: HTMLSelectElement): void {
  const units = webUnits();
  for (const dimension of WEB_DIMENSIONS) {
    const group = doc.createElement("optgroup");
    group.label = dimension;
    for (const unit of units.filter((u) => u.dimension === dimension)) {
      const option = doc.createElement("option");
      option.value = unit.symbol;
      option.textContent = `${unit.symbol} — ${unit.name}`;
      group.append(option);
    }
    select.append(group);
  }
}

/** Wires the converter form in `doc`: live results, inline errors, URL state. */
export function mountConverter(doc: Document): void {
  const form = required<HTMLFormElement>(doc, "converter");
  const valueInput = required<HTMLInputElement>(doc, "value");
  const fromSelect = required<HTMLSelectElement>(doc, "from");
  const toSelect = required<HTMLSelectElement>(doc, "to");
  const precisionSelect = required<HTMLSelectElement>(doc, "precision");
  const swap = required<HTMLButtonElement>(doc, "swap");
  const message = required<HTMLElement>(doc, ERROR_ID);
  const output = required<HTMLOutputElement>(doc, "result");
  const formula = required<HTMLElement>(doc, "formula");
  const fields = [valueInput, fromSelect, toSelect];

  populate(doc, fromSelect);
  populate(doc, toSelect);

  function readPrecision(): number | undefined {
    return precisionSelect.value === ""
      ? undefined
      : Number(precisionSelect.value);
  }

  function clearErrors(): void {
    for (const field of fields) {
      field.removeAttribute("aria-invalid");
      field.removeAttribute("aria-describedby");
    }
    message.textContent = "";
    message.hidden = true;
  }

  function hideFormula(): void {
    formula.textContent = "";
    formula.hidden = true;
  }

  function fail(text: string, culprits: HTMLElement[]): void {
    output.textContent = "";
    hideFormula();
    for (const field of culprits) {
      field.setAttribute("aria-invalid", "true");
      field.setAttribute("aria-describedby", ERROR_ID);
    }
    message.textContent = text;
    message.hidden = false;
  }

  function render(): void {
    clearErrors();
    const raw = valueInput.value.trim();
    if (raw === "") {
      output.textContent = "";
      hideFormula();
      return;
    }
    const n = Number(raw);
    if (!Number.isFinite(n)) {
      fail("Enter a number", [valueInput]);
      return;
    }
    try {
      const places = readPrecision();
      const converted =
        places === undefined
          ? convert(n, fromSelect.value, toSelect.value)
          : convert(n, fromSelect.value, toSelect.value, {
              precision: places,
            });
      if (!Number.isFinite(converted)) {
        fail("Result is too large to represent", [valueInput]);
        return;
      }
      output.textContent =
        places === undefined
          ? formatResult(converted)
          : formatFixed(converted, places);
      const from = fromSelect.value;
      const to = toSelect.value;
      formula.textContent = `1 ${from} = ${formatFactor(convert(1, from, to))} ${to}`;
      formula.hidden = false;
    } catch (error) {
      if (error instanceof IncompatibleDimensionError) {
        fail(error.message, [fromSelect, toSelect]);
      } else if (error instanceof UnknownUnitError) {
        fail(error.message, [
          error.unit === fromSelect.value ? fromSelect : toSelect,
        ]);
      } else {
        throw error;
      }
    }
  }

  function syncUrl(): void {
    const view = doc.defaultView;
    if (!view) return;
    const url = new URL(doc.location.href);
    const query = new URLSearchParams({
      value: valueInput.value.trim(),
      from: fromSelect.value,
      to: toSelect.value,
    });
    if (precisionSelect.value !== "") {
      query.set("precision", precisionSelect.value);
    }
    url.search = query.toString();
    view.history.replaceState(
      null,
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );
  }

  function update(): void {
    render();
    syncUrl();
  }

  // Restore from the query. A unit that is not a symbol falls back to its
  // default and is reported inline until the next user event.
  const params = new URLSearchParams(doc.location.search);
  const symbols = new Set(webUnits().map((u) => u.symbol));
  const rejected: [HTMLSelectElement, string][] = [];
  const restoreUnit = (
    select: HTMLSelectElement,
    name: "from" | "to",
  ): void => {
    const requested = params.get(name);
    if (requested !== null && !symbols.has(requested)) {
      rejected.push([select, new UnknownUnitError(requested).message]);
    }
    select.value =
      requested !== null && symbols.has(requested) ? requested : DEFAULTS[name];
  };
  const requestedPrecision = params.get("precision");
  precisionSelect.value =
    requestedPrecision !== null && /^[0-6]$/.test(requestedPrecision)
      ? requestedPrecision
      : "";
  valueInput.value = params.get("value") ?? DEFAULTS.value;
  if (params.has("from") || params.has("to")) {
    restoreUnit(fromSelect, "from");
    restoreUnit(toSelect, "to");
  } else {
    // No units in the link: reopen on the last pair, if it is still valid.
    const dimensions = new Map(webUnits().map((u) => [u.symbol, u.dimension]));
    const stored = readUnits(doc);
    const usable =
      stored !== null &&
      dimensions.has(stored.from) &&
      dimensions.get(stored.from) === dimensions.get(stored.to);
    fromSelect.value = usable ? stored.from : DEFAULTS.from;
    toSelect.value = usable ? stored.to : DEFAULTS.to;
  }

  if (rejected.length > 0) {
    fail(
      rejected.map(([, text]) => text).join(". "),
      rejected.map(([select]) => select),
    );
  } else {
    render();
  }

  form.addEventListener("input", update);
  form.addEventListener("change", (event) => {
    update();
    if (event.target === fromSelect || event.target === toSelect) {
      writeUnits(doc, fromSelect.value, toSelect.value);
    }
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
  });
  swap.addEventListener("click", () => {
    const from = fromSelect.value;
    fromSelect.value = toSelect.value;
    toSelect.value = from;
    update();
    writeUnits(doc, fromSelect.value, toSelect.value);
  });
}
