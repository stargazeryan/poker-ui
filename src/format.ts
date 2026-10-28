/**
 * Default big blind that `formatBB` uses when you do not pass one.
 *
 * Kept for back-compat. Nothing in the package applies it on your behalf: the
 * components render plain numbers unless you hand them a formatter, because a
 * big blind is a poker rule and this is not a poker library.
 */
export const BB = 20;

/**
 * Format an amount as big blinds, e.g. 1234 -> "61.7 BB".
 *
 * This is a poker *helper*, not a default. Pass your own big blind — a
 * fixed 20 is wrong for most tables:
 *
 * ```ts
 * <Pot amount={1234} format={(n) => formatBB(n, 100)} />
 * ```
 */
export function formatBB(amount: number, bb: number = BB): string {
  const value = amount / bb;
  return `${Number.isInteger(value) ? value : value.toFixed(1)} BB`;
}
