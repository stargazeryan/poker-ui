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
