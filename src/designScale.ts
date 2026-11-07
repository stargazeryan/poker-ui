/**
 * How big the design box is being drawn, and what that means for text.
 *
 * A table is laid out in a fixed design box that is then scaled to fit its
 * container with `transform: scale()`. That is what makes a complex layout
 * responsive without a media query per element, but it scales the *text* with
 * the geometry — and text has a floor below which it is decoration rather than
 * information. Measured on the docs' own demos: a 725px-wide container draws the
 * box at 0.602, so an 11px seat nameplate lands at 6.6px on screen, and a 390px
 * phone draws it at 0.277, where the same nameplate is 3px.
 *
 * So the scale is published here, and the components that draw their own text
 * use it to keep that text at or above `MIN_TEXT_PX` on screen. Anything a
 * caller draws can do the same with `useDesignScale()`.
 */

import { createContext, useContext } from "react";

/** The smallest a label should ever be drawn, in CSS px, before it is compensated for. */
export const MIN_TEXT_PX = 10;

/**
 * The most the compensation may enlarge text by.
 *
 * The multiplier is `MIN_TEXT_PX / (textPx * scale)`, which grows without bound
 * as the container shrinks: at scale 0.1 an 11px label would need 9x. Past about
 * 3x the text is wider than the frame it sits in and reads as broken rather than
 * as legible, so it stops there and a table small enough to be a stamp is
 * allowed to be one.
 */
export const MAX_TEXT_SCALE = 3;

/** The design box's scale. `1` means it is being drawn at its design size. */
export const DesignScaleContext = createContext(1);

/**
 * The scale the surrounding `FitBox` (and therefore every table type) is drawing
 * at. `1` outside one, or before the container has been measured.
 */
export function useDesignScale(): number {
  return useContext(DesignScaleContext);
}

/**
 * The multiplier that keeps `textPx` at or above `minPx` on screen at `scale`.
 *
 * `1` when the text is already big enough — so a table drawn at its design size
 * is untouched — and `1` for any nonsense input, because a caller passing a
 * negative `minPx` to switch the floor off should get no compensation rather
 * than a mirrored one.
 */
export function readableScale(scale: number, textPx: number, minPx: number = MIN_TEXT_PX): number {
  if (!Number.isFinite(scale) || scale <= 0) return 1;
  if (!Number.isFinite(textPx) || textPx <= 0) return 1;
  if (!Number.isFinite(minPx) || minPx <= 0) return 1;
  const onScreen = textPx * scale;
  if (onScreen >= minPx) return 1;
  return Math.min(MAX_TEXT_SCALE, minPx / onScreen);
}
