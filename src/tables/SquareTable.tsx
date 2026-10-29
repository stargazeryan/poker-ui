import { CardTable, type CardTableProps } from "../components/CardTable";

/**
 * A **square table**: a rounded rectangle, with the players' frames spaced along
 * its perimeter by arc length.
 *
 * The other table type that exists because people sit around furniture rather
 * than in a circle. Four players on the four sides, six, eight — the frames walk
 * the edge evenly instead of bunching into the corners the way an angle-based
 * arrangement would.
 *
 * Like `RoundTable`, it has no props of its own: it is `CardTable` with the
 * surface and the seat placement decided. `cornerRadius` survives on it, because
 * how round the corners are is a property of a rectangle — set it to `0` for a
 * hard-edged table, or leave it and get the felt-rounded default.
 *
 * ```tsx
 * <SquareTable seatCount={4} cornerRadius={40} renderSeat={(i, box) => <Seat ... />} />
 * ```
 */
export interface SquareTableProps extends Omit<CardTableProps, "shape" | "seatPlacement"> {}

export function SquareTable(props: SquareTableProps) {
  return <CardTable {...props} shape="rect" seatPlacement="perimeter" />;
}
