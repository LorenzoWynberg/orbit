# Converter

`src/converter.ts` exports `mountConverter(doc)`, which wires the form in `index.html` (ids `converter`, `value`, `from`, `to`, `swap`, `converter-error`, `result`). `src/main.ts` calls it.

- Unit selects are filled from `listUnits()` of `@orbit/core`, grouped by dimension in `optgroup`s. `src/converter.ts` filters to a `WEB_DIMENSIONS` allow-list of length and mass, so core's temperature and volume units never reach the page.
- Every `input`/`change` event re-renders the result with `convert()` and formats it with `formatResult` (`src/format.ts`).
- A non-numeric value shows "Enter a number"; `IncompatibleDimensionError` and `UnknownUnitError` messages show inline, with `aria-invalid` and `aria-describedby` on the offending fields. An empty value clears the result.
- URL state: `value`, `from` and `to` query parameters are written with `history.replaceState` (the hash is kept) and restored on load. Defaults are `1`, `km`, `mi`.
- Restore accepts canonical unit symbols only. An unknown unit falls back to its default and is reported inline until the next user event.
- Decimal places: the `precision` select (id `precision`) offers "No rounding" (empty value) and 0–6. With a number chosen, the page calls `convert(..., { precision })` and prints the result with `formatFixed` (`src/format.ts`, `toFixed`, zero-padded, e.g. `1.500`). With "No rounding" it calls `convert` without options and uses `formatResult`. Values of 1e21 and above print in exponent notation, as `toFixed` does.
- The `precision` query parameter is written only when a number is chosen. On load it is accepted only if it matches `0`–`6`; anything else falls back to "No rounding".
- The swap button exchanges the two units.
- Unit memory: `src/unit-memory.ts` keeps the last unit pair in `localStorage` under `orbit:web:units` as `{"from":"lb","to":"kg"}`. It is written on a `from`/`to` change and on swap, never on value input and never on load. No `chrome.storage` or manifest permission is used.
- On load, a query that has `from` or `to` wins and storage is not read. Otherwise the stored pair is used only if both symbols are offered and share a dimension; anything else (missing, bad JSON, unknown or mixed units) falls back silently to `km`/`mi` with no inline error. Storage that throws on read or write is ignored.
