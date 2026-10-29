/**
 * Where things go: positioning strategies for rectangular frames. Pure
 * functions — no React, no game rules, and no opinion about what a frame *is*.
 *
 * A seat, a hand, a meld and an empty card slot are all the same thing to these:
 * a rectangle at a point. Every strategy returns the same shape of result —
 * one `FrameBox` per index, carrying the centre and the frame size — so a
 * component renders any of them with one loop, and swapping the strategy is a
 * one-prop change rather than a rewrite.
 *
 * `ringFrames` is the round-table arrangement. It is one strategy among four,
 * not the definition of a table: a blackjack layout is a `rowFrames`, a
 * rectangle of seats is `perimeterFrames`, and a square four-player card game is
 * either.
 */

import { ellipsePoint } from "./geometry";

/** A placed frame: its centre and the size it was laid out for. */
export interface FrameBox {
  index: number;
  /** Centre of the frame. */
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Smallest fraction of the preferred frame size the auto-shrink will go to. */
export const FRAME_SHRINK_FLOOR = 0.5;

export interface RingFramesOptions {
  count: number;
  /** Centre of the ellipse. */
  cx: number;
  cy: number;
  /** Ellipse radii. */
  rx: number;
  ry: number;
  width: number;
  height: number;
  /** Angle of frame 0, in degrees. 90 = directly below the centre. */
  startAngle?: number;
  /** How much of the circle to use, in degrees. Default 360. */
  sweep?: number;
}

/**
 * `count` frames evenly spaced around an ellipse, starting at `startAngle`.
 *
 * The angle advances with the index, so any count from 1 upwards spreads
 * evenly. A `sweep` below 360 leaves the ring open — useful for a half-round
 * table, or for a row of hands arranged along an arc.
 */
export function ringFrames(opts: RingFramesOptions): FrameBox[] {
  const n = normCount(opts.count);
  const start = opts.startAngle ?? 90;
  const sweep = opts.sweep ?? 360;
  return Array.from({ length: n }, (_, index) => {
    const p = ellipsePoint(opts.cx, opts.cy, opts.rx, opts.ry, start + (index * sweep) / n);
    return { index, x: p.x, y: p.y, width: opts.width, height: opts.height };
  });
}

export interface RowFramesOptions {
  count: number;
  /** Centre of the row. */
  cx: number;
  cy: number;
  width: number;
  height: number;
  /** Clearance between neighbouring frames. Default 24. */
  gap?: number;
  /** Total distance between the first and last frame centre, instead of `gap`. */
  spread?: number;
  /** `"row"` (default) lays out left to right; `"column"` top to bottom. */
  direction?: "row" | "column";
}

/**
 * `count` frames in a straight line, centred on (`cx`, `cy`).
 *
 * Either pass `gap` and let the line be as long as it needs to be, or pass
 * `spread` to pin the first and last frame and distribute the rest between
 * them.
 */
export function rowFrames(opts: RowFramesOptions): FrameBox[] {
  const n = normCount(opts.count);
  const column = opts.direction === "column";
  const extent = column ? opts.height : opts.width;
  const step = opts.spread !== undefined && n > 1 ? opts.spread / (n - 1) : extent + (opts.gap ?? 24);
  const centreOffset = (n - 1) / 2;

  return Array.from({ length: n }, (_, index) => {
    const offset = (index - centreOffset) * step;
    return {
      index,
      x: opts.cx + (column ? 0 : offset),
      y: opts.cy + (column ? offset : 0),
      width: opts.width,
      height: opts.height,
    };
  });
}

export interface GridFramesOptions {
  count: number;
  /** Centre of the grid. */
  cx: number;
  cy: number;
  width: number;
  height: number;
  /** Columns before it wraps. Default 2. */
  columns?: number;
  /** Clearance between neighbouring frames, both axes. Default 24. */
  gap?: number;
  /** Clearance between rows, if different from `gap`. */
  rowGap?: number;
}

/**
 * `count` frames in a grid of `columns` columns, centred on (`cx`, `cy`).
 * Every frame keeps `width` / `height`, so the cell pitch is the frame size plus
 * the gap rather than a fraction of the container.
 */
export function gridFrames(opts: GridFramesOptions): FrameBox[] {
  const n = normCount(opts.count);
  const columns = Math.max(1, Math.floor(opts.columns ?? 2));
  const rows = Math.ceil(n / columns);
  const gap = opts.gap ?? 24;
  const rowGap = opts.rowGap ?? gap;
  const px = opts.width + gap;
  const py = opts.height + rowGap;

  return Array.from({ length: n }, (_, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);
    return {
      index,
      x: opts.cx + (col - (columns - 1) / 2) * px,
      y: opts.cy + (row - (rows - 1) / 2) * py,
      width: opts.width,
      height: opts.height,
    };
  });
}

export interface PerimeterFramesOptions {
  count: number;
  /** Centre of the rectangle. */
  cx: number;
  cy: number;
  /** Half-extents of the rectangle the frames ride on. */
  halfW: number;
  halfH: number;
  width: number;
  height: number;
  /** Where frame 0 sits, in degrees. 90 = bottom edge, centred. Default 90. */
  startAngle?: number;
}

/**
 * `count` frames evenly spaced around the **perimeter** of a rectangle, by arc
 * length, so a corner does not bunch them up the way an angle-based walk would.
 *
 * This is what makes a rectangular table a real option rather than an ellipse in
 * a costume: `seatAngle`/`ellipsePoint` have nothing sensible to say about a
 * rectangle, and this does.
 */
