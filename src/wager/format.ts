/**
 * Money formats, for the games that name their units. Part of the `wager` entry
 * point: a big blind is a betting convention, so it belongs next to the chips
 * rather than in the core `Counter`.
 */

/**
 * Default big blind that `formatBB` uses when you do not pass one.
 *
 * Nothing in the package applies it on your behalf: the components render plain
 * numbers unless you hand them a formatter. Pass your own — a fixed 20 is wrong
 * for most tables.
 */
export const BB = 20;

/**
 * Format an amount as big blinds, e.g. 1234 -> "61.7 BB".
 *
 * An opt-in helper, not a default. Nothing in the package applies it on your
 * behalf: a big blind is a poker rule, and the components are not a poker
 * library.
 *
 * ```ts
 * <Counter amount={1234} format={(n) => formatBB(n, 100)} />
 * ```
 */
export function formatBB(amount: number, bb: number = BB): string {
  const value = amount / bb;
  return `${Number.isInteger(value) ? value : value.toFixed(1)} BB`;
}
