# @orbit/web

The orbit unit converter page. It is deployed to GitHub Pages and reused as the popup of a Chrome extension.

## Chrome extension

Build the popup:

```sh
pnpm --filter @orbit/web build:extension
```

This writes `apps/web/dist-extension/`. To try it, open `chrome://extensions`, turn on Developer mode, choose **Load unpacked** and pick that folder.

Package it for the Chrome Web Store:

```sh
pnpm --filter @orbit/web zip:extension
```

This builds the extension and writes `apps/web/orbit-chrome-extension.zip` with `manifest.json` at the zip root.
