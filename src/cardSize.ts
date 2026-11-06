import type { CardSize } from "./sizes";

/**
 * Card dimensions in px, matching the `SIZE_CLASSES` the artwork is drawn with.
 *
 * Components that *position* cards — a fan that overlaps them, an empty slot,
 * a row that has to reserve its final width before the cards arrive — need the
 * same numbers the artwork uses, and previously each of them would have
 * re-derived them from the Tailwind class names. One table, one source.
 */
export const CARD_WIDTH: Record<CardSize, number> = {
  xs: 32,
  sm: 40,
  md: 64,
  lg: 96,
};

export const CARD_HEIGHT: Record<CardSize, number> = {
  xs: 44,
  sm: 56,
  md: 88,
  lg: 128,
};

/** Largest first, so a search for "the biggest that fits" walks this in order. */
const BY_SIZE_DESC: CardSize[] = ["lg", "md", "sm", "xs"];

/** What a card row costs in room that is not the cards themselves. */
export interface CardSizeFit {
  /** Gap between neighbouring cards — `CardRow`'s `gap-2`. Default 8. */
  gap?: number;
  /** Padding inside the frame, on each side — `Seat`'s `p-2`. Default 8. */
  padding?: number;
  /** Room the frame spends on everything else: a header row, a footer row, the gaps between them. Default 44. */
  chrome?: number;
}

/**
 * The largest card size whose `count` cards fit in `box`.
 *
 * A frame is laid out at a size the caller chose and the content is drawn at a
 * size the caller chose, and nothing connected the two: the default 160x176 seat
 * left two thirds of itself empty because `sm` cards (40x56) had been passed by
 * hand, while a thirteen-seat ring's 80x88 frame overflows at the same size. This
 * answers "which size belongs in this frame" from the frame itself, so a seat can
 * fill its own box and a ring that shrinks its frames shrinks their cards with
 * them.
 *
 * ```tsx
 * <Seat width={box.width} height={box.height}>
 *   <CardRow cards={hand} size={cardSizeFor(box, hand.length)} />
 * </Seat>
 * ```
 *
 * The smallest size is the floor: a frame too small for even `xs` returns `xs`
 * rather than nothing, because a table that has been shrunk past legibility
 * should look small, not empty.
 */
export function cardSizeFor(
  box: { width: number; height: number },
  count = 1,
  { gap = 8, padding = 8, chrome = 44 }: CardSizeFit = {},
): CardSize {
  const cards = Math.max(1, count);
  // What is left for *one* card once the gaps are paid for — the search compares
  // a single card against it, so the count has to come out here and not later.
  const availableWidth = (box.width - 2 * padding - gap * (cards - 1)) / cards;
  const availableHeight = box.height - 2 * padding - chrome;
  for (const size of BY_SIZE_DESC) {
    if (CARD_WIDTH[size] <= availableWidth && CARD_HEIGHT[size] <= availableHeight) return size;
  }
  return "xs";
}
