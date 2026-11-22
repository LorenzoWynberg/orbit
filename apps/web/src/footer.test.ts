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

  it("adds the npm and GitHub links in web mode", () => {
    mountFooter(document, { mode: "production" });
    const footer = document.querySelector("footer.site-footer");
    const links = footer?.querySelectorAll("a");
    expect(links).toHaveLength(3);
    expect(links?.[2]?.textContent).toBe("Report an issue");
    expect(links?.[2]?.getAttribute("href")).toBe(
      "https://github.com/LorenzoWynberg/orbit/issues",
    );
    expect(links?.[1]?.textContent).toBe("Source on GitHub");
    expect(links?.[1]?.getAttribute("href")).toBe(
      "https://github.com/LorenzoWynberg/orbit",
    );
    expect(links?.[0]?.textContent).toBe("CLI on npm");
    expect(links?.[0]?.getAttribute("href")).toBe(
      "https://www.npmjs.com/package/@orbit/cli",
    );
    expect(footer?.textContent).toBe(
      `Chrome extension: ${expectedName}CLI on npmSource on GitHubReport an issue`,
    );
  });

  it("has no link in extension mode", () => {
    mountFooter(document, { mode: "extension" });
    const footer = document.querySelector("footer.site-footer");
    expect(footer?.querySelector("a")).toBeNull();
    expect(footer?.textContent).toBe(`Chrome extension: ${expectedName}`);
  });

  it.each(["production", "extension"])(
    "keeps structure and mounts once in %s mode",
    (mode) => {
      mountFooter(document, { mode });
      mountFooter(document, { mode });
      expect(document.querySelectorAll("footer.site-footer")).toHaveLength(1);
      const footer = document.querySelector("footer.site-footer");
      expect(footer?.previousElementSibling?.tagName).toBe("MAIN");
      expect(document.getElementById("extension-name")?.textContent).toBe(
        expectedName,
      );
    },
  );

  it("mounts only once", () => {
    mountFooter(document);
    mountFooter(document);
    expect(document.querySelectorAll("footer.site-footer")).toHaveLength(1);
  });
});
