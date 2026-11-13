import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { CardBack, CardRow, CardSlot, PlayingCard } from "../src/components/PlayingCard";
import { getSuitSymbol, parseCard } from "../src/cards";
import { CARD_HEIGHT, CARD_WIDTH } from "../src/cardSize";

/**
 * A row or fan of cards the way a caller composes one: children, one per
 * position. The container arranges them and nothing else, so the cards have to be
 * written out — which is the point of the API, and makes these tests read like the
 * call sites do.
 */
const cardsOf = (codes: (string | null)[], size: "xs" | "sm" | "md" | "lg" = "md") =>
  codes.map((code, i) => <PlayingCard key={`${i}:${code ?? "back"}`} card={code} size={size} />);

describe("an arced row", () => {
  it("is a flat row at arc 0, and splays when given an arc", () => {
    // `arc` defaults to 0, which is a row: nothing may be rotated or given a pivot
    // it does not use.
    const flat = render(<CardRow arc={0}>{cardsOf(["As", "Kh", "Qd"])}</CardRow>).container;
    expect(flat.querySelector("[style*='transform-origin']")).toBeNull();

    // arc 60 over three cards is -30 / 0 / +30, so the middle card stays flat and
    // the outer two pivot about a point below the row — a held hand.
    const fanned = render(<CardRow arc={60}>{cardsOf(["As", "Kh", "Qd"])}</CardRow>).container;
    expect(fanned.querySelectorAll("[style*='transform-origin']")).toHaveLength(2);
    expect(fanned.querySelectorAll("[style*='rotate(-30deg)']")).toHaveLength(1);
    expect(fanned.querySelectorAll("[style*='rotate(30deg)']")).toHaveLength(1);
  });

  it("leaves a single card flat even in an arc — there is nothing to splay it against", () => {
    const one = render(<CardRow arc={90}>{cardsOf(["As"])}</CardRow>).container;
    expect(one.querySelector("[style*='transform-origin']")).toBeNull();
    expect(one.querySelector("[style*='rotate(']")).toBeNull();
  });

  it("keeps the arc while the row is dealt in: the turn gets its own layer", () => {
    // The arrival animates `transform`, and the arc *is* a `transform` — on one
    // element the animation wins and flattens the arc, so the row nests them.
    const { container } = render(<CardRow arc={60}>{cardsOf(["As", "Kh", "Qd"])}</CardRow>);
    const arced = container.querySelector("[style*='rotate(-30deg)']") as HTMLElement;
    expect(arced.parentElement?.className).toContain("animate-deal-in");
  });

  it("tucks each card under the one before it when given an overlap", () => {
    const { container } = render(
      <CardRow enter={false} overlap={20}>
        {cardsOf(["As", "Kh", "Qd"])}
      </CardRow>,
    );
    const wrappers = [...(container.firstElementChild as HTMLElement).children] as HTMLElement[];
    expect(wrappers.map((el) => el.style.marginInlineStart)).toEqual(["", "-20px", "-20px"]);
    // and the overlap replaces the row's gap rather than adding to it
    expect(container.firstElementChild?.className).toContain("gap-0");
    expect(container.firstElementChild?.className).not.toContain("gap-2");
  });
});

describe("parseCard", () => {
  it("splits a compact card code into rank + suit", () => {
    expect(parseCard("As")).toEqual({ rank: "A", suit: "s" });
    expect(parseCard("10h")).toEqual({ rank: "10", suit: "h" });
    expect(parseCard("kd")).toEqual({ rank: "k", suit: "d" });
    expect(parseCard("2c")).toEqual({ rank: "2", suit: "c" });
  });

  it("returns empty parts for short input", () => {
    expect(parseCard("")).toEqual({ rank: "", suit: "" });
    expect(parseCard("A")).toEqual({ rank: "", suit: "" });
  });

  // NOTE: intentionally permissive. Junk like "xyz" parses as rank "xy" / suit
  // "z" and renders the raw "z". Validation is a known open gap (audit #11).
  it("does not validate, it only splits", () => {
    expect(parseCard("xyz")).toEqual({ rank: "xy", suit: "z" });
  });
});

describe("getSuitSymbol", () => {
  it("maps the four suits", () => {
    expect(getSuitSymbol("s")).toBe("♠");
    expect(getSuitSymbol("h")).toBe("♥");
    expect(getSuitSymbol("d")).toBe("♦");
    expect(getSuitSymbol("c")).toBe("♣");
  });

  it("passes unknown suits through", () => {
    expect(getSuitSymbol("z")).toBe("z");
    expect(getSuitSymbol("")).toBe("");
  });
});

