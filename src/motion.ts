/**
 * Animation timing, in one place.
 *
 * These were magic numbers inside three components. They are kept short on
 * purpose: the on-by-default animations are game feel, and a consumer who wants
 * a different tempo turns them off rather than tuning them.
 *
 * The names are deliberately neutral. `DEAL_STAGGER_MS` / `FLIP_STAGGER_MS` read
 * like poker vocabulary, but the mechanism — a staggered entrance for a row of
 * cards — is the same in every card game, so the tokens are named after the
 * mechanism.
 */

/** How long a counter takes to count from one value to the next, in ms. */
export const COUNT_UP_MS = 500;

/** Stagger between the cards of one row arriving, in ms. */
export const STAGGER_MS = 100;

/** Stagger between the cards of one row flipping in, in ms. */
export const FLIP_MS = 70;

/** @deprecated Renamed to `STAGGER_MS` — the mechanism is a stagger, not a deal. */
export const DEAL_STAGGER_MS = STAGGER_MS;

/** @deprecated Renamed to `FLIP_MS`. */
export const FLIP_STAGGER_MS = FLIP_MS;
