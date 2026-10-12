import type { CSSProperties, ReactNode } from "react";
import { cn } from "../cn";

export interface SeatProps {
  /** Turn/active highlight (generic). Animated by default. */
  isActive?: boolean;
  /** Winner highlight (generic). Animated by default. */
  isWinner?: boolean;
  /** Dimmed, e.g. folded or out (generic). */
  isDimmed?: boolean;
  /** Enable the turn/winner glow animations. Default true. */
  animated?: boolean;
  /** Render a default 👑 in the top-left corner when `isWinner`. Default false. */
  winnerCrown?: boolean;
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
  /** Slot: floating content at the frame's top-left corner (e.g. a crown). */
  topLeft?: ReactNode;
  /** Slot: floating content at the frame's top-right corner (e.g. a kick button). */
  topRight?: ReactNode;
  /** Slot: floating content centered above the top edge (e.g. D/SB/BB badges). */
  topCenter?: ReactNode;

  width?: number;
  height?: number;
  className?: string;
  /** Extra classes for the inner frame, to override visuals. */
  frameClassName?: string;
  /** Inline styles for the inner frame. */
  frameStyle?: CSSProperties;
}

/**
 * A neutral seat: a frame with generic visual states and named slots. Put
 * whatever you want into `header` / `children` / `footer`, and use
 * `above` / `below` / `topLeft` / `topRight` / `topCenter` / `overlay` for
 * floating bits. It knows nothing about any particular game.
 */
export function Seat({
  isActive = false,
  isWinner = false,
  isDimmed = false,
  animated = true,
  winnerCrown = false,
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
  width = 160,
  height = 176,
  className,
  frameClassName,
  frameStyle,
}: SeatProps) {
  const activeClass = animated
    ? "border-amber-400 animate-turn-glow"
    : "border-amber-400 shadow-[0_0_18px_rgba(243,156,18,0.5)]";
  const winnerClass = animated
    ? "border-amber-400 animate-winner-glow"
    : "border-amber-400 shadow-[0_0_0_3px_rgba(243,156,18,0.9)]";

  const effTopLeft =
    topLeft !== undefined
      ? topLeft
      : isWinner && winnerCrown
        ? <span className="text-3xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] animate-bounce">👑</span>
        : undefined;

  return (
    <div className={cn("relative flex flex-col items-center", className)} style={{ width }}>
      {topCenter !== undefined && (
        <div className="absolute -top-2 left-1/2 z-20 flex -translate-x-1/2 gap-1">{topCenter}</div>
      )}
      {effTopLeft !== undefined && <div className="absolute -top-3 -left-2 z-40">{effTopLeft}</div>}
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
        style={{ width, height, ...frameStyle }}
        className={cn(
          "relative flex flex-col items-center justify-between gap-1 rounded-2xl border bg-neutral-900/80 p-2 text-neutral-100 transition",
          "border-neutral-700",
          isActive && activeClass,
          isWinner && winnerClass,
          isDimmed && "opacity-50",
          onClick && "cursor-pointer hover:border-neutral-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400",
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
