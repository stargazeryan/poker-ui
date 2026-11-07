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
 * animates nothing and schedules nothing.
 *
 * Where it goes on a `Seat` matters more than how it is sized. `below` reads as a
 * countdown badge under the frame; `topRight` reads as a small one in the corner.
 * **Not `overlay`**: that slot is centred on the frame and painted *over* the
 * seat's own content, so a ring there crosses the cards, crosses the header, and
 * prints its label on the card faces.
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

  /**
   * The label follows the ring. It used to be a fixed 14px, which is a stamp
   * inside a 28px badge ("13" touching the rim) and lost inside a 110px one.
   */
  const labelPx = Math.max(9, Math.min(22, Math.round(px * 0.3)));
  /** What the ring can hold, in multiples of the label's own size. */
  const inner = Math.max(6, px - 2 * stroke);
  /**
   * The text floor still applies, but never past the ring: a number that overflows
   * its ring is not more legible than a small one, it is noise. The comparison is
   * in design space, where the ring and its label scale together.
   */
  const textScale = Math.min(readableScale(useDesignScale(), labelPx, MIN_TEXT_PX), inner / labelPx);

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
          className="absolute font-mono leading-none text-surface-ink"
          style={{ fontSize: labelPx, ...(textScale === 1 ? null : { transform: `scale(${textScale})` }) }}
        >
          {label}
        </span>
      )}
    </div>
  );
}
