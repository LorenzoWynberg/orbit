import { log, error } from "node:console";
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { exit } from "node:process";
import { fileURLToPath } from "node:url";
import { zipSync } from "fflate";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist-extension");
const out = join(root, "orbit-chrome-extension.zip");

execFileSync("pnpm", ["exec", "vite", "build", "--mode", "extension"], {
  cwd: root,
  stdio: "inherit",
});

if (!existsSync(join(dist, "manifest.json"))) {
  error("dist-extension/manifest.json is missing; nothing to zip");
  exit(1);
}

const files = {};
const walk = (dir) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else files[relative(dist, full).split(sep).join("/")] = readFileSync(full);
  }
};
walk(dist);

writeFileSync(out, zipSync(files));
log(`wrote ${relative(root, out)} (${Object.keys(files).length} files)`);
