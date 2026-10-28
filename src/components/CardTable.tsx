import { useRef, useLayoutEffect, useState, useMemo, type ReactNode } from "react";
import { cn } from "../cn";
import { ellipsePoint, seatAngle } from "../geometry";
import {
  DEFAULT_BET_SCALE,
  DEFAULT_FELT_GAP,
  DEFAULT_MARGIN_X,
  DEFAULT_MARGIN_Y,
  DEFAULT_SEAT_GAP,
  DEFAULT_SEAT_H,
  DEFAULT_SEAT_W,
  DESIGN_H,
  DESIGN_W,
  layoutSeats,
  type EllipseBox,
  type Layout,
} from "../layout";
import { SeatSizeContext } from "./seatSize";

/*
 * The design constants live in `layout.ts` with the rest of the geometry. They
 * are re-exported here so imports from this module keep working.
 */
export {
  DEFAULT_BET_SCALE,
  DEFAULT_FELT_GAP,
  DEFAULT_MARGIN_X,
  DEFAULT_MARGIN_Y,
  DEFAULT_SEAT_GAP,
  DESIGN_H,
  DESIGN_W,
} from "../layout";

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
  /** Everything `layoutSeats` computed — centres, frame size, every ellipse box. */
  layout: Layout;
}

export interface CardTableProps {
    /**
   * Number of seats. Default 6.
   *
   * There is no upper limit. The seat ring shrinks the frames until `seatGap` is
   * honoured, so 11–16 seats lay out fine (measured: 11 -> 126x139 frames,
   * 16 -> 80x88). Past roughly 16 the frames hit the 50% shrink floor and start
   * to overlap — that is the caller's call, not something to clamp silently.
   */
  seatCount?: number;
  /** Optional per-seat content. Length should equal `seatCount`. */
  seats?: (ReactNode | null)[];
  /**
   * Alternative to `seats`: render a seat by index, and size a shrunk frame to
   * the ring: `<Seat width={box.width} height={box.height} />`.
   *
   * The table tells you *where* the seat is, never *what it is*: no `isYou`,
   * no active/winner flag. Those are yours to pass to `Seat` — see the
   * `overlay` prop for the decorations that used to live here.
   */
  renderSeat?: (index: number, box: SeatBox) => ReactNode;
  /**
   * Optional per-seat "bet" content, auto-positioned on the betting line
   * (`betRadiusScale`) along the seat-to-center radius, so it faces the middle
   * of the table. Length should equal `seatCount`; `null` entries are skipped.
   */
  bets?: (ReactNode | null)[];
  /** Alternative to `bets`: render a bet by index (return `null` to skip). */
  renderBet?: (index: number) => ReactNode;
  /**
   * Radius of the bet ring, as a fraction of the table radius. Default 0.72.
   * The drawn betting line follows this value. Clamped to 0.2–1.
   */
  betRadiusScale?: number;
  /**
   * Angle (degrees) of seat 0. Default 90° = directly below the table centre.
   * Seats advance by `360 / seatCount` from there.
   */
  startAngle?: number;
  /** Optional content in the middle of the table (cards, pot, anything). */
  center?: ReactNode;
  /** Ambient spotlight + felt shimmer. Default true. */
  ambient?: boolean;
  /**
   * Content drawn above the seats, inside the scaled design box
   * (`pointer-events-none`). This is where the caller puts table-edge effects
   * and celebrations — the table does not know why anything is happening.
   *
   * ```tsx
   * <CardTable overlay={isMyTurn ? <TableGlow /> : null} />
   * ```
   */
  overlay?: ReactNode;
  /**
   * Alternative to `overlay`: render it with the geometry the table laid out,
   * so a decoration can be positioned on the real ellipse instead of guessed
   * at. Continues to work if the design box is resized:
   *
   * ```tsx
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
   * Only applies when `renderSeat` is used (it is the only form that can size
   * the frames); the `seats` array keeps the size you were given.
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
   *   table's proportions but letterboxes non-matching containers.
   * - `"container"`: derive the design width from the container's aspect ratio
   *   (clamped to 0.5–2.5) so the table fills the box instead of letterboxing.
   *   Use this for phone-portrait layouts. Pair with `designHeight` to set the
   *   scale.
   */
  fit?: "design" | "container";
  className?: string;
}

