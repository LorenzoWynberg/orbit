import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/bin.ts"],
  format: ["esm"],
  target: "es2022",
  clean: true,
  dts: false,
  sourcemap: false,
});
