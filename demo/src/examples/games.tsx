import { useState } from "react";
import {
  CardRow,
  CardSlot,
  Counter,
  Confetti,
  DealerTable,
  PlayingCard,
  RoundTable,
  Seat,
  SquareTable,
  CardFan,
  type CardSize,
} from "@stargazeryan/poker-ui";
import { ChipStack, formatBB } from "@stargazeryan/poker-ui/wager";

/**
 * Four games, built out of the table types and nothing else.
 *
 * These exist to answer one question: *the library ships three table shapes —
 * can I actually build a game I have not been given a component for?* Each of
 * them imports only `@stargazeryan/poker-ui` and `@stargazeryan/poker-ui/wager`,
 * the same two entries a consumer gets, and `tests/games.test.tsx` renders them
 * and asserts the things that matter:
 *
 * - the flop game has a betting line because it **declared** one;
 * - the shedding game has no line, no felt decoration and no chip anywhere,
 *   because it declared none — it is the same round/square machinery with the
 *   opinions left out;
 * - the twenty-one and banking games draw no felt at all, because a table type
 *   that cannot draw one is the only way to be sure;
 * - the banking game and the twenty-one game use the *same* table type, which is
 *   the point: a table type serves many games, a game-specific table serves one.
 *
 * None of them is a library component. Poker, big two, dragon gate and
 * twenty-one are *your* rules, and these files hold no rules at all — no hand
 * evaluation, no betting legality, no dealer draw. They are what a consumer's
 * own game file looks like.
 */

const SUIT_WATERMARK = (
  <span className="text-white/[0.05] text-[110px] font-black tracking-[0.2em] select-none leading-none">♠♥♦♣</span>
);

/* --------------------------------------------------------------- flop poker -- */

export interface FlopPokerExampleProps {
  /** How many board cards are out. 0 / 3 / 4 / 5. */
  street?: number;
  /** Per-seat wager, in chip units. 0 means no wager. */
  bets?: number[];
  /** Whose turn it is — your engine's answer, not the table's. */
  activeSeat?: number | null;
  /** The board. */
  board?: string[];
  /** Per-seat stacks, in chip units, displayed as big blinds. */
  stacks?: number[];
}

const POKER_HANDS: (string | null)[][] = [
  ["As", "Kh"],
  [null, null],
  [null, null],
  [null, null],
  [null, null],
  [null, null],
];

export function FlopPokerExample({
  street = 3,
  bets = [0, 60, 0, 115, 240, 0],
  activeSeat = 3,
  board = ["Ah", "Kd", "7c", "2s", "9h"],
  stacks = [1000, 940, 1000, 885, 760, 1000],
}: FlopPokerExampleProps) {
  const pot = 415;
  const betRadius = 0.72;

  return (
    <RoundTable
      seatCount={6}
      watermark={SUIT_WATERMARK}
      /* The betting line is a ring this file declares. A game with no betting
         would simply not declare one — and nothing would be drawn. */
      rings={[{ id: "betting-line", radius: betRadius }]}
      slots={[
        {
          id: "bet",
          radius: betRadius,
          render: (i) => (bets[i] ? <ChipStack amount={bets[i]} size="sm" /> : null),
        },
      ]}
      renderSeat={(i, box) => (
        <Seat
          width={box.width}
          height={box.height}
          isActive={activeSeat === i}
          header={<span className="w-full truncate text-center font-semibold">{i === 0 ? "You" : `Seat ${i}`}</span>}
          footer={
            <span className="w-full text-center font-mono text-gold-light">{formatBB(stacks[i] ?? 0, 20)}</span>
          }
        >
          <CardRow cards={POKER_HANDS[i]} size="sm" />
        </Seat>
      )}
      center={
        <div className="flex flex-col items-center gap-3">
          <CardRow cards={board.slice(0, street)} size="lg" slots={5} animation="flip" />
          <Counter label="Main" amount={pot} />
        </div>
      }
      renderOverlay={({ layout }) =>
        activeSeat === null ? null : (
          <div style={layout.boxes.glow} className="absolute animate-turn-glow rounded-[50%]" />
        )
      }
    />
  );
}

/* ------------------------------------------------------------ shedding game -- */

export interface SheddingExampleProps {
  /** One hand per seat — the whole 13 if you like. */
  hands?: (string | null)[][];
  names?: string[];
  /** Whose turn it is. */
  activeSeat?: number | null;
  /** Seats that are out of cards. */
  finished?: number[];
  /** The last play, in the middle. */
  discard?: string[];
  /** Card size for a hand. 13 cards survive at `xs`. */
  cardSize?: CardSize;
}

