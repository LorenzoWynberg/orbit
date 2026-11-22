# Output and exit codes

Shape: [Argument handling](../tech-guide/cli/arguments.md)

- A successful conversion writes only the bare number and a newline to stdout. No colour, label or unit is ever added to it.
- With `--json`, a conversion writes one line `{"value":…,"from":…,"to":…,"result":…}` to stdout, and every error writes `{"error":"<message>"}` (usage errors append the `Run "orbit --help"` hint to the message) to stderr, uncoloured. Exit codes are unchanged. `--json` after a `--` terminator is not recognised. A malformed `--json=1` is rejected by argument parsing and reported as plain text (exit 1).
- With `--places`, output is `toFixed` of the result, so a result with magnitude >= 1e21 prints in exponent form (`1e+22`), matching the web app; `--json` carries the same string in `formatted`. A non-finite result (e.g. Infinity) still exits 2.
- Colour applies only to `--list` dimension headings (stdout) and error messages (stderr), and only when that stream is a TTY and `NO_COLOR` is empty.
- Exit codes: `0` success, `1` usage error, `2` conversion error (unknown unit, incompatible dimensions, below absolute zero, or a result too large to represent).
- `main(argv, io)` in `src/main.ts` takes injected streams and returns the exit code; only `src/bin.ts` touches `process`. Tests in `src/main.test.ts` enforce the contract.
