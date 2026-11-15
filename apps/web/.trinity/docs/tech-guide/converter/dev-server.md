# Dev server port

The Vite dev and preview servers bind to the port the Runner assigns through the `PORT` environment variable.

- `vite.config.ts` reads `PORT`; an unset, empty or non-positive value falls back to 5173.
- `strictPort` is on for both `server` and `preview`, in the web and extension modes. A taken port fails loudly instead of hopping to a port nobody can reach.
- `pnpm web` is an alias of `pnpm dev` (`vite`), for example `PORT=8035 pnpm --filter @orbit/web web`.
- The web app is served under `/orbit/`.
- `src/dev-server.test.ts` starts Vite against `PORT` and checks both the bind and the failure when the port is taken. It scans ports 5174–5183 because ephemeral ports may be unreachable in a sandbox.
