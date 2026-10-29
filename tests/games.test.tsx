import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import {
  BankingExample,
  FlopPokerExample,
  GameGallery,
  SheddingExample,
  TwentyOneExample,
} from "../demo/src/examples/games";
import { setElementSize } from "./setup";

/**
 * The worked examples are the package's own answer to "can I build a game you
 * have not given me a component for?" — so they are exercised like components.
 *
 * The assertions that matter are the negative ones. An example rendering proves
 * nothing about the primitives unless the table's own opinions are genuinely
 * absent from it: no betting ring on a game with no betting, and no surface at
 * all on a game that is not played around one.
 */

const railOf = (container: HTMLElement) => container.querySelector(".bg-gradient-to-b.from-rail");
const noSurface = (container: HTMLElement) =>
  railOf(container) === null &&
  container.querySelector(".animate-felt-shimmer") === null &&
  container.querySelector(".animate-spotlight") === null;

const labels = (container: HTMLElement) =>
  [...container.querySelectorAll('[role="img"]')].map((el) => el.getAttribute("aria-label"));

describe("the flop example", () => {
  it("has a betting line because it declared one, and wagers on it", () => {
    setElementSize(1200, 900);
    const { container } = render(<FlopPokerExample />);

    expect(container.querySelector('[data-ring="betting-line"]')).toBeTruthy();
    expect(container.querySelectorAll('[data-part="ring"]')).toHaveLength(1);
    // three of the six seats declared a wager
    expect(container.querySelectorAll("[data-slot-index]")).toHaveLength(3);
    // and it asked for the felt decoration, so it got it
    expect(container.textContent).toContain("♠♥♦♣");
  });

  it("puts exactly the cards on the board that the street says", () => {
    // No wagers here, so every `role="img"` in the tree is a card: 12 in the six
    // seats, plus however many are on the board.
    for (const [street, cards] of [
      [0, 12],
      [3, 15],
      [4, 16],
      [5, 17],
    ] as const) {
      const { container, unmount } = render(<FlopPokerExample street={street} bets={[0, 0, 0, 0, 0, 0]} />);
      expect(container.querySelectorAll('[role="img"]'), `${street} on board`).toHaveLength(cards);
      unmount();
    }
  });

  it("puts a chip stack on the line for each seat that wagered", () => {
    const { container } = render(<FlopPokerExample bets={[0, 60, 0, 115, 240, 0]} />);
    // a ChipStack names itself "… in N chips: …"
    const stacks = [...container.querySelectorAll('[role="img"]')].filter((el) =>
      /in \d+ chips?/.test(el.getAttribute("aria-label") ?? ""),
    );
    expect(stacks).toHaveLength(3);
    // and the demo is the one that decided the radius, not the library
    expect(container.querySelector('[data-ring="betting-line"]')).toBeTruthy();
  });

  it("marks the seat on turn through Seat, not through the table", () => {
    const { container, unmount } = render(<FlopPokerExample activeSeat={3} />);
    expect(container.querySelectorAll(".animate-turn-glow").length).toBeGreaterThan(0);
    unmount();
    const idle = render(<FlopPokerExample activeSeat={null} />);
    expect(idle.container.querySelectorAll(".animate-turn-glow")).toHaveLength(0);
  });

  it("formats the stacks as big blinds, because the example asked for it", () => {
    const { container } = render(<FlopPokerExample stacks={[1000, 940, 1000, 885, 760, 1000]} />);
    expect(container.textContent).toContain("50 BB");
    expect(container.textContent).toContain("38 BB");
  });
});

describe("the shedding example", () => {
  it("draws no betting line, no slot and no felt decoration, because it declared none", () => {
    setElementSize(1200, 900);
    const { container } = render(<SheddingExample />);

    expect(container.querySelectorAll('[data-part="ring"]')).toHaveLength(0);
    expect(container.querySelectorAll('[data-part="slot"]')).toHaveLength(0);
    expect(container.textContent).not.toContain("♠♥♦♣");
    // no chips anywhere: a chip is an SVG and nothing in this example is one
    expect(container.querySelectorAll("svg")).toHaveLength(0);
    // but the table itself is still there, with a real surface
    expect(railOf(container)).toBeTruthy();
  });

  it("fits a four-player game with thirteen cards each, and names the count", () => {
    setElementSize(1200, 900);
    const { container } = render(<SheddingExample />);
    expect(container.querySelectorAll('[data-part="seat"]')).toHaveLength(4);
    // 13 cards in each of four hands, plus the three-card discard
    expect(container.querySelectorAll('[role="img"]')).toHaveLength(4 * 13 + 3);
    expect(container.textContent).toContain("13 cards");
  });

  it("takes the count from the hands it was given, not from a game rule", () => {
    const { container } = render(<SheddingExample hands={[["As"], ["Kh"], []]} />);
    expect(container.querySelectorAll('[data-part="seat"]')).toHaveLength(3);
    expect(container.textContent).toContain("1 cards");
  });
});

