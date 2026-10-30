import type { ReactNode } from "react";
import { cn } from "../cn";
import { FitBox } from "../components/FitBox";
import { SeatSizeContext } from "../components/seatSize";
import { TableRim, TableSurface } from "../components/TableSurface";
import { fitFrameScale, fitRowScale, rowFrames, type FrameBox } from "../frames";
import {
  DEFAULT_FELT_GAP,
  DEFAULT_MARGIN_X,
  DEFAULT_MARGIN_Y,
  DESIGN_H,
  DESIGN_W,
  layoutTable,
  ROW_FRACTION,
} from "../layout";
import type { TableShape } from "../surface";

/**
 * A **dealer table**: one frame at the head, and a row of frames for the
 * players, on a rounded-rectangle table.
 *
 * This is the third table type, and the one that used to have no name at all.
 * Plenty of card games are not played *around* anything: one position holds
 * something everybody else acts against — a dealer's hand, a banker's cards, a
 * shared row, a pile — and the players line up opposite it. Twenty-one, the
 * three-card banking games, baccarat, dragon-tiger, and whatever you are
 * building next all have this shape.
 *
 * ## What makes this not a `CardTable`
 *
 * The **arrangement**, not the furniture. Its positions are a head and a row,
 * never a ring — `seatPlacement: "row"` against `CardTable`'s ellipse — and this
 * file lays that row out with `rowFrames` and sizes it with `fitRowScale`, which
 * is the part a ring cannot express. `tests/tables.test.tsx` guards that: it
 * renders one and asserts every position shares a row, and that no ring seat
 * layer exists at all.
 *
 * It used to also draw *nothing* — no rail, no felt, no rim — on the reasoning
 * that a dealer table has no ellipse to draw. That was the wrong conclusion from
 * a right observation: not being a poker oval is not the same as having no
 * surface, and a game sitting on the page's raw background looks unfinished. The
 * surface below comes from `layoutTable`, the same function `CardTable` uses, so
 * the two tables cannot drift apart; the default is a rounded rectangle
 * (`shape="rect"`), and `shape="none"` still gets you the bare version.
 *
 * The head is whatever your game calls it. It is a *position*, not a role: pass
 * the dealer's hand, or the banker's, or a label and a counter.
 *
 * ```tsx
 * <DealerTable
 *   handCount={hands.length}
 *   head={<Seat header="Dealer"><CardRow cards={dealer} /></Seat>}
 *   renderHand={(i) => (
 *     <Seat isActive={hands[i].active} footer={<ChipStack amount={hands[i].bet} />}>
 *       <CardRow cards={hands[i].cards} />
 *     </Seat>
 *   )}
 * />
 * ```
 */

/** Preferred head-frame size. */
export const DEFAULT_HEAD_W = 240;
export const DEFAULT_HEAD_H = 230;
/** Preferred hand-frame size. */
export const DEFAULT_HAND_W = 220;
export const DEFAULT_HAND_H = 280;
/** Clearance between neighbouring hand frames. */
export const DEFAULT_HAND_GAP = 24;
/** Centre of the head frame, as a fraction of the design-box height. */
export const DEFAULT_HEAD_Y = 0.16;
/** Centre of the row of hands, as a fraction of the design-box height. */
export const DEFAULT_HAND_Y = 0.74;

export interface DealerTableProps {
  /** Content of the head frame — a hand, a pile, a label. Positioned and sized. */
  head?: ReactNode;
  /** Preferred head frame width. Default 240. */
  headWidth?: number;
  /** Preferred head frame height. Default 230. */
  headHeight?: number;
  /** Centre of the head frame, as a fraction of the design height. Default 0.16. */
  headY?: number;
  /**
   * Render a player position by index. Return `null` to skip it.
   *
   * **This is the only way to render a position.** A function rather than an
   * array of nodes because it hands you `box` — the frame size the row was laid
   * out for after the auto-shrink — which an array of nodes cannot reach, and
   * because a row whose length changes mid-round (a split) is one `handCount`
   * away rather than an array that has to be rebuilt. `tests/separation.test.ts`
   * fails if an array form grows back next to it.
   */
  renderHand?: (index: number, box: FrameBox) => ReactNode;
  /** How many player positions there are. Default 1. */
  handCount?: number;
  /** Preferred hand frame width. Default 220. */
  handWidth?: number;
  /** Preferred hand frame height. Default 280. */
  handHeight?: number;
  /** Minimum clearance between hand frames, shrunk to fit. `0` disables it. Default 24. */
  handGap?: number;
  /** Centre of the row of hands, as a fraction of the design height. Default 0.74. */
  handY?: number;
  /**
   * Boundary to draw. Default `"rect"` — a rounded rectangle, which is what a
   * dealer table is. `"ellipse"` is available if your game really does line the
   * players up around a circle, and `"none"` paints nothing (the design box is
   * the surface), which is what this table used to be.
   */
  shape?: TableShape;
  /** Corner radius of a `rect` surface, in design-space px. Default 45% of the short half-extent. */
  cornerRadius?: number;
  /**
   * Draw the rail, the felt and the rim. Defaults to `true`, except with
   * `shape="none"`, where no boundary was asked for.
   */
  deck?: boolean;
  /** Ambient spotlight + felt sheen. Default true. */
  ambient?: boolean;
  /**
   * Draw the edge glow — a golden halo hugging the rail, behind the hands.
   * Default false. `glow={isDealersTurn}` is what this is for; the table does
   * not know what a turn is.
   */
  glow?: boolean;
  /** Decoration across the middle of the felt. Nothing is drawn by default. */
  watermark?: ReactNode;
  /** Extra classes for the rail. */
  railClassName?: string;
  /** Extra classes for the felt. */
  feltClassName?: string;
  /** Rail inset as a fraction of the design box. Default 164/1200. */
  marginX?: number;
  /** Rail inset as a fraction of the design box. Default 196/900. */
  marginY?: number;
  /** Felt inset from the rail, in design-space px. Default 11. */
  feltGap?: number;
  /** Design-space width. Default 1200. */
  designWidth?: number;
  /** Design-space height. Default 900. */
  designHeight?: number;
  /** `"design"` (default) scales the fixed box; `"container"` fills the box. */
  fit?: "design" | "container";
  /**
   * Content over the whole design box, `pointer-events-none` — a settlement
   * banner, confetti. **Called**, like `CardTable`'s, so both tables spell this
   * slot the same way and a caller switching between them changes a prop's
   * value rather than its name.
   */
  renderOverlay?: (geometry: DealerOverlayGeometry) => ReactNode;
  className?: string;
}

