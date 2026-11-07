/**
 * Chip denominations and the breakdown of an amount into chips. Pure functions,
 * no React.
 *
 * This is a **wagering** module, not a core one. Chips are how a game that bets
 * moves value around: the games that want them (blackjack, a banking game, a
 * no-limit game) take them, and a game that has no betting (most shedding and
 * trick-taking games) never loads this file. Nothing in `src/` outside
 * `src/wager/` imports it.
 *
 * Amounts are in **chip units** (the smallest chip is 1), not in big blinds.
 */

import { mostVisible } from "../color";

export interface Denomination {
  /** Face value of the chip. */
  value: number;
  /**
   * Printed on the chip face. Defaults to the value, which is what you want for
   * a 5 or a 100; use it for a "$5" or a "5K" if your table reads differently.
   */
  label?: string;
  /**
   * CSS colour for the body. Used directly as the SVG `fill`, so it can be any
   * CSS colour — including `var(--color-chip-red)`.
   */
  color: string;
  /**
   * Colour of the eight edge spots. Defaults to white, or to a dark spot on a
   * light body — see `chipSpotColor`.
   */
  spotColor?: string;
  /**
   * Optional `fill-*` utility for the eight edge spots, applied over
   * `spotColor` — the same rule as the body, where a class wins over the `fill`
   * attribute.
   *
   * It exists because the two halves of a chip are painted from two different
   * places that do not know about each other: the body from `className`, the
   * spots from a colour `chipSpotColor` *measured* off `color`. Repaint a chip's
   * body with a `@theme` override of `--color-chip-white` and the measurement
   * still describes the old hex, so a chip repainted dark keeps dark spots.
   * `spotClassName: SPOT_CLASSES.light` is the way out.
   */
  spotClassName?: string;
  /**
   * Optional `fill-*` utility applied on top of `color`. The default set uses
   * these so the `--color-chip-*` theme tokens are actually emitted by Tailwind
   * (it only outputs a theme variable something references) and can therefore be
   * overridden from a consumer's `@theme` block like every other token.
   *
   * A class wins over the `fill` attribute, so `color` acts as the fallback.
   */
  className?: string;
}

/**
 * The classic low-stakes set: white 1, red 5, blue 10, green 25, black 100.
 *
 * Blue is the one that varies between houses — plenty of rooms use blue for
 * $10 and plenty for $20. Ten is the default here; override
 * `denominations` to use twenty.
 */
export const DEFAULT_DENOMINATIONS: Denomination[] = [
  { value: 100, color: "#1a1a2e", className: "fill-chip-black" },
  { value: 25, color: "#27ae60", className: "fill-chip-green" },
  { value: 10, color: "#2980b9", className: "fill-chip-blue" },
  { value: 5, color: "#c0392b", className: "fill-chip-red" },
  { value: 1, color: "#ecf0f1", className: "fill-chip-white" },
];

/** The two inks a chip's edge spots can be drawn in. The values `SPOT_CLASSES` names. */
const SPOT_CANDIDATES = ["rgba(255,255,255,0.9)", "rgba(0,0,0,0.45)"] as const;

/**
 * Those same two inks as `fill-*` utilities, for spots that cannot be measured.
 *
 * `chipSpotColor` reads a body colour and picks the more visible of the two;
 * these are for the body it *cannot* read — one painted by a theme token — where
 * the answer has to come from CSS instead. The tokens behind them ship the same
 * two values, so a measured spot and its class are the same colour.
 */
export const SPOT_CLASSES = {
  /** `rgba(255, 255, 255, 0.9)` — the default, and the one for a dark body. */
  light: "fill-chip-spot",
  /** `rgba(0, 0, 0, 0.45)` — the one for a light body. */
  ink: "fill-chip-spot-ink",
} as const;

/**
 * Spot colour for a chip body: whichever of the two inks is measurably more
 * visible on it.
 *
 * Derived from contrast rather than a luminance threshold, because the obvious
 * implementation — always white spots — puts the white chip
 * (`--color-chip-white`, #ecf0f1) at a 1.13:1 contrast ratio against its own
 * body, so it renders as a blank oval with no edge at all. Colours we cannot
 * measure keep white spots.
 */
export function chipSpotColor(bodyColor: string): string {
  return mostVisible(SPOT_CANDIDATES, bodyColor);
}

export interface ChipStackEntry extends Denomination {
  /** How many chips of this denomination the amount needs. */
  count: number;
}

/**
 * Break an amount into chips, largest denomination first (the greedy breakdown
 * a dealer actually uses).
 *
 * Anything below the smallest denomination is left out rather than rounded up —
 * `chipsTotal()` tells you what the chips add up to, so you can spot the
 * remainder. Non-integer and negative amounts are floored/clamped to 0.
 */
export function chipBreakdown(
  amount: number,
  denominations: Denomination[] = DEFAULT_DENOMINATIONS,
): ChipStackEntry[] {
  const usable = denominations.filter((d) => Number.isFinite(d.value) && d.value >= 1);
  const sorted = [...usable].sort((a, b) => b.value - a.value);

  let remaining = Math.max(0, Math.floor(Number.isFinite(amount) ? amount : 0));
  const entries: ChipStackEntry[] = [];

  for (const denomination of sorted) {
    const count = Math.floor(remaining / denomination.value);
    if (count > 0) {
      entries.push({ ...denomination, count });
      remaining -= count * denomination.value;
    }
  }
  return entries;
}

/** What a set of chip entries adds up to. Compare with the amount to see the remainder. */
export function chipsTotal(entries: ChipStackEntry[]): number {
  return entries.reduce((sum, e) => sum + e.value * e.count, 0);
}

/** Total number of physical chips in a breakdown. */
export function chipCount(entries: ChipStackEntry[]): number {
  return entries.reduce((sum, e) => sum + e.count, 0);
}
