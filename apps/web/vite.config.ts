import { defineConfig } from "vite";

// GitHub Pages serves the project site from /orbit/. The Chrome extension
// popup is loaded from its own folder, so its build uses relative URLs.
export default defineConfig(({ mode }) =>
  mode === "extension"
    ? {
        base: "./",
        build: {
          outDir: "dist-extension",
          emptyOutDir: true,
          modulePreload: false,
        },
      }
    : { base: "/orbit/", build: { modulePreload: false } },
);