describe("the banking example", () => {
  it("lays the three shared positions out before anything is dealt", () => {
    const { container } = render(<BankingExample />);
    // two cards are in, the goal is still an empty, named slot
    const empty = container.querySelectorAll('[role="img"][aria-label$="not dealt"]');
    expect(empty).toHaveLength(1);
    expect(empty[0].getAttribute("aria-label")).toBe("goal, not dealt");
    expect(labels(container)).toContain("Ace of spades");
    expect(labels(container)).toContain("Queen of clubs");
  });

  it("uses one table type for four player positions and a shared middle", () => {
    setElementSize(1200, 900);
    const { container } = render(<BankingExample />);
    expect(container.querySelectorAll('[data-part="hand"]')).toHaveLength(4);
    expect(container.querySelector('[data-part="head"]')).toBeTruthy();
    // and still no felt, because the type it used has none
    expect(noSurface(container)).toBe(true);
  });

  it("shows the wager as chips and the result as a highlight and confetti", () => {
    const live = render(<BankingExample won={false} />);
    expect(live.container.querySelectorAll(".animate-confetti")).toHaveLength(0);
    expect(live.container.querySelectorAll(".animate-winner-glow")).toHaveLength(0);

    const settled = render(<BankingExample won />);
    expect(settled.container.querySelectorAll(".animate-confetti").length).toBeGreaterThan(0);
    expect(settled.container.querySelectorAll(".animate-winner-glow").length).toBeGreaterThan(0);
    // wagers are real chip stacks
    expect(settled.container.querySelectorAll("svg").length).toBeGreaterThan(0);
  });
});

describe("the twenty-one example", () => {
  it("keeps the dealer above a row of hands, with no felt anywhere", () => {
    setElementSize(1200, 900);
    const { container } = render(<TwentyOneExample />);
    expect(noSurface(container)).toBe(true);
    expect(container.querySelectorAll('[data-part="ring"]')).toHaveLength(0);
    expect(container.querySelectorAll('[data-part="slot"]')).toHaveLength(0);
    expect(container.querySelectorAll('[data-part="hand"]')).toHaveLength(3);
    expect(container.querySelector('[data-part="head"]')).toBeTruthy();
    expect(container.textContent).toContain("Dealer");
  });

  it("hides the hole card until the round is settled", () => {
    const live = render(<TwentyOneExample dealer={["As", "9d"]} dealerHidden />);
    expect(labels(live.container).slice(0, 2)).toEqual(["Ace of spades", "face-down card"]);

    const settled = render(<TwentyOneExample dealer={["As", "9d"]} dealerHidden={false} />);
    expect(labels(settled.container).slice(0, 2)).toEqual(["Ace of spades", "Nine of diamonds"]);
  });

  it("represents every hand that is actually there — a split adds positions", () => {
    for (const n of [1, 2, 3]) {
      const { container, unmount } = render(
        <TwentyOneExample hands={Array.from({ length: n }, (_, i) => ({ cards: ["10h"], label: `H${i}` }))} />,
      );
      expect(container.querySelectorAll('[data-part="hand"]'), `${n} hands`).toHaveLength(n);
      unmount();
    }
  });

  it("does not depend on a game-specific table component", () => {
    // The acid test, from the consumer's side: this is the same three lines a
    // client writes, and the deliverable is a game with no library component
    // named after it.
    const { container } = render(<TwentyOneExample />);
    expect(container.querySelectorAll('[data-part="seat"]')).toHaveLength(0);
    expect(noSurface(container)).toBe(true);
  });
});

describe("the gallery", () => {
  it("renders all four games together without a game-specific table anywhere", () => {
    setElementSize(1200, 900);
    const { container } = render(<GameGallery />);
    // four games, three table types, one of them used twice
    expect(container.querySelector('[data-ring="betting-line"]')).toBeTruthy();
    expect(container.querySelectorAll('[data-part="head"]')).toHaveLength(2);
    expect(container.querySelectorAll('[data-part="seat"]').length).toBeGreaterThan(4);
    expect(container.textContent).toContain("13 cards");
    expect(container.textContent).toContain("Dealer");
  });
});