const SHEDDING_HANDS: string[][] = [
  ["3s", "4h", "5d", "6c", "7s", "9h", "10d", "Jc", "Qs", "Kh", "2d", "2c", "2s"],
  ["4s", "6h", "8d", "9c", "Js", "Qh", "Ad", "Kc", "3h", "5c", "7d", "8s", "9s"],
  ["5s", "7h", "9d", "Jc", "Ks", "Ah", "2d", "3c", "4h", "6s", "8c", "10d", "Qh"],
  ["6s", "8h", "10d", "Qc", "As", "3h", "5d", "7c", "9s", "Jh", "Kd", "2h", "4c"],
];

export function SheddingExample({
  hands = SHEDDING_HANDS,
  names = ["You", "West", "North", "East"],
  activeSeat = 1,
  finished = [],
  discard = ["9h", "9d", "9c"],
  cardSize = "xs",
}: SheddingExampleProps) {
  return (
    <SquareTable
      cornerRadius={150}
      seatCount={hands.length}
      /* No `rings`, no `slots`, no `watermark`: there is nothing to wager and
         nothing to decorate, so nothing is drawn. */
      renderSeat={(i, box) => (
        <Seat
          width={box.width}
          height={box.height}
          isActive={activeSeat === i}
          isDimmed={finished.includes(i)}
          header={<span className="w-full truncate text-center font-semibold">{names[i] ?? `Seat ${i}`}</span>}
          footer={
            <span className="w-full text-center font-mono text-neutral-400">{hands[i]?.length ?? 0} cards</span>
          }
        >
          <CardFan cards={hands[i] ?? []} size={cardSize} overlap={0.68} />
        </Seat>
      )}
      center={
        <div className="flex flex-col items-center gap-2">
          <span className="text-[11px] uppercase tracking-wider text-neutral-400">last play</span>
          <CardRow cards={discard} size="md" />
        </div>
      }
    />
  );
}

/* ------------------------------------------------------------ banking game -- */

export interface BankingExampleProps {
  /**
   * The three shared positions. `undefined` is "not dealt yet" — the slots are
   * laid out before anything arrives, which is the whole reason `CardSlot`
   * exists.
   */
  gate?: [string | null | undefined, string | null | undefined, string | null | undefined];
  /** Per-seat wager, in chip units. */
  wagers?: number[];
  /** Which position the result rests on, for a highlight. */
  highlight?: 0 | 1 | 2 | null;
  /** Whether the player's wager won. */
  won?: boolean;
}

export function BankingExample({
  gate = ["As", undefined, "Qc"],
  wagers = [50, 100, 25, 0],
  highlight = 1,
  won = false,
}: BankingExampleProps) {
  return (
    <DealerTable
      headWidth={420}
      headHeight={230}
      handWidth={210}
      handHeight={250}
      head={
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-2xl border border-neutral-700 bg-neutral-900/80 p-3">
          <span className="text-[11px] uppercase tracking-wider text-neutral-400">the gate</span>
          <div className="flex items-end gap-3">
            {gate.map((card, i) => (
              <CardSlot
                key={i}
                size="md"
                label={["left gate, not dealt", "goal, not dealt", "right gate, not dealt"][i]}
                className={highlight === i ? "border-solid border-gold animate-turn-glow" : undefined}
              >
                {card ? <PlayingCard card={card} size="md" /> : null}
              </CardSlot>
            ))}
          </div>
        </div>
      }
      hands={wagers.map((wager, i) => (
        <Seat
          key={i}
          isWinner={won && wager > 0}
          header={<span className="w-full truncate text-center font-semibold">{i === 0 ? "You" : `Seat ${i}`}</span>}
          footer={wager > 0 ? <span className="w-full text-center"><ChipStack amount={wager} size="sm" /></span> : undefined}
        >
          <span className="text-xs text-neutral-500">{wager > 0 ? "in" : "out"}</span>
        </Seat>
      ))}
      overlay={won ? <Confetti count={30} colors={["#f39c12", "#2ecc71", "#f0c04a"]} /> : undefined}
    />
  );
}

/* -------------------------------------------------------- twenty-one game -- */

export interface TwentyOneHand {
  cards: (string | null)[];
  label?: string;
  isActive?: boolean;
  isWinner?: boolean;
  isDimmed?: boolean;
  /** Wager in chip units. */
  bet?: number;
}

