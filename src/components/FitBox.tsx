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
 */

export type FitMode = "design" | "container";

/** Aspect range `fit="container"` will not go outside of. */
export const MIN_FIT_ASPECT = 0.5;
export const MAX_FIT_ASPECT = 2.5;

/** The design box in use, and the scale it is drawn at. */
export interface DesignBox {
  /** Design-space width. Under `fit="container"` this is derived from the container. */
  width: number;
  height: number;
  /** Multiplier the design box is drawn at to fill the container. */
  scale: number;
}

export interface FitBoxOptions {
  designWidth?: number;
  designHeight?: number;
  /**
   * How the design box relates to the container.
   * - `"design"` (default): scale the fixed design box to fit — preserves the
   *   proportions but letterboxes non-matching containers.
   * - `"container"`: derive the design width from the container's aspect ratio
   *   (clamped to 0.5–2.5) so the layout fills the box instead of letterboxing.
   */
  fit?: FitMode;
}

/**
 * Measure a container and derive the design box and scale for it.
 *
 * Guarded by the package's `"use client"` banner: `useLayoutEffect` warns during
 * server rendering.
 */
export function useFitBox({ designWidth = DESIGN_W, designHeight = DESIGN_H, fit = "design" }: FitBoxOptions = {}): {
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
    const scale = box.w > 0 && box.h > 0 ? Math.min(box.w / dw, box.h / dh) : 1;
    return { width: dw, height: dh, scale };
  }, [designWidth, designHeight, fit, box.w, box.h]);

  return { outerRef, design };
}

/*
 * Declared out in full rather than `extends FitBoxOptions`: the docs' prop table
 * is read back off this interface, and an inherited prop is invisible to that
 * check — which is how a documented prop ends up with no code behind it.
 */
export interface FitBoxProps {
  /** Design-space width your content is laid out in. Default 1200. */
  designWidth?: number;
  /** Design-space height. Default 900. */
  designHeight?: number;
  /**
   * How the design box relates to the container.
   * - `"design"` (default): scale the fixed design box to fit — preserves the
   *   proportions but letterboxes non-matching containers.
   * - `"container"`: derive the design width from the container's aspect ratio
   *   (clamped to 0.5–2.5) so the layout fills the box instead of letterboxing.
   */
  fit?: FitMode;
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
 * box to fit. Knows nothing about what is inside it.
 */
export function FitBox({ designWidth, designHeight, fit, children, className }: FitBoxProps) {
  const { outerRef, design } = useFitBox({ designWidth, designHeight, fit });

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
