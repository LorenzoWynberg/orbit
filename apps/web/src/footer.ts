import manifestText from "../public/manifest.json?raw";

const name = (JSON.parse(manifestText) as { name: string }).name;

/** Appends the footer naming the Chrome extension, once, after `main`. */
export function mountFooter(doc: Document): void {
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
  doc.body.append(footer);
}
