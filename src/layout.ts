/**
 * Pure layout math for the card table. No React, no game rules.
 *
 * Everything is derived from one parametric ellipse (see `geometry.ts`). The
 * table, the felt, the rim, the seat ring and the betting line are ellipses
 * sharing a centre and an aspect ratio, and they are all computed **here**.
 *
 * That matters: the betting line used to be computed inside `CardTable` from a
 * module constant while the chips were positioned from the `betRadiusScale`
 * prop, and the two drifted apart. One ellipse, one place that computes it.
 */

import { ellipsePoint, seatAngle } from "./geometry";

/** Default design space. */
export const DESIGN_W = 1200;
export const DESIGN_H = 900;
/** Rail inset as a fraction of the design box (164/1200, 196/900). */
export const DEFAULT_MARGIN_X = 164 / DESIGN_W;
export const DEFAULT_MARGIN_Y = 196 / DESIGN_H;
/** Gap between the rail and the felt, in design-space px. */
export const DEFAULT_FELT_GAP = 11;
/** Default radius of the bet ring, as a fraction of the table radius. */
export const DEFAULT_BET_SCALE = 0.72;
/** Default minimum clearance between neighbouring seat frames. */
export const DEFAULT_SEAT_GAP = 24;
/** Default preferred seat frame size. */
export const DEFAULT_SEAT_W = 160;
export const DEFAULT_SEAT_H = 176;
/** How far inside the rail the rim highlight sits, in design-space px. */
export const RIM_GAP = 6;
/** How far inside the rail the your-turn glow sits, in design-space px. */
export const GLOW_GAP = 2;

export interface LayoutOptions {
  /** Number of seats. */
  count: number;
  /** Design-space width / height. */
  designWidth: number;
  designHeight: number;
  /** Rail inset as a fraction of designWidth / designHeight (0..0.5). */
  marginX: number;
  marginY: number;
  /** Felt inset from the rail, in design-space px. */
  feltGap: number;
  /** Preferred (maximum) seat frame size. */
  seatWidth: number;
  seatHeight: number;
  /**
   * Minimum clearance in design-space px to keep between neighbouring seat
   * frames. Frames are shrunk uniformly (never below `SEAT_SHRINK_FLOOR`) to
   * honour it. `0` disables the shrink entirely.
   */
  seatGap: number;
  /** Angle of seat 0, in degrees. */
  startAngle: number;
  /** Where the betting line sits, as a fraction of the table radii. Default 0.72. */
  betRadiusScale?: number;
}

export interface SeatLayout {
  index: number;
  /** Centre of the seat frame, in design space. */
  x: number;
  y: number;
  /** Frame size the layout was computed for (≤ the preferred size when shrunk). */
  width: number;
  height: number;
}

/**
 * How far an ellipse sits inside the design box, in design-space px. Spread it
 * onto an absolutely-positioned element and the ellipse lands where the rest of
 * the layout expects.
 */