/** Aspect range `fit="container"` will not go outside of. */
const MIN_FIT_ASPECT = 0.5;
const MAX_FIT_ASPECT = 2.5;

/**
 * A responsive, game-agnostic card table. It scales a design box (1200x900 by
 * default) onto its container and arranges `seatCount` seats around the felt.
 *
 * It lays out and it draws: seat positions, frame sizes, the betting line, the
 * felt, the scaling, and an `overlay` slot for whatever you want on top. It
 * holds no opinion about the game — not whose turn it is, not who won, not
 * which seat is yours. Put those on the `Seat`s you pass in.
 */
export function CardTable({
  seatCount = 6,
  seats,
  renderSeat,
  bets,
  renderBet,
  betRadiusScale = DEFAULT_BET_SCALE,
  startAngle = 90,
  center,
  ambient = true,
  overlay,
  renderOverlay,
  seatWidth = DEFAULT_SEAT_W,
  seatHeight = DEFAULT_SEAT_H,
  seatGap = DEFAULT_SEAT_GAP,
  designWidth = DESIGN_W,
  designHeight = DESIGN_H,
  marginX = DEFAULT_MARGIN_X,
  marginY = DEFAULT_MARGIN_Y,
  feltGap = DEFAULT_FELT_GAP,
  fit = "design",
  className,
}: CardTableProps) {
  const requested = Math.floor(seatCount);
  const count = Number.isFinite(requested) ? Math.max(1, requested) : 1;
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

  const geo = useMemo(() => {
    const dh = designHeight;
    const dw =
      fit === "container" && box.w > 0 && box.h > 0
        ? dh * Math.min(MAX_FIT_ASPECT, Math.max(MIN_FIT_ASPECT, box.w / box.h))
        : designWidth;

    const layout = layoutSeats({
      count,
      designWidth: dw,
      designHeight: dh,
      marginX,
      marginY,
      feltGap,
      seatWidth,
      seatHeight,
      // Always applied. Every Seat inside the table is told its frame size
      // through context, so the shrink is no longer limited to `renderSeat`.
      seatGap,
      startAngle,
      betRadiusScale,
    });

    const scale = box.w > 0 && box.h > 0 ? Math.min(box.w / dw, box.h / dh) : 1;
    return { designW: dw, designH: dh, scale, layout };
  }, [
    count,
    designWidth,
    designHeight,
    marginX,
    marginY,
    feltGap,
    seatWidth,
    seatHeight,
    seatGap,
    startAngle,
    fit,
    betRadiusScale,
    box.w,
    box.h,
  ]);

  const { designW, designH, scale, layout } = geo;
  const { cx, cy, seatW, seatH, betRx, betRy, boxes } = layout;
  const hasBets = bets !== undefined || renderBet !== undefined;
  const hasOverlay = overlay !== undefined || renderOverlay !== undefined;

  /*
   * Every ellipse comes from `layoutSeats` as an inset box, so this component
   * computes no geometry of its own. The betting line in particular used to be
   * derived here from a module constant while the chips were positioned from the
   * `betRadiusScale` prop, which is how the two drifted apart.
   *
   * Explicit top/right/bottom/left rather than the `inset` shorthand: it is what
   * every browser and CSSOM implementation (incl. jsdom) agrees on.
   */
  const px = (b: EllipseBox) => ({
    top: `${b.top}px`,
    right: `${b.right}px`,
    bottom: `${b.bottom}px`,
    left: `${b.left}px`,
  });
  const tableFrameInset = px(boxes.table);
  const feltInset = px(boxes.felt);
  const rimInset = px(boxes.rim);
  const betLineInset = px(boxes.bettingLine);

  return (
    <div
      ref={outerRef}
      className={cn("relative flex h-full w-full min-h-0 items-center justify-center overflow-hidden", className)}
    >
      <div style={{ width: designW * scale, height: designH * scale }}>
        <div
          className="relative"
          style={{ width: designW, height: designH, transform: `scale(${scale})`, transformOrigin: "top left" }}
        >
          <div
            className="absolute -inset-6 rounded-[50%] bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--color-gold-light)_16%,transparent),transparent_72%)] blur-3xl"
            aria-hidden="true"
          />

          {/* wooden rail */}
          <div
            className="absolute rounded-[50%] bg-gradient-to-b from-rail via-rail-dark to-rail-deep shadow-[0_26px_70px_-12px_rgba(0,0,0,0.85),inset_0_3px_0_rgba(255,255,255,0.20),inset_0_-6px_16px_rgba(0,0,0,0.5)]"
            style={tableFrameInset}
            aria-hidden="true"
          />

          {/* felt */}
          <div
            className="absolute rounded-[50%] bg-[radial-gradient(ellipse_at_50%_32%,var(--color-felt-light),var(--color-felt)_55%,var(--color-felt-dark))] shadow-[inset_0_0_90px_rgba(0,0,0,0.55),inset_0_3px_10px_rgba(255,255,255,0.06)]"
            style={feltInset}
            aria-hidden="true"
          />

          {/* ambient: breathing spotlight + felt shimmer */}
          {ambient && (
            <>
              <div
                className="absolute animate-spotlight rounded-[50%] bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--color-gold-glow)_14%,transparent),transparent_70%)] blur-2xl"
                style={feltInset}
                aria-hidden="true"
              />
              <div className="absolute overflow-hidden rounded-[50%]" style={feltInset} aria-hidden="true">
                <div className="absolute inset-0 animate-felt-shimmer bg-[linear-gradient(115deg,transparent_42%,rgba(255,255,255,0.06)_50%,transparent_58%)] bg-[length:220%_100%]" />
              </div>
            </>
          )}

          {/* betting line */}
          <div
            data-part="betting-line"
            className="absolute rounded-[50%] border-2 border-white/10 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.25)]"
            style={betLineInset}
            aria-hidden="true"
          />

          {/* center suit watermark */}
          <div className="absolute flex items-center justify-center pointer-events-none" style={feltInset} aria-hidden="true">
            <span className="text-white/[0.05] text-[110px] font-black tracking-[0.2em] select-none leading-none">
              ♠♥♦♣
            </span>
          </div>

          {/* center slot (optional) */}
          {center !== undefined && (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              {center}
            </div>
          )}

          {/* seats */}
          <div className="absolute inset-0 z-20">
            {/*
             * The context is what gives every `Seat` its frame size: one source
             * for it (the ring this table computed) instead of CardTable's
             * seatWidth and Seat's own width being two unrelated numbers that
             * happen to share a default.
             */}
            <SeatSizeContext.Provider value={{ width: seatW, height: seatH }}>
              {layout.seats.map((seat) => {
                const { index, x, y } = seat;
                const box: SeatBox = { index, x, y, width: seatW, height: seatH };
                const content = seats ? (seats[index] ?? null) : renderSeat ? renderSeat(index, box) : null;
                if (content === null) return null;
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

          {/* bets on the betting line (positioned toward the table center) */}
          {hasBets && (
            <div className="pointer-events-none absolute inset-0 z-20">
              {layout.seats.map(({ index }) => {
                const content = bets ? (bets[index] ?? null) : renderBet ? renderBet(index) : null;
                if (content === null || content === undefined) return null;
                const pt = ellipsePoint(cx, cy, betRx, betRy, seatAngle(index, count, startAngle));
                return (
                  <div
                    key={index}
                    data-seat-bet={index}
                    className="absolute"
                    style={{ left: `${pt.x}px`, top: `${pt.y}px`, transform: "translate(-50%, -50%)" }}
                  >
                    {content}
                  </div>
                );
              })}
            </div>
          )}

          {/* caller-drawn overlay: edge effects, celebrations, annotations */}
          {hasOverlay && (
            <div data-part="overlay" className="pointer-events-none absolute inset-0 z-30">
              {overlay !== undefined
                ? overlay
                : renderOverlay?.({ designWidth: designW, designHeight: designH, layout })}
            </div>
          )}

          {/* outer rim highlight */}
          <div className="absolute rounded-[50%] border border-white/10 pointer-events-none" style={rimInset} aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
