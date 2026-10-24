/**
 * Pure layout math for the card table. No React, no game rules.
 *
 * Everything is derived from one parametric ellipse (see `geometry.ts`). The
 * table, the seat ring and the betting line are three ellipses sharing a centre
 * and an aspect ratio.
 *
 * This module exists so the layout can be unit-tested without a DOM: seat
 * positions, the seat ring, and the auto-shrink that keeps neighbouring seat
 * frames from crowding each other.
 */

import { ellipsePoint, seatAngle } from "./geometry";

export interface Box {
  /** Centre of the frame, in design space. */
  x: number;
  y: number;
  width: number;
  height: number;
}

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
  /** Seat frame size actually used. */
  seatW: number;
  seatH: number;
  seats: SeatLayout[];
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
 * out. Wide tables (2–8 seats) are unaffected — they pass on the first step.
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
 * Full seat layout for a design box: the table ellipse, the seat ring, the
 * (possibly shrunk) frame size, and every seat centre.
 */
export function layoutSeats(opts: LayoutOptions): Layout {
  const { rx, ry } = tableRadii(opts.designWidth, opts.designHeight, opts.marginX, opts.marginY);
  const cx = opts.designWidth / 2;
  const cy = opts.designHeight / 2;

  const scale = fitSeatScale(opts);
  const seatW = Math.max(1, Math.round(opts.seatWidth * scale));
  const seatH = Math.max(1, Math.round(opts.seatHeight * scale));

  const ring = seatRingRadii(opts.designWidth, opts.designHeight, rx, ry, seatW, seatH, opts.feltGap);

  return {
    cx,
    cy,
    tableRx: rx,
    tableRy: ry,
    ringRx: ring.rx,
    ringRy: ring.ry,
    seatW,
    seatH,
    seats: positionsFor(opts.count, cx, cy, ring.rx, ring.ry, seatW, seatH, opts.startAngle),
  };
}
