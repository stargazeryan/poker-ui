export { cn } from "./cn";
export { BB, formatBB } from "./format";
export {
  contrastRatio,
  flatten,
  mostVisible,
  parseColor,
  relativeLuminance,
  type Rgba,
} from "./color";
export { SIZES, type CardSize, type ChipSize, type Size } from "./sizes";
export { COUNT_UP_MS, DEAL_STAGGER_MS, FLIP_STAGGER_MS } from "./motion";
export {
  describeCard,
  getRankName,
  getSuitName,
  getSuitSymbol,
  isKnownSuit,
  isRedSuit,
  parseCard,
  type ParsedCard,
} from "./cards";
export { nextSeatIndex, type NextSeatOptions } from "./seat";
export {
  seatAngle,
  ellipsePoint,
  ringPoints,
  type Point,
} from "./geometry";
export {
  DEFAULT_SEAT_H,
  DEFAULT_SEAT_W,
  GLOW_GAP,
  RIM_GAP,
  SEAT_SHRINK_FLOOR,
  ellipseBox,
  fitSeatScale,
  layoutSeats,
  minSeatSeparation,
  seatPoint,
  seatRingRadii,
  tableRadii,
  type EllipseBox,
  type Layout,
  type LayoutOptions,
  type SeatLayout,
} from "./layout";

export {
  PlayingCard,
  CardBack,
  HoleCards,
  CommunityCards,
  type PlayingCardProps,
  type CardBackProps,
  type HoleCardsProps,
  type CommunityCardsProps,
} from "./components/PlayingCard";

export {
  DEFAULT_DENOMINATIONS,
  chipBreakdown,
  chipCount,
  chipSpotColor,
  chipsTotal,
  type ChipStackEntry,
  type Denomination,
} from "./chips";

export { Chip, ChipStack, type ChipProps, type ChipStackProps } from "./components/Chip";
export { Confetti, type ConfettiProps } from "./components/Confetti";

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
  type TableOverlayGeometry,
} from "./components/CardTable";

// Back-compat alias (the table is now game-agnostic).
export { CardTable as PokerTable, type CardTableProps as PokerTableProps } from "./components/CardTable";
