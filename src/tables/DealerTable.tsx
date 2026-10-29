import type { ReactNode } from "react";
import { cn } from "../cn";
import { FitBox } from "../components/FitBox";
import { SeatSizeContext } from "../components/seatSize";
import { fitFrameScale, fitRowScale, rowFrames, type FrameBox } from "../frames";
import { DESIGN_H, DESIGN_W, ROW_FRACTION } from "../layout";

/**
 * A **dealer table**: one frame at the head, and a row of frames for the
 * players. No felt, no rail, no ellipse.
 *
 * This is the third table type, and the one that used to have no name at all.
 * Plenty of card games are not played *around* anything: one position holds
 * something everybody else acts against — a dealer's hand, a banker's cards, a
 * shared row, a pile — and the players line up opposite it. Twenty-one, the
 * three-card banking games, baccarat, dragon-tiger, and whatever you are
 * building next all have this shape, and none of them wants a wooden oval
 * behind it.
 *
 * It is built out of `FitBox` (a design box scaled to its container) and
 * `rowFrames` (where the frames go) rather than `CardTable`, which is what makes
 * the claim real: **this file cannot draw a felt, because it has no felt to
 * draw.** `tests/tables.test.tsx` renders one and asserts the tree is free of
 * every table-surface decoration.
 *
 * The head is whatever your game calls it. It is a *position*, not a role: pass
 * the dealer's hand, or the banker's, or a label and a counter.
 *
 * ```tsx
 * <DealerTable
 *   head={<Seat header="Dealer"><CardRow cards={dealer} /></Seat>}
 *   hands={hands.map((h) => (
 *     <Seat isActive={h.active} footer={<ChipStack amount={h.bet} />}>
 *       <CardRow cards={h.cards} />
 *     </Seat>
 *   ))}
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
  /** Content of the head frame — a hand, a pile, a label. Positioned, sized, not drawn. */
  head?: ReactNode;
  /** Preferred head frame width. Default 240. */
  headWidth?: number;
  /** Preferred head frame height. Default 230. */
  headHeight?: number;
  /** Centre of the head frame, as a fraction of the design height. Default 0.16. */
  headY?: number;
  /** Content per player position. `null` skips that position. */
  hands?: (ReactNode | null)[];
  /**
   * Alternative to `hands`: render a position by index, and size a shrunk frame
   * to the row — `<Seat width={box.width} height={box.height} />`.
   */
  renderHand?: (index: number, box: FrameBox) => ReactNode;
  /** How many player positions there are. Defaults to `hands.length`. */
  handCount?: number;
  /** Preferred hand frame width. Default 220. */
  handWidth?: number;
  /** Preferred hand frame height. Default 280. */
  handHeight?: number;
  /** Minimum clearance between hand frames, shrunk to fit. `0` disables it. Default 24. */
  handGap?: number;
  /** Centre of the row of hands, as a fraction of the design height. Default 0.74. */
  handY?: number;
  /** Design-space width. Default 1200. */
  designWidth?: number;
  /** Design-space height. Default 900. */
  designHeight?: number;
  /** `"design"` (default) scales the fixed box; `"container"` fills the box. */
  fit?: "design" | "container";
  /** Content over the whole design box, `pointer-events-none`. */
  overlay?: ReactNode;
  className?: string;
}

/** Round a frame dimension at a scale, never below 1. */
const dim = (base: number, scale: number): number => Math.max(1, Math.round(base * scale));

export function DealerTable({
  head,
  headWidth = DEFAULT_HEAD_W,
  headHeight = DEFAULT_HEAD_H,
  headY = DEFAULT_HEAD_Y,
  hands,
  renderHand,
  handCount,
  handWidth = DEFAULT_HAND_W,
  handHeight = DEFAULT_HAND_H,
  handGap = DEFAULT_HAND_GAP,
  handY = DEFAULT_HAND_Y,
  designWidth = DESIGN_W,
  designHeight = DESIGN_H,
  fit = "design",
  overlay,
  className,
}: DealerTableProps) {
  return (
    <FitBox designWidth={designWidth} designHeight={designHeight} fit={fit} className={className}>
      {({ width, height }) => {
        const requested = Math.floor(handCount ?? hands?.length ?? 1);
        const count = Number.isFinite(requested) ? Math.max(1, requested) : 1;

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
                const content = hands ? (hands[index] ?? null) : renderHand ? renderHand(index, frame) : null;
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

            {overlay !== undefined && (
              <div
                data-part="overlay"
                className={cn("pointer-events-none absolute inset-0 z-30")}
              >
                {overlay}
              </div>
            )}
          </>
        );
      }}
    </FitBox>
  );
}
