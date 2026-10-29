/**
 * The table types.
 *
 * A **table type** is a shape and an arrangement, with nothing in it that
 * belongs to a game: who sits where, where the felt is, where the frames go, and
 * where a ring or a slot the caller declares will land. Pick the one your game's
 * seating looks like, put your own content in it, and it stops being "a poker
 * table" the moment you do.
 *
 * There are three because there are three ways card games arrange people:
 *
 * | Type | Arrangement |
 * | --- | --- |
 * | `RoundTable` | everybody around an ellipse, the middle shared |
 * | `SquareTable` | everybody around a rounded rectangle's perimeter |
 * | `DealerTable` | one position at the head, the players in a row opposite it |
 *
 * `TABLE_TYPES` maps the names to the components, so a client that lets the
 * player choose a table can do it with a string.
 *
 * A game-specific table is deliberately **not** here. `PokerTable`,
 * `BigTwoTable`, `BlackjackTable` and friends are compositions of these types,
 * and they live in the docs' worked examples — because a game you have not
 * written yet cannot use a table that only exists for someone else's game, and
 * because a library that names games in its API is one release behind every
 * game anyone invents. If your seating is none of the three, `FitBox` plus
 * `frames.ts` (or `CardTable`, which is all three of these underneath) is the
 * escape hatch, and it is the same code these are built from.
 */

// Imported as well as re-exported: `TABLE_TYPES` below is a value that holds
// them, and `export { X } from "./x"` creates no local binding to hold.
import { RoundTable } from "./RoundTable";
import { SquareTable } from "./SquareTable";
import { DealerTable } from "./DealerTable";

export { RoundTable, type RoundTableProps } from "./RoundTable";
export { SquareTable, type SquareTableProps } from "./SquareTable";
export {
  DealerTable,
  DEFAULT_HAND_GAP,
  DEFAULT_HAND_H,
  DEFAULT_HAND_W,
  DEFAULT_HAND_Y,
  DEFAULT_HEAD_H,
  DEFAULT_HEAD_W,
  DEFAULT_HEAD_Y,
  type DealerTableProps,
} from "./DealerTable";

export type TableTypeName = "round" | "square" | "dealer";

/** The table types by name, for a client that lets the player choose one. */
export const TABLE_TYPES = {
  round: RoundTable,
  square: SquareTable,
  dealer: DealerTable,
} as const;
