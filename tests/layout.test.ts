import { describe, expect, it } from "vitest";
import {
  DEFAULT_MARGIN_X,
  DEFAULT_MARGIN_Y,
  DEFAULT_SEAT_GAP,
  DESIGN_H,
  DESIGN_W,
} from "../src/components/CardTable";
import { minSeatSeparation, layoutSeats, type LayoutOptions } from "../src/layout";

const base: LayoutOptions = {
  count: 6,
  designWidth: DESIGN_W,
  designHeight: DESIGN_H,
  marginX: DEFAULT_MARGIN_X,
  marginY: DEFAULT_MARGIN_Y,
  feltGap: 11,
  seatWidth: 160,
  seatHeight: 176,
  seatGap: 0,
  startAngle: 90,
};

describe("tableRadii / layoutSeats — design box", () => {
  it("reproduces the historical 1200x900 geometry exactly", () => {
    const l = layoutSeats(base);
    // 1200/2 - 164 and 900/2 - 196
    expect(l.tableRx).toBeCloseTo(436, 6);
    expect(l.tableRy).toBeCloseTo(254, 6);
    expect(l.cx).toBe(600);
    expect(l.cy).toBe(450);
    // ring = tableRx - feltGap + seatW/2 + 6
    expect(l.ringRx).toBeCloseTo(511, 6);
    expect(l.ringRy).toBeCloseTo(337, 6);
    expect(l.seatW).toBe(160);
    expect(l.seatH).toBe(176);
  });

  it("puts seat 0 directly below the centre", () => {
    const l = layoutSeats(base);
    expect(l.seats[0].x).toBeCloseTo(l.cx, 6);
    expect(l.seats[0].y).toBeGreaterThan(l.cy);
    expect(l.seats[0].y).toBeCloseTo(l.cy + l.ringRy, 6);
  });

  it("keeps every seat frame inside the design box", () => {
    for (const count of [2, 3, 4, 5, 6, 7, 8, 9, 10]) {
      for (const startAngle of [0, 30, 90, 137]) {
        const l = layoutSeats({ ...base, count, startAngle });
        for (const s of l.seats) {
          expect(s.x - s.width / 2, `seat ${s.index} of ${count} @ ${startAngle}`).toBeGreaterThanOrEqual(-0.001);
          expect(s.x + s.width / 2, `seat ${s.index} of ${count} @ ${startAngle}`).toBeLessThanOrEqual(DESIGN_W + 0.001);
          expect(s.y - s.height / 2, `seat ${s.index} of ${count} @ ${startAngle}`).toBeGreaterThanOrEqual(-0.001);
          expect(s.y + s.height / 2, `seat ${s.index} of ${count} @ ${startAngle}`).toBeLessThanOrEqual(DESIGN_H + 0.001);
        }
      }
    }
  });
});

describe("minSeatSeparation", () => {
  it("is Infinity below two seats and positive when frames are apart", () => {
    expect(minSeatSeparation([])).toBe(Infinity);
    expect(minSeatSeparation([{ index: 0, x: 0, y: 0, width: 10, height: 10 }])).toBe(Infinity);
    const apart = minSeatSeparation([
      { index: 0, x: 0, y: 0, width: 10, height: 10 },
      { index: 1, x: 30, y: 0, width: 10, height: 10 },
    ]);
    expect(apart).toBeCloseTo(20, 6);
  });

  it("goes negative when frames overlap", () => {
    const overlap = minSeatSeparation([
      { index: 0, x: 0, y: 0, width: 10, height: 10 },
      { index: 1, x: 5, y: 0, width: 10, height: 10 },
    ]);
    expect(overlap).toBeCloseTo(-5, 6);
  });
});

