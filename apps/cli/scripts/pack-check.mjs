// Packs @orbit/sdk and @orbit/cli, checks the cli tarball's contents, installs
// both into a scratch project outside the workspace and runs the `orbit` bin.
// Packing builds dist itself (prepack); both dists are deleted first. Uses
// Node built-ins only.
import { execFileSync, spawnSync } from "node:child_process";
import {
  existsSync,
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
const sdkDir = join(pkgDir, "..", "..", "packages", "sdk");
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

function pack(dir, dest) {
  const before = new Set(readdirSync(dest));
  run("pnpm", ["pack", "--pack-destination", dest], dir);
  const name = readdirSync(dest).find(
    (f) => f.endsWith(".tgz") && !before.has(f),
  );
  if (!name) throw new Error(`pnpm pack produced no tarball for ${dir}`);
  return join(dest, name);
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
  for (const field of [
    "dependencies",
    "peerDependencies",
    "optionalDependencies",
  ]) {
    for (const [name, range] of Object.entries(manifest[field] ?? {})) {
      if (String(range).startsWith("workspace:"))
        fail(`${field}.${name} is still ${range}`);
    }
  }
  return manifest;
}

function orbit(scratch, args) {
  const r = spawnSync(join(scratch, "node_modules", ".bin", "orbit"), args, {
    cwd: scratch,
    encoding: "utf8",
  });
  return r;
}

function checkConsumer(sdkTgz, cliTgz, scratch, manifest) {
  // pnpm rewrites the cli's workspace:* to the sdk's own version; the override
  // keeps npm from reaching a registry for it.
  writeFileSync(
    join(scratch, "package.json"),
    JSON.stringify({
      name: "orbit-cli-consumer",
      private: true,
      type: "module",
      overrides: { "@orbit/sdk": `file:${sdkTgz}` },
    }),
  );
  run(
    "npm",
    [
      "install",
      cliTgz,
      "--offline",
      "--no-audit",
      "--no-fund",
      "--ignore-scripts",
    ],
    scratch,
  );
  const ok = orbit(scratch, ["5", "km", "mi"]);
  if (ok.status !== 0 || ok.stdout !== "3.10686\n") {
    fail(
      `orbit 5 km mi: exit ${ok.status}, stdout ${JSON.stringify(ok.stdout)}`,
    );
  } else {
    console.log("  orbit 5 km mi -> 3.10686");
  }
  const temp = orbit(scratch, ["100", "c", "f"]);
  if (temp.status !== 0 || temp.stdout !== "212\n") {
    fail(
      `orbit 100 c f: exit ${temp.status}, stdout ${JSON.stringify(temp.stdout)}`,
    );
  } else {
    console.log("  orbit 100 c f -> 212");
  }
  const ver = orbit(scratch, ["--version"]);
  if (ver.status !== 0 || ver.stdout !== `${manifest.version}\n`) {
    fail(
      `orbit --version: exit ${ver.status}, stdout ${JSON.stringify(ver.stdout)}`,
    );
  } else {
    console.log(`  orbit --version -> ${manifest.version}`);
  }
  const json = orbit(scratch, ["100", "kmh", "mph", "--json"]);
  let parsed;
  try {
    parsed = JSON.parse(json.stdout);
  } catch {
    parsed = undefined;
  }
  if (
    json.status !== 0 ||
    parsed?.value !== 100 ||
    parsed?.from !== "kmh" ||
    parsed?.to !== "mph" ||
    parsed?.result !== 62.1371
  ) {
    fail(
      `orbit 100 kmh mph --json: exit ${json.status}, stdout ${JSON.stringify(json.stdout)}`,
    );
  } else {
    console.log("  orbit 100 kmh mph --json -> 62.1371");
  }
  const jsonBad = orbit(scratch, ["5", "km", "kg", "--json"]);
  let jsonErr;
  try {
    jsonErr = JSON.parse(jsonBad.stderr);
  } catch {
    jsonErr = undefined;
  }
  if (
    jsonBad.status !== 2 ||
    jsonBad.stdout !== "" ||
    typeof jsonErr?.error !== "string"
  ) {
    fail(
      `orbit 5 km kg --json: exit ${jsonBad.status}, stderr ${JSON.stringify(jsonBad.stderr)}`,
    );
  } else {
    console.log("  orbit 5 km kg --json -> exit 2, JSON error on stderr");
  }
  const bad = orbit(scratch, ["5", "km", "kg"]);
  if (bad.status !== 2 || bad.stdout !== "" || bad.stderr === "") {
    fail(`orbit 5 km kg: expected exit 2 with stderr, got exit ${bad.status}`);
  } else {
    console.log("  orbit 5 km kg -> exit 2");
  }
}

{
  rmSync(distDir, { recursive: true, force: true });
  rmSync(join(sdkDir, "dist"), { recursive: true, force: true });
  const work = mkdtempSync(join(tmpdir(), "orbit-cli-pack-"));
  const scratch = mkdtempSync(join(tmpdir(), "orbit-cli-scratch-"));
  try {
    const sdkTgz = pack(sdkDir, work);
    const cliTgz = pack(pkgDir, work);
    const manifest = checkTarball(cliTgz, work);
    if (manifest.bin?.orbit !== "dist/bin.js")
      fail("bin.orbit is not dist/bin.js");
    const sdkWork = mkdtempSync(join(tmpdir(), "orbit-cli-sdk-manifest-"));
    try {
      run(
        "tar",
        ["-xzf", sdkTgz, "-C", sdkWork, "package/package.json"],
        sdkWork,
      );
      const sdkManifest = JSON.parse(
        readFileSync(join(sdkWork, "package", "package.json"), "utf8"),
      );
      if (manifest.dependencies?.["@orbit/sdk"] !== sdkManifest.version)
        fail(
          `cli depends on @orbit/sdk ${manifest.dependencies?.["@orbit/sdk"]}, sdk is ${sdkManifest.version}`,
        );
    } finally {
      rmSync(sdkWork, { recursive: true, force: true });
    }
    checkConsumer(sdkTgz, cliTgz, scratch, manifest);
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
