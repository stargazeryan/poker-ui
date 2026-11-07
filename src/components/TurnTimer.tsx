import type { ReactNode } from "react";
import { cn } from "../cn";
import { MIN_TEXT_PX, readableScale, useDesignScale } from "../designScale";

/** Ring diameter, in px. A number is taken as px, so a timer can be sized off its seat frame. */
export const TIMER_SIZE = { sm: 28, md: 44, lg: 64 } as const;

export type TurnTimerSize = keyof typeof TIMER_SIZE;

export interface TurnTimerProps {
  /**
   * How much of the turn is **left**, `1` → `0`. The caller owns the clock: this
   * draws a number it is handed and has no idea whether that number is seconds,
   * a deadline or a rule. `1` is a full ring, `0` an empty one.
   */
  remaining: number;
  /** `"sm" | "md" | "lg"`, or a number of px. Default `"md"` (44). */
  size?: TurnTimerSize | number;
  /** Ring thickness in px. Default `4`. */
  stroke?: number;
  /**
   * What the ring says at a glance. `"gold"` (default) is time left, `"warning"`
   * is the token a caller reaches for when the clock is nearly out, `"muted"` for
   * a paused or inactive one.
   */
  tone?: "gold" | "warning" | "muted";
  /** Content in the middle of the ring — a number of seconds, an icon. */
  label?: ReactNode;
  /** Accessible name. Default `"turn timer"`. */
  title?: string;
  className?: string;
}

const TONE_CLASS: Record<NonNullable<TurnTimerProps["tone"]>, string> = {
  gold: "stroke-gold",
  warning: "stroke-warning",
  muted: "stroke-muted",
};

/**
 * A countdown ring — a turn timer, a deadline, an egg timer.
 *
 * Drawn from one number the caller owns, so a game's clock stays in the game: it
 * animates nothing and schedules nothing. Put it in a `Seat`'s `overlay` for a
 * ring on the frame, or in `below` for one under it.
 *
 * ```tsx
 * <Seat below={<TurnTimer remaining={msLeft / msTotal} tone={msLeft < 5000 ? "warning" : "gold"} />} />
 * ```
 *
 * It is a `progressbar`, not a `timer`, so a screen reader can read the value on
 * demand; it is deliberately **not** a live region, because a ring that ticks once
 * a second would interrupt whatever is being read out. Announce the number
 * yourself if that is what you want (a `Seat`'s `below` with `aria-live`).
 */
export function TurnTimer({
  remaining,
  size = "md",
  stroke = 4,
  tone = "gold",
  label,
  title = "turn timer",
  className,
}: TurnTimerProps) {
  const px = typeof size === "number" ? size : TIMER_SIZE[size];
  // Clamped, because a caller mid-animation can hand over 1.0000001 and an
  // out-of-range dash offset is an empty ring with no sign of why.
  const left = Number.isFinite(remaining) ? Math.min(1, Math.max(0, remaining)) : 0;
  const radius = (px - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  const textScale = readableScale(useDesignScale(), 14, MIN_TEXT_PX);

  return (
    <div
      role="progressbar"
      aria-label={title}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(left * 100)}
      className={cn("relative inline-grid place-items-center", className)}
      style={{ width: px, height: px }}
    >
      <svg width={px} height={px} viewBox={`0 0 ${px} ${px}`} aria-hidden="true" className="-rotate-90">
        <circle
          cx={px / 2}
          cy={px / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-surface-border"
        />
        <circle
          cx={px / 2}
          cy={px / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - left)}
          className={cn("transition-[stroke-dashoffset]", TONE_CLASS[tone])}
        />
      </svg>
      {label !== undefined && (
        <span
          className="absolute font-mono text-[14px] leading-none text-surface-ink"
          style={textScale === 1 ? undefined : { transform: `scale(${textScale})` }}
        >
          {label}
        </span>
      )}
    </div>
  );
}
