import type { ReactNode } from "react";
import {
  CardRow,
  MIN_TEXT_PX,
  Seat,
  cardSizeFor,
  readableScale,
  useDesignScale,
  type CardSize,
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
 * Room a `layout="row"` seat spends on the player's own two lines — the name and
 * the stack — before the hand gets the rest of the width.
 */
const ROW_INFO_W = 72;

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

export interface PlayerSeatProps {
  index: number;
  /** Frame size from `SeatBox`. Omit to let the table's context size it. */
  width?: number;
  height?: number;
  isActive?: boolean;
  isWinner?: boolean;
  isDimmed?: boolean;
  /**
   * The cards in the frame — or `null` for a **plate**: a seat with nothing to show
   * draws no cards and nothing where they would be. Defaults to the sample hand,
   * face up.
   */
  cards?: (string | null)[] | null;
  /**
   * How the frame is laid out. `"stack"` (the default) puts the player over their
   * hand, which is what a portrait frame with two large cards wants. `"row"` splits
   * the frame in two: the player on the left, what they are holding on the right.
   *
   * The split is the point — a hidden hand in the middle of a portrait frame
   * competes with the name and the stack for the same column, and wins, because two
   * `md` cards are 40% of the frame. Beside them, each is legible. A row wants a
   * landscape frame: at 240x112 it keeps `md` cards, where a 240x96 row drops them
   * to `sm`.
   */
  layout?: "stack" | "row";
  /**
   * What the seat is holding, for `layout="row"`. Defaults to its cards, so a card
   * game passes nothing and a betting game passes its chips.
   */
  hold?: ReactNode;
  /**
   * Defaults to the largest size that fits `width`/`height` — `cardSizeFor`.
   * A hand-written size is how the default seat ended up two-thirds empty.
   */
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
  layout = "stack",
  hold,
  cardSize,
  label,
  footer,
}: PlayerSeatProps) {
  const stack = SAMPLE.stacks[index % SAMPLE.stacks.length];
  const shown = cards ?? [];
  const rowwise = layout === "row";
  const name = label ?? (index === 0 ? "You" : `Seat ${index}`);
  /*
   * A row spends part of its width on the player's own two lines, so what is left
   * for the cards is the frame minus `ROW_INFO_W` — and none of the `chrome` a
   * portrait frame reserves for a header and a footer, because a row has neither.
   */
  const cardBox =
    width !== undefined && height !== undefined
      ? rowwise
        ? { width: Math.max(80, width - ROW_INFO_W), height }
        : { width, height }
      : undefined;
  // The frame is the thing that knows how much room there is. Outside a table
  // nothing reported a size, so `sm` is the honest fallback.
  const size =
    cardSize ?? (cardBox ? cardSizeFor(cardBox, shown.length || 1, rowwise ? { chrome: 0 } : undefined) : "sm");
  const stackLine = <span className="w-full text-center font-mono text-gold-light">{formatBB(stack, 20)}</span>;
  /*
   * A row writes its own two lines, so it carries the floor the seat's own rows
   * carry — through the exported `readableScale`, which is what that export is for.
   * Text a caller writes inside `children` gets no compensation otherwise, and a flat
   * `text-base` lands under `MIN_TEXT_PX` on any table the ring has shrunk.
   */
  const rowFloor = readableScale(useDesignScale(), 11, MIN_TEXT_PX);

  return (
    <Seat
      width={width}
      height={height}
      isActive={isActive}
      isWinner={isWinner}
      isDimmed={isDimmed}
      /*
       * A row has no header or footer: its two lines are the left half of `children`,
       * beside the hand. Everything the frame's own rows would have done for that text
       * — the floor above all — is done there instead.
       */
      header={rowwise ? undefined : <span className="w-full truncate text-center font-semibold">{name}</span>}
      /*
       * A plate draws no cards and nothing where they would be — the empty middle is
       * the mark. It keeps the same footer every other seat has, because the stack is
       * the one number on a table and it cannot be shouted in one seat's middle and
       * whispered in the next seat's footer.
       */
      footer={rowwise ? undefined : (footer ?? stackLine)}
    >
      {rowwise ? (
        <div className="flex w-full items-center justify-between gap-2">
          {/*
            * `shrink-0` and a real width, not `min-w-0`: a flex column that is
            * allowed to shrink gets squeezed by the cards and the name ends up
            * behind them — which is exactly the contest the row exists to settle.
            * 72px is ROW_INFO_W, the number the card size was computed against.
            */}
          <span
            className="flex shrink-0 flex-col items-start"
            style={{
              width: ROW_INFO_W,
              ...(rowFloor === 1 ? null : { transform: `scale(${rowFloor})`, transformOrigin: "left center" }),
            }}
          >
            <span className="max-w-full truncate text-[11px] font-semibold">{name}</span>
            <span className="font-mono text-[11px] text-gold-light">{formatBB(stack, 20)}</span>
          </span>
          {hold ?? (cards === null ? null : <CardRow cards={[...shown]} size={size} />)}
        </div>
      ) : cards === null ? null : (
        <CardRow cards={[...shown]} size={size} />
      )}
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
  // The box is handed over so the hand's cards are sized to the frame the row
  // was laid out for, rather than to whatever size was written by hand.
  return (index: number, box: FrameBox) => (
    <PlayerSeat index={index} width={box.width} height={box.height} {...opts} />
  );
}
