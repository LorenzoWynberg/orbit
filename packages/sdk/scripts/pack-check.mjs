// Packs @orbit/sdk, checks the tarball's contents, then installs it into a
// scratch project outside the workspace and imports it over ESM and CJS.
// Packing builds dist itself (prepack); dist is deleted first. Uses Node
// built-ins only.
import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const pkgDir = fileURLToPath(new URL("..", import.meta.url));
const distDir = join(pkgDir, "dist");

function fail(message) {
  console.error(`pack:check failed: ${message}`);
  process.exitCode = 1;
}

function listFiles(dir, prefix) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? listFiles(join(dir, entry.name), `${prefix}${entry.name}/`)
      : [`${prefix}${entry.name}`],
  );
}

function collectManifestPaths(manifest) {
  const paths = [];
  for (const field of ["main", "module", "types"]) {
    if (typeof manifest[field] === "string") paths.push(manifest[field]);
  }
  const walk = (value) => {
    if (typeof value === "string") {
      if (value.startsWith("./")) paths.push(value);
    } else if (Array.isArray(value)) {
      value.forEach(walk);
    } else if (value && typeof value === "object") {
      Object.values(value).forEach(walk);
    }
  };
  walk(manifest.exports);
  if (typeof manifest.bin === "string") paths.push(manifest.bin);
  else if (manifest.bin && typeof manifest.bin === "object")
    paths.push(...Object.values(manifest.bin));
  return [...new Set(paths.map((p) => p.replace(/^\.\//, "")))];
}

function run(command, args, cwd) {
  return execFileSync(command, args, { cwd, encoding: "utf8" });
}

function checkTarball(tgz, work) {
  const actual = new Set(
    run("tar", ["-tzf", tgz], work)
      .split("\n")
      .filter((line) => line !== "" && !line.endsWith("/"))
      .map((line) => line.replace(/^package\//, "")),
  );
  run("tar", ["-xzf", tgz, "-C", work, "package/package.json"], work);
  const manifest = JSON.parse(
    readFileSync(join(work, "package", "package.json"), "utf8"),
  );
  for (const path of collectManifestPaths(manifest)) {
    if (!actual.has(path))
      fail(`manifest names ${path} but the tarball lacks it`);
  }
  const expected = new Set([
    "package.json",
    "README.md",
    "LICENSE",
    ...(existsSync(distDir) ? listFiles(distDir, "dist/") : []),
  ]);
  const unexpected = [...actual].filter((f) => !expected.has(f));
  const missing = [...expected].filter((f) => !actual.has(f));
  if (unexpected.length > 0) fail(`unexpected files: ${unexpected.join(", ")}`);
  if (missing.length > 0) fail(`missing files: ${missing.join(", ")}`);
  const leaked = [...actual].filter(
    (f) =>
      f.startsWith("src/") || f.startsWith("scripts/") || /\.test\./.test(f),
  );
  if (leaked.length > 0)
    fail(`source or test files packed: ${leaked.join(", ")}`);
  for (const field of ["dependencies", "peerDependencies"]) {
    if (manifest[field] && "@orbit/core" in manifest[field]) {
      fail(`${field} lists @orbit/core`);
    }
  }
}

function checkConsumer(tgz, scratch) {
  writeFileSync(
    join(scratch, "package.json"),
    JSON.stringify({
      name: "orbit-sdk-consumer",
      private: true,
      type: "module",
    }),
  );
  run(
    "npm",
    [
      "install",
      tgz,
      "--offline",
      "--no-audit",
      "--no-fund",
      "--ignore-scripts",
    ],
    scratch,
  );
  const body = `
if (convert(1, "mi", "km") !== 1.609344) throw new Error("convert(1, mi, km) is wrong");
if (convert(100, "c", "f") !== 212) throw new Error("convert(100, c, f) is wrong");
let caught;
try { convert(1, "xyz", "m"); } catch (error) { caught = error; }
if (!(caught instanceof UnknownUnitError)) throw new Error("UnknownUnitError was not thrown");
`;
  writeFileSync(
    join(scratch, "check.mjs"),
    `import { convert, UnknownUnitError } from "@orbit/sdk";${body}`,
  );
  writeFileSync(
    join(scratch, "check.cjs"),
    `const { convert, UnknownUnitError } = require("@orbit/sdk");${body}`,
  );
  for (const file of ["check.mjs", "check.cjs"]) {
    run(process.execPath, [file], scratch);
    console.log(
      `  ${file}: convert(1, "mi", "km") === 1.609344, convert(100, "c", "f") === 212`,
    );
  }
}

{
  rmSync(distDir, { recursive: true, force: true });
  const work = mkdtempSync(join(tmpdir(), "orbit-sdk-pack-"));
  const scratch = mkdtempSync(join(tmpdir(), "orbit-sdk-scratch-"));
  try {
    run("pnpm", ["pack", "--pack-destination", work], pkgDir);
    const tgzName = readdirSync(work).find((f) => f.endsWith(".tgz"));
    if (!tgzName) throw new Error("pnpm pack produced no tarball");
    const tgz = join(work, tgzName);
    mkdirSync(scratch, { recursive: true });
    checkTarball(tgz, work);
    checkConsumer(tgz, scratch);
    if (process.exitCode !== 1) console.log("pack:check passed");
  } catch (error) {
    fail(
      error instanceof Error
        ? [error.stdout, error.stderr]
            .map((out) => out?.toString())
            .filter(Boolean)
            .join("\n") || error.message
        : String(error),
    );
  } finally {
    rmSync(work, { recursive: true, force: true });
    rmSync(scratch, { recursive: true, force: true });
  }
}