describe("PlayingCard", () => {
  it("renders the rank and the suit symbol, red for hearts/diamonds", () => {
    const { container } = render(<PlayingCard card="Ah" size="md" />);
    expect(container.textContent).toContain("A");
    expect(container.textContent).toContain("♥");
    expect(container.querySelector(".text-red-600")).not.toBeNull();
    expect(container.querySelector(".text-neutral-900")).toBeNull();
  });

  it("uses black for spades and clubs", () => {
    const { container } = render(<PlayingCard card="Ks" size="md" />);
    expect(container.querySelector(".text-neutral-900")).not.toBeNull();
    expect(container.querySelector(".text-red-600")).toBeNull();
  });

  it("renders a card back for null, at every size", () => {
    for (const size of ["xs", "sm", "md", "lg"] as const) {
      const card = render(<PlayingCard card={null} size={size} />);
      const back = render(<CardBack size={size} />);
      // The same art CardBack draws, one layer down: the card's own box holds it
      // as the far side, behind the card's own name rather than as its own image.
      const side = card.container.querySelector('[aria-hidden="true"]') as HTMLElement;
      const art = side.firstElementChild as HTMLElement;
      const backArt = back.container.firstElementChild as HTMLElement;
      expect(art.getAttribute("class")).toBe(backArt.getAttribute("class"));
      expect(art.innerHTML).toBe(backArt.innerHTML);
      expect(card.container.textContent).toBe("");
    }
  });
});

describe("cards announce themselves", () => {
  it("names the card instead of reading out its fragments", () => {
    const face = render(<PlayingCard card="As" size="md" />);
    expect(face.container.querySelector('[role="img"]')?.getAttribute("aria-label")).toBe("Ace of spades");
    const small = render(<PlayingCard card="10h" size="sm" />);
    expect(small.container.querySelector('[role="img"]')?.getAttribute("aria-label")).toBe("Ten of hearts");
  });

  it("lets the caller override the name, and forwards it to the back", () => {
    expect(
      render(<PlayingCard card="As" label="the river card" />).container
        .querySelector('[role="img"]')
        ?.getAttribute("aria-label"),
    ).toBe("the river card");
    expect(
      render(<PlayingCard card={null} label="opponent 1" />).container
        .querySelector('[role="img"]')
        ?.getAttribute("aria-label"),
    ).toBe("opponent 1");
  });

  it("names a face-down card by default", () => {
    expect(render(<CardBack />).container.querySelector('[role="img"]')?.getAttribute("aria-label")).toBe(
      "face-down card",
    );
  });

  it("does not pretend to know a card code it cannot read", () => {
    expect(
      render(<PlayingCard card="xyz" />).container.querySelector('[role="img"]')?.getAttribute("aria-label"),
    ).toBe("xyz");
  });
});

describe("CardRow enter=deal", () => {
  it("staggers the deal animation across the row", () => {
    const { container } = render(<CardRow enter="deal">{cardsOf(["As", "Kh"])}</CardRow>);
    const wrappers = container.querySelectorAll(".animate-deal-in");
    expect(wrappers).toHaveLength(2);
    expect((wrappers[0] as HTMLElement).style.animationDelay).toBe("0ms");
    expect((wrappers[1] as HTMLElement).style.animationDelay).toBe("100ms");
  });

  it("can turn the deal animation off", () => {
    const { container } = render(<CardRow enter={false}>{cardsOf(["As", "Kh"])}</CardRow>);
    expect(container.querySelectorAll(".animate-deal-in")).toHaveLength(0);
  });

  it("renders face-down cards for null codes", () => {
    const { container } = render(<CardRow enter="deal">{cardsOf([null, null])}</CardRow>);
    expect(container.textContent).toBe("");
    expect(container.querySelectorAll("svg")).toHaveLength(2);
  });
});

describe("CardRow — a row arranges, a card turns over", () => {
  it("holds a position open when the caller says so", () => {
    const { container } = render(
      <CardRow enter={false}>
        {cardsOf(["Ah", "Kd"])}
        <CardSlot />
        <CardSlot />
      </CardRow>,
    );
    // A board is five positions from the first hand: two cards and two slots are
    // four positions, and the row is that wide because it was given that many.
    expect(container.firstElementChild?.children).toHaveLength(4);
    expect(container.querySelectorAll('[role="img"]')).toHaveLength(4);
    // the two slots say they are empty rather than naming a card
    expect(container.querySelectorAll('[aria-label="empty card slot"]')).toHaveLength(2);
  });

  it("is exactly as wide as the children it was given", () => {
    const { container } = render(<CardRow enter={false}>{cardsOf(["Ah", "Kd", "7c"])}</CardRow>);
    expect(container.firstElementChild?.children).toHaveLength(3);
  });

  it("has no flip of its own: the turn is the card's", () => {
    // The row used to take animation="flip". It cannot turn a card over — it does
    // not hold both sides of one — so the class never appears on a row now.
    for (const container of [
      render(<CardRow>{cardsOf(["Ah", "Kd"])}</CardRow>).container,
      render(
        <CardRow enter={false}>
          {cardsOf(["Ah", null])}
        </CardRow>,
      ).container,
    ]) {
      expect(container.querySelectorAll(".animate-card-flip")).toHaveLength(0);
    }
  });
});

