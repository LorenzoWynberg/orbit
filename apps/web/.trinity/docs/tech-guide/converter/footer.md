# Footer

`src/footer.ts` exports `mountFooter(doc)`, called from `src/main.ts`. It appends `<footer class="site-footer">` to `body` showing "Chrome extension: " followed by `<span id="extension-name">`.

The name is read from `public/manifest.json` (imported with `?raw` and parsed), so renaming the extension in the manifest changes the footer. The call is idempotent: if a `footer.site-footer` already exists, it does nothing.

`src/footer.test.ts` expects the literal name `orbit` rather than reading the manifest, so a manifest rename must update the test.
