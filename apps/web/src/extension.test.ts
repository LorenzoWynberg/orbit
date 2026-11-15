// @vitest-environment node
import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { unzipSync } from "fflate";
import { build } from "vite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const root = fileURLToPath(new URL("..", import.meta.url));
const dist = join(root, "dist-extension");
const zipPath = join(root, "orbit-chrome-extension.zip");
const read = (...p: string[]): string => readFileSync(join(...p), "utf8");
const files = (dir: string): string[] =>
  readdirSync(dir, { recursive: true, encoding: "utf8" });

let html = "";
let pagesDir = "";

beforeAll(async () => {
  await build({
    root,
    configFile: join(root, "vite.config.ts"),
    mode: "extension",
    logLevel: "silent",
  });
  html = read(dist, "index.html");
  pagesDir = mkdtempSync(join(tmpdir(), "orbit-pages-"));
  await build({
    root,
    configFile: join(root, "vite.config.ts"),
    mode: "production",
    logLevel: "silent",
    build: { outDir: pagesDir, emptyOutDir: true },
  });
}, 120_000);

afterAll(() => {
  rmSync(pagesDir, { recursive: true, force: true });
  rmSync(zipPath, { force: true });
});

describe("extension manifest", () => {
  const manifest = JSON.parse(read(root, "public", "manifest.json")) as Record<
    string,
    unknown
  >;

  it("is MV3 with a popup that exists in the build and no extra powers", () => {
    expect(manifest["manifest_version"]).toBe(3);
    const action = manifest["action"] as { default_popup: string };
    expect(files(dist)).toContain(action.default_popup);
    for (const key of [
      "permissions",
      "host_permissions",
      "content_scripts",
      "background",
      "content_security_policy",
    ]) {
      expect(manifest).not.toHaveProperty(key);
    }
    expect(Object.keys(manifest["icons"] as object)).toEqual([
      "16",
      "48",
      "128",
    ]);
  });

  it("ships icons of the declared sizes in source and in the build", () => {
    for (const dir of [join(root, "public"), dist]) {
      for (const n of [16, 48, 128]) {
        const png = readFileSync(join(dir, "icons", `icon-${n}.png`));
        expect(png.readUInt32BE(16)).toBe(n);
        expect(png.readUInt32BE(20)).toBe(n);
      }
    }
  });
});

describe("extension build", () => {
  it("uses relative asset URLs and no inline script or handler", () => {
    const urls = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map((m) => m[1]);
    expect(urls.some((u) => u?.startsWith("./assets/"))).toBe(true);
    for (const u of urls) {
      expect(u).not.toMatch(/^\/|^https?:|orbit\//);
    }
    for (const m of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) {
      expect(m[1]?.trim()).toBe("");
    }
    expect(html).not.toMatch(/\son\w+\s*=/i);
  });

  it("emits no eval or Function constructor", () => {
    const js = files(dist).filter((f) => f.endsWith(".js"));
    expect(js.length).toBeGreaterThan(0);
    for (const f of js) {
      const text = read(dist, f);
      expect(text).not.toMatch(/\beval\(|new Function\(/);
    }
  });

  it("fixes the popup width in the stylesheet", () => {
    const css = read(root, "src", "styles", "app.css");
    expect(css).toContain("html.extension");
    expect(css).toContain("360px");
  });

  it("keeps the Pages build under /orbit/", () => {
    const pagesHtml = read(pagesDir, "index.html");
    expect(pagesHtml).toMatch(/src="\/orbit\/assets\//);
  });
});

describe("extension zip", () => {
  it("puts manifest.json at the zip root with the whole build", () => {
    execFileSync("node", ["scripts/zip-extension.mjs"], {
      cwd: root,
      stdio: "pipe",
    });
    const names = Object.keys(unzipSync(readFileSync(zipPath)));
    expect(names).toContain("manifest.json");
    expect(names).toContain("index.html");
    expect(names.some((n) => /^assets\/.+\.js$/.test(n))).toBe(true);
    expect(names.some((n) => /^assets\/.+\.css$/.test(n))).toBe(true);
    for (const n of [16, 48, 128]) {
      expect(names).toContain(`icons/icon-${n}.png`);
    }
  }, 120_000);
});
