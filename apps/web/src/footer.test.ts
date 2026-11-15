// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from "vitest";
import { mountFooter } from "./footer.js";

describe("mountFooter", () => {
  beforeEach(() => {
    document.body.innerHTML = "<main></main>";
  });

  it("shows the extension name after main", () => {
    mountFooter(document);
    const footer = document.querySelector("footer.site-footer");
    expect(footer?.previousElementSibling?.tagName).toBe("MAIN");
    expect(document.getElementById("extension-name")?.textContent).toBe(
      "orbit",
    );
    expect(footer?.textContent).toBe("Chrome extension: orbit");
  });

  it("mounts only once", () => {
    mountFooter(document);
    mountFooter(document);
    expect(document.querySelectorAll("footer.site-footer")).toHaveLength(1);
  });
});
