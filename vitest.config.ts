import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["packages/*/src/**/*.test.ts", "apps/*/src/**/*.test.ts"],
    // Style sources are read as text by their tests (`?raw`), so CSS must not be stubbed.
    css: { include: [/\.css(\?|$)/] },
  },
});
