import manifestText from "../public/manifest.json?raw";

const name = (JSON.parse(manifestText) as { name: string }).name;

/** Appends the footer naming the Chrome extension, once, after `main`. */
export function mountFooter(
  doc: Document,
  options: { mode?: string } = {},
): void {
  const { mode = "extension" } = options;
  if (doc.querySelector("footer.site-footer")) return;
  const footer = doc.createElement("footer");
  footer.className = "site-footer";
  const p = doc.createElement("p");
  p.append("Chrome extension: ");
  const span = doc.createElement("span");
  span.id = "extension-name";
  span.textContent = name;
  p.append(span);
  footer.append(p);
  if (mode !== "extension") {
    const cliP = doc.createElement("p");
    const a = doc.createElement("a");
    a.href = "https://www.npmjs.com/package/@orbit/cli";
    a.textContent = "CLI on npm";
    cliP.append(a);
    footer.append(cliP);
    const srcP = doc.createElement("p");
    const src = doc.createElement("a");
    src.href = "https://github.com/LorenzoWynberg/orbit";
    src.textContent = "Source on GitHub";
    srcP.append(src);
    footer.append(srcP);
    const issuesP = doc.createElement("p");
    const issues = doc.createElement("a");
    issues.href = "https://github.com/LorenzoWynberg/orbit/issues";
    issues.textContent = "Report an issue";
    issuesP.append(issues);
    footer.append(issuesP);
  }
  doc.body.append(footer);
}
