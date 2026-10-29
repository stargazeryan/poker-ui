import type { ReactNode } from "react";
import { cn } from "../cn";
import {
  DEFAULT_FELT_GAP,
  DEFAULT_MARGIN_X,
  DEFAULT_MARGIN_Y,
  DEFAULT_SEAT_H,
  DEFAULT_SEAT_GAP,
  DEFAULT_SEAT_W,
  DESIGN_H,
  DESIGN_W,
  layoutTable,
  type Box,
  type Layout,
} from "../layout";
import type { SeatPlacement, TableShape } from "../surface";
import { FitBox, type DesignBox } from "./FitBox";
import { SeatSizeContext } from "./seatSize";

/* Re-exported so an import from this module keeps working; the constants live
 * in `layout.ts` and `surface.ts` with the rest of the geometry. */
export {
  DEFAULT_FELT_GAP,
  DEFAULT_MARGIN_X,
  DEFAULT_MARGIN_Y,
  DEFAULT_SEAT_GAP,
  DEFAULT_SEAT_H,
  DEFAULT_SEAT_W,
  DESIGN_H,
  DESIGN_W,
} from "../layout";
export { DEFAULT_CORNER_FRACTION } from "../surface";

/** Geometry CardTable laid a seat frame out for, handed to `renderSeat`. */
export interface SeatBox {
  index: number;
  /** Centre of the frame, in design space. */
  x: number;
  y: number;
  /** Frame size the ring was laid out for (≤ `seatWidth`/`seatHeight`). */
  width: number;
  height: number;
}

/** What `renderOverlay` is handed: the design box, and the layout inside it. */
export interface TableOverlayGeometry {
  /** Design box the overlay is scaled with. */
  designWidth: number;
  designHeight: number;
  /** Everything `layoutTable` computed — centres, frame size, the surface, every ring box. */
  layout: Layout;
}

/** An outline drawn on the surface, at `radius` (a fraction of it). */
export interface TableRing {
  /** Name for this ring, used for the `data-ring` attribute and to find it again. */
  id: string;
  /** Radius as a fraction of the surface: 0 at the centre, 1 at the rail. */
  radius: number;
  className?: string;
}

/**
 * Content positioned between the centre of the table and each seat, at `radius`.
 *
 * This is the mechanism a betting line, a chip stack, a muck pile or a "current
 * bid" bubble all need, with none of them named: the table places whatever you
 * return, on the line from the centre toward that seat.
 */
export interface TableSlot {
  /** Name for this slot, used for the `data-slot` attribute. */
  id: string;
  /** Distance out toward the seat, as a fraction of the seat's own distance. */
  radius: number;
  /** Content for seat `index`. Return `null` to skip that seat. */
  render: (index: number) => ReactNode;
}

