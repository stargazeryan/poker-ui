import { describe, expect, it } from "vitest";
import { contrastRatio, flatten, mostVisible, parseColor, relativeLuminance } from "../src/color";

describe("parseColor", () => {
  it("reads hex in 3, 4, 6 and 8 digits", () => {
    expect(parseColor("#fff")).toEqual({ r: 255, g: 255, b: 255, a: 1 });
    expect(parseColor("#f00")).toEqual({ r: 255, g: 0, b: 0, a: 1 });
    expect(parseColor("#ecf0f1")).toEqual({ r: 236, g: 240, b: 241, a: 1 });
    expect(parseColor("#00000000")).toEqual({ r: 0, g: 0, b: 0, a: 0 });
    expect(parseColor("#ff000080")?.a).toBeCloseTo(0.5, 1);
  });

  it("reads rgb() and rgba(), comma- or space-separated", () => {
    expect(parseColor("rgb(1, 2, 3)")).toEqual({ r: 1, g: 2, b: 3, a: 1 });
    expect(parseColor("rgba(1, 2, 3, 0.5)")).toEqual({ r: 1, g: 2, b: 3, a: 0.5 });
    expect(parseColor("rgb(1 2 3 / 0.25)")).toEqual({ r: 1, g: 2, b: 3, a: 0.25 });
  });

  it("returns null rather than guessing", () => {
    expect(parseColor("var(--color-felt)")).toBeNull();
    expect(parseColor("rebeccapurple")).toBeNull();
    expect(parseColor("color-mix(in oklab, red, blue)")).toBeNull();
    expect(parseColor("")).toBeNull();
    expect(parseColor("#12345")).toBeNull();
  });
});

describe("relativeLuminance", () => {
  it("anchors black and white", () => {
    expect(relativeLuminance("#000")).toBeCloseTo(0, 5);
    expect(relativeLuminance("#fff")).toBeCloseTo(1, 5);
  });

  it("uses the WCAG curve, not a naive channel average", () => {
    // mid-grey is ~0.216, not 0.5
    expect(relativeLuminance("#808080")).toBeCloseTo(0.216, 3);
    // channels are weighted: green is most of the luminance
    expect(relativeLuminance("#00ff00")).toBeCloseTo(0.7152, 3);
    expect(relativeLuminance("#0000ff")).toBeCloseTo(0.0722, 3);
  });

  it("is null when the colour cannot be read", () => {
    expect(relativeLuminance("var(--x)")).toBeNull();
  });
});

describe("contrastRatio", () => {
  it("runs 1 to 21", () => {
    expect(contrastRatio("#000", "#fff")).toBeCloseTo(21, 1);
    expect(contrastRatio("#888", "#888")).toBeCloseTo(1, 5);
  });

  it("composites a translucent foreground first", () => {
    // 90% white over the white chip is nearly invisible - this is the number that
    // showed the chip edge spots were broken
    expect(contrastRatio("rgba(255,255,255,0.9)", "#ecf0f1")).toBeCloseTo(1.13, 1);
    expect(contrastRatio("rgba(255,255,255,0.9)", "#1a1a2e")).toBeGreaterThan(10);
  });

  it("is symmetric about which colour is the background", () => {
    expect(contrastRatio("#1a1a2e", "#ecf0f1")).toBeCloseTo(contrastRatio("#ecf0f1", "#1a1a2e")!, 6);
  });

  it("is null when either colour is unreadable", () => {
    expect(contrastRatio("var(--x)", "#fff")).toBeNull();
    expect(contrastRatio("#fff", "var(--x)")).toBeNull();
  });
});

describe("flatten", () => {
  it("mixes by alpha", () => {
    expect(flatten("rgba(255,255,255,0.5)", "#000000")).toEqual({ r: 127.5, g: 127.5, b: 127.5, a: 1 });
    expect(flatten("#fff", "#000")).toEqual({ r: 255, g: 255, b: 255, a: 1 });
  });

  it("is null when either colour is unreadable", () => {
    expect(flatten("var(--x)", "#000")).toBeNull();
    expect(flatten("#fff", "var(--x)")).toBeNull();
  });
});

describe("mostVisible", () => {
  const inks = ["rgba(255,255,255,0.9)", "rgba(0,0,0,0.45)"] as const;

  it("picks the candidate with the higher measured contrast", () => {
    expect(mostVisible(inks, "#1a1a2e")).toBe("rgba(255,255,255,0.9)");
    expect(mostVisible(inks, "#ecf0f1")).toBe("rgba(0,0,0,0.45)");
    // a mid grey is the interesting case a luminance threshold gets wrong
    expect(mostVisible(inks, "#808080")).toBe("rgba(255,255,255,0.9)");
  });

  it("falls back to the first candidate when it cannot measure", () => {
    expect(mostVisible(["a", "b"], "var(--x)")).toBe("a");
    expect(mostVisible(inks, "var(--color-chip-white)")).toBe("rgba(255,255,255,0.9)");
  });
});
