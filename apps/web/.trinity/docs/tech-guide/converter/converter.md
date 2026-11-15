# Converter

`src/converter.ts` exports `mountConverter(doc)`, which wires the form in `index.html` (ids `converter`, `value`, `from`, `to`, `swap`, `converter-error`, `result`). `src/main.ts` calls it.

- Unit selects are filled from `listUnits()` of `@orbit/core`, grouped by dimension in `optgroup`s.
- Every `input`/`change` event re-renders the result with `convert()` and formats it with `formatResult` (`src/format.ts`).
- A non-numeric value shows "Enter a number"; `IncompatibleDimensionError` and `UnknownUnitError` messages show inline, with `aria-invalid` and `aria-describedby` on the offending fields. An empty value clears the result.
- URL state: `value`, `from` and `to` query parameters are written with `history.replaceState` (the hash is kept) and restored on load. Defaults are `1`, `km`, `mi`.
- Restore accepts canonical unit symbols only. An unknown unit falls back to its default and is reported inline until the next user event.
- The swap button exchanges the two units.
