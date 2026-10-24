/**
 * Chip denominations and the breakdown of an amount into chips. Pure functions,
 * no React — the same split as `geometry.ts` and `layout.ts`.
 *
 * Amounts are in **chip units** (the smallest chip is 1), not in big blinds.
 */

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

/** White edge spots, and the darker variant used on light chips. */
const SPOT_ON_DARK_BODY = "rgba(255,255,255,0.9)";
const SPOT_ON_LIGHT_BODY = "rgba(0,0,0,0.45)";

/**
 * Relative luminance of a `#rgb` / `#rrggbb` / `rgb()` colour, or `null` when it
 * is something we cannot read (a `var(...)`, a named colour).
 */
export function relativeLuminance(color: string): number | null {
  const hex = color.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  let rgb: [number, number, number];
  if (hex) {
    const h = hex[1].length === 3 ? hex[1].replace(/./g, (c) => c + c) : hex[1];
    rgb = [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  } else {
    const parts = color.trim().match(/^rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i);
    if (!parts) return null;
    rgb = [Number(parts[1]), Number(parts[2]), Number(parts[3])];
  }
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(rgb[0]) + 0.7152 * channel(rgb[1]) + 0.0722 * channel(rgb[2]);
}

/**
 * Spot colour for a chip body.
 *
 * White spots on a light body are invisible: over `--color-chip-white` (#ecf0f1)
 * they land at a 1.1:1 contrast ratio, so the white chip reads as a blank oval
 * with no edge at all. Anything light enough to have that problem gets dark spots
 * instead (3.3:1). Colours we cannot measure — a `var(...)` or a named colour —
 * keep white spots.
 */
export function chipSpotColor(bodyColor: string): string {
  const luminance = relativeLuminance(bodyColor);
  return luminance !== null && luminance > 0.55 ? SPOT_ON_LIGHT_BODY : SPOT_ON_DARK_BODY;
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