export interface CardTableProps {
  /**
   * Number of seats. Default 6.
   *
   * There is no upper limit. Seats shrink until `seatGap` is honoured, so 11–16
   * lay out fine (measured on the default ring: 11 -> 126x139 frames, 16 ->
   * 80x88). Past roughly 16 the frames hit the 50% shrink floor and start to
   * overlap — that is the caller's call, not something to clamp silently.
   */
  seatCount?: number;
  /**
   * Render a seat by index. Return `null` to skip that position.
   *
   * **This is the only way to render a seat**, and a function rather than an
   * array of nodes because it is strictly the more capable form: it hands you
   * `box`, the centre and the frame size the ring was laid out for (after the
   * auto-shrink), which an array of nodes cannot reach. There used to be a
   * `seats` array next to it; it was the same call site with less information,
   * one precedence rule nobody knew, and two things to document.
   *
   * ```tsx
   * renderSeat={(i, box) => (
   *   <Seat width={box.width} height={box.height} isActive={activeSeat === i} />
   * )}
   * ```
   *
   * A bare `<Seat />` needs no props at all: the table tells every `Seat`
   * inside it the frame size through context, so `box` is only for content you
   * position yourself.
   *
   * The table tells you *where* the seat is, never *what it is*: no `isYou`, no
   * active/winner flag. Those are yours to pass to `Seat` — see `renderOverlay`
   * for the decorations that used to live here.
   */
  renderSeat?: (index: number, box: SeatBox) => ReactNode;
  /**
   * Angle (degrees) of seat 0. Default 90° = directly below the table centre.
   * On a `ring` the seats advance by `360 / seatCount` from there; on a
   * rectangle they walk the perimeter from the bottom edge's centre.
   */
  startAngle?: number;
  /**
   * Boundary to draw. Default `"ellipse"`.
   *
   * - `"ellipse"` — a round table.
   * - `"rect"` — a rectangular table with rounded corners (`cornerRadius`).
   * - `"none"` — no rail and no felt: the design box itself is the surface,
   *   with the seats laid out on it and nothing drawn behind them.
   *
   * This changes the *surface* only. What the table is *for* is the caller's
   * business, which is why every shape here is parameterised rather than themed.
   */
  shape?: TableShape;
  /** Corner radius of a `rect` table, in design-space px. Default 45% of the short half-extent. */
  cornerRadius?: number;
  /**
   * Where the seats go. Defaults to the shape's natural placement: a `ring` on
   * an ellipse, `perimeter` on a rectangle, a `row` on no surface at all.
   *
   * `"row"` is the layout a dealer/player arrangement wants — never a ring.
   * For anything these three cannot express, use `<FitBox>` with `frames.ts`
   * directly; that is exactly what the recipes in `@stargazeryan/poker-ui/recipes`
   * do, and it is why the blackjack recipe has no table component in it.
   */
  seatPlacement?: SeatPlacement;
  /**
   * Draw the rail, the felt and the rim. `false` gives you the seats and the
   * geometry with nothing painted behind them, which is what a hairline or
   * light-themed table wants.
   *
   * Defaults to `true`, except with `shape="none"` — no boundary was asked for,
   * so none is painted. Pass `true` explicitly for a full-bleed backdrop.
   */
  deck?: boolean;
  /**
   * Decoration drawn across the middle of the felt, e.g. `<span>♠♥♦♣</span>`.
   *
   * Nothing is drawn by default. A suit watermark is a card-room decoration, not
   * part of a table, so a game that is not played on green felt does not inherit
   * one.
   */
  watermark?: ReactNode;
  /** Extra classes for the rail, to restyle or replace it. */
  railClassName?: string;
  /** Extra classes for the felt. */
  feltClassName?: string;
  /**
   * Outlines drawn on the surface, e.g. a betting line. `radius` is a fraction
   * of the surface, and the drawn ring follows it exactly — the two used to be
   * derived separately and drifted apart. Empty by default.
   */
  rings?: TableRing[];
  /**
   * Content positioned between the centre and each seat, e.g. chips, a bet pill,
   * a bid. Empty by default: the table draws no line and places nothing unless
   * you declare it.
   */
  slots?: TableSlot[];
  /** Optional content in the middle of the table (cards, a counter, anything). */
  center?: ReactNode;
  /** Ambient spotlight + felt shimmer. Default true. */
  ambient?: boolean;
  /**
   * Content drawn above the seats, inside the scaled design box
   * (`pointer-events-none`). This is where the caller puts table-edge effects
   * and celebrations — the table does not know why anything is happening.
   *
   * It is **called** with the geometry the table laid out, so a decoration can
   * be positioned on the real surface instead of guessed at, and keeps working
   * when the design box is resized. Ignore the argument when you do not need it;
   * there used to be a plain-node `overlay` prop next to this one, which
   * rendered into exactly the same layer with exactly the same wrapper and only
   * differed by being unable to see the geometry.
   *
   * ```tsx
   * renderOverlay={() => (isMyTurn ? <TableGlow /> : null)}
   * renderOverlay={({ layout }) => (
   *   <div style={layout.boxes.glow} className="absolute animate-turn-glow rounded-[50%]" />
   * )}
   * ```
   */
  renderOverlay?: (geometry: TableOverlayGeometry) => ReactNode;
  /** Preferred seat frame width. Default 160. */
  seatWidth?: number;
  /** Preferred seat frame height. Default 176. */
  seatHeight?: number;
  /**
   * Minimum clearance to keep between neighbouring seat frames, in design-space
   * px. Frames shrink uniformly (down to 50%) until it is honoured, which is what
   * keeps 9–10 seat tables from looking cramped and what lets 11–16 seat tables
   * lay out at all. `0` disables it.
   * Every Seat inside the table is told the frame size through context, so this
   * applies to the `seats` array form too.
   * Default 24.
   */
  seatGap?: number;
  /** Design-space width. Default 1200. */
  designWidth?: number;
  /** Design-space height. Default 900. */
  designHeight?: number;
  /**
   * Rail inset as a fraction of the design box (default 164/1200).
   * Proportional so a custom design box stays in proportion.
   */
  marginX?: number;
  /** Rail inset as a fraction of the design box (default 196/900). */
  marginY?: number;
  /** Felt inset from the rail, in design-space px. Default 11. */
  feltGap?: number;
  /**
   * How the design box relates to the container.
   * - `"design"` (default): scale the fixed design box to fit — preserves the
   *   proportions but letterboxes non-matching containers.
   * - `"container"`: derive the design width from the container's aspect ratio
   *   (clamped to 0.5–2.5) so the table fills the box instead of letterboxing.
   *   Use this for phone-portrait layouts.
   */
  fit?: "design" | "container";
  className?: string;
}

