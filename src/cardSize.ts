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
