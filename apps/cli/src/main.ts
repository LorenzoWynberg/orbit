import { parseArgs, styleText } from "node:util";
import pkg from "../package.json" with { type: "json" };
import {
  BelowAbsoluteZeroError,
  convert,
  IncompatibleDimensionError,
  listUnits,
  UnknownUnitError,
  type Dimension,
} from "@orbit/sdk";

export interface Stream {
  write(chunk: string): unknown;
}

export interface Io {
  stdout: Stream;
  stderr: Stream;
  isStdoutTTY: boolean;
  isStderrTTY: boolean;
  env: Record<string, string | undefined>;
}

const DIMENSIONS: readonly Dimension[] = [
  "length",
  "mass",
  "temperature",
  "volume",
  "speed",
];
const DEFAULT_PRECISION = 6;

const USAGE = `orbit - convert length, mass, temperature, volume and speed units

Usage:
  orbit <value> <from> <to> [--precision <n>] [--json]
  orbit --list [length|mass|temperature|volume|speed]
  orbit --version
  orbit --help

Arguments:
  <value>  the number to convert (negative numbers and 1e3 are accepted)
  <from>   the unit to convert from (symbol, name or alias)
  <to>     the unit to convert to

Options:
  -p, --precision <n>  significant digits, 1 to 21 (default ${DEFAULT_PRECISION})
  -l, --list [dim]     list the units, optionally for one dimension
  --json               print the result as JSON (errors as {"error":...} on stderr)
  -v, --version        print the CLI version
  -h, --help           show this help

Examples:
  orbit 5 km mi
  orbit 12 in cm --precision 3
  orbit 100 c f
  orbit -40 c f
  orbit 1 gal l --precision 10
  orbit 100 kmh mph
  orbit --list mass
  orbit --list speed

Exit codes:
  0  success
  1  usage error
  2  conversion error (unknown unit, incompatible dimensions, or a value below absolute zero)
`;

class UsageError extends Error {}

// parseArgs reads "-5" as a short option, so numeric-looking tokens are
// pulled out as positionals first; a token after --precision stays with it.
function splitArgs(argv: string[]): { rest: string[]; numbers: string[] } {
  const rest: string[] = [];
  const numbers: string[] = [];
  let afterTerminator = false;
  let sawPositional = false;
  argv.forEach((token, i) => {
    const prev = argv[i - 1];
    const isOptionValue = prev === "--precision" || prev === "-p";
    // Only a negative number in the leading value slot is lifted; anywhere
    // else it stays put and parseArgs rejects it as an unknown option.
    if (
      !afterTerminator &&
      !isOptionValue &&
      !sawPositional &&
      /^-(\d|\.\d)/.test(token) &&
      Number.isFinite(Number(token))
    ) {
      numbers.push(token);
      sawPositional = true;
    } else {
      if (token === "--") afterTerminator = true;
      else if (!isOptionValue && !token.startsWith("-")) sawPositional = true;
      rest.push(token);
    }
  });
  return { rest, numbers };
}

function parsePrecision(raw: string | undefined): number {
  if (raw === undefined) return DEFAULT_PRECISION;
  const n = /^\d+$/.test(raw) ? Number(raw) : NaN;
  if (!(n >= 1 && n <= 21)) {
    throw new UsageError(
      `Invalid precision "${raw}": expected an integer from 1 to 21.`,
    );
  }
  return n;
}

function parseValue(raw: string): number {
  const n = raw.trim() === "" ? NaN : Number(raw.trim());
  if (!Number.isFinite(n)) {
    throw new UsageError(`Invalid value "${raw}": expected a finite number.`);
  }
  return n;
}

function paint(
  io: Io,
  stream: "stdout" | "stderr",
  format: Parameters<typeof styleText>[0],
  text: string,
): string {
  const tty = stream === "stdout" ? io.isStdoutTTY : io.isStderrTTY;
  if (!tty || (io.env["NO_COLOR"] ?? "") !== "") return text;
  return styleText(format, text, { validateStream: false });
}

