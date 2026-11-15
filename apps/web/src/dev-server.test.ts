// @vitest-environment node
import { createServer as createNetServer } from "node:net";
import type { AddressInfo, Server as NetServer } from "node:net";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { createServer, type ViteDevServer } from "vite";

const root = fileURLToPath(new URL("..", import.meta.url));
const configFile = fileURLToPath(new URL("../vite.config.ts", import.meta.url));
const originalPort = process.env.PORT;

// Ports a sandboxed runner can both bind and reach; ephemeral ports may not be.
const candidates = Array.from({ length: 10 }, (_, i) => 5174 + i);

let vite: ViteDevServer | undefined;
let blocker: NetServer | undefined;

const listenOn = (server: NetServer, port: number): Promise<void> =>
  new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => resolve());
  });

async function claimPort(server: NetServer): Promise<number> {
  for (const port of candidates) {
    try {
      await listenOn(server, port);
      return port;
    } catch {
      // taken, try the next one
    }
  }
  throw new Error("no free port in range");
}

async function freePort(): Promise<number> {
  const s = createNetServer();
  const port = await claimPort(s);
  await new Promise((r) => s.close(r));
  return port;
}

const start = () =>
  createServer({
    root,
    configFile,
    logLevel: "silent",
    server: { host: "127.0.0.1" },
  });

afterEach(async () => {
  await vite?.close();
  vite = undefined;
  await new Promise((r) => (blocker ? blocker.close(r) : r(undefined)));
  blocker = undefined;
  if (originalPort === undefined) delete process.env.PORT;
  else process.env.PORT = originalPort;
});

describe("web dev server", () => {
  it("binds to PORT and serves the app under /orbit/", async () => {
    const port = await freePort();
    process.env.PORT = String(port);
    vite = await start();
    await vite.listen();
    expect((vite.httpServer!.address() as AddressInfo).port).toBe(port);
    const res = await fetch(`http://127.0.0.1:${port}/orbit/`);
    expect(res.status).toBe(200);
    expect(await res.text()).toContain("<h1>orbit</h1>");
  });

  it("fails instead of hopping when PORT is taken", async () => {
    blocker = createNetServer();
    const port = await claimPort(blocker);
    process.env.PORT = String(port);
    vite = await start();
    await expect(vite.listen()).rejects.toThrow();
  });
});
