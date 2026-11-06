import type { ReactNode } from "react";
import { cn } from "../cn";

/** Disc diameter, in px. A number is taken as px, so a marker can be sized off its seat frame. */
export const MARKER_SIZE = { sm: 18, md: 24, lg: 32 } as const;

export type MarkerSize = keyof typeof MARKER_SIZE;

/** The ink a marker is drawn in. */
export type MarkerTone = "gold" | "dark" | "felt";

export interface MarkerProps {
  /** What is printed on the disc — `"D"`, `"1"`, a suit, an emoji. */
  children?: ReactNode;
  /** `"sm" | "md" | "lg"`, or a number of px. Default `"md"` (24). */
  size?: MarkerSize | number;
  /** `"gold"` (default), `"dark"` or `"felt"`. */
  tone?: MarkerTone;
  /** Accessible name. Default `"marker"` — "dealer button", "bid marker", "1 chip". */
  label?: string;
  className?: string;
}

const TONE_CLASS: Record<MarkerTone, string> = {
  gold: "bg-gold text-neutral-900 ring-black/30",
  dark: "bg-surface text-surface-ink ring-surface-border",
  felt: "bg-felt text-gold-light ring-black/30",
};

const FONT_PX: Record<MarkerSize, number> = { sm: 9, md: 11, lg: 13 };

/**
 * A small disc that sits on a seat or a position — a dealer button, a bid
 * marker, "this is the button", "this is seat one".
 *
 * It exists because every card room draws one and every caller was drawing it by
 * hand: the docs used a `<span>👑</span>` in `Seat`'s `topLeft` to prove the point
 * that a decoration is not a state. This is that decoration, themed, with a name
 * a screen reader can read — it carries no opinion about what it marks, which is
 * why it is called a marker and not a dealer button.
 *
 * A marker is round on purpose: a square one reads as another badge and competes
 * with the frame's own border, while a disc reads as an object sitting on the
 * table, like a chip.
 */
export function Marker({ children, size = "md", tone = "gold", label = "marker", className }: MarkerProps) {
  const px = typeof size === "number" ? size : MARKER_SIZE[size];
  // A named size has a font size chosen for it; a px size scales the `md` one,
  // so a marker sized off a shrunk seat frame keeps its proportions.
  const fontSize = typeof size === "number" ? Math.round(FONT_PX.md * (px / MARKER_SIZE.md)) : FONT_PX[size];

  return (
    <span
      role="img"
      aria-label={label}
      className={cn(
        "grid shrink-0 place-items-center rounded-full font-bold leading-none shadow-[0_1px_3px_rgba(0,0,0,0.5)] ring-1",
        TONE_CLASS[tone],
        className,
      )}
      style={{ width: px, height: px, fontSize }}
    >
      {children}
    </span>
  );
}
