import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import {
  CardRow,
  CardTable,
  Counter,
  FIT_BLEED,
  MAX_TEXT_SCALE,
  MIN_TEXT_PX,
  PlayingCard,
  Seat,
  cardSizeFor,
  contrastRatio,
  readableScale,
  useDesignScale,
} from "../src/index";
import { ChipStack, PILE_HEIGHT } from "../src/wager";
import { setElementSize } from "./setup";

/**
 * What a player can actually read, at the size the table is actually drawn.
 *
 * Every test here was a measurement first: a betting line at 1.2:1 against the
 * felt, a nameplate drawn at 3px on a phone, a bubble cut off by the box it was
 * drawn in, a winner and a current player drawn in the same gold. The fixes are
 * only fixed while something holds them, which is what this file is.
 */

// Read by path rather than by URL: this file runs in jsdom, where `import.meta.url`
// is an http URL and not a file one. Vitest's cwd is the package root.
const STYLES = readFileSync("src/styles.css", "utf8");

/** A `@theme` token's value, read out of the stylesheet. */
function token(name: string): string {
  const match = new RegExp(`^\\s*${name}:\\s*([^;]+);`, "m").exec(STYLES);
  if (!match) throw new Error(`${name} is not in styles.css`);
  return match[1].trim();
}

const scaleIn = (el: HTMLElement): number => {
  const match = /scale\(([\d.]+)\)/.exec(el.style.transform);
  return match ? Number(match[1]) : 1;
};

describe("a declared ring is visible on the felt it is drawn on", () => {
  it("keeps the line at 3:1 or better against both ends of the felt gradient", () => {
    const line = token("--color-line");
    // 1.2:1 was the old `border-white/10`, which is not a line anybody could see.
    for (const felt of ["--color-felt", "--color-felt-light", "--color-felt-dark"]) {
      const ratio = contrastRatio(line, token(felt));
      expect(ratio, `${line} on ${token(felt)}`).not.toBeNull();
      expect(ratio as number, `${line} on ${token(felt)}`).toBeGreaterThanOrEqual(3);
    }
  });

  it("draws the outline of every declared ring with that token", () => {
    const { container } = render(
      <CardTable seatCount={3} rings={[{ id: "betting-line", radius: 0.72 }]} renderSeat={() => null} />,
    );
    const ring = container.querySelector('[data-ring="betting-line"]') as HTMLElement;
    expect(ring.className).toContain("border-line");
  });
});

describe("text has a floor under the design box's scale", () => {
  it("leaves text alone at the floor or above it", () => {
    expect(readableScale(1, 11, 10)).toBe(1);
    expect(readableScale(2, 11, 10)).toBe(1);
  });

  it("scales text back up to the floor, and no further than the cap", () => {
    // 11px at 0.602 is 6.6px: the docs' own desktop figure.
    expect(readableScale(0.602, 11, 10) * 11 * 0.602).toBeCloseTo(10, 6);
    // a phone: 3px, and the ceiling is what stops it from becoming absurd
    expect(readableScale(0.277, 11, 10)).toBe(MAX_TEXT_SCALE);
    expect(readableScale(0.01, 11, 10)).toBe(MAX_TEXT_SCALE);
  });

  it("is off when the caller asks for nothing, and sane about nonsense", () => {
    expect(readableScale(0.5, 11, 0)).toBe(1);
    expect(readableScale(0.5, 11, -4)).toBe(1);
    expect(readableScale(0, 11, 10)).toBe(1);
    expect(readableScale(Number.NaN, 11, 10)).toBe(1);
    expect(readableScale(0.5, 0, 10)).toBe(1);
  });
});

