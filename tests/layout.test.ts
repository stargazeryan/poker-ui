import { describe, expect, it } from "vitest";
import {
  DEFAULT_MARGIN_X,
  DEFAULT_MARGIN_Y,
  DEFAULT_SEAT_GAP,
  DESIGN_H,
  DESIGN_W,
  GLOW_GAP,
  RIM_GAP,
  ellipseBox,
  layoutTable,
  seatPoint,
  type LayoutOptions,
} from "../src/layout";
import {
  FRAME_SHRINK_FLOOR,
  fitRowScale,
  gridFrames,
  minFrameSeparation,
  perimeterFrames,
  ringFrames,
} from "../src/frames";
import { insetBox, scaledRadius, type TableSurface } from "../src/surface";
import { ellipsePoint, seatAngle } from "../src/geometry";

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

describe("layoutTable — design box", () => {
  it("reproduces the historical 1200x900 geometry exactly", () => {
    const l = layoutTable(base);
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
    const l = layoutTable(base);
    expect(l.seats[0].x).toBeCloseTo(l.cx, 6);
    expect(l.seats[0].y).toBeGreaterThan(l.cy);
    expect(l.seats[0].y).toBeCloseTo(l.cy + l.ringRy, 6);
  });

  it("keeps every seat frame inside the design box", () => {
    for (const count of [2, 3, 4, 5, 6, 7, 8, 9, 10]) {
      for (const startAngle of [0, 30, 90, 137]) {
        const l = layoutTable({ ...base, count, startAngle });
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
    const l = layoutTable(base);
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

  it("perimeterFrames answers a rectangle that cannot exist instead of walking nowhere", () => {
    // Negative half-extents are a caller's arithmetic going wrong. The walk is
    // by arc length over a perimeter that is negative, so every leg is skipped
    // and the fallback line answers: the bottom edge's centre, finite, not NaN.
    const frames = perimeterFrames({ count: 1, cx: 0, cy: 0, halfW: -10, halfH: -10, width: 0, height: 0 });
    expect(frames).toHaveLength(1);
    expect(frames[0].x).toBe(0);
    expect(frames[0].y).toBe(-10);
    expect(Number.isFinite(frames[0].x) && Number.isFinite(frames[0].y)).toBe(true);
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

describe("minFrameSeparation", () => {
  it("is Infinity below two seats and positive when frames are apart", () => {
    expect(minFrameSeparation([])).toBe(Infinity);
    expect(minFrameSeparation([{ index: 0, x: 0, y: 0, width: 10, height: 10 }])).toBe(Infinity);
    const apart = minFrameSeparation([
      { index: 0, x: 0, y: 0, width: 10, height: 10 },
      { index: 1, x: 30, y: 0, width: 10, height: 10 },
    ]);
    expect(apart).toBeCloseTo(20, 6);
  });

  it("goes negative when frames overlap", () => {
    const overlap = minFrameSeparation([
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
      const measuredGap = minFrameSeparation(layoutTable({ ...base, count }).seats);
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
    const withoutShrink = minFrameSeparation(layoutTable({ ...base, count: 10, seatWidth: 200, seatHeight: 220 }).seats);
    expect(withoutShrink).toBeLessThan(0);

    const withShrink = layoutTable({
      ...base,
      count: 10,
      seatWidth: 200,
      seatHeight: 220,
      seatGap: DEFAULT_SEAT_GAP,
    });
    expect(minFrameSeparation(withShrink.seats)).toBeGreaterThanOrEqual(DEFAULT_SEAT_GAP);
    expect(withShrink.seatW).toBeLessThan(200);
    expect(withShrink.seatH).toBeLessThan(220);
    // Never shrinks below the documented floor.
    expect(withShrink.seatW).toBeGreaterThanOrEqual(Math.round(200 * 0.5));
  });

  it("leaves wide tables untouched (2–8 seats pass on the first step)", () => {
    for (const count of [2, 3, 4, 5, 6, 7, 8]) {
      const l = layoutTable({ ...base, count, seatGap: DEFAULT_SEAT_GAP });
      expect(l.seatW, `${count} seats`).toBe(160);
      expect(l.seatH, `${count} seats`).toBe(176);
    }
  });

  it("gives 9–10 seat tables more room when the caller asks for a larger clearance", () => {
    const tight = layoutTable({ ...base, count: 10, seatGap: DEFAULT_SEAT_GAP });
    const roomy = layoutTable({ ...base, count: 10, seatGap: 48 });
    expect(minFrameSeparation(roomy.seats)).toBeGreaterThanOrEqual(48);
    expect(roomy.seatW).toBeLessThan(tight.seatW);
    expect(roomy.seatH).toBeLessThan(tight.seatH);
  });

  it("lays out 11–16 seats without overlapping, and says where it gives up", () => {
    // The auto-shrink is what makes these possible, so the seatGap has to be the
    // real one - seatGap: 0 would disable the shrink and leave 160px frames.
    for (const count of [11, 12, 14, 16]) {
      const l = layoutTable({ ...base, count, seatGap: DEFAULT_SEAT_GAP });
      expect(l.seatW, `${count} seats`).toBeLessThan(160);
      expect(l.seatW, `${count} seats`).toBeGreaterThanOrEqual(Math.round(160 * 0.5));
      expect(minFrameSeparation(l.seats), `${count} seats`).toBeGreaterThan(0);
    }
  });

  it("does not pretend it can fit an unbounded number of seats", () => {
    // the documented limit: past ~16 the frames sit on the 50% floor and overlap
    const huge = layoutTable({ ...base, count: 20, seatGap: DEFAULT_SEAT_GAP });
    expect(huge.seatW).toBe(Math.round(160 * 0.5));
    expect(minFrameSeparation(huge.seats)).toBeLessThan(0);
  });

  it("treats seatGap <= 0 as disabled", () => {
    const l = layoutTable({ ...base, count: 10, seatGap: 0 });
    expect(l.seatW).toBe(160);
    expect(l.seatH).toBe(176);
  });
});

describe("proportional margins", () => {
  it("scales the rail inset with the design box instead of collapsing it", () => {
    const wide = layoutTable({ ...base, designWidth: 1600, designHeight: 900 });
    // 1600/2 - 0.1367*1600
    expect(wide.tableRx).toBeCloseTo(800 - DEFAULT_MARGIN_X * 1600, 6);
    const narrow = layoutTable({ ...base, designWidth: 640, designHeight: 900 });
    expect(narrow.tableRx).toBeCloseTo(320 - DEFAULT_MARGIN_X * 640, 6);
    expect(narrow.tableRx).toBeGreaterThan(0);
  });

  it("clamps the seat ring to the design box in narrow layouts", () => {
    const narrow = layoutTable({ ...base, designWidth: 640, designHeight: 900 });
    expect(narrow.ringRx).toBeLessThanOrEqual(640 / 2 - narrow.seatW / 2 + 0.001);
    for (const s of narrow.seats) {
      expect(s.x - s.width / 2).toBeGreaterThanOrEqual(-0.001);
      expect(s.x + s.width / 2).toBeLessThanOrEqual(640 + 0.001);
    }
  });
});

/*
 * The helpers below are exported for consumers to use *without* a table — the
 * docs call them the escape hatch for a seating that is none of the three table
 * shapes. Until these tests existed they had no coverage at all, which for
 * public API means their output was a contract nobody had checked.
 */
describe("the exported helpers, with no table around them", () => {
  it("ellipseBox is insetBox — the identity its own docstring promises", () => {
    // The docstring says the name exists for the layout's callers and the
    // reference page, that it is "the same one `surface.insetBox` performs", and
    // that "it used to be a copy, and two copies of one conversion disagree
    // eventually". The identity IS the promise, so this is what to pin.
    for (const [dw, dh, rx, ry] of [
      [1200, 900, 436, 254],
      [640, 900, 200, 320],
      [1200, 900, 0, 0],
    ]) {
      expect(ellipseBox(dw, dh, rx, ry), `ellipseBox(${dw}, ${dh}, ${rx}, ${ry})`).toEqual(insetBox(dw, dh, rx, ry));
    }
  });

  it("seatPoint is seatAngle + ellipsePoint, and lands on the ring the layout placed", () => {
    const l = layoutTable(base);
    for (const [index, count] of [
      [0, 6],
      [1, 6],
      [5, 6],
      [1, 2],
      [3, 9],
    ]) {
      expect(seatPoint(index, count, l.cx, l.cy, l.ringRx, l.ringRy, 90), `seat ${index} of ${count}`).toEqual(
        ellipsePoint(l.cx, l.cy, l.ringRx, l.ringRy, seatAngle(index, count, 90)),
      );
    }
    // Seat for seat on the same ring: a helper that disagreed with the table it
    // belongs to would be a second answer to one question.
    l.seats.forEach((seat, index) => {
      expect(seatPoint(index, 6, l.cx, l.cy, l.ringRx, l.ringRy, 90), `layout seat ${index}`).toEqual({
        x: seat.x,
        y: seat.y,
      });
    });
    // startAngle moves it, like everything else on the ring
    expect(seatPoint(0, 4, 0, 0, 100, 100, 0).x).toBeCloseTo(100, 6);
    expect(seatPoint(0, 4, 0, 0, 100, 100, 0).y).toBeCloseTo(0, 6);
  });

  it("gridFrames is `columns` across, cells of frame + gap, centred on the box", () => {
    const g = gridFrames({ count: 4, cx: 0, cy: 0, width: 10, height: 10, gap: 0 });
    expect(g.map((f) => [f.x, f.y])).toEqual([
      [-5, -5],
      [5, -5],
      [-5, 5],
      [5, 5],
    ]);
    // rowGap is independent of gap, and the cell pitch is frame + gap on both axes
    const column = gridFrames({ count: 2, cx: 0, cy: 0, width: 10, height: 20, columns: 1, gap: 0, rowGap: 4 });
    expect(column.map((f) => [f.x, f.y])).toEqual([
      [0, -12],
      [0, 12],
    ]);
    // every strategy carries the frame size it was laid out for
    expect(column[0]).toMatchObject({ index: 0, width: 10, height: 20 });
  });

  it("gridFrames normalises a nonsense columns or count like the other strategies", () => {
    expect(gridFrames({ count: 3, cx: 0, cy: 0, width: 10, height: 10, columns: 0, gap: 0 }).map((f) => f.x)).toEqual([
      0, 0, 0,
    ]);
    expect(gridFrames({ count: 3, cx: 0, cy: 0, width: 10, height: 10, columns: 2.7, gap: 0 })).toHaveLength(3);
    expect(gridFrames({ count: 0, cx: 0, cy: 0, width: 10, height: 10 }).map((f) => f.index)).toEqual([0]);
  });
});

describe("slotPoint — where a declared slot lands on each placement", () => {
  it("walks towards its seat on a row or perimeter table, and to the centre with no seat", () => {
    // A ring slot is measured from the table centre along the ellipse. A row or
    // perimeter slot is measured from the centre towards the seat it belongs to,
    // which is a different walk and had no test at all until this one.
    const l = layoutTable({ ...base, shape: "none" });
    expect(l.seatPlacement).toBe("row");
    const seat = l.seats[0];

    const half = l.slotPoint(0, 0.5);
    expect(half.x).toBeCloseTo(l.cx + (seat.x - l.cx) * 0.5, 6);
    expect(half.y).toBeCloseTo(l.cy + (seat.y - l.cy) * 0.5, 6);

    // radius 1 is the seat itself, and a radius past the surface is clamped to it
    expect(l.slotPoint(0, 1).x).toBeCloseTo(seat.x, 6);
    expect(l.slotPoint(0, 9).y).toBeCloseTo(seat.y, 6);

    // an index with no seat behind it is the centre, not a NaN
    expect(l.slotPoint(99, 0.5)).toEqual({ x: l.cx, y: l.cy });
  });

  it("still walks the ellipse when the seats are on a ring", () => {
    const l = layoutTable(base);
    const p = l.slotPoint(0, 1);
    expect(p.x).toBeCloseTo(l.cx, 6);
    expect(p.y).toBeCloseTo(l.cy + l.tableRy, 6);
  });
});

describe("ringRadius / scaledRadius — the border-radius of a smaller box", () => {
  it("scales a rectangle's corner radius with the ring", () => {
    // `scaledRadius` only had ellipse callers in the tests, so the whole rect
    // path was unexecuted — on the one shape whose radius is a number.
    const rect = layoutTable({ ...base, shape: "rect" });
    const full = Number.parseFloat(rect.radius);
    expect(Number.isFinite(full)).toBe(true);
    expect(rect.ringRadius(0.5)).toBe(`${full * 0.5}px`);
    expect(rect.ringRadius(1)).toBe(`${full}px`);
    // and the clamp holds here too
    expect(rect.ringRadius(9)).toBe(`${full}px`);
  });

  it("leaves an ellipse's radius alone, whatever ring is asked for", () => {
    const l = layoutTable(base);
    expect(l.ringRadius(0.25)).toBe("50%");
    expect(l.ringRadius(1)).toBe("50%");
  });

  it("never emits NaNpx for a surface whose radius is not a number", () => {
    // Only reachable for a hand-made surface — the factory always writes `50%`
    // or `Npx` — which is exactly why it is worth pinning: a public helper must
    // not put `NaNpx` in a style.
    const handMade = { shape: "rect", radius: "auto" } as TableSurface;
    expect(scaledRadius(handMade, 1)).toBe("0px");
    expect(scaledRadius(handMade, 0.5)).toBe("0px");
  });
});

describe("fitRowScale — a row's only constraint is the box it is in", () => {
  it("passes at full scale when the row already fits", () => {
    expect(fitRowScale({ count: 3, width: 100, gap: 10, maxWidth: 1000 })).toBe(1);
    // count is normalised everywhere else the same way: 0 means one frame
    expect(fitRowScale({ count: 0, width: 100, gap: 10, maxWidth: 1000 })).toBe(1);
  });

  it("returns the largest 1%-step scale that fits, not the first one that does", () => {
    // 10 frames of 100 plus 9 gaps of 10 is 1090, and the box is 600:
    // 10w + 90 <= 600 -> w <= 51 -> scale 0.51, and 0.52 would be 610.
    expect(fitRowScale({ count: 10, width: 100, gap: 10, maxWidth: 600 })).toBeCloseTo(0.51, 6);
  });

  it("honours `fraction` — the share of the box the row may use", () => {
    expect(fitRowScale({ count: 10, width: 100, gap: 10, maxWidth: 1200 })).toBe(1);
    expect(fitRowScale({ count: 10, width: 100, gap: 10, maxWidth: 1200, fraction: 0.5 })).toBeCloseTo(0.51, 6);
  });

  it("treats a negative gap as no gap rather than widening the row", () => {
    // 2 x 100 = 200 <= 210, so gap: -50 must not shrink anything
    expect(fitRowScale({ count: 2, width: 100, gap: -50, maxWidth: 210 })).toBe(1);
  });

  it("answers with the floor when even the smallest scale cannot fit", () => {
    // 40 frames is past anything the docs recommend, which is the point: the
    // floor is the documented answer, and it is reachable.
    expect(fitRowScale({ count: 40, width: 100, gap: 20, maxWidth: 500 })).toBe(FRAME_SHRINK_FLOOR);
    expect(fitRowScale({ count: 40, width: 100, gap: 20, maxWidth: 500, floor: 0.2 })).toBe(0.2);
  });

  it("separates `no width limit` from `no room`", () => {
    // An unbounded box is no constraint at all: the row fits, at scale 1. This
    // used to be the floor, which shrank a row for a box that cannot exist.
    expect(fitRowScale({ count: 4, width: 100, gap: 10, maxWidth: Number.POSITIVE_INFINITY })).toBe(1);
    // A box with no width, or a nonsense one, is the floor rather than a NaN.
    for (const maxWidth of [0, -1, Number.NaN]) {
      expect(fitRowScale({ count: 4, width: 100, gap: 10, maxWidth }), `maxWidth ${maxWidth}`).toBe(FRAME_SHRINK_FLOOR);
    }
  });
});
