import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import {
  CardBack,
  CardFan,
  CardRow,
  CardSlot,
  CommunityCards,
  HoleCards,
  PlayingCard,
  getSuitSymbol,
  parseCard,
} from "../src/components/PlayingCard";
import { CARD_HEIGHT, CARD_WIDTH } from "../src/cardSize";

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
      expect(card.container.innerHTML).toBe(back.container.innerHTML);
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

describe("HoleCards (deprecated wrapper over CardRow)", () => {
  it("renders one wrapper per card and staggers the deal animation", () => {
    const { container } = render(<HoleCards cards={["As", "Kh"]} size="sm" />);
    const wrappers = container.querySelectorAll(".animate-deal-in");
    expect(wrappers).toHaveLength(2);
    expect((wrappers[0] as HTMLElement).style.animationDelay).toBe("0ms");
    expect((wrappers[1] as HTMLElement).style.animationDelay).toBe("100ms");
  });

  it("can turn the deal animation off", () => {
    const { container } = render(<HoleCards cards={["As", "Kh"]} deal={false} />);
    expect(container.querySelectorAll(".animate-deal-in")).toHaveLength(0);
  });

  it("renders face-down placeholders for null cards", () => {
    const { container } = render(<HoleCards cards={[null, null]} size="sm" />);
    expect(container.textContent).toBe("");
    expect(container.querySelectorAll("svg")).toHaveLength(2);
  });
});

describe("CommunityCards (deprecated wrapper over CardRow)", () => {
  it("reserves fixed slots so the row width never changes", () => {
    const { container } = render(<CommunityCards cards={["Ah", "Kd"]} size="md" slots={5} />);
    // 5 slots, 2 filled -> 3 empty placeholders keep the row width stable
    expect(container.firstElementChild?.children).toHaveLength(5);
    expect(container.querySelectorAll(".animate-card-flip")).toHaveLength(2);
  });

  it("defaults the slot count to the number of cards", () => {
    const { container } = render(<CommunityCards cards={["Ah", "Kd", "7c"]} />);
    expect(container.firstElementChild?.children).toHaveLength(3);
  });

  it("stagger-flips in order and can be turned off", () => {
    const { container } = render(<CommunityCards cards={["Ah", "Kd", "7c"]} animated />);
    const flips = container.querySelectorAll(".animate-card-flip");
    expect([...flips].map((f) => (f as HTMLElement).style.animationDelay)).toEqual(["0ms", "70ms", "140ms"]);
    expect(render(<CommunityCards cards={["Ah"]} animated={false} />).container.querySelectorAll(".animate-card-flip")).toHaveLength(0);
  });
});

describe("CardRow — one primitive, one animation prop", () => {
  it("is the same component the two old names wrap", () => {
    expect(render(<CardRow cards={["As", "Kh"]} animation={false} />).container.querySelectorAll('[role="img"]')).toHaveLength(2);
  });

  it("animates a hand by sliding and a board by flipping, on request", () => {
    const dealt = render(<CardRow cards={["As", "Kh"]} animation="deal" />).container;
    expect(dealt.querySelectorAll(".animate-deal-in")).toHaveLength(2);
    expect(dealt.querySelectorAll(".animate-card-flip")).toHaveLength(0);

    const flipped = render(<CardRow cards={["As", "Kh"]} animation="flip" />).container;
    expect(flipped.querySelectorAll(".animate-card-flip")).toHaveLength(2);

    const still = render(<CardRow cards={["As", "Kh"]} animation={false} />).container;
    expect(still.querySelectorAll(".animate-deal-in, .animate-card-flip")).toHaveLength(0);
  });

  it("treats a null inside the array as a face-down card, and past the end as undealt", () => {
    const { container } = render(<CardRow cards={["As", null]} slots={4} size="sm" />);
    // 2 cards (one face down) + 2 undealt positions that still hold the width
    expect(container.firstElementChild?.children).toHaveLength(4);
    expect(container.querySelectorAll("svg")).toHaveLength(1);
  });

  it("can render a null as an empty position instead — the old CommunityCards rule", () => {
    const { container } = render(<CardRow cards={["As", null]} placeholder="empty" />);
    expect(container.querySelectorAll("svg")).toHaveLength(0);
  });

  it("replays the animation for an unchanged row when animationKey changes", () => {
    const { container, rerender } = render(<CardRow cards={["As", "Kh"]} animationKey={1} />);
    const first = container.querySelector(".animate-deal-in") as HTMLElement;
    rerender(<CardRow cards={["As", "Kh"]} animationKey={2} />);
    // a new key is a new element, so the CSS animation restarts
    expect(container.querySelector(".animate-deal-in")).not.toBe(first);
  });
});

describe("CardSlot and CardFan", () => {
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

  it("overlaps a large hand into something narrower than the cards laid flat", () => {
    const cards = ["As", "Kh", "Qd", "Jc", "10s", "9h", "8d", "7c", "6s", "5h", "4d", "3c", "2s"];
    const { container } = render(<CardFan cards={cards} size="sm" overlap={0.6} />);
    const row = container.firstElementChild as HTMLElement;
    const flat = cards.length * CARD_WIDTH.sm;
    expect(parseFloat(row.style.width)).toBeLessThan(flat);
    expect(row.children).toHaveLength(cards.length);
    // every card is still rendered, just tucked under its neighbour
    expect(container.querySelectorAll('[role="img"]')).toHaveLength(cards.length);
  });

  it("splays the fan when given an arc, and stays flat at arc 0", () => {
    const flat = render(<CardFan cards={["As", "Kh", "Qd"]} arc={0} />).container;
    expect([...flat.querySelectorAll("div")].some((d) => (d as HTMLElement).style.transform.includes("rotate"))).toBe(false);

    const fanned = render(<CardFan cards={["As", "Kh", "Qd"]} arc={24} />).container;
    const rotated = [...fanned.querySelectorAll("div")].filter((d) =>
      (d as HTMLElement).style.transform.includes("rotate"),
    );
    // the middle card of three sits at the centre of the arc, so only the two
    // outer ones are rotated
    expect(rotated).toHaveLength(2);
  });
});
