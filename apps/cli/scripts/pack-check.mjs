// Packs @orbit/sdk and @orbit/cli, checks the cli tarball's contents, installs
// both into a scratch project outside the workspace and runs the `orbit` bin.
// Run `pnpm build` first. Uses Node built-ins only.
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
  const expected = new Set([
    "package.json",
    "README.md",
    "LICENSE",
    ...listFiles(distDir, "dist/"),
  ]);
  const actual = new Set(
    run("tar", ["-tzf", tgz], work)
      .split("\n")
      .filter((line) => line !== "" && !line.endsWith("/"))
      .map((line) => line.replace(/^package\//, "")),
  );
  const unexpected = [...actual].filter((f) => !expected.has(f));
  const missing = [...expected].filter((f) => !actual.has(f));
  if (unexpected.length > 0) fail(`unexpected files: ${unexpected.join(", ")}`);
  if (missing.length > 0) fail(`missing files: ${missing.join(", ")}`);
}

function orbit(scratch, args) {
  const r = spawnSync(join(scratch, "node_modules", ".bin", "orbit"), args, {
    cwd: scratch,
    encoding: "utf8",
  });
  return r;
}

function checkConsumer(sdkTgz, cliTgz, scratch) {
  // pnpm rewrites the cli's workspace:* to 0.0.0; the override keeps npm from
  // reaching a registry for it.
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
  const bad = orbit(scratch, ["5", "km", "kg"]);
  if (bad.status !== 2 || bad.stdout !== "" || bad.stderr === "") {
    fail(`orbit 5 km kg: expected exit 2 with stderr, got exit ${bad.status}`);
  } else {
    console.log("  orbit 5 km kg -> exit 2");
  }
}

if (!existsSync(distDir) || !existsSync(join(sdkDir, "dist"))) {
  fail("dist/ is missing; run `pnpm build` first");
} else {
  const work = mkdtempSync(join(tmpdir(), "orbit-cli-pack-"));
  const scratch = mkdtempSync(join(tmpdir(), "orbit-cli-scratch-"));
  try {
    const sdkTgz = pack(sdkDir, work);
    const cliTgz = pack(pkgDir, work);
    checkTarball(cliTgz, work);
    run("tar", ["-xzf", cliTgz, "-C", work, "package/package.json"], work);
    const manifest = JSON.parse(
      readFileSync(join(work, "package", "package.json"), "utf8"),
    );
    if (manifest.bin?.orbit !== "dist/bin.js")
      fail("bin.orbit is not dist/bin.js");
    checkConsumer(sdkTgz, cliTgz, scratch);
    if (process.exitCode !== 1) console.log("pack:check passed");
  } catch (error) {
    fail(
      error instanceof Error
        ? error.stderr?.toString() || error.message
        : String(error),
    );
  } finally {
    rmSync(work, { recursive: true, force: true });
    rmSync(scratch, { recursive: true, force: true });
  }
}
