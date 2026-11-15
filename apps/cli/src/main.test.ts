import { describe, expect, it } from "vitest";
import { listUnits } from "@orbit/sdk";
import { main, type Io } from "./main.js";

const ANSI = new RegExp(`${String.fromCharCode(27)}\\[`);

function run(argv: string[], opts: Partial<Io> = {}) {
  let out = "";
  let err = "";
  const io: Io = {
    stdout: { write: (s) => (out += s) },
    stderr: { write: (s) => (err += s) },
    isStdoutTTY: false,
    isStderrTTY: false,
    env: {},
    ...opts,
  };
  const code = main(argv, io);
  return { code, out, err };
}

describe("conversion", () => {
  it("converts and prints 6 significant digits", () => {
    expect(run(["5", "km", "mi"])).toEqual({
      code: 0,
      out: "3.10686\n",
      err: "",
    });
  });
  it("honours --precision and -p", () => {
    expect(run(["12", "in", "cm", "--precision", "3"]).out).toBe("30.5\n");
    expect(run(["12", "in", "cm", "-p", "3"]).out).toBe("30.5\n");
  });
  it("accepts negative, exponent and fractional values", () => {
    expect(run(["-5", "km", "m"]).out).toBe("-5000\n");
    expect(run(["1e3", "m", "km"]).out).toBe("1\n");
    expect(run(["0.5", "km", "m"]).out).toBe("500\n");
  });
  it("converts temperature units when named", () => {
    expect(run(["100", "c", "f"]).out).toBe("212\n");
  });
});

describe("conversion errors exit 2", () => {
  it.each([
    ["5", "km", "kg"],
    ["5", "KM", "mi"],
    ["-300", "c", "k"],
  ])("%s %s %s", (...argv) => {
    const r = run(argv);
    expect(r.code).toBe(2);
    expect(r.out).toBe("");
    expect(r.err).not.toBe("");
  });
});

describe("overflow", () => {
  it("exits 2 instead of printing Infinity", () => {
    const r = run(["1e308", "km", "mm"]);
    expect(r.code).toBe(2);
    expect(r.out).toBe("");
    expect(r.err).not.toBe("");
  });
});

describe("usage errors exit 1", () => {
  it.each([
    [["5", "km"]],
    [["abc", "km", "mi"]],
    [["1", "km", "mi", "--precision", "0"]],
    [["1", "km", "mi", "--precision", "22"]],
    [["1", "km", "mi", "--precision", "1.5"]],
    [["--bogus"]],
    [["--list", "foo"]],
    [["km", "-5", "mi"]],
    [["km", "mi", "-5"]],
    [["5", "-3", "km"]],
  ])("%j", (argv) => {
    const r = run(argv);
    expect(r.code).toBe(1);
    expect(r.out).toBe("");
    expect(r.err).toContain("orbit --help");
  });
});

describe("--list and --help", () => {
  it("lists every unit under its dimension", () => {
    const r = run(["--list"]);
    expect(r.code).toBe(0);
    expect(r.out).toContain("length");
    expect(r.out).toContain("mass");
    const split = r.out.indexOf("mass\n");
    // The CLI lists length and mass only; temperature is not offered here.
    expect(r.out).not.toContain("temperature");
    expect(r.out).not.toContain("celsius");
    for (const u of [...listUnits("length"), ...listUnits("mass")]) {
      const at = r.out.indexOf(`  ${u.symbol}  ${u.name}`);
      expect(at).toBeGreaterThan(-1);
      expect(u.dimension === "mass" ? at > split : at < split).toBe(true);
    }
  });
  it("--list mass omits length units", () => {
    const r = run(["--list", "mass"]);
    expect(r.out).not.toContain("length");
    for (const u of listUnits("length")) {
      expect(r.out).not.toContain(`  ${u.symbol}  ${u.name}`);
    }
  });
  it("--help prints usage and exit codes", () => {
    const r = run(["--help"]);
    expect(r.code).toBe(0);
    expect(r.out).toContain("orbit <value> <from> <to>");
    expect(r.out).toContain("orbit 12 in cm --precision 3");
    expect(r.out).toContain("2  conversion error");
  });
});

describe("colour", () => {
  it("never colours conversion stdout", () => {
    expect(run(["5", "km", "mi"], { isStdoutTTY: true }).out).not.toMatch(ANSI);
  });
  it("colours stderr on a TTY unless NO_COLOR is set", () => {
    expect(run(["5", "km", "kg"], { isStderrTTY: true }).err).toMatch(ANSI);
    expect(
      run(["5", "km", "kg"], { isStderrTTY: true, env: { NO_COLOR: "1" } }).err,
    ).not.toMatch(ANSI);
    expect(run(["5", "km", "kg"]).err).not.toMatch(ANSI);
  });
  it("colours --list headings only on a TTY", () => {
    expect(run(["--list"], { isStdoutTTY: true }).out).toMatch(ANSI);
    expect(run(["--list"]).out).not.toMatch(ANSI);
  });
});
