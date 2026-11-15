# Output and exit codes

Shape: [Argument handling](../tech-guide/cli/arguments.md)

- A successful conversion writes only the bare number and a newline to stdout. No colour, label or unit is ever added to it.
- Colour applies only to `--list` dimension headings (stdout) and error messages (stderr), and only when that stream is a TTY and `NO_COLOR` is empty.
- Exit codes: `0` success, `1` usage error, `2` conversion error (unknown unit, incompatible dimensions, below absolute zero, or a result too large to represent).
- `main(argv, io)` in `src/main.ts` takes injected streams and returns the exit code; only `src/bin.ts` touches `process`. Tests in `src/main.test.ts` enforce the contract.
