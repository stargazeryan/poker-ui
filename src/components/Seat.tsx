import type { CSSProperties, ReactNode } from "react";
import { cn } from "../cn";
import { DEFAULT_SEAT_H, DEFAULT_SEAT_W } from "../layout";
import { useSeatSize } from "./seatSize";

export interface SeatProps {
  /**
   * Turn/current highlight. "Active" rather than "your turn": what makes a seat
   * current is the game's business, and the frame only draws the state.
   */
  isActive?: boolean;
  /** Win highlight. */
  isWinner?: boolean;
  /** Dimmed — out of the hand, disconnected, empty. */
  isDimmed?: boolean;
  /** Enable the turn/winner glow animations. Default true. */
  animated?: boolean;
  /** Optional click handler (e.g. "sit here"). */
  onClick?: () => void;

  /** Slot: top row inside the frame — name / badges. */
  header?: ReactNode;
  /** Slot: center content — 0..N cards, avatar, anything. */
  children?: ReactNode;
  /** Slot: bottom row inside the frame — stack / status. */
  footer?: ReactNode;
  /** Slot: floating element at the frame's top-right (legacy alias of topRight). */
  badge?: ReactNode;
  /** Slot: overlay centered over the frame. */
  overlay?: ReactNode;

  /** Slot: floating content above the frame, centered (e.g. an action bubble). */
  above?: ReactNode;
  /** Slot: content below the frame, centered (e.g. countdown / bet pill). */
  below?: ReactNode;
  /** Slot: floating content at the frame's top-left corner (e.g. a crown, a rank badge). */
  topLeft?: ReactNode;
  /** Slot: floating content at the frame's top-right corner (e.g. a kick button). */
  topRight?: ReactNode;
  /** Slot: floating content centered above the top edge (e.g. dealer / blind badges). */
  topCenter?: ReactNode;

  /**
   * Frame width. Defaults to the size the surrounding `CardTable` laid out for
   * this seat, or 160 outside a table — the table is the one that knows how much
   * room the ring has.
   */
  width?: number;
  /** Frame height. Defaults to the laid-out size, or 176 outside a table. */
  height?: number;
  className?: string;
  /** Extra classes for the inner frame, to override visuals. */
  frameClassName?: string;
  /** Inline styles for the inner frame. */
  frameStyle?: CSSProperties;
}

/**
 * A neutral frame: three named rows with generic visual states, plus floating
 * slots. It knows nothing about any particular game — put whatever you want into
 * `header` / `children` / `footer`, and use `above` / `below` / `topLeft` /
 * `topRight` / `topCenter` / `overlay` for floating bits.
 *
 * It draws no default decoration. A crown over the winner is a decoration, not a
 * state, so `isWinner` draws the frame and the caller passes the crown through
 * `topLeft`.
 */
export function Seat({
  isActive = false,
  isWinner = false,
  isDimmed = false,
  animated = true,
  onClick,
  header,
  children,
  footer,
  badge,
  overlay,
  above,
  below,
  topLeft,
  topRight,
  topCenter,
  width,
  height,
  className,
  frameClassName,
  frameStyle,
}: SeatProps) {
  const laidOut = useSeatSize();
  const frameWidth = width ?? laidOut?.width ?? DEFAULT_SEAT_W;
  const frameHeight = height ?? laidOut?.height ?? DEFAULT_SEAT_H;

  const activeClass = animated
    ? "border-gold animate-turn-glow"
    : "border-gold shadow-[0_0_18px_color-mix(in_oklab,var(--color-gold)_50%,transparent)]";
  const winnerClass = animated
    ? "border-gold animate-winner-glow"
    : "border-gold shadow-[0_0_0_3px_color-mix(in_oklab,var(--color-gold)_90%,transparent)]";

  return (
    <div className={cn("relative flex flex-col items-center", className)} style={{ width: frameWidth }}>
      {topCenter !== undefined && (
        <div className="absolute -top-2 left-1/2 z-20 flex -translate-x-1/2 gap-1">{topCenter}</div>
      )}
      {topLeft !== undefined && <div className="absolute -top-3 -left-2 z-40">{topLeft}</div>}
      {topRight !== undefined && <div className="absolute -top-2 -right-2 z-40">{topRight}</div>}
      {above !== undefined && (
        <div className="pointer-events-none absolute -top-12 left-1/2 z-30 -translate-x-1/2">{above}</div>
      )}

      <div
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : undefined}
        onClick={onClick}
        onKeyDown={
          onClick
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") onClick();
              }
            : undefined
        }
        style={{ width: frameWidth, height: frameHeight, ...frameStyle }}
        className={cn(
          "relative flex flex-col items-center justify-between gap-1 rounded-2xl border bg-neutral-900/80 p-2 text-neutral-100 transition",
          "border-neutral-700",
          isActive && activeClass,
          isWinner && winnerClass,
          isDimmed && "opacity-50",
          onClick && "cursor-pointer hover:border-neutral-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold",
          frameClassName,
        )}
      >
        {header !== undefined && (
          <div className="flex w-full shrink-0 items-center justify-between gap-1 text-[11px]">{header}</div>
        )}
        <div className="flex min-h-0 flex-1 items-center justify-center">{children}</div>
        {footer !== undefined && (
          <div className="flex w-full shrink-0 items-center justify-between text-[11px] text-neutral-300">{footer}</div>
        )}

        {overlay !== undefined && (
          <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 text-center">{overlay}</div>
        )}
      </div>

      {badge !== undefined && <div className="absolute top-0 right-0 z-40">{badge}</div>}
      {below !== undefined && <div className="mt-1 flex flex-col items-center gap-1">{below}</div>}
    </div>
  );
}