/** What `DealerTable`'s `renderOverlay` is handed. */
export interface DealerOverlayGeometry {
  /** Design box the overlay is scaled with. */
  designWidth: number;
  designHeight: number;
  /** Multiplier the design box is drawn at. */
  scale: number;
}

/** Round a frame dimension at a scale, never below 1. */
const dim = (base: number, scale: number): number => Math.max(1, Math.round(base * scale));

export function DealerTable({
  head,
  headWidth = DEFAULT_HEAD_W,
  headHeight = DEFAULT_HEAD_H,
  headY = DEFAULT_HEAD_Y,
  renderHand,
  handCount = 1,
  handWidth = DEFAULT_HAND_W,
  handHeight = DEFAULT_HAND_H,
  handGap = DEFAULT_HAND_GAP,
  handY = DEFAULT_HAND_Y,
  shape = "rect",
  cornerRadius,
  // `shape` is destructured above, so the default can read it: no boundary
  // means nothing to paint.
  deck = shape !== "none",
  ambient = true,
  glow = false,
  watermark,
  railClassName,
  feltClassName,
  marginX = DEFAULT_MARGIN_X,
  marginY = DEFAULT_MARGIN_Y,
  feltGap = DEFAULT_FELT_GAP,
  designWidth = DESIGN_W,
  designHeight = DESIGN_H,
  fit = "design",
  renderOverlay,
  className,
}: DealerTableProps) {
  return (
    <FitBox designWidth={designWidth} designHeight={designHeight} fit={fit} className={className}>
      {({ width, height, scale: boxScale }) => {
        const requested = Math.floor(handCount);
        const count = Number.isFinite(requested) ? Math.max(1, requested) : 1;

        /*
         * The surface, from the same function `CardTable` calls. Only `radius`
         * and `boxes` are used — the ring seats it also computes are ignored,
         * because this table's positions are a row. Going through it rather than
         * re-deriving the insets is what keeps the two tables' felt identical.
         */
        const surface = layoutTable({
          count,
          designWidth: width,
          designHeight: height,
          marginX,
          marginY,
          feltGap,
          seatWidth: handWidth,
          seatHeight: handHeight,
          seatGap: handGap,
          startAngle: 90,
          shape,
          cornerRadius,
          seatPlacement: "row",
        });

        // Two constraints, and a row needs both: the gap between neighbours (the
        // same shrink a ring uses) and the width of the box itself, which a ring
        // gets for free from its clamped radii and a row does not.
        const scale = Math.min(
          fitFrameScale(
            (s) =>
              rowFrames({
                count,
                cx: width / 2,
                cy: height * handY,
                width: dim(handWidth, s),
                height: dim(handHeight, s),
                gap: handGap,
              }),
            handGap,
          ),
          fitRowScale({
            count,
            width: handWidth,
            height: handHeight,
            gap: handGap,
            maxWidth: width,
            fraction: ROW_FRACTION,
          }),
        );
        const w = dim(handWidth, scale);
        const h = dim(handHeight, scale);
        const frames = rowFrames({ count, cx: width / 2, cy: height * handY, width: w, height: h, gap: handGap });

        return (
          <>
            {deck && (
              <TableSurface
                layout={surface}
                watermark={watermark}
                ambient={ambient}
                glow={glow}
                railClassName={railClassName}
                feltClassName={feltClassName}
              />
            )}

            {head !== undefined && (
              <div
                data-part="head"
                className="absolute"
                style={{ left: width / 2 - headWidth / 2, top: height * headY - headHeight / 2 }}
              >
                <SeatSizeContext.Provider value={{ width: headWidth, height: headHeight }}>
                  {head}
                </SeatSizeContext.Provider>
              </div>
            )}

            <SeatSizeContext.Provider value={{ width: w, height: h }}>
              {frames.map((frame, index) => {
                const content = renderHand ? renderHand(index, frame) : null;
                if (content === null || content === undefined) return null;
                return (
                  <div
                    key={index}
                    data-part="hand"
                    data-hand={index}
                    className="absolute"
                    style={{ left: frame.x - w / 2, top: frame.y - h / 2 }}
                  >
                    {content}
                  </div>
                );
              })}
            </SeatSizeContext.Provider>

            {renderOverlay !== undefined && (
              <div data-part="overlay" className={cn("pointer-events-none absolute inset-0 z-30")}>
                {renderOverlay({ designWidth: width, designHeight: height, scale: boxScale })}
              </div>
            )}

            {deck && <TableRim layout={surface} />}
          </>
        );
      }}
    </FitBox>
  );
}
