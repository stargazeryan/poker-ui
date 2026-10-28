/**
 * Animation timing, in one place.
 *
 * These were magic numbers inside three components. They are kept short on
 * purpose: the on-by-default animations are game feel, and a consumer who wants
 * a different tempo turns them off rather than tuning them.
 */

/** How long the pot takes to count from one value to the next, in ms. */
export const COUNT_UP_MS = 500;

/** Stagger between hole cards dealing in, in ms. */
export const DEAL_STAGGER_MS = 100;

/** Stagger between community cards flipping in, in ms. */
export const FLIP_STAGGER_MS = 70;