export function perimeterFrames(opts: PerimeterFramesOptions): FrameBox[] {
  const n = normCount(opts.count);
  // The walk starts at the bottom edge's centre (90°), which is where the ring
  // starts too, so a seat index means the same thing on either shape.
  const start = ((opts.startAngle ?? 90) - 90) / 360;

  return Array.from({ length: n }, (_, index) => {
    const t = (start + index / n) % 1;
    const p = rectanglePerimeterPoint(opts.halfW, opts.halfH, t);
    return { index, x: opts.cx + p.x, y: opts.cy + p.y, width: opts.width, height: opts.height };
  });
}

/**
 * A point on a rectangle's perimeter, walking clockwise from the bottom edge's
 * centre. `t` is the fraction of the perimeter travelled, in [0, 1).
 */
function rectanglePerimeterPoint(halfW: number, halfH: number, t: number): { x: number; y: number } {
  const total = 4 * (halfW + halfH);
  let d = ((t % 1) + 1) % 1 * total;
  // h = halfW, v = 2 * halfH: bottom-left half, left edge, top edge, right edge,
  // bottom-right half.
  const legs: Array<[number, number, number, number, number]> = [
    [0, halfH, -halfW, halfH, halfW],
    [-halfW, halfH, -halfW, -halfH, 2 * halfH],
    [-halfW, -halfH, halfW, -halfH, 2 * halfW],
    [halfW, -halfH, halfW, halfH, 2 * halfH],
    [halfW, halfH, 0, halfH, halfW],
  ];
  for (const [x0, y0, x1, y1, length] of legs) {
    if (d <= length) {
      const f = length === 0 ? 0 : d / length;
      return { x: x0 + (x1 - x0) * f, y: y0 + (y1 - y0) * f };
    }
    d -= length;
  }
  return { x: 0, y: halfH };
}

/** Axis-aligned separation of two frames: > 0 is a gap, < 0 a penetration. */
function frameSeparation(a: FrameBox, b: FrameBox): number {
  const dx = Math.max(b.x - a.x - (a.width + b.width) / 2, a.x - b.x - (a.width + b.width) / 2);
  const dy = Math.max(b.y - a.y - (a.height + b.height) / 2, a.y - b.y - (a.height + b.height) / 2);
  if (dx > 0 && dy > 0) return Math.hypot(dx, dy);
  if (dx > 0) return dx;
  if (dy > 0) return dy;
  return Math.max(dx, dy);
}

/**
 * Smallest gap between any two frames, over every pair. Positive means no
 * frames overlap. Returns `Infinity` for fewer than two frames.
 */
export function minFrameSeparation(frames: FrameBox[]): number {
  let worst = Infinity;
  for (let i = 0; i < frames.length; i++) {
    for (let j = i + 1; j < frames.length; j++) {
      const s = frameSeparation(frames[i], frames[j]);
      if (s < worst) worst = s;
    }
  }
  return worst;
}

/**
 * Pick the largest uniform scale (1 → `FRAME_SHRINK_FLOOR`, in 1% steps) at
 * which `place(scale)` clears `gap`. Returns the scale to apply.
 *
 * `place` is the whole arrangement at a given scale, so this works for any
 * strategy: a 10-seat ring at 160x176 frames only leaves ~26px between
 * neighbours, a row of blackjack hands can collide on a narrow container, and
 * both are the same problem with the same fix. Measured tables (2–8 seats) are
 * unaffected — they pass on the first step.
 */
export function fitFrameScale(
  place: (scale: number) => FrameBox[],
  gap: number,
  floor: number = FRAME_SHRINK_FLOOR,
): number {
  if (gap <= 0 || !Number.isFinite(gap)) return 1;
  for (let step = 0; step <= 50; step++) {
    const scale = 1 - step * 0.01;
    if (minFrameSeparation(place(scale)) >= gap) return scale;
    if (scale <= floor) break;
  }
  return floor;
}

export interface RowFitOptions {
  count: number;
  /** Preferred frame width. */
  width: number;
  /** Preferred frame height. */
  height: number;
  /** Clearance between neighbours. */
  gap: number;
  /** The widest the row may be, frame edge to frame edge. */
  maxWidth: number;
  /** Fraction of `maxWidth` the row may use. Default 1. */
  fraction?: number;
  floor?: number;
}

/**
 * The largest uniform scale at which a **row** still fits `maxWidth` across.
 *
 * `fitFrameScale` only promises the *gap* between neighbours, and a row always
 * satisfies that on the first step — its pitch is the frame plus the gap, so the
 * gap is met by construction. A ring does not have that problem, because its
 * radii are clamped to the design box, so shrinking the frames is what keeps it
 * inside. A row has no such clamp and simply runs off the edge.
 *
 * Hence this: the constraint a row actually has is the width of the box it is
 * in, and it is the only constraint that ever causes a row to shrink.
 */
export function fitRowScale({
  count,
  width,
  height,
  gap,
  maxWidth,
  fraction = 1,
  floor = FRAME_SHRINK_FLOOR,
}: RowFitOptions): number {
  void height;
  const n = normCount(count);
  const limit = maxWidth * fraction;
  if (!Number.isFinite(limit) || limit <= 0) return floor;
  for (let step = 0; step <= 50; step++) {
    const scale = 1 - step * 0.01;
    const w = Math.max(1, Math.round(width * scale));
    if (n * w + (n - 1) * Math.max(0, gap) <= limit) return scale;
    if (scale <= floor) break;
  }
  return floor;
}

/** Normalise a frame count to a positive integer. */
function normCount(count: number): number {
  const n = Math.floor(count);
  return Number.isFinite(n) && n > 0 ? n : 1;
}