describe("a seat keeps its name legible and its floats inside the table", () => {
  /** The row whose text is compensated: the header the caller passed. */
  const headerRow = (container: HTMLElement, text: string): HTMLElement => {
    const content = [...container.querySelectorAll("span")].find((el) => el.textContent === text) as HTMLElement;
    return content.parentElement as HTMLElement;
  };
  const seatInTable = (container: HTMLElement) => container.querySelector("[data-state]") as HTMLElement;

  it("compensates a seat's own rows for the scale the table is drawn at", () => {
    setElementSize(600, 450); // half the design box
    const { container } = render(
      <CardTable
        seatCount={2}
        renderSeat={(i, box) => (
          <Seat width={box.width} height={box.height} header={<span>Seat {i}</span>} footer={<span>50 BB</span>} />
        )}
      />,
    );
    for (const text of ["Seat 0", "50 BB"]) {
      const row = headerRow(container, text);
      const onScreen = 11 * 0.5 * scaleIn(row);
      expect(onScreen, `${text} on screen`).toBeGreaterThanOrEqual(MIN_TEXT_PX - 0.001);
    }
    // and the frame itself is still drawn at the table's scale — geometry is not
    // compensated, only the ink
    expect(seatInTable(container).style.width).toBe("160px");
  });

  it("leaves a seat drawn at 1:1 exactly as it was", () => {
    setElementSize(1600, 1200); // bigger than the design box: never scaled up
    const { container } = render(<Seat header={<span>Seat 3</span>} />);
    expect(headerRow(container, "Seat 3").style.transform).toBe("");
  });

  it("can be switched off, per seat", () => {
    setElementSize(600, 450);
    const { container } = render(<Seat minTextPx={0} header={<span>Seat 3</span>} />);
    expect(headerRow(container, "Seat 3").style.transform).toBe("");
  });

  it("hangs its floats off the frame by a fraction of it, so a shrunk frame keeps them tight", () => {
    const floatTop = (height: number) => {
      const { container } = render(<Seat height={height} topLeft={<i className="tl" />} />);
      return (container.querySelector(".tl") as HTMLElement).parentElement!.style.top;
    };
    // the default frame: exactly the px these used to be hard-coded to
    expect(floatTop(176)).toBe("-12px");
    // a sixteen-seat ring's frame: proportionally tight instead of most of the seat
    expect(floatTop(88)).toBe("-6px");
  });

  it("anchors the bubble to the frame's edge rather than to a fixed offset above it", () => {
    const { container } = render(<Seat above={<i className="ab" />} />);
    const holder = (container.querySelector(".ab") as HTMLElement).parentElement!.parentElement as HTMLElement;
    // attached to the top edge whatever height the bubble is, rather than
    // floating 48px above it and needing exactly that much room
    expect(holder.className).toContain("bottom-full");
    expect(holder.className).not.toContain("-top-12");
    expect(holder.style.marginBottom).toBe("5px"); // 3% of the default 176px frame
  });
});

describe("the box a table is drawn in stops cutting its decorations off", () => {
  it("clips with a margin, so a declared float is drawn", () => {
    setElementSize(600, 450);
    const { container } = render(<CardTable seatCount={2} renderSeat={() => null} />);
    const outer = container.firstElementChild as HTMLElement;
    expect(outer.style.overflow).toBe("clip");
    expect(outer.style.overflowClipMargin).toBe(`${FIT_BLEED}px`);
  });

  it("publishes the scale it is drawing at, so anything inside can read it", () => {
    setElementSize(600, 450);
    const { container } = render(
      <CardTable
        seatCount={1}
        center={<ScaleProbe />}
        renderSeat={(i, box) => <Seat width={box.width} height={box.height} header={<span>Seat {i}</span>} />}
      />,
    );
    expect(container.querySelector("[data-scale]")?.getAttribute("data-scale")).toBe("0.5");
  });
});

/** Reads the design scale the way a caller's own content would. */
function ScaleProbe() {
  return <span data-scale={useDesignScale()} />;
}

describe("a current seat and a winning seat are not the same drawing", () => {
  const seat = (props: { isActive?: boolean; isWinner?: boolean }) =>
    render(<Seat width={160} height={176} {...props} />);

  it("marks the state, in the DOM and for anyone reading it", () => {
    expect((seat({ isActive: true }).container.querySelector("[data-state]") as HTMLElement).dataset.state).toBe("active");
    expect((seat({ isWinner: true }).container.querySelector("[data-state]") as HTMLElement).dataset.state).toBe("winner");
    expect((seat({}).container.querySelector("[data-state]") as HTMLElement).dataset.state).toBe("idle");
    expect((seat({ isActive: true }).container.querySelector("[aria-current]") as HTMLElement).getAttribute("aria-current")).toBe("true");
    expect(seat({ isWinner: true }).container.querySelector("[aria-current]")).toBeNull();
  });

  it("gives the winner a heavier border, a gold wash and a second outline the current seat does not have", () => {
    const winner = seat({ isWinner: true }).container.querySelector("[data-state]") as HTMLElement;
    const active = seat({ isActive: true }).container.querySelector("[data-state]") as HTMLElement;

    expect(winner.className).toContain("border-[3px]");
    expect(winner.className).toContain("bg-gold/10");
    expect(winner.querySelector('span[aria-hidden="true"]')).not.toBeNull();

    expect(active.className).toContain("border-2");
    expect(active.className).not.toContain("bg-gold/10");
    expect(active.querySelector('span[aria-hidden="true"]')).toBeNull();
    // both still carry the gold, and the animations the docs promise
    expect(active.className).toContain("animate-turn-glow");
    expect(winner.className).toContain("animate-winner-glow");
  });

  it("names a seat when the caller gives it a name", () => {
    const named = render(<Seat label="Seat 3" />).container.firstElementChild as HTMLElement;
    const frame = named.querySelector("[data-state]") as HTMLElement;
    expect(frame.getAttribute("role")).toBe("group");
    expect(frame.getAttribute("aria-label")).toBe("Seat 3");

    const clickable = render(<Seat label="Sit here" onClick={() => {}} />).container.querySelector(
      "[data-state]",
    ) as HTMLElement;
    expect(clickable.getAttribute("role")).toBe("button");
    expect(clickable.getAttribute("aria-label")).toBe("Sit here");
  });
});

