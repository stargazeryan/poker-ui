/**
 * `@stargazeryan/poker-ui` — the core entry point.
 *
 * Everything here is shared by any card game: a scaler, positioning strategies,
 * cards, seats, a counter and decorations. There is deliberately **nothing
 * game-specific** in this file:
 *
 * - no betting line, no chip set, no big blind — those are the `./wager` entry
 *   point, because only the games that wager need them;
 * - no `PokerTable`, no `HoleCards`, no `Pot` — those are words one game uses.
 *   The four worked examples are in the docs, `demo/src/examples/games.tsx`,
 *   built out of this entry and `/wager` and nothing else.
 *
 * The components here *position and draw*; you decide *what is true*.
 */

/* ------------------------------------------------------------------ basics -- */

export { cn } from "./cn";

export {
  contrastRatio,
  flatten,
  mostVisible,
  parseColor,
  relativeLuminance,
  type Rgba,
} from "./color";

export { SIZES, type CardSize, type ChipSize, type Size } from "./sizes";
export { CARD_HEIGHT, CARD_WIDTH, cardSizeFor, type CardSizeFit } from "./cardSize";
export { COUNT_UP_MS, FLIP_MS, STAGGER_MS } from "./motion";
export { MAX_TEXT_SCALE, MIN_TEXT_PX, readableScale, useDesignScale } from "./designScale";

/* ------------------------------------------------------------------- cards -- */

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

/* --------------------------------------------------------------- position -- */

export { ellipsePoint, ringPoints, seatAngle, type Point } from "./geometry";
export { nextSeatIndex, type NextSeatOptions } from "./seat";

export {
  FRAME_SHRINK_FLOOR,
  fitFrameScale,
  fitRowScale,
  gridFrames,
  minFrameSeparation,
  perimeterFrames,
  ringFrames,
  rowFrames,
  type FrameBox,
  type GridFramesOptions,
  type PerimeterFramesOptions,
  type RingFramesOptions,
  type RowFitOptions,
  type RowFramesOptions,
} from "./frames";

export {
  DEFAULT_CORNER_FRACTION,
  insetBox,
  scaledBox,
  scaledRadius,
  tableSurface,
  type Box,
  type SeatPlacement,
  type SurfaceOptions,
  type TableShape,
  type TableSurface,
} from "./surface";

export {
  DEFAULT_FELT_GAP,
  DEFAULT_MARGIN_X,
  DEFAULT_MARGIN_Y,
  DEFAULT_SEAT_GAP,
  DEFAULT_SEAT_H,
  DEFAULT_SEAT_W,
  DESIGN_H,
  DESIGN_W,
  GLOW_GAP,
  MIN_SLOT_RADIUS,
  RIM_GAP,
  ROW_FRACTION,
  SEAT_SHRINK_FLOOR,
  defaultSeatPlacement,
  ellipseBox,
  fitSeatScale,
  layoutTable,
  seatPoint,
  seatRingRadii,
  tableRadii,
  type Layout,
  type LayoutOptions,
} from "./layout";

/* -------------------------------------------------------------- components -- */

export {
  FIT_BLEED,
  FitBox,
  MAX_FIT_ASPECT,
  MIN_FIT_ASPECT,
  useFitBox,
  type DesignBox,
  type FitBoxProps,
  type FitMode,
} from "./components/FitBox";

export {
  CardBack,
  CardFan,
  CardRow,
  CardSlot,
  PlayingCard,
  type CardAnimation,
  type CardBackProps,
  type CardFanProps,
  type CardRowProps,
  type CardSlotProps,
  type PlayingCardProps,
} from "./components/PlayingCard";

export { Seat, type SeatProps } from "./components/Seat";
export { Confetti, type ConfettiProps } from "./components/Confetti";

export { Counter, type CounterProps } from "./components/Counter";

export {
  TIMER_SIZE,
  TurnTimer,
  type TurnTimerProps,
  type TurnTimerSize,
} from "./components/TurnTimer";

export {
  MARKER_SIZE,
  Marker,
  type MarkerProps,
  type MarkerSize,
  type MarkerTone,
} from "./components/Marker";

export {
  CardTable,
  type CardTableProps,
  type SeatBox,
  type TableOverlayGeometry,
  type TableRing,
  type TableSlot,
} from "./components/CardTable";

/* ----------------------------------------------------------- table types -- */

export {
  DEFAULT_HAND_GAP,
  DEFAULT_HAND_H,
  DEFAULT_HAND_W,
  DEFAULT_HAND_Y,
  DEFAULT_HEAD_H,
  DEFAULT_HEAD_W,
  DEFAULT_HEAD_Y,
  DealerTable,
  RoundTable,
  SquareTable,
  TABLE_TYPES,
  type DealerOverlayGeometry,
  type DealerTableProps,
  type RoundTableProps,
  type SquareTableProps,
  type TableTypeName,
} from "./tables";

/*
 * Not exported here, on purpose:
 *
 * - `DEFAULT_DENOMINATIONS`, `chipBreakdown`, `chipsTotal`, `chipCount`,
 *   `chipSpotColor`, `Chip`, `ChipStack`, `BB`, `formatBB`
 *   are in `@stargazeryan/poker-ui/wager` — they are about money on the table,
 *   which a game without betting does not need.
 * - there is no `PokerTable` / `BlackjackTable` / `BigTwoTable` here, or
 *   anywhere in the package. A table for one game is a composition of the table
 *   types above, and those compositions live in the docs' worked examples. A
 *   game nobody has written yet cannot use a component named after somebody
 *   else's game, and naming games in the API makes this library one release
 *   behind every game anyone invents.
 *
 * A round table is a shape, and the betting line that made one "poker" is a
 * `ring` the caller declares.
 */
