# Footer

`src/footer.ts` exports `mountFooter(doc)`, called from `src/main.ts`. It appends `<footer class="site-footer">` to `body` showing "Chrome extension: " followed by `<span id="extension-name">`.

The name is read from `public/manifest.json` (imported with `?raw` and parsed), so renaming the extension in the manifest changes the footer. The call is idempotent: if a `footer.site-footer` already exists, it does nothing.

The footer's link paragraphs, in order, are CLI on npm, Source on GitHub, Report an issue, Changelog and Docs. Docs links to `https://github.com/LorenzoWynberg/orbit#readme`.

`src/footer.test.ts` derives `expectedName` from `public/manifest.json` (imported with `?raw`), so a manifest rename needs no test edit.
