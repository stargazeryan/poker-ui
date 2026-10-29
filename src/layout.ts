/**
 * Layout for a table: the surface, where the seats go, and the box any ring
 * traces. Pure — no React, no game rules, no drawing.
 *
 * This module composes three things that used to be one:
 *
 * - `surface.ts` — the boundary and its insets (a shape, not a game)
 * - `frames.ts` — the positioning strategy (a ring, a row, a rectangle's edge)
 * - this file — the defaults that tie them together, and the `Layout` object the
 *   components hand to `renderOverlay`
 *
 * It carries no concept the games disagree about. There is no betting line, no
 * felt-must-be-green, and no "your turn" ring: a ring the caller declared is
 * drawn where the caller asked for it, and nothing else is drawn at all.
 */

import {
  fitFrameScale,
  fitRowScale,
  minFrameSeparation,
  perimeterFrames,
  ringFrames,
  rowFrames,
  type FrameBox,
} from "./frames";
import { ellipsePoint, seatAngle } from "./geometry";
import {
  scaledBox,
  scaledRadius,
  tableSurface,
  type Box,
  type SeatPlacement,
  type TableShape,
} from "./surface";

/** Default design space. */
export const DESIGN_W = 1200;
export const DESIGN_H = 900;
/** Rail inset as a fraction of the design box (164/1200, 196/900). */
export const DEFAULT_MARGIN_X = 164 / DESIGN_W;
export const DEFAULT_MARGIN_Y = 196 / DESIGN_H;
/** Gap between the rail and the felt, in design-space px. */
export const DEFAULT_FELT_GAP = 11;
/** Default minimum clearance between neighbouring seat frames. */
export const DEFAULT_SEAT_GAP = 24;
/** Default preferred seat frame size. */
export const DEFAULT_SEAT_W = 160;
export const DEFAULT_SEAT_H = 176;
/** How far inside the rail the rim highlight sits, in design-space px. */
export const RIM_GAP = 6;
/** How far inside the rail a "your turn" style glow ring sits, in design-space px. */
export const GLOW_GAP = 2;
/** How close to the centre a slot may be placed, as a fraction of the seat distance. */
export const MIN_SLOT_RADIUS = 0;
/** Smallest fraction of the preferred seat size the auto-shrink will go to. */
export const SEAT_SHRINK_FLOOR = 0.5;
/** Fraction of its container a row of frames may span before it starts shrinking. */
export const ROW_FRACTION = 0.94;

export type { FrameBox, SeatPlacement, TableShape, Box };

/** Kept as the name the docs and older consumers know. */
export type SeatLayout = FrameBox;
/** An inset box — the representation every shape shares. */
export type EllipseBox = Box;

export interface LayoutOptions {
  /** Number of seats. */
  count: number;
  /** Design-space width / height. */
  designWidth: number;
  designHeight: number;
  /** Rail inset as a fraction of `designWidth` / `designHeight` (0..0.5). */
  marginX: number;
  marginY: number;
  /** Felt inset from the rail, in design-space px. */
  feltGap: number;
  /** Preferred (maximum) seat frame size. */
  seatWidth: number;
  seatHeight: number;
  /**
   * Minimum clearance in design-space px to keep between neighbouring frames.
   * Frames are shrunk uniformly (never below `SEAT_SHRINK_FLOOR`) to honour it.
   * `0` disables the shrink entirely.
   */
  seatGap: number;
  /** Angle of seat 0, in degrees. */
  startAngle: number;
  /** Boundary to draw. Default `"ellipse"`. */
  shape?: TableShape;
  /** Corner radius of a `rect` table, in design-space px. */
  cornerRadius?: number;
  /** Where the seats go. Defaults to the shape's own natural placement. */
  seatPlacement?: SeatPlacement;
  /** Rim highlight inset. Default `RIM_GAP`. */
  rimGap?: number;
  /** Glow-ring inset. Default `GLOW_GAP`. */
  glowGap?: number;
}

export interface Layout {
  /** Design box the layout was computed for. */
  designWidth: number;
  designHeight: number;
  /** Centre of the surface. */
  cx: number;
  cy: number;
  shape: TableShape;
  seatPlacement: SeatPlacement;
  /** CSS `border-radius` that draws the surface. */
  radius: string;
  /** Half-extents of the outer boundary (the "radii" of the surface). */
  tableRx: number;
  tableRy: number;
  /** Radii of the seat ring (a rectangle's half-extents under `perimeter`). */
  ringRx: number;
  ringRy: number;
  /** Seat frame size actually used, after the auto-shrink. */
  seatW: number;
  seatH: number;
  seats: FrameBox[];
  /** The surface and its insets, ready to position. */
  boxes: {
    table: Box;
    felt: Box;
    rim: Box;
    glow: Box;
  };
  /** The box a ring at `radius` (a fraction of the surface) traces. */
  ringBox(radius: number): Box;
  /** The `border-radius` a ring at `radius` is drawn with. */
  ringRadius(radius: number): string;
  /**
   * Where a slot at `radius` for seat `index` goes.
   *
   * On a ring this **is** the point on the ring the layout would draw at that
   * radius, at that seat's angle, so a declared line and the content on it can
   * never disagree — the two used to be derived separately and drifted apart by
   * up to 100px. On a row or a rectangle's perimeter there is no ellipse to be
   * on, so the point is `radius` of the way from the centre toward that seat.
   */
  slotPoint(index: number, radius: number): { x: number; y: number };
}

/** Radii of the surface for a given design box and rail inset. */
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

