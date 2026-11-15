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
  it("converts volume units", () => {
    expect(run(["1", "gal", "l", "--precision", "10"]).out).toBe(
      "3.785411784\n",
    );
    expect(run(["1", "gal", "l"]).out).toBe("3.78541\n");
    expect(run(["1", "L", "mL"]).out).toBe("1000\n");
    expect(run(["2", "gallons", "litres"]).out).toBe("7.57082\n");
  });
  it("converts temperature units when named", () => {
    for (const [argv, out] of [
      [["100", "c", "f"], "212\n"],
      [["-40", "c", "f"], "-40\n"],
      [["0", "k", "c"], "-273.15\n"],
      [["32", "fahrenheit", "celsius"], "0\n"],
      [["-273.15", "c", "k"], "0\n"],
    ] as const) {
      expect(run([...argv])).toEqual({ code: 0, out, err: "" });
    }
  });
});

describe("conversion errors exit 2", () => {
  it.each([
    ["5", "km", "kg"],
    ["5", "KM", "mi"],
    ["-300", "c", "k"],
    ["-1", "k", "c"],
    ["5", "c", "m"],
    ["1", "kg", "f"],
    ["1", "gal", "kg"],
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
    const heads = ["length", "mass", "temperature", "volume"].map((d) =>
      r.out.indexOf(`${d}\n`),
    );
    expect(heads[0]).toBeGreaterThan(-1);
    expect(heads[1]).toBeGreaterThan(heads[0]!);
    expect(heads[2]).toBeGreaterThan(heads[1]!);
    for (const [i, d] of (
      ["length", "mass", "temperature", "volume"] as const
    ).entries()) {
      for (const u of listUnits(d)) {
        const at = r.out.indexOf(`  ${u.symbol}  ${u.name}`);
        expect(at).toBeGreaterThan(heads[i]!);
        if (i < 3) expect(at).toBeLessThan(heads[i + 1]!);
      }
    }
  });
  it("--list temperature lists only temperature units", () => {
    const r = run(["--list", "temperature"]);
    expect(r.code).toBe(0);
    expect(r.out).toContain("°C");
    expect(r.out).toContain("°F");
    expect(r.out).toContain("K");
    for (const u of listUnits("temperature")) {
      expect(r.out).toContain(`  ${u.symbol}  ${u.name}`);
    }
    for (const d of ["length", "mass"] as const) {
      for (const u of listUnits(d)) {
        expect(r.out).not.toContain(`  ${u.symbol}  ${u.name}`);
      }
    }
  });
  it("--list with an unknown dimension exits 1 naming all four dimensions", () => {
    const r = run(["--list", "bogus"]);
    expect(r.code).toBe(1);
    expect(r.err).toContain("length, mass, temperature or volume");
  });
  it("--list volume lists only volume units", () => {
    const r = run(["--list", "volume"]);
    expect(r.code).toBe(0);
    for (const u of listUnits("volume")) {
      expect(r.out).toContain(`  ${u.symbol}  ${u.name}`);
    }
    for (const d of ["length", "mass", "temperature"] as const) {
      for (const u of listUnits(d)) {
        expect(r.out).not.toContain(`  ${u.symbol}  ${u.name}`);
      }
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
    expect(r.out).toContain("temperature");
    expect(r.out).toContain("--list [length|mass|temperature|volume]");
    expect(r.out).toContain("orbit 1 gal l --precision 10");
    expect(r.out).toContain("orbit 100 c f");
    expect(r.out).toContain("below absolute zero");
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

describe("--json", () => {
  const lines = (s: string) => s.split("\n").filter(Boolean);
  const parse = (s: string) => JSON.parse(s) as Record<string, unknown>;

  it("prints a single JSON object on success", () => {
    expect(run(["5", "km", "mi", "--json"])).toEqual({
      code: 0,
      out: '{"value":5,"from":"km","to":"mi","result":3.10686}\n',
      err: "",
    });
    expect(run(["1e3", "m", "km", "--json"]).out).toBe(
      '{"value":1000,"from":"m","to":"km","result":1}\n',
    );
    expect(run(["-40", "c", "f", "--json"]).out).toBe(
      '{"value":-40,"from":"c","to":"f","result":-40}\n',
    );
    expect(run(["12", "in", "cm", "--precision", "3", "--json"]).out).toBe(
      '{"value":12,"from":"in","to":"cm","result":30.5}\n',
    );
  });
  it("accepts the flag anywhere, before a negative value too", () => {
    expect(run(["--json", "5", "km", "mi"]).code).toBe(0);
    expect(run(["--json", "-5", "km", "m"]).out).toContain('"result":-5000');
  });
  it("result matches the plain output", () => {
    for (const argv of [
      ["5", "km", "mi"],
      ["1", "gal", "l"],
      ["100", "c", "f"],
    ]) {
      const plain = run(argv).out;
      const json = parse(run([...argv, "--json"]).out);
      expect(json.result).toBe(Number(plain));
    }
  });
  it.each([
    ["5", "km", "kg"],
    ["5", "foo", "mi"],
    ["1e308", "km", "mm"],
  ])("conversion error %s %s %s: exit 2, JSON on stderr", (...argv) => {
    const r = run([...argv, "--json"]);
    expect(r.code).toBe(2);
    expect(r.out).toBe("");
    expect(lines(r.err)).toHaveLength(1);
    expect(typeof parse(r.err).error).toBe("string");
  });
  it.each([
    [["5", "km", "--json"]],
    [["1", "km", "mi", "--precision", "0", "--json"]],
    [["--bogus", "--json"]],
  ])("usage error %j: exit 1 with hint", (argv) => {
    const r = run(argv);
    expect(r.code).toBe(1);
    expect(r.out).toBe("");
    expect(lines(r.err)).toHaveLength(1);
    expect(parse(r.err).error).toContain('Run "orbit --help" for usage.');
  });
  it("never emits ANSI in JSON mode", () => {
    const tty = { isStdoutTTY: true, isStderrTTY: true, env: {} };
    for (const argv of [
      ["5", "km", "mi", "--json"],
      ["5", "km", "kg", "--json"],
      ["5", "km", "--json"],
    ]) {
      const r = run(argv, tty);
      expect(r.out + r.err).not.toMatch(ANSI);
    }
  });
  it("leaves --help and --list as plain text", () => {
    expect(run(["--help", "--json"]).out).toBe(run(["--help"]).out);
    expect(run(["--list", "mass", "--json"]).out).toBe(
      run(["--list", "mass"]).out,
    );
    expect(run(["--help"]).out).toContain("--json");
  });
  it("only honours --json before the -- terminator", () => {
    const after = run(["--", "5", "km", "mi", "--json"]);
    expect(after.code).toBe(1);
    expect(after.out).toBe("");
    expect(() => {
      JSON.parse(after.err);
    }).toThrow();
    const before = run(["--json", "--", "5", "km", "mi"]);
    expect(before.code).toBe(0);
    expect(before.out).toBe(
      '{"value":5,"from":"km","to":"mi","result":3.10686}\n',
    );
  });
});
