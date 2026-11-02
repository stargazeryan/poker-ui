/**
 * Animation timing, in one place.
 *
 * These were magic numbers inside three components. They are kept short on
 * purpose: the on-by-default animations are game feel, and a consumer who wants
 * a different tempo turns them off rather than tuning them.
 *
 * The names are deliberately neutral, after the mechanism rather than the game:
 * a staggered entrance for a row of cards is the same in every card game. The
 * poker-sounding names these two used to have are gone.
 */

/** How long a counter takes to count from one value to the next, in ms. */
export const COUNT_UP_MS = 500;

/** Stagger between the cards of one row arriving, in ms. */
export const STAGGER_MS = 100;

/** Stagger between the cards of one row flipping in, in ms. */
export const FLIP_MS = 70;