/** Turn radii into the inset box of a positioned surface. */
export function ellipseBox(designWidth: number, designHeight: number, rx: number, ry: number): Box {
  const top = designHeight / 2 - ry;
  const left = designWidth / 2 - rx;
  return { top, right: left, bottom: top, left };
}

/** Smallest gap between any two frames. Alias of `minFrameSeparation`. */
export const minSeatSeparation = minFrameSeparation;

/** The natural placement for a shape. */
export function defaultSeatPlacement(shape: TableShape): SeatPlacement {
  if (shape === "rect") return "perimeter";
  if (shape === "none") return "row";
  return "ring";
}

/** Every seat frame for one configuration, before the auto-shrink. */
function seatFramesFor(opts: LayoutOptions, shape: TableShape, seatW: number, seatH: number): FrameBox[] {
  const placement = opts.seatPlacement ?? defaultSeatPlacement(shape);
  const { rx, ry } = tableRadii(opts.designWidth, opts.designHeight, opts.marginX, opts.marginY);
  const cx = opts.designWidth / 2;
  const cy = opts.designHeight / 2;
  const ring = seatRingRadii(opts.designWidth, opts.designHeight, rx, ry, seatW, seatH, opts.feltGap);

  if (placement === "perimeter") {
    return perimeterFrames({
      count: opts.count,
      cx,
      cy,
      halfW: ring.rx,
      halfH: ring.ry,
      width: seatW,
      height: seatH,
      startAngle: opts.startAngle,
    });
  }
  if (placement === "row") {
    // A straight line along the bottom of the surface — the shape a dealer /
    // player layout wants, and the one thing a ring cannot express.
    return rowFrames({
      count: opts.count,
      cx,
      cy: cy + ring.ry,
      width: seatW,
      height: seatH,
      gap: opts.seatGap,
    });
  }
  return ringFrames({
    count: opts.count,
    cx,
    cy,
    rx: ring.rx,
    ry: ring.ry,
    width: seatW,
    height: seatH,
    startAngle: opts.startAngle,
  });
}

/**
 * Pick the largest uniform scale (1 → `SEAT_SHRINK_FLOOR`, in 1% steps) at which
 * every pair of seat frames clears `seatGap`. Works for every placement, because
 * it re-runs the whole arrangement at each scale.
 */
export function fitSeatScale(opts: LayoutOptions): number {
  const shape = opts.shape ?? "ellipse";
  const gapScale = fitFrameScale(
    (scale) =>
      seatFramesFor(
        opts,
        shape,
        Math.max(1, Math.round(opts.seatWidth * scale)),
        Math.max(1, Math.round(opts.seatHeight * scale)),
      ),
    opts.seatGap,
  );
  // A ring is kept inside the design box by its clamped radii; a row is not, so
  // a row is also bounded by the width of the box.
  if ((opts.seatPlacement ?? defaultSeatPlacement(shape)) !== "row") return gapScale;
  return Math.min(
    gapScale,
    fitRowScale({
      count: opts.count,
      width: opts.seatWidth,
      height: opts.seatHeight,
      gap: opts.seatGap,
      maxWidth: opts.designWidth,
      fraction: ROW_FRACTION,
    }),
  );
}

/**
 * Everything the table draws for one configuration: the surface and its insets,
 * the seat frames at their final size and position, and a way to ask for the box
 * any other ring would occupy.
 */
export function layoutTable(opts: LayoutOptions): Layout {
  const shape = opts.shape ?? "ellipse";
  const surface = tableSurface({
    shape,
    designWidth: opts.designWidth,
    designHeight: opts.designHeight,
    marginX: opts.marginX,
    marginY: opts.marginY,
    feltGap: opts.feltGap,
    rimGap: opts.rimGap ?? RIM_GAP,
    glowGap: opts.glowGap ?? GLOW_GAP,
    cornerRadius: opts.cornerRadius,
  });

  const scale = fitSeatScale(opts);
  const seatW = Math.max(1, Math.round(opts.seatWidth * scale));
  const seatH = Math.max(1, Math.round(opts.seatHeight * scale));
  const seats = seatFramesFor(opts, shape, seatW, seatH);
  const placement = opts.seatPlacement ?? defaultSeatPlacement(shape);
  const ring = seatRingRadii(
    opts.designWidth,
    opts.designHeight,
    surface.rx,
    surface.ry,
    seatW,
    seatH,
    opts.feltGap,
  );

  return {
    designWidth: opts.designWidth,
    designHeight: opts.designHeight,
    cx: surface.cx,
    cy: surface.cy,
    shape,
    seatPlacement: placement,
    radius: surface.radius,
    tableRx: surface.rx,
    tableRy: surface.ry,
    ringRx: ring.rx,
    ringRy: ring.ry,
    seatW,
    seatH,
    seats,
    boxes: surface.boxes,
    ringBox: (radius: number) => scaledBox(surface, radius),
    ringRadius: (radius: number) => scaledRadius(surface, radius),
    slotPoint: (index: number, radius: number) => {
      if (placement === "ring") {
        return ellipsePoint(
          surface.cx,
          surface.cy,
          surface.rx * radius,
          surface.ry * radius,
          seatAngle(index, opts.count, opts.startAngle),
        );
      }
      const seat = seats[index];
      if (!seat) return { x: surface.cx, y: surface.cy };
      return {
        x: surface.cx + (seat.x - surface.cx) * radius,
        y: surface.cy + (seat.y - surface.cy) * radius,
      };
    },
  };
}

/** @deprecated Renamed to `layoutTable` — it lays out a table, not just seats. */
export const layoutSeats = layoutTable;