export interface EllipseBox {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface Layout {
  /** Seat centre used for every ring, in design space. */
  cx: number;
  cy: number;
  /** Radii of the outer table ellipse. */
  tableRx: number;
  tableRy: number;
  /** Radii of the seat ring. */
  ringRx: number;
  ringRy: number;
  /** Radii of the betting line. */
  betRx: number;
  betRy: number;
  /** Seat frame size actually used. */
  seatW: number;
  seatH: number;
  seats: SeatLayout[];
  /** Every ellipse the table draws, ready to position. */
  boxes: {
    table: EllipseBox;
    felt: EllipseBox;
    rim: EllipseBox;
    glow: EllipseBox;
    bettingLine: EllipseBox;
  };
}

/** Smallest fraction of the preferred seat size the auto-shrink will go to. */
export const SEAT_SHRINK_FLOOR = 0.5;

/** Radii of the table ellipse for a given design box and rail inset. */
export function tableRadii(
  designWidth: number,
  designHeight: number,
  marginX: number,
  marginY: number,
): { rx: number; ry: number } {
  return {
    rx: Math.max(0, designWidth / 2 - marginX * designWidth),
    ry: Math.max(0, designHeight / 2 - marginY * designHeight),
  };
}

/**
 * Radii of the seat ring. Seats ride the ring at `+ seatSize / 2 + 6`, so the
 * frames straddle the rail, but never past the design box (seats at the extreme
 * left / right / top / bottom used to be clipped in narrow layouts).
 */
export function seatRingRadii(
  designWidth: number,
  designHeight: number,
  tableRx: number,
  tableRy: number,
  seatW: number,
  seatH: number,
  feltGap: number,
): { rx: number; ry: number } {
  const rx = Math.min(tableRx - feltGap + seatW / 2 + 6, designWidth / 2 - seatW / 2);
  const ry = Math.min(tableRy - feltGap + seatH / 2 + 6, designHeight / 2 - seatH / 2);
  return { rx: Math.max(0, rx), ry: Math.max(0, ry) };
}

/** Centre point of seat `index` on the seat ring, in design space. */
export function seatPoint(
  index: number,
  count: number,
  cx: number,
  cy: number,
  ringRx: number,
  ringRy: number,
  startAngle = 90,
): { x: number; y: number } {
  return ellipsePoint(cx, cy, ringRx, ringRy, seatAngle(index, count, startAngle));
}

/** Turn radii into the inset box of an absolutely-positioned ellipse. */
export function ellipseBox(designWidth: number, designHeight: number, rx: number, ry: number): EllipseBox {
  const top = designHeight / 2 - ry;
  const left = designWidth / 2 - rx;
  return { top, right: left, bottom: top, left };
}

/** Axis-aligned separation of two seat frames: > 0 is a gap, < 0 a penetration. */
function boxSeparation(a: SeatLayout, b: SeatLayout): number {
  const dx = Math.max(b.x - a.x - (a.width + b.width) / 2, a.x - b.x - (a.width + b.width) / 2);
  const dy = Math.max(b.y - a.y - (a.height + b.height) / 2, a.y - b.y - (a.height + b.height) / 2);
  if (dx > 0 && dy > 0) return Math.hypot(dx, dy);
  if (dx > 0) return dx;
  if (dy > 0) return dy;
  return Math.max(dx, dy);
}

/**
 * Smallest gap between any two seat frames, over every pair. Positive means no
 * frames overlap. Returns `Infinity` for fewer than two seats.
 */
export function minSeatSeparation(seats: SeatLayout[]): number {
  let worst = Infinity;
  for (let i = 0; i < seats.length; i++) {
    for (let j = i + 1; j < seats.length; j++) {
      const s = boxSeparation(seats[i], seats[j]);
      if (s < worst) worst = s;
    }
  }
  return worst;
}

function positionsFor(
  count: number,
  cx: number,
  cy: number,
  ringRx: number,
  ringRy: number,
  seatW: number,
  seatH: number,
  startAngle: number,
): SeatLayout[] {
  return Array.from({ length: count }, (_, index) => {
    const p = seatPoint(index, count, cx, cy, ringRx, ringRy, startAngle);
    return { index, x: p.x, y: p.y, width: seatW, height: seatH };
  });
}

/**
 * Pick the largest uniform scale (1 → `SEAT_SHRINK_FLOOR`, in 1% steps) at which
 * every pair of seat frames clears `seatGap`. Returns the scale to apply.
 *
 * A 10-seat table at the default 160x176 frames only leaves ~26px between
 * neighbours, which reads as crowded; shrinking them a little spreads the ring
 * out. It is also what makes 11–16 seats possible at all. Wide tables (2–8
 * seats) are unaffected — they pass on the first step.
 */
export function fitSeatScale(opts: LayoutOptions): number {
  if (opts.seatGap <= 0) return 1;
  const { rx, ry } = tableRadii(opts.designWidth, opts.designHeight, opts.marginX, opts.marginY);
  const cx = opts.designWidth / 2;
  const cy = opts.designHeight / 2;

  for (let step = 0; step <= 50; step++) {
    const scale = 1 - step * 0.01;
    const w = Math.max(1, Math.round(opts.seatWidth * scale));
    const h = Math.max(1, Math.round(opts.seatHeight * scale));
    const ring = seatRingRadii(opts.designWidth, opts.designHeight, rx, ry, w, h, opts.feltGap);
    const seats = positionsFor(opts.count, cx, cy, ring.rx, ring.ry, w, h, opts.startAngle);
    if (minSeatSeparation(seats) >= opts.seatGap) return scale;
    if (scale <= SEAT_SHRINK_FLOOR) break;
  }
  return SEAT_SHRINK_FLOOR;
}

/**
 * Everything the table draws for one configuration: the table ellipse, the felt,
 * the rim, the glow ring, the betting line, the seat ring and every seat centre.
 */
export function layoutSeats(opts: LayoutOptions): Layout {
  const { rx, ry } = tableRadii(opts.designWidth, opts.designHeight, opts.marginX, opts.marginY);
  const cx = opts.designWidth / 2;
  const cy = opts.designHeight / 2;

  const scale = fitSeatScale(opts);
  const seatW = Math.max(1, Math.round(opts.seatWidth * scale));
  const seatH = Math.max(1, Math.round(opts.seatHeight * scale));

  const ring = seatRingRadii(opts.designWidth, opts.designHeight, rx, ry, seatW, seatH, opts.feltGap);
  const betScale = Math.min(1, Math.max(0.2, opts.betRadiusScale ?? DEFAULT_BET_SCALE));
  const betRx = rx * betScale;
  const betRy = ry * betScale;

  const box = (bx: number, by: number) => ellipseBox(opts.designWidth, opts.designHeight, bx, by);

  return {
    cx,
    cy,
    tableRx: rx,
    tableRy: ry,
    ringRx: ring.rx,
    ringRy: ring.ry,
    betRx,
    betRy,
    seatW,
    seatH,
    seats: positionsFor(opts.count, cx, cy, ring.rx, ring.ry, seatW, seatH, opts.startAngle),
    boxes: {
      table: box(rx, ry),
      felt: box(rx - opts.feltGap, ry - opts.feltGap),
      rim: box(rx - RIM_GAP, ry - RIM_GAP),
      glow: box(rx - GLOW_GAP, ry - GLOW_GAP),
      bettingLine: box(betRx, betRy),
    },
  };
}