export interface TwentyOneExampleProps {
  dealer?: (string | null)[];
  /** Hide every dealer card but the first — the hole card. */
  dealerHidden?: boolean;
  hands?: TwentyOneHand[];
}

const DEFAULT_HANDS: TwentyOneHand[] = [
  { cards: ["10h", "7s"], label: "You", isActive: true, bet: 25 },
  { cards: ["5d", "6c", "10s"], label: "Seat 2", bet: 50 },
  { cards: ["Ad", "Kh"], label: "Seat 3", isWinner: true, bet: 100 },
];

export function TwentyOneExample({
  dealer = ["As", "9d"],
  dealerHidden = true,
  hands = DEFAULT_HANDS,
}: TwentyOneExampleProps) {
  const shown = dealerHidden ? dealer.map((card, i) => (i === 0 ? card : null)) : dealer;

  return (
    <DealerTable
      headWidth={260}
      headHeight={240}
      handWidth={230}
      handHeight={280}
      head={
        <Seat
          width={260}
          height={240}
          header={<span className="w-full text-center font-semibold">Dealer</span>}
          footer={<span className="w-full text-center font-mono text-neutral-400">{dealer.length} cards</span>}
        >
          <CardRow cards={shown} size="md" />
        </Seat>
      }
      hands={hands.map((hand, i) => (
        <Seat
          key={i}
          isActive={hand.isActive}
          isWinner={hand.isWinner}
          isDimmed={hand.isDimmed}
          header={<span className="w-full truncate text-center font-semibold">{hand.label ?? `Hand ${i + 1}`}</span>}
          footer={
            hand.bet !== undefined ? (
              <span className="w-full text-center">
                <ChipStack amount={hand.bet} size="sm" />
              </span>
            ) : undefined
          }
        >
          <CardRow cards={hand.cards} size="sm" />
        </Seat>
      ))}
    />
  );
}

/* ------------------------------------------------------------ a plaything -- */

/**
 * The four examples on one page, with the state each one needs to be worth
 * clicking. This is the demo's own composition — nothing here is exported from
 * the package.
 */
export function GameGallery() {
  const [street, setStreet] = useState(3);
  const [handsLeft, setHandsLeft] = useState(3);
  const [dealerHidden, setDealerHidden] = useState(true);
  const [won, setWon] = useState(false);

  const board = ["Ah", "Kd", "7c", "2s", "9h"];

  return (
    <div className="flex flex-col gap-10">
      <section>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <h3 className="mr-2 font-semibold text-neutral-100">A flop game — RoundTable</h3>
          {[0, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setStreet(n)}
              className={`rounded border px-2 py-0.5 font-mono text-[11px] ${
                street === n ? "border-gold text-gold" : "border-white/20 text-neutral-400"
              }`}
            >
              {n} on board
            </button>
          ))}
        </div>
        <div className="h-[460px] w-full">
          <FlopPokerExample street={street} board={board} />
        </div>
      </section>

      <section>
        <h3 className="mb-3 font-semibold text-neutral-100">A shedding game — SquareTable</h3>
        <div className="h-[460px] w-full">
          <SheddingExample />
        </div>
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <h3 className="mr-2 font-semibold text-neutral-100">A banking game — DealerTable</h3>
          <button
            type="button"
            onClick={() => setWon((v) => !v)}
            className={`rounded border px-2 py-0.5 font-mono text-[11px] ${
              won ? "border-gold text-gold" : "border-white/20 text-neutral-400"
            }`}
          >
            settle
          </button>
        </div>
        <div className="h-[460px] w-full">
          <BankingExample won={won} />
        </div>
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <h3 className="mr-2 font-semibold text-neutral-100">Twenty-one — DealerTable again</h3>
          <button
            type="button"
            onClick={() => setDealerHidden((v) => !v)}
            className={`rounded border px-2 py-0.5 font-mono text-[11px] ${
              dealerHidden ? "border-gold text-gold" : "border-white/20 text-neutral-400"
            }`}
          >
            hole card {dealerHidden ? "down" : "up"}
          </button>
          <span className="ml-2 flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setHandsLeft(n)}
                className={`rounded border px-2 py-0.5 font-mono text-[11px] ${
                  handsLeft === n ? "border-gold text-gold" : "border-white/20 text-neutral-400"
                }`}
              >
                {n}
              </button>
            ))}
          </span>
        </div>
        <div className="h-[460px] w-full">
          <TwentyOneExample
            dealerHidden={dealerHidden}
            hands={DEFAULT_HANDS.slice(0, handsLeft)}
          />
        </div>
      </section>
    </div>
  );
}
