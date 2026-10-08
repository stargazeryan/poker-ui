import type { ReactNode } from "react";
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

  /** Slot: top row — name / badges. */
  header?: ReactNode;
  /** Slot: top-right floating element — e.g. a dealer button. */
  badge?: ReactNode;
  /** Slot: center content — 0..N cards, avatar, anything. */
  children?: ReactNode;
  /** Slot: bottom row — stack / bet / status. */
  footer?: ReactNode;
  /** Slot: overlay — e.g. an "All-in" label. */
  overlay?: ReactNode;

  width?: number;
  height?: number;
  className?: string;
}

/**
 * A neutral seat: a frame with generic visual states and named slots.
 * It knows nothing about any particular game — put whatever you want into
 * `header` / `children` / `footer` / `badge` / `overlay`.
 */
export function Seat({
  isActive = false,
  isWinner = false,
  isDimmed = false,
  onClick,
  header,
  badge,
  children,
  footer,
  overlay,
  width = 160,
  height = 176,
  className,
}: SeatProps) {
  return (
    <div className={cn("relative", className)} style={{ width, height }}>
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
        className={cn(
          "flex h-full w-full flex-col items-center justify-between gap-1 rounded-2xl border bg-neutral-900/80 p-2 text-neutral-100 backdrop-blur transition",
          isActive ? "border-cyan-400 shadow-[0_0_18px_rgba(34,211,238,0.55)]" : "border-neutral-700",
          isWinner && "border-amber-400 shadow-[0_0_18px_rgba(251,191,36,0.6)]",
          isDimmed && "opacity-50",
          onClick && "cursor-pointer hover:border-neutral-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400",
        )}
      >
        {header !== undefined && (
          <div className="flex w-full items-center justify-between gap-1 text-[11px]">{header}</div>
        )}
        <div className="flex flex-1 items-center justify-center">{children}</div>
        {footer !== undefined && (
          <div className="flex w-full items-center justify-between text-[11px] text-neutral-300">{footer}</div>
        )}
      </div>

      {badge !== undefined && <div className="absolute -top-1 -right-1">{badge}</div>}
      {overlay !== undefined && (
        <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 text-center">{overlay}</div>
      )}
    </div>
  );
}
