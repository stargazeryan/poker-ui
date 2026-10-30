import type { ReactNode } from "react";
import { cn } from "../cn";
import type { Box, Layout } from "../layout";

/**
 * The *drawn* table: the glow behind it, the rail, the felt, the ambient light
 * and the watermark — and, separately, the rim hairline that goes in front of
 * the seats.
 *
 * Split out of `CardTable` so that every table type paints the same table. A
 * dealer table is a different *arrangement* (a head and a row, not a ring), not
 * a different surface, and re-typing the rail's gradient in a second file is how
 * the two drift apart. There is one place that knows a felt is green.
 *
 * ## Two shapes, one set of decorations
 *
 * Every decoration here takes its `borderRadius` from `layout.radius` rather
 * than hardcoding a circle. The rail, the felt, the rim and the watermark always
 * did; the outer glow, the spotlight and the sheen mask used to be written as
 * `rounded-[50%]`, which is invisible on a round table and obvious on a square
 * one — a gold circle sitting behind a rounded rectangle, and a sheen clipped to
 * an ellipse that cuts the felt's corners off.
 *
 * `shape="none"` has no radius of its own to follow; `layout.radius` is `"0px"`
 * there, which is the right answer for a surface that is the design box.
 */

/* Explicit top/right/bottom/left rather than the `inset` shorthand: it is what
 * every browser and CSSOM implementation (incl. jsdom) agrees on. */
const px = (b: Box) => ({
  top: `${b.top}px`,
  right: `${b.right}px`,
  bottom: `${b.bottom}px`,
  left: `${b.left}px`,
});

/**
 * Not exported, and deliberately so: `TableSurface` is how the *two* table types
 * paint the same table, not a fourth thing for a client to choose between. The
 * package's public surface is unchanged by this file existing — a client still
 * picks a table type. `tests/docs-api.test.ts` fails if an exported `*Props`
 * interface has no docs page, which is the right pressure: it kept this internal.
 */
interface TableSurfaceProps {
  /** The laid-out surface. Only its `radius` and `boxes` are read. */
  layout: Pick<Layout, "radius" | "boxes">;
  /** Decoration across the middle of the felt. Nothing is drawn by default. */
  watermark?: ReactNode;
  /**
   * The ambient light — a breathing spotlight, a sheen that breathes with it.
   * Default true.
   */
  ambient?: boolean;
  /** Extra classes for the rail. */
  railClassName?: string;
  /** Extra classes for the felt. */
  feltClassName?: string;
}

/**
 * Everything drawn *behind* the seats and the caller's content.
 *
 * Render this first, then the seats, then `<TableRim />`: the rim is a hairline
 * that belongs on top, and the three layers are kept separate so a caller's
 * z-index still means what it says.
 */
export function TableSurface({
  layout,
  watermark,
  ambient = true,
  railClassName,
  feltClassName,
}: TableSurfaceProps) {
  const { boxes, radius } = layout;

  return (
    <>
      {/* glow behind the whole table */}
      <div
        className="absolute -inset-6 bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--color-gold-light)_16%,transparent),transparent_72%)] blur-3xl"
        style={{ borderRadius: radius }}
        aria-hidden="true"
      />

      {/* the rail */}
      <div
        className={cn(
          "absolute bg-gradient-to-b from-rail via-rail-dark to-rail-deep shadow-[0_26px_70px_-12px_rgba(0,0,0,0.85),inset_0_3px_0_rgba(255,255,255,0.20),inset_0_-6px_16px_rgba(0,0,0,0.5)]",
          railClassName,
        )}
        style={{ borderRadius: radius, ...px(boxes.table) }}
        aria-hidden="true"
      />

      {/* the felt */}
      <div
        className={cn(
          "absolute bg-[radial-gradient(ellipse_at_50%_32%,var(--color-felt-light),var(--color-felt)_55%,var(--color-felt-dark))] shadow-[inset_0_0_90px_rgba(0,0,0,0.55),inset_0_3px_10px_rgba(255,255,255,0.06)]",
          feltClassName,
        )}
        style={{ borderRadius: radius, ...px(boxes.felt) }}
        aria-hidden="true"
      />

      {/*
       * The ambient light: a spotlight that breathes, and a sheen that breathes
       * *with it*.
       *
       * Both used to run on their own clock — 7s and 22s — so the two lights
       * beat against each other and the felt went through a long series of
       * combinations, a few of which read as a lighting glitch. They are one
       * 7s `ease-in-out` cycle now, in phase, which is one slow pulse of the
       * whole felt instead of two lights drifting apart.
       */}
      {ambient && (
        <>
          <div
            className="absolute animate-spotlight bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--color-gold-glow)_14%,transparent),transparent_70%)] blur-2xl"
            style={{ borderRadius: radius, ...px(boxes.felt) }}
            aria-hidden="true"
          />
          <div className="absolute overflow-hidden" style={{ borderRadius: radius, ...px(boxes.felt) }} aria-hidden="true">
            <div className="absolute inset-0 animate-felt-shimmer bg-[linear-gradient(115deg,transparent_35%,rgba(255,255,255,0.05)_50%,transparent_65%)]" />
          </div>
        </>
      )}

      {watermark !== undefined && (
        <div
          className="pointer-events-none absolute flex items-center justify-center"
          style={{ borderRadius: radius, ...px(boxes.felt) }}
          aria-hidden="true"
        >
          {watermark}
        </div>
      )}
    </>
  );
}

/** The hairline drawn on top of the seats, at the outer boundary. */
export function TableRim({ layout }: { layout: Pick<Layout, "radius" | "boxes"> }) {
  return (
    <div
      className="pointer-events-none absolute border border-white/10"
      style={{ borderRadius: layout.radius, ...px(layout.boxes.rim) }}
      aria-hidden="true"
    />
  );
}
