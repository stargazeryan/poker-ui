/** Big Blind value used for stack display. */
export const BB = 20;

/** Format a chip amount as a Big-Blind string, e.g. 1234 -> "61.7 BB". */
export function formatBB(amount: number): string {
  const bb = amount / BB;
  return `${Number.isInteger(bb) ? bb : bb.toFixed(1)} BB`;
}