/*
 * Every ellipse, rectangle and inset comes from `layoutTable` as a box, so this
 * component computes no geometry of its own.
 *
 * Explicit top/right/bottom/left rather than the `inset` shorthand: it is what
 * every browser and CSSOM implementation (incl. jsdom) agrees on.
 */
const px = (b: Box) => ({
  top: `${b.top}px`,
  right: `${b.right}px`,
  bottom: `${b.bottom}px`,
  left: `${b.left}px`,
});

/**
 * A responsive card table: a surface, a seat ring, and slots for whatever you
 * want on top. It lays out and it draws. It holds no opinion about the game —
 * not whose turn it is, not who won, not which seat is yours, and not whether
 * there is a betting line, because two of those are the caller's and one of them
 * belongs to one game.
 */
export function CardTable(props: CardTableProps) {
  const { designWidth = DESIGN_W, designHeight = DESIGN_H, fit = "design", className } = props;
  return (
    <FitBox designWidth={designWidth} designHeight={designHeight} fit={fit} className={className}>
      {(design) => <Table {...props} design={design} />}
    </FitBox>
  );
}

function Table({
  design,
  seatCount = 6,
  renderSeat,
  startAngle = 90,
  shape = "ellipse",
  cornerRadius,
  seatPlacement,
  // `shape` is destructured above, so the default can read it: no boundary
  // means nothing to paint. Declaring `deck` before `shape` would break this.
  deck = shape !== "none",
  watermark,
  railClassName,
  feltClassName,
  rings,
  slots,
  center,
  ambient = true,
  renderOverlay,
  seatWidth = DEFAULT_SEAT_W,
  seatHeight = DEFAULT_SEAT_H,
  seatGap = DEFAULT_SEAT_GAP,
  marginX = DEFAULT_MARGIN_X,
  marginY = DEFAULT_MARGIN_Y,
  feltGap = DEFAULT_FELT_GAP,
}: CardTableProps & { design: DesignBox }) {
  const requested = Math.floor(seatCount);
  const count = Number.isFinite(requested) ? Math.max(1, requested) : 1;

  const layout = layoutTable({
    count,
    designWidth: design.width,
    designHeight: design.height,
    marginX,
    marginY,
    feltGap,
    seatWidth,
    seatHeight,
    seatGap,
    startAngle,
    shape,
    cornerRadius,
    seatPlacement,
  });

  const { seatW, seatH, boxes } = layout;

  return (
    <>
      {deck && (
        <>
          <div
            className="absolute -inset-6 rounded-[50%] bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--color-gold-light)_16%,transparent),transparent_72%)] blur-3xl"
            aria-hidden="true"
          />

          {/* the rail */}
          <div
            className={cn(
              "absolute bg-gradient-to-b from-rail via-rail-dark to-rail-deep shadow-[0_26px_70px_-12px_rgba(0,0,0,0.85),inset_0_3px_0_rgba(255,255,255,0.20),inset_0_-6px_16px_rgba(0,0,0,0.5)]",
              railClassName,
            )}
            style={{ borderRadius: layout.radius, ...px(boxes.table) }}
            aria-hidden="true"
          />

          {/* the felt */}
          <div
            className={cn(
              "absolute bg-[radial-gradient(ellipse_at_50%_32%,var(--color-felt-light),var(--color-felt)_55%,var(--color-felt-dark))] shadow-[inset_0_0_90px_rgba(0,0,0,0.55),inset_0_3px_10px_rgba(255,255,255,0.06)]",
              feltClassName,
            )}
            style={{ borderRadius: layout.radius, ...px(boxes.felt) }}
            aria-hidden="true"
          />

          {/* ambient: breathing spotlight + felt shimmer */}
          {ambient && (
            <>
              <div
                className="absolute animate-spotlight rounded-[50%] bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--color-gold-glow)_14%,transparent),transparent_70%)] blur-2xl"
                style={px(boxes.felt)}
                aria-hidden="true"
              />
              <div className="absolute overflow-hidden rounded-[50%]" style={px(boxes.felt)} aria-hidden="true">
                <div className="absolute inset-0 animate-felt-shimmer bg-[linear-gradient(115deg,transparent_42%,rgba(255,255,255,0.06)_50%,transparent_58%)] bg-[length:220%_100%]" />
              </div>
            </>
          )}

          {watermark !== undefined && (
            <div
              className="absolute flex items-center justify-center pointer-events-none"
              style={{ borderRadius: layout.radius, ...px(boxes.felt) }}
              aria-hidden="true"
            >
              {watermark}
            </div>
          )}
        </>
      )}

      {/* caller-declared outlines: a betting line, a muck ring, a target zone */}
      {rings?.map((ring) => (
        <div
          key={ring.id}
          data-ring={ring.id}
          data-part="ring"
          className={cn("absolute border-2 border-white/10 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.25)]", ring.className)}
          style={{ borderRadius: layout.ringRadius(ring.radius), ...px(layout.ringBox(ring.radius)) }}
          aria-hidden="true"
        />
      ))}

      {/* center slot (optional) */}
      {center !== undefined && (
        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center">{center}</div>
      )}

      {/* seats */}
      <div className="absolute inset-0 z-20">
        {/*
         * The context is what gives every `Seat` its frame size: one source for
         * it (the layout this table computed) instead of CardTable's seatWidth
         * and Seat's own width being two unrelated numbers that happen to share
         * a default.
         */}
        <SeatSizeContext.Provider value={{ width: seatW, height: seatH }}>
          {layout.seats.map(({ index, x, y }) => {
            const box: SeatBox = { index, x, y, width: seatW, height: seatH };
            const content = renderSeat ? renderSeat(index, box) : null;
            if (content === null || content === undefined) return null;
            return (
              <div
                key={index}
                data-part="seat"
                data-seat={index}
                className="absolute"
                style={{ left: `${x - seatW / 2}px`, top: `${y - seatH / 2}px` }}
              >
                {content}
              </div>
            );
          })}
        </SeatSizeContext.Provider>
      </div>

      {/* caller-declared slots: one piece of content per seat, out toward it */}
      {slots?.map((slot) => (
        <div key={slot.id} data-slot={slot.id} data-part="slot" className="pointer-events-none absolute inset-0 z-20">
          {layout.seats.map(({ index }) => {
            const content = slot.render(index);
            if (content === null || content === undefined) return null;
            const point = layout.slotPoint(index, slot.radius);
            return (
              <div
                key={index}
                data-slot-index={index}
                className="absolute"
                style={{ left: `${point.x}px`, top: `${point.y}px`, transform: "translate(-50%, -50%)" }}
              >
                {content}
              </div>
            );
          })}
        </div>
      ))}

      {/* caller-drawn overlay: edge effects, celebrations, annotations */}
      {renderOverlay !== undefined && (
        <div data-part="overlay" className="pointer-events-none absolute inset-0 z-30">
          {renderOverlay({ designWidth: design.width, designHeight: design.height, layout })}
        </div>
      )}

      {/* outer rim highlight */}
      {deck && (
        <div
          className="absolute border border-white/10 pointer-events-none"
          style={{ borderRadius: layout.radius, ...px(boxes.rim) }}
          aria-hidden="true"
        />
      )}
    </>
  );
}
