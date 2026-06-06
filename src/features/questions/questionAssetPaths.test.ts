import { describe, expect, it } from "vitest";
import { resolvePublicAssetPath } from "./questionAssetPaths";

describe("resolvePublicAssetPath", () => {
  it("prefixes root-relative public asset paths with the Vite base URL", () => {
    expect(resolvePublicAssetPath("/assets/diagrams/example.png", "/HSCMathsDB/")).toBe(
      "/HSCMathsDB/assets/diagrams/example.png"
    );
  });

  it("keeps root deployment asset paths root-relative", () => {
    expect(resolvePublicAssetPath("/assets/diagrams/example.png", "/")).toBe("/assets/diagrams/example.png");
  });

  it("does not rewrite external asset URLs", () => {
    expect(resolvePublicAssetPath("https://example.test/diagram.png", "/HSCMathsDB/")).toBe(
      "https://example.test/diagram.png"
    );
  });
});