describe("a counter inside a table is legible too", () => {
  it("announces the settled amount rather than the count-up", () => {
    const { container } = render(<Counter amount={240} label="Main" animate={false} />);
    const live = container.querySelector('[aria-live="polite"]') as HTMLElement;
    expect(live.textContent).toBe("Main: 240");
    // and the animated half stays out of the announcement
    expect(container.querySelector("[data-counter-value]")?.getAttribute("aria-hidden")).toBe("true");
  });

  it("is compensated for the table's scale, unless asked not to be", () => {
    setElementSize(600, 450);
    const { container } = render(
      <CardTable seatCount={1} renderSeat={() => null} center={<Counter amount={240} animate={false} />} />,
    );
    const root = container.querySelector('[aria-live="polite"]')!.parentElement!.parentElement as HTMLElement;
    expect(14 * 0.5 * scaleIn(root)).toBeGreaterThanOrEqual(MIN_TEXT_PX - 0.001);
  });
});

describe("a card size that belongs in the frame it is drawn in", () => {
  it("sizes the default seat's cards to the default seat", () => {
    // 160x176 with two cards: `md` fits, and `sm` is what left the frame empty
    expect(cardSizeFor({ width: 160, height: 176 }, 2)).toBe("md");
    expect(cardSizeFor({ width: 160, height: 176 }, 1)).toBe("md");
  });

  it("shrinks with a ring that shrinks its frames, and never returns nothing", () => {
    expect(cardSizeFor({ width: 126, height: 139 }, 2)).toBe("sm");
    expect(cardSizeFor({ width: 80, height: 88 }, 2)).toBe("xs");
    expect(cardSizeFor({ width: 10, height: 10 }, 2)).toBe("xs");
  });

  it("gives a roomy frame the biggest card that fits it", () => {
    expect(cardSizeFor({ width: 400, height: 300 }, 2)).toBe("lg");
    // a thirteen-card hand does not fit at any size flat: the smallest is the floor
    expect(cardSizeFor({ width: 160, height: 176 }, 13)).toBe("xs");
  });
});

describe("a big bet is a pile of chips, not one tall tower", () => {
  const columns = (container: HTMLElement) =>
    (container.querySelector('[aria-hidden="true"]') as HTMLElement).children.length;

  it("cuts the stack into columns of at most PILE_HEIGHT", () => {
    // 1,000 in chip units is ten black chips: two columns of five, not a tower
    const pile = render(<ChipStack amount={1000} layout="pile" />).container;
    expect(columns(pile)).toBe(10 / PILE_HEIGHT);
    const tall = (pile.querySelector('[aria-hidden="true"]') as HTMLElement).firstElementChild as HTMLElement;
    expect(tall.children.length).toBe(PILE_HEIGHT);
  });

  it("leaves the default one tower alone", () => {
    const stack = render(<ChipStack amount={1000} />).container;
    expect(columns(stack)).toBe(1);
  });

  it("says the same thing to a screen reader either way", () => {
    const label = (el: HTMLElement) => el.querySelector('[role="img"]')?.getAttribute("aria-label");
    const at = (layout: "stack" | "pile") => render(<ChipStack amount={1000} layout={layout} />).container;
    expect(label(at("pile"))).toBe(label(at("stack")));
    expect(label(at("pile"))).toContain("1000");
  });
});

describe("the four-colour deck carries the suit without hue alone", () => {
  /** Every class the card drew with — the ink is on the inner index, not the frame. */
  const suitClass = (card: string, fourColor: boolean) =>
    render(<PlayingCard card={card} fourColor={fourColor} />).container.innerHTML;

  it("separates the two suits a standard deck draws the same way", () => {
    // diamonds and hearts are both "red" in a standard deck's ink
    expect(suitClass("Ad", false)).toContain("text-red-600");
    expect(suitClass("Ad", true)).toContain("text-blue-700");
    // and clubs and spades are both "black"
    expect(suitClass("Ac", false)).toContain("text-neutral-900");
    expect(suitClass("Ac", true)).toContain("text-green-700");
    // hearts and spades keep the ink they had
    expect(suitClass("Ah", true)).toContain("text-red-600");
    expect(suitClass("As", true)).toContain("text-neutral-900");
  });

  it("changes no name: an ace of diamonds is an ace of diamonds", () => {
    const label = (fourColor: boolean) =>
      render(<PlayingCard card="Ad" fourColor={fourColor} />).container.querySelector('[role="img"]')!.getAttribute("aria-label");
    expect(label(true)).toBe(label(false));
  });

  it("reaches the cards of a row when the row is told once", () => {
    const { container } = render(<CardRow cards={["Ad", "Ac"]} animation={false} fourColor />);
    expect(container.innerHTML).toContain("text-blue-700");
    expect(container.innerHTML).toContain("text-green-700");
    // and a row that was not told keeps the standard ink
    const plain = render(<CardRow cards={["Ad", "Ac"]} animation={false} />).container;
    expect(plain.innerHTML).not.toContain("text-blue-700");
  });
});
