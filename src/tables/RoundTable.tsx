import { CardTable, type CardTableProps } from "../components/CardTable";

/**
 * A **round table**: an ellipse of felt, with the players' frames on a ring
 * around it.
 *
 * This is a table *type*, not a game. Any game where everybody sits around a
 * circle and the middle is shared uses it: a flop game, a draw game, a
 * trick-taking game, a betting game you have not invented yet. It has no props
 * of its own because there is nothing round-table-specific to add — it is
 * `CardTable` with the surface and the seat placement already decided, so you do
 * not have to think about ellipses to draw a felt.
 *
 * Anything the ring plays host to is the caller's: a betting line is a `ring`
 * you declare, the chips on it are a `slot`, whose turn it is is `Seat`'s
 * `isActive`, and a celebration is an `overlay`. Wrap it in an `overlay` and it
 * stops being a round table.
 *
 * ```tsx
 * <RoundTable
 *   seatCount={6}
 *   rings={[{ id: "line", radius: 0.72 }]}
 *   slots={[{ id: "bet", radius: 0.72, render: (i) => bets[i] && <ChipStack amount={bets[i]} /> }]}
 *   renderSeat={(i, box) => <Seat width={box.width} height={box.height} />}
 * />
 * ```
 */
export interface RoundTableProps extends Omit<CardTableProps, "shape" | "seatPlacement" | "cornerRadius"> {}

export function RoundTable(props: RoundTableProps) {
  return <CardTable {...props} shape="ellipse" seatPlacement="ring" />;
}