describe("CardRow — one primitive, one channel", () => {
  it("renders whatever cards it is handed", () => {
    expect(
      render(
        <CardRow enter={false}>
          {cardsOf(["As", "Kh"])}
        </CardRow>,
      ).container.querySelectorAll('[role="img"]'),
    ).toHaveLength(2);
  });

  it("animates a hand by sliding, and not at all on request", () => {
    const dealt = render(<CardRow enter="deal">{cardsOf(["As", "Kh"])}</CardRow>).container;
    expect(dealt.querySelectorAll(".animate-deal-in")).toHaveLength(2);

    const still = render(<CardRow enter={false}>{cardsOf(["As", "Kh"])}</CardRow>).container;
    expect(still.querySelectorAll(".animate-deal-in, .animate-card-flip")).toHaveLength(0);
  });

  it("draws a null code face down, and an empty position is the caller's CardSlot", () => {
    const { container } = render(
      <CardRow enter={false}>
        {cardsOf(["As", null])}
        <CardSlot />
      </CardRow>,
    );
    // three positions: a face-up card, a card back, and a slot holding nothing
    expect(container.firstElementChild?.children).toHaveLength(3);
    expect(container.querySelectorAll("svg")).toHaveLength(1); // the back's rosette
    expect(container.textContent).toContain("A");
  });

  it("skips a child that is not there", () => {
    const { container } = render(
      <CardRow enter={false}>
        {["As", "Kh", "Qd"].map((code, i) => i < 2 && <PlayingCard key={code} card={code} />)}
      </CardRow>,
    );
    // `false` from a conditional is not a position: two cards, two entries
    expect(container.firstElementChild?.children).toHaveLength(2);
    expect(container.querySelectorAll('[role="img"]')).toHaveLength(2);
  });

  it("takes its gap from the class, so a caller can change it", () => {
    const { container } = render(
      <CardRow enter={false} className="gap-4">
        {cardsOf(["As", "Kh"])}
      </CardRow>,
    );
    // `cn` resolves the conflict: the caller's gap-4 is what ships
    expect(container.firstElementChild?.className).toContain("gap-4");
    expect(container.firstElementChild?.className).not.toContain("gap-2");
  });

  it("replays the entrance for an unchanged row when enterKey changes", () => {
    const { container, rerender } = render(<CardRow enterKey={1}>{cardsOf(["As", "Kh"])}</CardRow>);
    const first = container.querySelector(".animate-deal-in") as HTMLElement;
    rerender(<CardRow enterKey={2}>{cardsOf(["As", "Kh"])}</CardRow>);
    // a new key is a new element, so the CSS animation restarts
    expect(container.querySelector(".animate-deal-in")).not.toBe(first);
  });

  it("re-enters a position whose own key changed", () => {
    const hand = (codes: string[]) => codes.map((code) => <PlayingCard key={code} card={code} />);
    const { container, rerender } = render(<CardRow>{hand(["As", "Kh"])}</CardRow>);
    const before = [...container.querySelectorAll(".animate-deal-in")];
    rerender(<CardRow>{hand(["Qd", "Kh"])}</CardRow>);
    const after = [...container.querySelectorAll(".animate-deal-in")];
    expect(after[0], "a card that changed arrives again").not.toBe(before[0]);
    expect(after[1], "one that did not is left alone").toBe(before[1]);
  });
});

