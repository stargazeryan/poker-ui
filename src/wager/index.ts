/**
 * `@stargazeryan/poker-ui/wager` — the betting half of the package.
 *
 * Chips, the breakdown of an amount into chips, and a big-blind formatter. All
 * of it is about *money on the table*, which is a property of the games that
 * bet, not of cards or tables: a card game with no betting should not have to
 * carry a chip set, and should not find one in its import graph.
 *
 * The main entry (`@stargazeryan/poker-ui`) does not export any of this.
 */

export {
  DEFAULT_DENOMINATIONS,
  chipBreakdown,
  chipCount,
  chipSpotColor,
  chipsTotal,
  type ChipStackEntry,
  type Denomination,
} from "./chips";

export { Chip, ChipStack, type ChipProps, type ChipStackProps } from "./Chip";

export { BB, formatBB } from "./format";