describe("seat crowding across the seat counts", () => {
  it("never overlaps at the default frame size, and stays above DEFAULT_SEAT_GAP", () => {
    const measured: Record<number, number> = {};
    for (const count of [2, 3, 4, 5, 6, 7, 8, 9, 10]) {
      const measuredGap = minSeatSeparation(layoutSeats({ ...base, count }).seats);
      measured[count] = Math.round(measuredGap * 10) / 10;
      expect(measuredGap, `${count} seats`).toBeGreaterThan(0);
    }
    // Regression pins for the numbers the audit reported (6 -> 161, 10 -> 25.6).
    expect(measured[6]).toBeCloseTo(161, 0);
    expect(measured[10]).toBeCloseTo(25.6, 0);
    expect(measured[10]).toBeGreaterThanOrEqual(DEFAULT_SEAT_GAP);
    expect(measured[2]).toBeCloseTo(498, 0);
  });

  it("shrinks oversized frames so they never overlap (200x220 at 10 seats used to overlap)", () => {
    const withoutShrink = minSeatSeparation(layoutSeats({ ...base, count: 10, seatWidth: 200, seatHeight: 220 }).seats);
    expect(withoutShrink).toBeLessThan(0);

    const withShrink = layoutSeats({
      ...base,
      count: 10,
      seatWidth: 200,
      seatHeight: 220,
      seatGap: DEFAULT_SEAT_GAP,
    });
    expect(minSeatSeparation(withShrink.seats)).toBeGreaterThanOrEqual(DEFAULT_SEAT_GAP);
    expect(withShrink.seatW).toBeLessThan(200);
    expect(withShrink.seatH).toBeLessThan(220);
    // Never shrinks below the documented floor.
    expect(withShrink.seatW).toBeGreaterThanOrEqual(Math.round(200 * 0.5));
  });

  it("leaves wide tables untouched (2–8 seats pass on the first step)", () => {
    for (const count of [2, 3, 4, 5, 6, 7, 8]) {
      const l = layoutSeats({ ...base, count, seatGap: DEFAULT_SEAT_GAP });
      expect(l.seatW, `${count} seats`).toBe(160);
      expect(l.seatH, `${count} seats`).toBe(176);
    }
  });

  it("gives 9–10 seat tables more room when the caller asks for a larger clearance", () => {
    const tight = layoutSeats({ ...base, count: 10, seatGap: DEFAULT_SEAT_GAP });
    const roomy = layoutSeats({ ...base, count: 10, seatGap: 48 });
    expect(minSeatSeparation(roomy.seats)).toBeGreaterThanOrEqual(48);
    expect(roomy.seatW).toBeLessThan(tight.seatW);
    expect(roomy.seatH).toBeLessThan(tight.seatH);
  });

  it("lays out 11–16 seats without overlapping, and says where it gives up", () => {
    // The auto-shrink is what makes these possible, so the seatGap has to be the
    // real one - seatGap: 0 would disable the shrink and leave 160px frames.
    for (const count of [11, 12, 14, 16]) {
      const l = layoutSeats({ ...base, count, seatGap: DEFAULT_SEAT_GAP });
      expect(l.seatW, `${count} seats`).toBeLessThan(160);
      expect(l.seatW, `${count} seats`).toBeGreaterThanOrEqual(Math.round(160 * 0.5));
      expect(minSeatSeparation(l.seats), `${count} seats`).toBeGreaterThan(0);
    }
  });

  it("does not pretend it can fit an unbounded number of seats", () => {
    // the documented limit: past ~16 the frames sit on the 50% floor and overlap
    const huge = layoutSeats({ ...base, count: 20, seatGap: DEFAULT_SEAT_GAP });
    expect(huge.seatW).toBe(Math.round(160 * 0.5));
    expect(minSeatSeparation(huge.seats)).toBeLessThan(0);
  });

  it("treats seatGap <= 0 as disabled", () => {
    const l = layoutSeats({ ...base, count: 10, seatGap: 0 });
    expect(l.seatW).toBe(160);
    expect(l.seatH).toBe(176);
  });
});

describe("proportional margins", () => {
  it("scales the rail inset with the design box instead of collapsing it", () => {
    const wide = layoutSeats({ ...base, designWidth: 1600, designHeight: 900 });
    // 1600/2 - 0.1367*1600
    expect(wide.tableRx).toBeCloseTo(800 - DEFAULT_MARGIN_X * 1600, 6);
    const narrow = layoutSeats({ ...base, designWidth: 640, designHeight: 900 });
    expect(narrow.tableRx).toBeCloseTo(320 - DEFAULT_MARGIN_X * 640, 6);
    expect(narrow.tableRx).toBeGreaterThan(0);
  });

  it("clamps the seat ring to the design box in narrow layouts", () => {
    const narrow = layoutSeats({ ...base, designWidth: 640, designHeight: 900 });
    expect(narrow.ringRx).toBeLessThanOrEqual(640 / 2 - narrow.seatW / 2 + 0.001);
    for (const s of narrow.seats) {
      expect(s.x - s.width / 2).toBeGreaterThanOrEqual(-0.001);
      expect(s.x + s.width / 2).toBeLessThanOrEqual(640 + 0.001);
    }
  });
});
