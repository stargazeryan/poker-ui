import { describe, expect, it } from "vitest";
import { nextSeatIndex } from "../src/seat";
import { BB, formatBB } from "../src/format";

describe("nextSeatIndex", () => {
  it("steps forward and wraps around", () => {
    expect(nextSeatIndex(0, 6)).toBe(1);
    expect(nextSeatIndex(5, 6)).toBe(0);
    expect(nextSeatIndex(2, 3)).toBe(0);
  });

  it("steps backwards", () => {
    expect(nextSeatIndex(0, 6, { dir: -1 })).toBe(5);
    expect(nextSeatIndex(3, 6, { dir: -1 })).toBe(2);
  });

  it("skips seats and wraps", () => {
    const out = new Set([1, 2]);
    expect(nextSeatIndex(0, 4, { skip: (i) => out.has(i) })).toBe(3);
    expect(nextSeatIndex(3, 4, { skip: (i) => out.has(i) })).toBe(0);
  });

  it("returns the starting seat when every other seat is skipped", () => {
    expect(nextSeatIndex(2, 4, { skip: () => true })).toBe(2);
  });

  it("normalises a negative or out-of-range current index", () => {
    expect(nextSeatIndex(-1, 4)).toBe(0);
    expect(nextSeatIndex(9, 4)).toBe(2);
  });

  it("never returns a skipped seat for any starting point", () => {
    const out = new Set([1]);
    for (let i = 0; i < 5; i++) {
      expect(out.has(nextSeatIndex(i, 5, { skip: (x) => out.has(x) }))).toBe(false);
    }
  });

  it("handles a single seat", () => {
    expect(nextSeatIndex(0, 1)).toBe(0);
  });

  it("stays in range for degenerate counts", () => {
    expect(nextSeatIndex(0, 0)).toBe(0);
    expect(nextSeatIndex(3, NaN)).toBe(0);
    expect(nextSeatIndex(3, -2)).toBe(0);
  });
});

describe("formatBB", () => {
  it("formats whole big blinds without decimals", () => {
    expect(formatBB(BB)).toBe("1 BB");
    expect(formatBB(BB * 100)).toBe("100 BB");
    expect(formatBB(0)).toBe("0 BB");
  });

  it("formats fractions with one decimal", () => {
    expect(formatBB(BB / 2)).toBe("0.5 BB");
    expect(formatBB(30)).toBe("1.5 BB");
  });

  it("keeps the sign", () => {
    expect(formatBB(-BB * 3)).toBe("-3 BB");
  });
});
