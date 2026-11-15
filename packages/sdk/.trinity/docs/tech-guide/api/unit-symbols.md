# Listing unit symbols

`listUnitSymbols(dimension)` is implemented in `src/index.ts` and returns the symbols of the units in one `Dimension`, in the order `@orbit/core`'s `listUnits` returns them.

- It returns a new array on every call, so callers may mutate the result.
- It is additive: the existing re-exports from `@orbit/core` are unchanged.
- The implementation lives in the SDK; core is not changed.
