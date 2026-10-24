export { cn } from "./cn";
export { BB, formatBB } from "./format";
export { nextSeatIndex, type NextSeatOptions } from "./seat";
export {
  seatAngle,
  ellipsePoint,
  ringPoints,
  type Point,
} from "./geometry";
export {
  SEAT_SHRINK_FLOOR,
  fitSeatScale,
  layoutSeats,
  minSeatSeparation,
  seatPoint,
  seatRingRadii,
  tableRadii,
  type Box,
  type Layout,
  type LayoutOptions,
  type SeatLayout,
} from "./layout";

export {
  PlayingCard,
  CardBack,
  HoleCards,
  CommunityCards,
  parseCard,
  getSuitSymbol,
  type PlayingCardProps,
  type CardBackProps,
  type HoleCardsProps,
  type CommunityCardsProps,
  type CardSize,
} from "./components/PlayingCard";

export { Seat, type SeatProps } from "./components/Seat";
export { Pot, type PotProps } from "./components/Pot";
export {
  DEFAULT_BET_SCALE,
  DEFAULT_FELT_GAP,
  DEFAULT_MARGIN_X,
  DEFAULT_MARGIN_Y,
  DEFAULT_SEAT_GAP,
  DESIGN_H,
  DESIGN_W,
  CardTable,
  type CardTableProps,
  type SeatBox,
} from "./components/CardTable";

// Back-compat alias (the table is now game-agnostic).
export { CardTable as PokerTable, type CardTableProps as PokerTableProps } from "./components/CardTable";
