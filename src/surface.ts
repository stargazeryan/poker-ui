/**
 * The table surface: one outer boundary and the concentric insets inside it.
 * Pure geometry, no React, and no game rules.
 *
 * A "table" here is only ever *a shape with a few insets in it* — the rail, the
 * felt and two highlight rings, all derived from the same box. Nothing in this
 * module knows what a betting line is, that a felt is green, or how many players
 * there are; it answers "where is the boundary, and where is everything inside
 * it", for either an ellipse or a rounded rectangle.
 *
 * The two shapes share one representation — an inset box plus a CSS border
 * radius — because everything downstream (positioning slots on the table,
 * drawing a highlight ring, handing the geometry to `renderOverlay`) only ever
 * needs those two things.
 */

/** How far an inset sits inside the design box, in design-space px. */
export interface Box {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/** Which boundary the surface is drawn as. */
export type TableShape =
  /** A round table (an ellipse in the design box). */
  | "ellipse"
  /** A rectangular table with rounded corners. */
  | "rect"
  /** No table at all: the design box *is* the surface. */
  | "none";

/** Which strategy places seats on this surface. */
export type SeatPlacement =
  /** Evenly spaced around an ellipse — the round table. */
  | "ring"
  /** Evenly spaced by arc length around a rectangle's perimeter. */
  | "perimeter"
  /** A straight row along the bottom of the design box. */
  | "row";

export interface SurfaceOptions {
  shape: TableShape;
  designWidth: number;
  designHeight: number;
  /** Rail inset as a fraction of the design box, per axis. */
  marginX: number;
  marginY: number;
  /** Felt inset from the rail, in design-space px. */
  feltGap: number;
  /** Rim highlight inset from the rail, in design-space px. */
  rimGap: number;
  /** Your-turn-style glow inset from the rail, in design-space px. */
  glowGap: number;
  /** Corner radius of a `rect` table, in design-space px. Default: 45% of the short half-extent. */
  cornerRadius?: number;
}

export interface TableSurface {
  shape: TableShape;
  /** Centre of the surface, in design space. */
  cx: number;
  cy: number;
  /** Half-extents of the outer boundary. `rx`/`ry` are the same numbers. */
  halfW: number;
  halfH: number;
  rx: number;
  ry: number;
  /** The CSS `border-radius` that draws this shape. */
  radius: string;
  /** Outer boundary, felt, rim highlight and glow ring. */
  boxes: {
    table: Box;
    felt: Box;
    rim: Box;
    glow: Box;
  };
}

/** Default corner radius fraction for a `rect` table. */
export const DEFAULT_CORNER_FRACTION = 0.45;

/**
 * The surface for a design box and a shape.
 *
 * `marginX` / `marginY` are fractions of the design box rather than px, so a
 * custom design box keeps its proportions — the same rule the rest of the
 * layout uses.
 */
export function tableSurface(opts: SurfaceOptions): TableSurface {
  const cx = opts.designWidth / 2;
  const cy = opts.designHeight / 2;

  const full: Box = { top: 0, right: 0, bottom: 0, left: 0 };

  if (opts.shape === "none") {
    return {
      shape: "none",
      cx,
      cy,
      halfW: cx,
      halfH: cy,
      rx: cx,
      ry: cy,
      radius: "0px",
      boxes: { table: full, felt: full, rim: full, glow: full },
    };
  }

  const rx = Math.max(0, cx - opts.marginX * opts.designWidth);
  const ry = Math.max(0, cy - opts.marginY * opts.designHeight);
  // A rectangle's corners: a fraction of the short half-extent keeps the shape
  // rounded-but-rectangular at any aspect ratio. The ellipse ignores it.
  const cornerRadius =
    opts.shape === "rect"
      ? Math.max(0, Math.min(opts.cornerRadius ?? Math.min(rx, ry) * DEFAULT_CORNER_FRACTION, Math.min(rx, ry)))
      : 0;

  return {
    shape: opts.shape,
    cx,
    cy,
    halfW: rx,
    halfH: ry,
    rx,
    ry,
    radius: opts.shape === "ellipse" ? "50%" : `${cornerRadius}px`,
    boxes: {
      table: insetBox(opts.designWidth, opts.designHeight, rx, ry),
      felt: insetBox(opts.designWidth, opts.designHeight, rx - opts.feltGap, ry - opts.feltGap),
      rim: insetBox(opts.designWidth, opts.designHeight, rx - opts.rimGap, ry - opts.rimGap),
      glow: insetBox(opts.designWidth, opts.designHeight, rx - opts.glowGap, ry - opts.glowGap),
    },
  };
}

/** The inset box of a boundary `rx` / `ry` inside the design box. */
export function insetBox(designWidth: number, designHeight: number, rx: number, ry: number): Box {
  const top = designHeight / 2 - ry;
  const left = designWidth / 2 - rx;
  return { top, right: left, bottom: top, left };
}

/**
 * The same shape at `radius` — a fraction of the surface, 0 at the centre and 1
 * at the outer boundary. This is how a named ring, or the line a slot sits on,
 * gets its geometry without anyone re-deriving an ellipse.
 */
export function scaledBox(surface: TableSurface, radius: number): Box {
  const s = Math.min(1, Math.max(0, radius));
  return insetBox(surface.cx * 2, surface.cy * 2, surface.rx * s, surface.ry * s);
}

/** The inset box of `shape` at `radius`, as a CSS `border-radius` value. */
export function scaledRadius(surface: TableSurface, radius: number): string {
  if (surface.shape !== "rect") return surface.radius;
  const s = Math.min(1, Math.max(0, radius));
  const px = Number.parseFloat(surface.radius);
  return `${Number.isFinite(px) ? px * s : 0}px`;
}
