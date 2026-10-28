import { cn } from "../cn";

/**
 * Default piece colours. A prop rather than a theme token because these land in
 * inline styles, which Tailwind's tree-shaking cannot see — a custom property
 * nothing references never gets emitted.
 */
const DEFAULT_COLORS = ["#f39c12", "#e74c3c", "#2ecc71", "#3498db", "#f1c40f", "#9b59b6"];

export interface ConfettiProps {
  /** How many pieces to scatter. Default 44. */
  count?: number;
  /** Piece colours, cycled. Defaults to a party palette. */
  colors?: string[];
  className?: string;
}

/**
 * Falling confetti, filling the box it is rendered into.
 *
 * A decoration with no opinion about why it is falling: render it when *you*
 * decide something is worth celebrating — typically inside `CardTable`'s
 * `overlay` slot, which is the design box the table laid out.
 *
 * It animates for as long as it is mounted (`animation-iteration-count:
 * infinite`), so unmount it to stop it. Under `prefers-reduced-motion` the
 * package's own media query switches it off.
 */
export function Confetti({ count = 44, colors = DEFAULT_COLORS, className }: ConfettiProps) {
  const pieces = Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;
  const palette = colors.length > 0 ? colors : DEFAULT_COLORS;

  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden="true">
      {Array.from({ length: pieces }).map((_, i) => {
        const w = 5 + (i % 4) * 2;
        const h = 9 + (i % 3) * 4;
        const dur = 1.7 + (i % 5) * 0.28;
        const delay = (i % 12) * 0.14;
        return (
          <span
            key={i}
            className="absolute top-[26%] animate-confetti rounded-[2px]"
            style={{
              left: `${(i * 37) % 96}%`,
              width: w,
              height: h,
              backgroundColor: palette[i % palette.length],
              animationDuration: `${dur}s`,
              animationDelay: `${delay}s`,
              animationIterationCount: "infinite",
            }}
          />
        );
      })}
    </div>
  );
}
