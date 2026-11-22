import { describe, expect, it } from "vitest";
import { convert, listUnits } from "@orbit/sdk";
import { main, type Io } from "./main.js";
import pkg from "../package.json" with { type: "json" };

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

  it("prints exponent form with --places for results >= 1e21", () => {
    const r = run(["1e22", "m", "m", "--places", "2"]);
    expect(r.code).toBe(0);
    expect(r.out).toBe("1e+22\n");
    expect(r.err).toBe("");
  });

  it("keeps fixed decimals with --places below 1e21", () => {
    const r = run(["1e19", "m", "mm", "--places", "6"]);
    expect(r.code).toBe(0);
    expect(r.out).toBe(
      `${convert(1e19, "m", "mm", { precision: 6 }).toFixed(6)}\n`,
    );
    expect(r.err).toBe("");
  });

  it("emits exponent form in --json with --places", () => {
    const r = run(["1e22", "m", "m", "--places", "2", "--json"]);
    expect(r.code).toBe(0);
    expect(r.out.trim().split("\n")).toHaveLength(1);
    const j = JSON.parse(r.out) as { result: number; formatted: string };
    expect(j.result).toBe(1e22);
    expect(j.formatted).toBe("1e+22");
  });

  it("still exits 2 with --places when the result is Infinity", () => {
    const r = run(["1e308", "km", "mm", "--places", "2"]);
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
    const heads = ["length", "mass", "temperature", "volume", "speed"].map(
      (d) => r.out.indexOf(`${d}\n`),
    );
    expect(heads[0]).toBeGreaterThan(-1);
    expect(heads[1]).toBeGreaterThan(heads[0]!);
    expect(heads[2]).toBeGreaterThan(heads[1]!);
    for (const [i, d] of (
      ["length", "mass", "temperature", "volume", "speed"] as const
    ).entries()) {
      for (const u of listUnits(d)) {
        const at = r.out.indexOf(`  ${u.symbol}  ${u.name}`);
        expect(at).toBeGreaterThan(heads[i]!);
        if (i < 4) expect(at).toBeLessThan(heads[i + 1]!);
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
  it("--list with an unknown dimension exits 1 naming every dimension", () => {
    const r = run(["--list", "bogus"]);
    expect(r.code).toBe(1);
    expect(r.err).toContain("length, mass, temperature, volume or speed");
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
  it("converts speed units, plain and as JSON", () => {
    const plain = run(["100", "kmh", "mph"]);
    expect(plain.out).toBe("62.1371\n");
    expect(plain.code).toBe(0);
    expect(plain.err).toBe("");
    expect(run(["100", "kmh", "mph", "--json"]).out).toBe(
      '{"value":100,"from":"kmh","to":"mph","result":62.1371}\n',
    );
  });
  it("--list speed lists the four speed units with aliases", () => {
    const r = run(["--list", "speed"]);
    expect(r.code).toBe(0);
    expect(r.out).toContain("speed\n");
    expect(r.out).toContain("  km/h  kilometre per hour  (kmh, kph)");
    expect(r.out.trim().split("\n")).toHaveLength(5);
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
    expect(r.out).toContain("--list [length|mass|temperature|volume|speed]");
    expect(r.out).toContain("orbit 100 kmh mph");
    expect(r.out).toContain("orbit --list speed");
    expect(r.out).toContain(
      "convert length, mass, temperature, volume and speed units",
    );
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

describe("--version", () => {
  it.each([["--version"], ["-v"]])("%s prints the version", (flag) => {
    expect(run([flag])).toEqual({
      code: 0,
      out: `${pkg.version}\n`,
      err: "",
    });
  });

  it("prints {version} as one JSON line with --json", () => {
    const r = run(["--version", "--json"]);
    expect(r.code).toBe(0);
    expect(r.out.endsWith("\n")).toBe(true);
    expect(JSON.parse(r.out)).toEqual({ version: pkg.version });
  });

  it.each([
    [["--version", "--help"]],
    [["--version", "--list"]],
    [["5", "km", "mi", "--version"]],
  ])("beats other modes: %j", (argv) => {
    const r = run(argv);
    expect(r.code).toBe(0);
    expect(r.out).toBe(`${pkg.version}\n`);
  });

  it("is plain text on a TTY", () => {
    expect(run(["--version"], { isStdoutTTY: true }).out).not.toMatch(ANSI);
  });

  it("is documented in --help", () => {
    const out = run(["--help"]).out;
    expect(out).toContain("-v, --version");
    expect(out).toContain("orbit --version");
  });
});

describe("--places", () => {
  it("prints zero-padded fixed decimals", () => {
    for (const [argv, out] of [
      [["100", "mi", "km", "--places", "4"], "160.9344\n"],
      [["1", "km", "m", "--places", "2"], "1000.00\n"],
      [["100", "mi", "km", "--places", "0"], "161\n"],
      [["2.5", "m", "m", "--places", "0"], "3\n"],
      [["-2.5", "m", "m", "--places", "0"], "-3\n"],
      [["-40", "c", "f", "--places", "2"], "-40.00\n"],
      [["100", "c", "f", "--places", "1"], "212.0\n"],
    ] as [string[], string][]) {
      expect(run(argv)).toEqual({ code: 0, out, err: "" });
    }
    for (let n = 0; n <= 6; n++) {
      const out = run(["1", "km", "m", "--places", String(n)]).out;
      expect(out).toBe(`${n === 0 ? "1000" : `1000.${"0".repeat(n)}`}\n`);
    }
  });
  it("rejects bad places and conflicts with exit 1", () => {
    for (const bad of ["7", "-1", "1.5", "abc"]) {
      const r = run(["1", "km", "m", "--places", bad]);
      expect(r.code).toBe(1);
      expect(r.err).toContain("0 to 6");
    }
    expect(run(["1", "km", "m", "--places"]).code).toBe(1);
    for (const p of [
      ["--precision", "3"],
      ["-p", "3"],
    ]) {
      const r = run(["1", "km", "m", "--places", "2", ...p]);
      expect(r.code).toBe(1);
      expect(r.err).toContain("cannot be combined");
    }
    expect(run(["1", "km", "m", "-p", "3"]).out).toBe("1000\n");
  });
  it("adds formatted to --json only with places", () => {
    expect(run(["100", "mi", "km", "--places", "4", "--json"]).out).toBe(
      '{"value":100,"from":"mi","to":"km","result":160.9344,"formatted":"160.9344"}\n',
    );
    expect(run(["1", "km", "m", "--places", "2", "--json"]).out).toBe(
      '{"value":1,"from":"km","to":"m","result":1000,"formatted":"1000.00"}\n',
    );
    expect(run(["1", "km", "m", "--json"]).out).not.toContain("formatted");
    const e = run(["1", "km", "m", "--places", "7", "--json"]);
    expect(e.code).toBe(1);
    expect((JSON.parse(e.err) as { error: string }).error).toContain("0 to 6");
  });
  it("is documented in --help", () => {
    const out = run(["--help"]).out;
    expect(out).toContain("[--places <n>]");
    expect(out).toContain("--places <n>  ");
    expect(out).toContain("orbit 100 mi km --places 4");
  });
});
