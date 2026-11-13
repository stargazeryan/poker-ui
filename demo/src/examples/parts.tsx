import type { ReactNode } from "react";
import {
  CardRow,
  MIN_TEXT_PX,
  PlayingCard,
  Seat,
  cardSizeFor,
  readableScale,
  useDesignScale,
  type FrameBox,
  type SeatBox,
  type TableRing,
  type TableSlot,
} from "@stargazeryan/poker-ui";
import { ChipStack, formatBB } from "@stargazeryan/poker-ui/wager";

/**
 * The demo's own Lego: the sample data and the three pieces of markup every page
 * used to write out by hand.
 *
 * Nothing here is library API. It lives beside the examples because
 * `tests/separation.test.ts` holds everything under `demo/src/examples/` to the
 * two published entry points, so this file cannot quietly start using something
 * a consumer would not have — which is what makes it safe for every page,
 * including the guide, to build on.
 *
 * The rule for what belongs here: a thing written out twice. A one-off shape
 * stays in the page that is about it.
 */

/** The sample a demo reaches for when the demo is not about the data. */
export const SAMPLE: {
  /** A two-card hand, face up. */
  hand: (string | null)[];
  /** Two cards nobody has turned over. */
  faceDown: (string | null)[];
  /** Six seats' worth of stacks, in chip units. */
  stacks: number[];
  /** Five board cards, so a street stepper has something to reveal. */
  board: string[];
  /** Six seats' wagers; 0 is "this seat has not wagered". */
  bets: number[];
  /** What those wagers add up to. */
  pot: number;
} = {
  hand: ["As", "Kh"],
  faceDown: [null, null],
  stacks: [1000, 940, 1000, 885, 760, 1000],
  board: ["Ah", "Kd", "7c", "2s", "9h"],
  bets: [0, 60, 0, 115, 240, 0],
  pot: 415,
};


/**
 * Room the container spends on the seat-info half, before the hand gets the rest of
 * the width. Published because the *caller* sizes its own half against it.
 */
export const INFO_HALF_W = 72;

/** The size the info half draws its two lines at — what its floor is measured for. */
const INFO_TEXT_PX = 11;

/** The radius every demo puts its betting line at. */
export const BET_RADIUS = 0.72;

/**
 * The felt decoration the card-room demos ask for. It is passed in rather than
 * defaulted, because that is the point: nothing paints a suit watermark on a
 * table that did not ask for one.
 */
export const WATERMARK = (
  <span className="text-white/[0.05] text-[110px] font-black tracking-[0.2em] select-none leading-none">♠♥♦♣</span>
);

/** The outline a demo's betting line is drawn with. */
export const BET_RING: TableRing = { id: "betting-line", radius: BET_RADIUS };

/**
 * Per-seat wager content for a declared betting line: one chip stack per seat
 * that wagered, nothing for the seats that did not.
 */
export function betSlots(bets: readonly number[] = SAMPLE.bets, radius = BET_RADIUS): TableSlot[] {
  return [
    {
      id: "bet",
      radius,
      // A bet sits on the felt as a pile of columns, not as one tall tower —
      // at `sm` a twelve-high tower is a smear rather than a count.
      render: (i) => (bets[i] ? <ChipStack amount={bets[i]} size="sm" layout="pile" /> : null),
    },
  ];
}

/* ---------------------------------------------------------------- the halves -- */

export interface PlayerInfoProps {
  /** Defaults to "You" for seat 0 and "Seat n" otherwise. */
  index?: number;
  /** Overrides the name. */
  label?: ReactNode;
  /** Overrides the stack, in chip units. `null` draws no stack line. */
  stack?: number | null;
  /** A third line, for what is not a stack: a wager, a badge. */
  extra?: ReactNode;
  className?: string;
}

/**
 * Who is sitting there: a name and a stack, and nothing else.
 *
 * It knows nothing about cards — that is the other half's business — which is what
 * lets either half be swapped on its own: this for a plate, a `CardRow` for a hand,
 * a `ChipStack` for a wager, none of them aware of the others.
 *
 * It carries the text floor itself, through the exported `readableScale`: a component
 * that draws text is the thing that has to keep it legible, because text written
 * inside a seat's `children` gets no compensation from the seat.
 */
