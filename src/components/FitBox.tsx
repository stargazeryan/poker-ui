import { useLayoutEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { cn } from "../cn";
import { DESIGN_H, DESIGN_W } from "../layout";

/**
 * The scaling half of a table, on its own.
 *
 * A design box that is laid out in fixed coordinates and then scaled to fit its
 * container is not a poker idea — it is how you make a complex layout responsive
 * without a media query per element. It is extracted here so a layout that is
 * not a ring of seats (a dealer zone and a row of hands, a square for four
 * players, a single row of card slots) can use it and nothing else.
 *
 * The design box is a **maximum**. A container larger than it does not enlarge
 * the table — the box is drawn at 1:1 and centred — and a smaller one scales the
 * whole box down by a single factor. So the design size is a real size, and the
 * numbers measured in it are real sizes at 1:1, rather than an arbitrary unit
 * that whatever container happens to be present then rewrites.
 */

export type FitMode = "design" | "container";

/** Aspect range `fit="container"` will not go outside of. */
export const MIN_FIT_ASPECT = 0.5;
export const MAX_FIT_ASPECT = 2.5;

/**
 * The largest multiplier the design box may be drawn at.
 *
 * `Infinity` is the "fill the container" case — what 0.8.x did unconditionally
 * and what `maxScale={Infinity}` still does. Anything else that is not a finite
 * number falls back to the documented default, rather than propagating `NaN`
 * into a style, and a negative cap cannot shrink a box that already fits.
 */
function capScale(maxScale: number): number {
  if (maxScale === Infinity) return Infinity;
  if (!Number.isFinite(maxScale)) return 1;
  return Math.max(0, maxScale);
}

/** The design box in use, and the scale it is drawn at. */
export interface DesignBox {
  /** Design-space width. Under `fit="container"` this is derived from the container. */
  width: number;
  height: number;
  /** Multiplier the design box is drawn at to fill the container. */
  scale: number;
}

export interface FitBoxOptions {
  /** Width your content is designed for, in CSS px. A maximum — see `FitBoxProps`. */
  designWidth?: number;
  /** Height your content is designed for, in CSS px. A maximum — see `FitBoxProps`. */
  designHeight?: number;
  /**
   * How the design box relates to the container.
   * - `"design"` (default): keep the design ratio, so a container with a
   *   different ratio leaves empty space around the table.
   * - `"container"`: derive the design width from the container's ratio
   *   (clamped to 0.5–2.5), so the layout fills the space instead of leaving it
   *   empty. The ratio changes here; the height does not.
   *
   * Neither mode scales above 1 — the design box is a maximum, see
   * `designWidth` — unless `maxScale` says otherwise.
   */
  fit?: FitMode;
  /**
   * The largest multiplier the design box may be drawn at. Default `1`, which is
   * the "the design box is a maximum" rule: a bigger container adds empty space.
   *
   * Raise it to let a large container enlarge the content (`maxScale={2}` grows
   * it to twice the design size), or pass `Infinity` for the pre-0.9.0
   * behaviour of filling the container whatever its size.
   */
  maxScale?: number;
}

/**
 * Measure a container and derive the design box and scale for it.
 *
 * Guarded by the package's `"use client"` banner: `useLayoutEffect` warns during
 * server rendering.
 */
export function useFitBox({
  designWidth = DESIGN_W,
  designHeight = DESIGN_H,
  fit = "design",
  maxScale = 1,
}: FitBoxOptions = {}): {
  outerRef: RefObject<HTMLDivElement | null>;
  design: DesignBox;
} {
  const outerRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });

  useLayoutEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const compute = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (!w || !h) return;
      setBox({ w, h });
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const design = useMemo<DesignBox>(() => {
    const dh = designHeight;
    const dw =
      fit === "container" && box.w > 0 && box.h > 0
        ? dh * Math.min(MAX_FIT_ASPECT, Math.max(MIN_FIT_ASPECT, box.w / box.h))
        : designWidth;
    // `maxScale` is the cap: at its default of `1` the design box is the largest
    // the content is ever drawn, so a bigger container adds empty space instead
    // of enlarging the table.
    const scale = box.w > 0 && box.h > 0 ? Math.min(box.w / dw, box.h / dh, capScale(maxScale)) : 1;
    return { width: dw, height: dh, scale };
  }, [designWidth, designHeight, fit, maxScale, box.w, box.h]);

  return { outerRef, design };
}

/*
 * Declared out in full rather than `extends FitBoxOptions`: the docs' prop table
 * is read back off this interface, and an inherited prop is invisible to that
 * check — which is how a documented prop ends up with no code behind it.
 */
export interface FitBoxProps {
  /**
   * The width your content is designed for, in CSS px — **a maximum, not a
   * target**. A container wider than this does not make the table bigger: the
   * box is drawn at 1:1 and centred. A narrower container scales the whole box
   * down by one factor, so every proportion holds. Default 1200.
   */
  designWidth?: number;
  /**
   * The height your content is designed for, in CSS px. A maximum, like
   * `designWidth`. Default 900.
   */
  designHeight?: number;
  /**
   * How the design box relates to the container.
   * - `"design"` (default): keep the design ratio, so a container with a
   *   different ratio leaves empty space around the table.
   * - `"container"`: derive the design width from the container's ratio
   *   (clamped to 0.5–2.5), so the layout fills the space instead of leaving it
   *   empty. The ratio changes here; the height does not.
   *
   * Neither mode scales above 1 — the design box is a maximum, see
   * `designWidth`.
   */
  fit?: FitMode;
  /**
   * The largest multiplier the design box may be drawn at, `1` by default: the
   * design box is a maximum, so a container bigger than it adds empty space
   * rather than enlarging the content.
   *
   * `maxScale={2}` lets a large container draw it twice as wide, and
   * `maxScale={Infinity}` fills the container at any size — what 0.8.x did
   * unconditionally, and what callers who relied on it now ask for.
   */
  maxScale?: number;
  /**
   * The design-box contents, **called** with the box that was settled on rather
   * than mounted as children — so this stays a function of the live geometry and
   * never becomes a new component type on every render.
   */
  children: (design: DesignBox) => ReactNode;
  className?: string;
}

/**
 * A container that lays its contents out in a fixed design box and scales that
 * box **down** to fit. Knows nothing about what is inside it.
 */
export function FitBox({ designWidth, designHeight, fit, maxScale, children, className }: FitBoxProps) {
  const { outerRef, design } = useFitBox({ designWidth, designHeight, fit, maxScale });

  return (
    <div
      ref={outerRef}
      className={cn(
        "relative flex h-full w-full min-h-0 items-center justify-center overflow-hidden",
        className,
      )}
    >
      <div style={{ width: design.width * design.scale, height: design.height * design.scale }}>
        <div
          className="relative"
          style={{
            width: design.width,
            height: design.height,
            transform: `scale(${design.scale})`,
            transformOrigin: "top left",
          }}
        >
          {children(design)}
        </div>
      </div>
    </div>
  );
}
