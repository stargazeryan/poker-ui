import { describe, expect, it } from "vitest";
import { ellipsePoint, ringPoints, seatAngle } from "../src/geometry";

describe("seatAngle", () => {
  it("puts seat 0 at startAngle and divides 360 evenly", () => {
    expect(seatAngle(0, 6)).toBe(90);
    expect(seatAngle(1, 6)).toBe(150);
    expect(seatAngle(3, 6)).toBe(270);
    expect(seatAngle(0, 2)).toBe(90);
    expect(seatAngle(1, 2)).toBe(270);
  });

  it("spreads 2–10 seats without duplication", () => {
    for (let n = 2; n <= 10; n++) {
      const angles = Array.from({ length: n }, (_, i) => seatAngle(i, n) % 360);
      expect(new Set(angles.map((a) => a.toFixed(6))).size, `${n} seats`).toBe(n);
    }
  });

  it("honours startAngle", () => {
    expect(seatAngle(0, 4, 0)).toBe(0);
    expect(seatAngle(2, 4, 0)).toBe(180);
    expect(seatAngle(0, 4, -90)).toBe(-90);
  });

  it("normalises degenerate seat counts instead of dividing by NaN/0", () => {
    for (const bad of [0, -3, NaN, Infinity, 0.4]) {
      const a = seatAngle(1, bad as number);
      expect(Number.isFinite(a), `seatCount=${String(bad)}`).toBe(true);
    }
    // floor'd, never below 1
    expect(seatAngle(0, 2.9)).toBe(90);
    expect(seatAngle(0, 0)).toBe(90 + 0);
    expect(seatAngle(1, 0)).toBe(90 + 360);
  });
});

describe("ellipsePoint", () => {
  it("places 90° below the centre (screen coordinates)", () => {
    expect(ellipsePoint(300, 200, 120, 80, 90)).toEqual({ x: 300, y: 280 });
  });

  it("places 0° to the right and 180° to the left", () => {
    expect(ellipsePoint(300, 200, 120, 80, 0).x).toBeCloseTo(420, 6);
    expect(ellipsePoint(300, 200, 120, 80, 0).y).toBeCloseTo(200, 6);
    expect(ellipsePoint(300, 200, 120, 80, 180).x).toBeCloseTo(180, 6);
  });

  it("is stable at 360° and negative angles", () => {
    const a = ellipsePoint(10, 20, 30, 40, 20);
    const b = ellipsePoint(10, 20, 30, 40, 380);
    expect(b.x).toBeCloseTo(a.x, 6);
    expect(b.y).toBeCloseTo(a.y, 6);
  });
});

describe("ringPoints", () => {
  it("starts directly below the centre and returns `count` points", () => {
    const pts = ringPoints(4, 300, 200, 120, 80);
    expect(pts).toHaveLength(4);
    // 4 seats -> 90 / 180 / 270 / 0 degrees
    expect(pts[0]).toEqual({ x: 300, y: 280 });
    expect(pts[1].x).toBeCloseTo(300 - 120, 6);
    expect(pts[1].y).toBeCloseTo(200, 6);
    expect(pts[2].x).toBeCloseTo(300, 6);
    expect(pts[2].y).toBeCloseTo(200 - 80, 6);
    expect(pts[3].x).toBeCloseTo(300 + 120, 6);
  });

  it("falls back to a single point for degenerate counts", () => {
    expect(ringPoints(0, 0, 0, 10, 10)).toHaveLength(1);
    expect(ringPoints(-5, 0, 0, 10, 10)).toHaveLength(1);
    expect(ringPoints(NaN, 0, 0, 10, 10)).toHaveLength(1);
  });

  it("agrees with seatAngle + ellipsePoint (the components share one formula)", () => {
    for (const [i, n] of [
      [0, 6],
      [4, 9],
      [9, 10],
    ]) {
      const p = ringPoints(n, 100, 50, 200, 120)[i];
      const q = ellipsePoint(100, 50, 200, 120, seatAngle(i, n));
      expect(p).toEqual(q);
    }
  });
});
