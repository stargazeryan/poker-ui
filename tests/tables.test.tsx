import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { CardRow, Seat, TABLE_TYPES } from "../src/index";
import { DealerTable, RoundTable, SquareTable } from "../src/tables";
import { setElementSize } from "./setup";

/**
 * The table types are the package's actual table API, so they get the same
 * treatment the components do. The assertions that matter are the negative ones:
 * a table type is only a *type* if nothing about a game is in it, so most of this
 * file checks that a type draws nothing it was not asked for.
 */

const railOf = (container: HTMLElement) => container.querySelector(".bg-gradient-to-b.from-rail") as HTMLElement | null;
const borderRadii = (container: HTMLElement) =>
  [...container.querySelectorAll("div")].map((d) => (d as HTMLElement).style.borderRadius).filter(Boolean);

describe("RoundTable", () => {
  it("is an ellipse with the seats on a ring, and draws no line of its own", () => {
    setElementSize(1200, 900);
    const { container } = render(<RoundTable seatCount={6} renderSeat={(i) => <div>{i}</div>} />);

    expect(railOf(container)?.style.borderRadius).toBe("50%");
    expect(container.querySelectorAll('[data-part="seat"]')).toHaveLength(6);
    // the shape of the old bug: a betting line nobody asked for
    expect(container.querySelector('[data-part="betting-line"]')).toBeNull();
    expect(container.querySelectorAll('[data-part="ring"]')).toHaveLength(0);
    expect(container.querySelectorAll('[data-part="slot"]')).toHaveLength(0);
  });

  it("draws a ring and places slots only where the caller declared them", () => {
    setElementSize(1200, 900);
    const { container } = render(
      <RoundTable
        seatCount={6}
        renderSeat={(i) => <div>{i}</div>}
        rings={[{ id: "line", radius: 0.72 }]}
        slots={[{ id: "bet", radius: 0.72, render: (i) => (i > 0 ? null : <span>chips</span>) }]}
      />,
    );
    expect(container.querySelectorAll('[data-part="ring"]')).toHaveLength(1);
    expect(container.querySelector('[data-ring="line"]')).toBeTruthy();
    // one of six seats had wager content, so one slot element exists
    expect(container.querySelectorAll("[data-slot-index]")).toHaveLength(1);
  });

  it("paints no watermark unless one is given", () => {
    expect(render(<RoundTable seatCount={4} renderSeat={(i) => <div>{i}</div>} />).container.textContent).not.toContain("♠");
    expect(
      render(
        <RoundTable seatCount={4} watermark={<span>♠♥♦♣</span>} renderSeat={(i) => <div>{i}</div>} />,
      ).container.textContent,
    ).toContain("♠♥♦♣");
  });
});

describe("SquareTable", () => {
  it("is a rounded rectangle with the seats on its perimeter", () => {
    setElementSize(1200, 900);
    const { container } = render(<SquareTable seatCount={4} renderSeat={(i) => <div>{i}</div>} />);
    expect(railOf(container)?.style.borderRadius).toMatch(/px$/);
    expect(container.querySelectorAll('[data-part="seat"]')).toHaveLength(4);

    const lefts = [...container.querySelectorAll('[data-part="seat"]')].map((el) =>
      parseFloat((el as HTMLElement).style.left),
    );
    // seats reach the far left and the far right of the box, which a ring at the
    // same seat count would not (it would stay on the ellipse)
    expect(Math.min(...lefts)).toBeLessThan(200);
    expect(Math.max(...lefts)).toBeGreaterThan(700);
  });

  it("honours an explicit cornerRadius, including none at all", () => {
    const sharp = render(<SquareTable seatCount={4} cornerRadius={0} renderSeat={(i) => <div>{i}</div>} />);
    expect(borderRadii(sharp.container)).toContain("0px");

    const round = render(<SquareTable seatCount={4} cornerRadius={60} renderSeat={(i) => <div>{i}</div>} />);
    expect(borderRadii(round.container)).toContain("60px");
  });

  it("keeps its seats off the corners rather than bunching them there", () => {
    setElementSize(1600, 900); // a wide rectangle: an angle-based walk would fail here
    const { container } = render(<SquareTable seatCount={8} renderSeat={(i) => <div>{i}</div>} />);
    const tops = [...container.querySelectorAll('[data-part="seat"]')].map((el) =>
      parseFloat((el as HTMLElement).style.top),
    );
    // at least two distinct rows mean the long edges are actually used
    expect(new Set(tops.map((t) => Math.round(t / 10))).size).toBeGreaterThan(1);
  });
});

