/**
 * The geometry of a fanned hand — how far apart the cards sit, and how far each one
 * is turned.
 *
 * Both are answers a caller asks for *before* drawing anything, so they are
 * functions here and two numbers on `CardRow` (`overlap`, `arc`), rather than a
 * component that measures. Nothing in this file knows how big a card is beyond the
 * width it is handed, and a fanned row is never told at all: the row is given the
 * px overlap this returns.
 */

/** How much of a card a fan tucks under its neighbour, as a fraction of a card width. */
export const FAN_OVERLAP = 0.55;

/** The tightest a fan is drawn before it stops reading as a hand rather than a stack. */
export const FAN_MAX_OVERLAP = 0.95;

/**
 * Where a fanned card pivots, as a multiple of its own height: `1.35` is a point 35%
 * below the card's bottom edge. Expressed against the card rather than as a px
 * offset, so nothing has to be told how tall a card is — `50% 135%` is the same
 * origin as `50% calc(100% + 0.35 * height)`.
 */
export const FAN_PIVOT = 1.35;

export interface FanOverlapOptions {
  /** How many cards the fan holds. */
  count: number;
  /** A card's width in px — `CARD_WIDTH[size]`, or whatever `cardSizeFor` returned. */
  cardWidth: number;
  /** The overlap to ask for, as a fraction of a card width. Default `FAN_OVERLAP`. */
  overlap?: number;
  /**
   * The width the fan has to fit, in px — usually a seat frame's. Give it and the
   * **overlap is chosen for you**: the cards are brought together until the fan is no
   * wider than this. It never goes past `FAN_MAX_OVERLAP`, and a fan already narrower
   * than this is left where it is rather than spread out to fill it — this fits a
   * hand into a frame, it does not justify one.
   */
  fitWidth?: number;
}

/**
 * How much neighbouring cards overlap, in px — the number a `CardRow` wants.
 *
 * The row tucks each card under the one before it by exactly this, so a hand that has
 * to fit a seat frame is: `cardSizeFor` picks the size, this picks the overlap, and
 * the row is told neither.
 */
export function fanOverlap({ count, cardWidth, overlap = FAN_OVERLAP, fitWidth }: FanOverlapOptions): number {
  const needed = count > 1 && fitWidth !== undefined ? 1 - (fitWidth - cardWidth) / ((count - 1) * cardWidth) : 0;
  return cardWidth * Math.min(FAN_MAX_OVERLAP, Math.max(0, overlap, needed));
}

/**
 * The turn of each card in a fan, in degrees, left to right: the outer cards splay and
 * the middle one stays flat.
 *
 * A single card, or an `arc` of 0, is a flat row — there is nothing to splay a card
 * against, and a card must not be given a rotation it does not use.
 */
export function fanAngles(count: number, arc: number): number[] {
  const mid = (count - 1) / 2;
  return Array.from({ length: count }, (_, i) => (mid === 0 ? 0 : (((i - mid) / mid) * arc) / 2));
}
