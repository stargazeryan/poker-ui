import type { ReactNode } from "react";
import {
  CardRow,
  Seat,
  type CardSize,
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
      render: (i) => (bets[i] ? <ChipStack amount={bets[i]} size="sm" /> : null),
    },
  ];
}

export interface PlayerSeatProps {
  index: number;
  /** Frame size from `SeatBox`. Omit to let the table's context size it. */
  width?: number;
  height?: number;
  isActive?: boolean;
  isWinner?: boolean;
  isDimmed?: boolean;
  /** Defaults to the sample hand, face up. */
  cards?: (string | null)[];
  /** Defaults to `"sm"`. */
  cardSize?: CardSize;
  /** Defaults to "You" for seat 0 and "Seat n" otherwise. */
  label?: ReactNode;
  /** Defaults to that seat's sample stack, formatted as big blinds. */
  footer?: ReactNode;
}

/**
 * A seat with a name, a stack in big blinds and a hand — the block that used to
 * be copy-pasted into every demo on every page.
 */
export function PlayerSeat({
  index,
  width,
  height,
  isActive,
  isWinner,
  isDimmed,
  cards = SAMPLE.hand,
  cardSize = "sm",
  label,
  footer,
}: PlayerSeatProps) {
  const stack = SAMPLE.stacks[index % SAMPLE.stacks.length];

  return (
    <Seat
      width={width}
      height={height}
      isActive={isActive}
      isWinner={isWinner}
      isDimmed={isDimmed}
      header={
        <span className="w-full truncate text-center font-semibold">
          {label ?? (index === 0 ? "You" : `Seat ${index}`)}
        </span>
      }
      footer={footer ?? <span className="w-full text-center font-mono text-gold-light">{formatBB(stack, 20)}</span>}
    >
      <CardRow cards={[...cards]} size={cardSize} />
    </Seat>
  );
}

/** `renderSeat` for a table of `PlayerSeat`s. */
export function renderPlayers(opts: Omit<PlayerSeatProps, "index"> = {}) {
  return (index: number, box: SeatBox) => (
    <PlayerSeat index={index} width={box.width} height={box.height} {...opts} />
  );
}

/** `renderHand` for a dealer table of `PlayerSeat`s. */
export function renderHands(opts: Omit<PlayerSeatProps, "index"> = {}) {
  return (index: number) => <PlayerSeat index={index} {...opts} />;
}