describe("DealerTable", () => {
  const hand = (i: number) => <Seat header={<b>hand {i}</b>} />;

  it("draws no table surface at all — no rail, no felt, no shimmer, no rim", () => {
    const { container } = render(<DealerTable hands={[hand(0), hand(1)]} />);
    expect(railOf(container)).toBeNull();
    expect(container.querySelectorAll(".animate-felt-shimmer")).toHaveLength(0);
    expect(container.querySelectorAll(".animate-spotlight")).toHaveLength(0);
    expect(borderRadii(container)).toEqual([]);
  });

  it("puts the head above and the hands in a row below it", () => {
    setElementSize(1200, 900);
    const { container } = render(<DealerTable head={<Seat header={<b>Dealer</b>} />} hands={[hand(0), hand(1), hand(2)]} />);

    const head = container.querySelector('[data-part="head"]') as HTMLElement;
    const hands = [...container.querySelectorAll('[data-part="hand"]')] as HTMLElement[];
    expect(head).toBeTruthy();
    expect(hands).toHaveLength(3);
    expect(parseFloat(head.style.top)).toBeLessThan(parseFloat(hands[0].style.top));
    // one row: every hand shares a top
    expect(new Set(hands.map((h) => h.style.top)).size).toBe(1);
    expect(container.textContent).toContain("Dealer");
  });

  it("skips null positions and counts a sparse array by handCount", () => {
    const { container } = render(<DealerTable handCount={4} hands={[hand(0), null, null, hand(3)]} />);
    const hands = [...container.querySelectorAll('[data-part="hand"]')] as HTMLElement[];
    expect(hands).toHaveLength(2);
    expect(hands.map((h) => h.getAttribute("data-hand"))).toEqual(["0", "3"]);
  });

  it("hands renderHand the frame the row was laid out for", () => {
    setElementSize(1200, 900);
    const seen: number[] = [];
    render(
      <DealerTable
        handCount={3}
        renderHand={(i, box) => {
          seen.push(box.width);
          return <div>{i}</div>;
        }}
      />,
    );
    // The box is measured in a layout effect, so the row renders once at scale 1
    // and once at the real scale. Assert on the settled render.
    expect(seen.length % 3).toBe(0);
    const settled = seen[seen.length - 1];
    expect(seen.slice(-3)).toEqual([settled, settled, settled]);
    expect(settled).toBe(220);
  });

  it("tells a bare Seat the size it laid out, through context", () => {
    setElementSize(1200, 900);
    const { container } = render(<DealerTable handCount={2} renderHand={() => <Seat />} />);
    const hand = container.querySelector('[data-part="hand"]') as HTMLElement;
    const frame = [...hand.querySelectorAll("div")].find((el) => (el as HTMLElement).style.height !== "");
    expect(parseFloat((frame as HTMLElement).style.height)).toBe(280);
  });

  it("shrinks a row that would run off the edge of the box", () => {
    // A row is bounded by the width of the design box, which is the constraint a
    // ring gets for free from its clamped radii and a row does not have.
    setElementSize(1200, 900);
    const sizes: number[] = [];
    render(
      <DealerTable
        designWidth={900}
        handCount={4}
        renderHand={(i, box) => {
          sizes.push(box.width);
          return <div>{i}</div>;
        }}
      />,
    );
    const settled = sizes[sizes.length - 1];
    expect(settled).toBeLessThan(220);
    expect(settled).toBeGreaterThanOrEqual(Math.round(220 * 0.5));
    expect(sizes.slice(-4)).toEqual([settled, settled, settled, settled]);
    // four frames plus three gaps now fit inside 94% of the 900px box
    expect(4 * settled + 3 * 24).toBeLessThanOrEqual(900 * 0.94 + 1);
  });

  it("draws nothing behind the hands unless the caller puts something there", () => {
    const bare = render(<DealerTable hands={[hand(0)]} />);
    expect(bare.container.querySelectorAll('[data-part="overlay"]')).toHaveLength(0);
    expect(bare.container.querySelectorAll(".animate-confetti")).toHaveLength(0);

    const withOverlay = render(<DealerTable hands={[hand(0)]} overlay={<span data-testid="fx" />} />);
    const layer = withOverlay.container.querySelector('[data-part="overlay"]') as HTMLElement;
    expect(layer.className).toContain("pointer-events-none");
    expect(layer.querySelector('[data-testid="fx"]')).toBeTruthy();
  });

  it("shows its content, whatever that content is", () => {
    const { container } = render(<DealerTable head={<CardRow cards={["As", "9d"]} animation={false} />} hands={[hand(0)]} />);
    expect([...container.querySelectorAll('[role="img"]')].map((el) => el.getAttribute("aria-label"))).toEqual([
      "Ace of spades",
      "Nine of diamonds",
    ]);
  });
});

describe("TABLE_TYPES", () => {
  it("maps the names a client can offer to the components", () => {
    expect(Object.keys(TABLE_TYPES)).toEqual(["round", "square", "dealer"]);
    expect(TABLE_TYPES.round).toBe(RoundTable);
    expect(TABLE_TYPES.square).toBe(SquareTable);
    expect(TABLE_TYPES.dealer).toBe(DealerTable);
  });

  it("offers three shapes and no game", () => {
    // The whole point of the rename: a client choosing a table is choosing how
    // people sit, not which game they play.
    expect(Object.keys(TABLE_TYPES)).toHaveLength(3);
    for (const name of Object.keys(TABLE_TYPES)) {
      expect(name).not.toMatch(/poker|blackjack|big.?two|dragon|gin|rummy|bridge/i);
    }
  });
});