export function PlayerInfo({ index = 0, label, stack, extra, className = "" }: PlayerInfoProps) {
  const floor = readableScale(useDesignScale(), INFO_TEXT_PX, MIN_TEXT_PX);
  // `undefined` is the sample stack; `null` is none at all, because a game with no
  // stacks — a twenty-one table, a bank game — should not be shown a number it never had.
  const amount = stack === undefined ? SAMPLE.stacks[index % SAMPLE.stacks.length] : stack;
  return (
    <span
      className={`flex flex-col items-start ${className}`}
      style={floor === 1 ? undefined : { transform: `scale(${floor})`, transformOrigin: "left center" }}
    >
      <span className="max-w-full truncate text-[11px] font-semibold">
        {label ?? (index === 0 ? "You" : `Seat ${index}`)}
      </span>
      {amount === null ? null : (
        <span className="font-mono text-[11px] text-gold-light">{formatBB(amount, 20)}</span>
      )}
      {extra}
    </span>
  );
}

/* ------------------------------------------------------------- the container -- */

export interface SeatRowProps {
  /** Frame size from `SeatBox`. Omit to let the table's context size it. */
  width?: number;
  height?: number;
  isActive?: boolean;
  isWinner?: boolean;
  isDimmed?: boolean;
  /** The left half: who is sitting there. */
  info: ReactNode;
  /**
   * The right half: what they are holding, given the box that is left for it — so a
   * hand can size itself with `cardSizeFor` and a chip stack can ignore the box.
   *
   * A function rather than a node because the half's size is the container's to know
   * and its content's to use: passing a node would leave every caller computing the
   * same box by hand, and passing *cards* would make the container a card component,
   * which is the dependency this is here to avoid.
   */
  hold: (box: { width: number; height: number }) => ReactNode;
}

/**
 * The container: one frame, two halves. It knows how big the frame is and splits it;
 * it does not know what a card is, and the two halves never see each other.
 *
 * The frame is the library's own neutral `Seat`, so the border, the states and the
 * rows come from there and nothing is re-implemented here.
 */
export function SeatRow({ width, height, isActive, isWinner, isDimmed, info, hold }: SeatRowProps) {
  /*
   * The left half is a fixed width and `shrink-0`, not `min-w-0`: a flex child that is
   * allowed to shrink gets squeezed by whatever the right half is, and the name ends up
   * behind the cards — which is exactly the contest the container exists to settle.
   */
  const box = { width: Math.max(80, (width ?? 240) - INFO_HALF_W), height: height ?? 112 };
  return (
    <Seat width={width} height={height} isActive={isActive} isWinner={isWinner} isDimmed={isDimmed}>
      <div className="flex w-full items-center justify-between gap-2">
        <span className="shrink-0" style={{ width: INFO_HALF_W }}>
          {info}
        </span>
        <span className="shrink-0">{hold(box)}</span>
      </div>
    </Seat>
  );
}

/* ------------------------------------------------- the demo's own two halves -- */

/**
 * The demo's usual right half: a hand, sized to whatever box the container hands it.
 * A card game's content, in one place, so a page that is not about cards can say
 * `hold={handHalf()}` and mean "the sample hand".
 */
export function handHalf(cards: (string | null)[] = SAMPLE.hand) {
  return (box: { width: number; height: number }) => {
    // `chrome: 0` because a row has no header or footer for `cardSizeFor` to reserve.
    const size = cardSizeFor(box, cards.length || 1, { chrome: 0 });
    return (
      <CardRow>
        {cards.map((code, i) => (
          <PlayingCard key={i} card={code} size={size} />
        ))}
      </CardRow>
    );
  };
}

export interface SeatOpts {
  isActive?: (index: number) => boolean;
  isWinner?: (index: number) => boolean;
  isDimmed?: (index: number) => boolean;
  /** The right half, per seat. Defaults to the sample hand. */
  hold?: (index: number) => (box: { width: number; height: number }) => ReactNode;
  /** The left half's name, per seat. */
  label?: (index: number) => ReactNode;
  /** The left half's stack, per seat. */
  stack?: (index: number) => number;
}

/** One row assembled from the opts, in one place, so `renderSeat` and `renderHand` cannot drift. */
function seatRow(index: number, box: { width: number; height: number }, opts: SeatOpts) {
  return (
    <SeatRow
      width={box.width}
      height={box.height}
      isActive={opts.isActive?.(index)}
      isWinner={opts.isWinner?.(index)}
      isDimmed={opts.isDimmed?.(index)}
      info={<PlayerInfo index={index} label={opts.label?.(index)} stack={opts.stack?.(index)} />}
      hold={opts.hold?.(index) ?? handHalf()}
    />
  );
}

/** `renderSeat` for a table of rows: a `PlayerInfo` on the left, the sample hand right. */
export function renderPlayers(opts: SeatOpts = {}) {
  return (index: number, box: SeatBox) => seatRow(index, box, opts);
}

/** `renderHand` for a dealer table of rows — the same pair, one row per position. */
export function renderHands(opts: SeatOpts = {}) {
  return (index: number, box: FrameBox) => seatRow(index, box, opts);
}
