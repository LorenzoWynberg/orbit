// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from "vitest";
import manifestText from "../public/manifest.json?raw";
import { mountFooter } from "./footer.js";

const expectedName = (JSON.parse(manifestText) as { name: string }).name;

describe("mountFooter", () => {
  beforeEach(() => {
    document.body.innerHTML = "<main></main>";
  });

  it("shows the extension name after main", () => {
    expect(typeof expectedName).toBe("string");
    expect(expectedName.length).toBeGreaterThan(0);
    mountFooter(document);
    const footer = document.querySelector("footer.site-footer");
    expect(footer?.previousElementSibling?.tagName).toBe("MAIN");
    expect(document.getElementById("extension-name")?.textContent).toBe(
      expectedName,
    );
    expect(footer?.textContent).toBe(`Chrome extension: ${expectedName}`);
  });

  it("mounts only once", () => {
    mountFooter(document);
    mountFooter(document);
    expect(document.querySelectorAll("footer.site-footer")).toHaveLength(1);
  });
});
