import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import {
  CardBack,
  CommunityCards,
  HoleCards,
  PlayingCard,
  getSuitSymbol,
  parseCard,
} from "../src/components/PlayingCard";

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

describe("HoleCards", () => {
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

describe("CommunityCards", () => {
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
