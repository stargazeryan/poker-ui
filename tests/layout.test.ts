import { describe, expect, it } from "vitest";
import {
  DEFAULT_MARGIN_X,
  DEFAULT_MARGIN_Y,
  DEFAULT_SEAT_GAP,
  DESIGN_H,
  DESIGN_W,
} from "../src/layout";
import { GLOW_GAP, RIM_GAP } from "../src/layout";
import { layoutSeats, layoutTable, minSeatSeparation, type LayoutOptions } from "../src/layout";
import { perimeterFrames, ringFrames } from "../src/frames";

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

describe("every drawn ellipse comes from one place", () => {
  it("derives the boxes from the same centre and radii", () => {
    const l = layoutSeats(base);
    const cx = base.designWidth / 2;
    const cy = base.designHeight / 2;

    expect(l.boxes.table.top).toBeCloseTo(cy - l.tableRy, 6);
    expect(l.boxes.table.left).toBeCloseTo(cx - l.tableRx, 6);
    // symmetric
    expect(l.boxes.table.right).toBeCloseTo(l.boxes.table.left, 6);
    expect(l.boxes.table.bottom).toBeCloseTo(l.boxes.table.top, 6);
    // felt, rim and glow are the table inset by their own gap
    expect(l.boxes.felt.top).toBeCloseTo(l.boxes.table.top + base.feltGap, 6);
    expect(l.boxes.felt.left).toBeCloseTo(l.boxes.table.left + base.feltGap, 6);
    expect(l.boxes.rim.top).toBeCloseTo(l.boxes.table.top + RIM_GAP, 6);
    expect(l.boxes.glow.top).toBeCloseTo(l.boxes.table.top + GLOW_GAP, 6);
  });

  it("draws no ring of its own — the layout has no betting line in it", () => {
    // 0.7.0 always computed `betRx` / `betRy` / `boxes.bettingLine`, so every
    // game got a betting ring whether it had betting or not. The layout now
    // carries the surface and the seats and nothing else; a ring is asked for.
    expect(Object.keys(layoutTable(base).boxes).sort()).toEqual(["felt", "glow", "rim", "table"]);
    expect("betRx" in layoutTable(base)).toBe(false);
  });

  it("traces a declared ring at the radius it was given", () => {
    const l = layoutTable(base);
    for (const radius of [0.2, 0.5, 0.72, 1]) {
      const box = l.ringBox(radius);
      expect((base.designWidth - box.left - box.right) / 2, `radius ${radius}`).toBeCloseTo(l.tableRx * radius, 6);
      expect((base.designHeight - box.top - box.bottom) / 2, `radius ${radius}`).toBeCloseTo(l.tableRy * radius, 6);
    }
  });

  it("clamps a nonsense ring radius instead of drawing off the table", () => {
    const l = layoutTable(base);
    expect(l.ringBox(9).top).toBeCloseTo(l.boxes.table.top, 6);
    expect(l.ringBox(-3).top).toBeCloseTo(l.boxes.table.top + l.tableRy, 6);
  });
});

describe("table shapes", () => {
  it("defaults to an ellipse, drawn with a 50% border-radius", () => {
    const l = layoutTable(base);
    expect(l.shape).toBe("ellipse");
    expect(l.radius).toBe("50%");
    expect(l.seatPlacement).toBe("ring");
  });

  it("draws a rectangle with a real corner radius, and walks its perimeter", () => {
    const l = layoutTable({ ...base, shape: "rect" });
    expect(l.shape).toBe("rect");
    expect(l.radius).toMatch(/^\d+(\.\d+)?px$/);
    expect(l.seatPlacement).toBe("perimeter");
    // Same surface as the ellipse: the shape changes the drawing, not the box.
    expect(l.tableRx).toBeCloseTo(layoutTable(base).tableRx, 6);
    // Corners are actually reached: the widest seat is left of the centre.
    expect(Math.min(...l.seats.map((s) => s.x))).toBeLessThan(l.cx);
    expect(Math.max(...l.seats.map((s) => s.x))).toBeGreaterThan(l.cx);
  });

  it("can draw no surface at all, and lays the seats out in a row instead", () => {
    const l = layoutTable({ ...base, shape: "none" });
    expect(l.radius).toBe("0px");
    expect(l.seatPlacement).toBe("row");
    // A row: every seat shares a baseline.
    const ys = new Set(l.seats.map((s) => Math.round(s.y)));
    expect(ys.size).toBe(1);
    expect([...ys][0]).toBeGreaterThan(l.cy);
  });

  it("lets the placement be overridden independently of the shape", () => {
    const row = layoutTable({ ...base, shape: "ellipse", seatPlacement: "row" });
    expect(row.shape).toBe("ellipse");
    expect(new Set(row.seats.map((s) => Math.round(s.y))).size).toBe(1);

    const rectRing = layoutTable({ ...base, shape: "rect", seatPlacement: "ring" });
    expect(rectRing.seatPlacement).toBe("ring");
    expect(rectRing.seats[0].y).toBeCloseTo(rectRing.cy + rectRing.ringRy, 6);
  });
});

describe("frame placement strategies", () => {
  it("ringFrames and the layout's ring agree", () => {
    const l = layoutTable(base);
    const direct = ringFrames({
      count: 6,
      cx: l.cx,
      cy: l.cy,
      rx: l.ringRx,
      ry: l.ringRy,
      width: l.seatW,
      height: l.seatH,
      startAngle: 90,
    });
    expect(direct.map((s) => [s.x, s.y])).toEqual(l.seats.map((s) => [s.x, s.y]));
  });

  it("perimeterFrames spaces by arc length, so a corner does not bunch them up", () => {
    // On a wide rectangle an angle-based walk would put four seats in the
    // corners and none along the long edges.
    const frames = perimeterFrames({ count: 4, cx: 600, cy: 450, halfW: 400, halfH: 250, width: 0, height: 0 });
    // Seat 0 is the bottom edge's centre; seat 1 is halfway up the left edge.
    expect(frames[0].x).toBeCloseTo(600, 6);
    expect(frames[0].y).toBeCloseTo(700, 6);
    expect(frames[1].x).toBeCloseTo(200, 6);
    expect(frames[1].y).toBeCloseTo(450, 6);
    expect(frames[2].x).toBeCloseTo(600, 6);
    expect(frames[2].y).toBeCloseTo(200, 6);
    expect(frames[3].x).toBeCloseTo(1000, 6);
    expect(frames[3].y).toBeCloseTo(450, 6);
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
