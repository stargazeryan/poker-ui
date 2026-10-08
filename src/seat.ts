/**
 * Seat-ring helpers. Pure functions — they contain no game-specific rules.
 */

export interface NextSeatOptions {
  /** +1 for clockwise, -1 for counter-clockwise. Default +1. */
  dir?: 1 | -1;
  /** Return true to skip a seat (e.g. folded / empty / out). */
  skip?: (index: number) => boolean;
}

/**
 * Return the index of the next seat on the ring after `current`, skipping any
 * seat matched by `opts.skip`. Wraps around. Returns `current` if every other
 * seat is skipped.
 */
export function nextSeatIndex(current: number, seatCount: number, opts: NextSeatOptions = {}): number {
  const n = Math.max(1, Math.floor(seatCount));
  const dir = opts.dir ?? 1;
  const skip = opts.skip;
  const start = ((Math.floor(current) % n) + n) % n;

  let i = start;
  for (let step = 0; step < n - 1; step++) {
    i = (i + dir + n) % n;
    if (!skip || !skip(i)) return i;
  }
  return start;
}