function jsonMode(argv: string[]): boolean {
  const end = argv.indexOf("--");
  return (end === -1 ? argv : argv.slice(0, end)).includes("--json");
}

function writeError(
  io: Io,
  json: boolean,
  message: string,
  hint?: string,
): void {
  if (json) {
    io.stderr.write(
      `${JSON.stringify({ error: hint ? `${message} ${hint}` : message })}\n`,
    );
    return;
  }
  io.stderr.write(`${paint(io, "stderr", "red", message)}\n`);
  if (hint) io.stderr.write(`${hint}\n`);
}

function isConversionError(error: unknown): error is Error {
  return (
    error instanceof UnknownUnitError ||
    error instanceof IncompatibleDimensionError ||
    error instanceof BelowAbsoluteZeroError
  );
}

function listing(io: Io, dimension: Dimension | undefined): string {
  const dims = dimension ? [dimension] : DIMENSIONS;
  return dims
    .map((dim) => {
      const lines = listUnits(dim).map((u) => {
        const aliases =
          u.aliases.length > 0 ? `  (${u.aliases.join(", ")})` : "";
        return `  ${u.symbol}  ${u.name}${aliases}`;
      });
      return [paint(io, "stdout", "bold", dim), ...lines].join("\n");
    })
    .join("\n\n");
}

function run(argv: string[], io: Io, json: boolean): number {
  const { rest, numbers } = splitArgs(argv);
  let parsed;
  try {
    parsed = parseArgs({
      args: rest,
      strict: true,
      allowPositionals: true,
      options: {
        precision: { type: "string", short: "p" },
        list: { type: "boolean", short: "l" },
        help: { type: "boolean", short: "h" },
        json: { type: "boolean" },
        version: { type: "boolean", short: "v" },
      },
    });
  } catch (error) {
    throw new UsageError(
      error instanceof Error ? error.message : String(error),
    );
  }
  const { values } = parsed;
  // Negative numbers were lifted out of position; they only ever lead the value.
  const positionals = [...numbers, ...parsed.positionals];

  if (values.version) {
    io.stdout.write(
      `${json ? JSON.stringify({ version: pkg.version }) : pkg.version}\n`,
    );
    return 0;
  }

  if (values.help) {
    io.stdout.write(USAGE);
    return 0;
  }

  if (values.list) {
    if (positionals.length > 1) {
      throw new UsageError("--list takes at most one dimension.");
    }
    const dim = positionals[0];
    if (dim !== undefined && !DIMENSIONS.includes(dim as Dimension)) {
      throw new UsageError(
        `Unknown dimension "${dim}": expected length, mass, temperature, volume or speed.`,
      );
    }
    io.stdout.write(`${listing(io, dim as Dimension | undefined)}\n`);
    return 0;
  }

  if (positionals.length !== 3) {
    throw new UsageError(
      `Expected <value> <from> <to>, got ${positionals.length} argument(s).`,
    );
  }
  const [rawValue, from, to] = positionals as [string, string, string];
  const precision = parsePrecision(values.precision);
  const value = parseValue(rawValue);

  try {
    const result = convert(value, from, to);
    if (!Number.isFinite(result)) {
      writeError(
        io,
        json,
        `Result of converting ${rawValue} ${from} to ${to} is too large to represent.`,
      );
      return 2;
    }
    const rounded = Number(result.toPrecision(precision));
    io.stdout.write(
      json
        ? `${JSON.stringify({ value, from, to, result: rounded })}\n`
        : `${String(rounded)}\n`,
    );
    return 0;
  } catch (error) {
    if (isConversionError(error)) {
      writeError(io, json, error.message);
      return 2;
    }
    throw error;
  }
}

export function main(argv: string[], io: Io): number {
  const json = jsonMode(argv);
  try {
    return run(argv, io, json);
  } catch (error) {
    if (error instanceof UsageError) {
      writeError(io, json, error.message, 'Run "orbit --help" for usage.');
      return 1;
    }
    throw error;
  }
}
