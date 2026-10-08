import type { CSSProperties, ReactNode } from "react";
import { cn } from "../cn";

export interface SeatProps {
  /** Turn/active highlight (generic). */
  isActive?: boolean;
  /** Winner highlight (generic). */
  isWinner?: boolean;
  /** Dimmed, e.g. folded or out (generic). */
  isDimmed?: boolean;
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
  return (
    <div className={cn("relative flex flex-col items-center", className)} style={{ width }}>
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
        style={{ width, height, ...frameStyle }}
        className={cn(
          "relative flex flex-col items-center justify-between gap-1 rounded-2xl border bg-neutral-900/80 p-2 text-neutral-100 transition",
          isActive ? "border-cyan-400 shadow-[0_0_18px_rgba(34,211,238,0.55)]" : "border-neutral-700",
          isWinner && "border-amber-400 shadow-[0_0_18px_rgba(251,191,36,0.6)]",
          isDimmed && "opacity-50",
          onClick && "cursor-pointer hover:border-neutral-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400",
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
