import { createContext, useContext } from "react";

/** The seat frame size a table laid its ring out for. */
export interface SeatSize {
  width: number;
  height: number;
}

/**
 * Provided by `CardTable`, consumed by `Seat`.
 *
 * Without it the frame size has two sources: `CardTable`'s `seatWidth` /
 * `seatHeight` (used to position the ring) and `Seat`'s own `width` / `height`
 * (used to draw the frame). They share a default and nothing else, so shrinking
 * a seat to fit the ring only worked when the caller threaded the size through by
 * hand. A `Seat` rendered outside any table gets `null` and falls back to its own
 * defaults.
 */
export const SeatSizeContext = createContext<SeatSize | null>(null);

/** The frame size the surrounding table laid out, or `null` outside a table. */
export function useSeatSize(): SeatSize | null {
  return useContext(SeatSizeContext);
}