describe("PlayingCard revealed", () => {
  it("keeps a hidden card out of the DOM, code and name alike", () => {
    const { container } = render(<PlayingCard card="As" revealed={false} />);
    const img = container.querySelector('[role="img"]') as HTMLElement;
    expect(img.getAttribute("aria-label")).toBe("face-down card");
    // nothing of the card is rendered: no rank, no suit, no name
    expect(img.textContent).toBe("");
    expect(container.innerHTML).not.toContain("As");
    expect(container.querySelectorAll("svg")).toHaveLength(1); // the back's rosette
  });

  it("shows the face by default, and the back for a null", () => {
    expect(render(<PlayingCard card="As" />).container.textContent).toContain("A");
    expect(render(<PlayingCard card="As" />).container.querySelectorAll("svg")).toHaveLength(0);
    expect(render(<PlayingCard card={null} />).container.querySelectorAll("svg")).toHaveLength(1);
  });

  it("turns over on a flipKey, and only while the face is showing", () => {
    // no key: a card that arrives face up simply appears
    expect(render(<PlayingCard card="As" />).container.querySelectorAll(".animate-card-flip")).toHaveLength(0);

    // a key: the card turns, so the back is there for it to turn from
    const turning = render(<PlayingCard card="As" flipKey="hand-1" />).container;
    expect(turning.querySelectorAll(".animate-card-flip")).toHaveLength(1);
    expect(turning.querySelectorAll("svg")).toHaveLength(1);

    // a key on a hidden card has no side to turn to, so nothing turns
    const hidden = render(<PlayingCard card="As" revealed={false} flipKey="hand-1" />).container;
    expect(hidden.querySelectorAll(".animate-card-flip")).toHaveLength(0);
  });

  it("replays the turn when the key changes, like a re-dealt hand", () => {
    const { container, rerender } = render(<PlayingCard card="As" flipKey={1} />);
    const first = container.querySelector(".animate-card-flip");
    rerender(<PlayingCard card="As" flipKey={2} />);
    // a new key is a new element, so the CSS animation restarts
    expect(container.querySelector(".animate-card-flip")).not.toBe(first);
  });

  it("is announced once, whichever side is showing", () => {
    const turning = render(<PlayingCard card="As" flipKey={1} />).container;
    const announced = [...turning.querySelectorAll('[role="img"]')].filter(
      (el) => el.closest('[aria-hidden="true"]') === null,
    );
    // the back is a CardBack, one layer down and behind aria-hidden
    expect(announced).toHaveLength(1);
    expect(announced[0].getAttribute("aria-label")).toBe("Ace of spades");
  });
});

describe("CardSlot", () => {
  it("reserves a card-sized position with nothing in it", () => {
    const { container } = render(<CardSlot />);
    const slot = container.firstElementChild as HTMLElement;
    expect(slot.style.width).toBe(`${CARD_WIDTH.md}px`);
    expect(slot.style.height).toBe(`${CARD_HEIGHT.md}px`);
    expect(slot.getAttribute("aria-label")).toBe("empty card slot");
    expect(container.textContent).toBe("");
  });

  it("names itself by what is in it when it is filled", () => {
    const { container } = render(
      <CardSlot>
        <PlayingCard card="As" />
      </CardSlot>,
    );
    expect(container.querySelector('[role="img"]')?.getAttribute("aria-label")).toBe("Ace of spades");
  });

  it("draws every card of a large hand, however tight it is pulled together", () => {
    const cards = ["As", "Kh", "Qd", "Jc", "10s", "9h", "8d", "7c", "6s", "5h", "4d", "3c", "2s"];
    const { container } = render(
      <CardRow enter={false} overlap={CARD_WIDTH.sm * 0.6}>
        {cardsOf(cards, "sm")}
      </CardRow>,
    );
    expect((container.firstElementChild as HTMLElement).children).toHaveLength(cards.length);
    // every card is still rendered, just tucked under its neighbour
    expect(container.querySelectorAll('[role="img"]')).toHaveLength(cards.length);
  });
});

describe("naming a group of cards", () => {
  // A row or a fan is a group of cards that belong together, and nothing said so:
  // a screen reader got a string of images with no idea they were one hand. The
  // name is opt-in, because *what* a row is belongs to the caller's game.
  it("groups a CardRow under its label, and adds no role without one", () => {
    const named = render(<CardRow label="Your hand">{cardsOf(["As", "Kh"])}</CardRow>).container;
    expect(named.querySelector('[role="group"]')?.getAttribute("aria-label")).toBe("Your hand");
    expect(render(<CardRow>{cardsOf(["As", "Kh"])}</CardRow>).container.querySelector('[role="group"]')).toBeNull();
  });

  it("lets an empty position say that it is one", () => {
    const { container } = render(
      <CardRow>
        {cardsOf(["As"])}
        <CardSlot />
      </CardRow>,
    );
    // a slot holding nothing announces itself as an empty position
    expect(container.querySelector('[aria-label="empty card slot"]')).not.toBeNull();
    // while the card itself is announced as the card: two images, one of each kind
    expect(container.querySelectorAll('[role="img"]')).toHaveLength(2);
    expect(container.querySelector('[aria-label="Ace of spades"]')).not.toBeNull();
  });
});
