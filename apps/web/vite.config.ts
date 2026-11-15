import { defineConfig } from "vite";

// The Runner assigns the dev port through PORT. Bind to it and fail loudly if
// it is taken, rather than hopping to another port nobody can reach.
const parsed = Number.parseInt(process.env.PORT ?? "", 10);
const port = Number.isInteger(parsed) && parsed > 0 ? parsed : 5173;
const serverOpts = { port, strictPort: true };

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
        server: serverOpts,
        preview: serverOpts,
      }
    : {
        base: "/orbit/",
        build: { modulePreload: false },
        server: serverOpts,
        preview: serverOpts,
      },
);
