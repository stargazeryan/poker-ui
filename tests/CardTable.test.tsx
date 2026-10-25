import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { CardTable } from "../src/components/CardTable";
import { setElementSize } from "./setup";

const insetPx = (el: HTMLElement): { top: number; right: number; bottom: number; left: number } => ({
  top: parseFloat(el.style.top),
  right: parseFloat(el.style.right),
  bottom: parseFloat(el.style.bottom),
  left: parseFloat(el.style.left),
});

const px = (v: string): number => parseFloat(v);

describe("CardTable — seats", () => {
  it("renders exactly `seatCount` seat slots", () => {
    for (const n of [2, 5, 6, 10]) {
      const { container, unmount } = render(<CardTable seatCount={n} renderSeat={(i) => <div>{i}</div>} />);
      expect(container.querySelectorAll('[data-part="seat"]')).toHaveLength(n);
      unmount();
    }
  });

  it("renders the seat count it was given, without clamping the top end", () => {
    // 12 used to be silently rendered as 10, even though the ring lays it out fine
    for (const n of [11, 12, 16]) {
      const { container, unmount } = render(<CardTable seatCount={n} renderSeat={(i) => <div>{i}</div>} />);
      expect(container.querySelectorAll('[data-part="seat"]'), `${n} seats`).toHaveLength(n);
      unmount();
    }
  });

  it("still guards the bottom end, where there is no sensible layout", () => {
    for (const n of [0, -3, NaN]) {
      const { container, unmount } = render(<CardTable seatCount={n} renderSeat={(i) => <div>{i}</div>} />);
      expect(container.querySelectorAll('[data-part="seat"]'), `seatCount=${String(n)}`).toHaveLength(1);
      unmount();
    }
  });

  it("skips null entries in the `seats` array but keeps the other indices in place", () => {
    const { container } = render(
      <CardTable seatCount={4} seats={[<div key="0">a</div>, null, null, <div key="3">d</div>]} />,
    );
    const seats = container.querySelectorAll('[data-part="seat"]');
    expect(seats).toHaveLength(2);
    expect([...seats].map((s) => s.getAttribute("data-seat"))).toEqual(["0", "3"]);
  });

  it("puts seat 0 at the bottom of the table and seat 3 of 6 at the top", () => {
    setElementSize(1200, 900);
    const { container } = render(<CardTable seatCount={6} renderSeat={(i) => <div>{i}</div>} />);
    const seat = (i: number) => container.querySelector(`[data-seat="${i}"]`) as HTMLElement;
    // design space is 1200x900, seat frame 160x176 -> centre y = top + 88
    const y = (i: number) => px(seat(i).style.top) + 88;
    expect(y(0)).toBeCloseTo(450 + 337, 3);
    expect(y(3)).toBeCloseTo(450 - 337, 3);
    expect(px(seat(0).style.left)).toBeCloseTo(600 - 80, 3);
  });

  it("flags `isYou` for yourSeatIndex only, and passes the laid-out box to renderSeat", () => {
    const seen = new Map<number, { isYou: boolean; width: number; height: number }>();
    render(
      <CardTable
        seatCount={4}
        yourSeatIndex={2}
        renderSeat={(i, isYou, box) => {
          seen.set(i, { isYou, width: box.width, height: box.height });
          return <div>{i}</div>;
        }}
      />,
    );
    expect([...seen.keys()]).toEqual([0, 1, 2, 3]);
    expect([...seen.values()].map((s) => s.isYou)).toEqual([false, false, true, false]);
    expect([...seen.values()].every((s) => s.width === 160 && s.height === 176)).toBe(true);
  });

  it("hands renderSeat the shrunk frame size when the ring is too tight", () => {
    const sizes: number[] = [];
    render(
      <CardTable
        seatCount={10}
        seatWidth={200}
        seatHeight={220}
        renderSeat={(i, _isYou, box) => {
          sizes.push(box.width);
          return <div>{i}</div>;
        }}
      />,
    );
    expect(new Set(sizes).size).toBe(1);
    expect(sizes[0]).toBeLessThan(200);
    expect(sizes[0]).toBeGreaterThanOrEqual(100);
  });
});

describe("CardTable — the bet ring and the drawn betting line stay in sync", () => {
  // Regression: the betting line was drawn from a module constant while the
  // chips were positioned from `betRadiusScale`, so any non-default scale put
  // the chips off the line (56.7px off at 0.85, 100.3px at 0.95).
  it.each([0.5, 0.72, 0.85, 0.95, 1])("lands every bet on the line at betRadiusScale=%s", (scale) => {
    setElementSize(1200, 900);
    const { container } = render(
      <CardTable
        seatCount={6}
        betRadiusScale={scale}
        renderSeat={(i) => <div>{i}</div>}
        renderBet={(i) => <span>{i}</span>}
      />,
    );
    const line = insets(container);
    const bet = (i: number) => container.querySelector(`[data-seat-bet="${i}"]`) as HTMLElement;

    // Seat 0 sits at the bottom of the ellipse: on the line's lower edge.
    expect(px(bet(0).style.left)).toBeCloseTo(600, 3);
    expect(px(bet(0).style.top)).toBeCloseTo(900 - line.top, 3);
    // Seat 3 sits at the top: on the line's upper edge.
    expect(px(bet(3).style.top)).toBeCloseTo(line.top, 3);
    // Seat 1 of 6 is at 210° -> left of centre, on the line's left edge.
    const rx = (1200 - line.left - line.right) / 2;
    const ry = (900 - line.top - line.bottom) / 2;
    expect(rx).toBeCloseTo((1200 / 2 - 164) * scale, 3);
    expect(ry).toBeCloseTo((900 / 2 - 196) * scale, 3);
  });

  it("clamps a nonsense betRadiusScale instead of drawing off-table", () => {
    const { container } = render(
      <CardTable seatCount={4} betRadiusScale={9} renderSeat={(i) => <div>{i}</div>} renderBet={(i) => <span>{i}</span>} />,
    );
    const line = insets(container);
    expect(line.left).toBeGreaterThanOrEqual(0);
    expect(insets(container).top).toBeGreaterThanOrEqual(0);
  });

  it("renders no bet layer at all when neither bets nor renderBet is given", () => {
    const { container } = render(<CardTable seatCount={4} renderSeat={(i) => <div>{i}</div>} />);
    expect(container.querySelector("[data-seat-bet]")).toBeNull();
  });

  it("skips null bets", () => {
    const { container } = render(
      <CardTable seatCount={4} renderSeat={(i) => <div>{i}</div>} renderBet={(i) => (i % 2 ? null : <span>{i}</span>)} />,
    );
    expect(container.querySelectorAll("[data-seat-bet]")).toHaveLength(2);
  });
});

function insets(container: HTMLElement) {
  return insetPx(container.querySelector('[data-part="betting-line"]') as HTMLElement);
}

describe("CardTable — scaling and fit", () => {
  const wrapper = (container: HTMLElement) => container.firstElementChild?.firstElementChild as HTMLElement;

  it("letterboxes a non-matching container in the default `design` fit", () => {
    setElementSize(640, 900);
    const { container } = render(<CardTable renderSeat={(i) => <div>{i}</div>} />);
    // scale = min(640/1200, 900/900) = 0.5333
    expect(px(wrapper(container).style.width)).toBeCloseTo(1200 * (640 / 1200), 3);
    expect(px(wrapper(container).style.height)).toBeCloseTo(900 * (640 / 1200), 3);
  });

  it("fills the container with fit=\"container\"", () => {
    setElementSize(640, 900);
    const { container } = render(<CardTable fit="container" renderSeat={(i) => <div>{i}</div>} />);
    expect(px(wrapper(container).style.width)).toBeCloseTo(640, 3);
    expect(px(wrapper(container).style.height)).toBeCloseTo(900, 3);
  });

  it("clamps fit=\"container\" to a sane aspect range", () => {
    setElementSize(3000, 400); // aspect 7.5
    const { container } = render(<CardTable fit="container" renderSeat={(i) => <div>{i}</div>} />);
    // designWidth = 900 * 2.5 = 2250, scale = min(3000/2250, 400/900) = 0.4444
    const scale = 400 / 900;
    expect(px(wrapper(container).style.width)).toBeCloseTo(2250 * scale, 3);
  });

  it("honours explicit designWidth/designHeight", () => {
    setElementSize(900, 1100);
    const { container } = render(
      <CardTable designWidth={900} designHeight={1100} marginX={0.12} marginY={0.15} renderSeat={(i) => <div>{i}</div>} />,
    );
    const line = insets(container);
    // tableRx = 450 - 0.12*900 = 342 -> bet ring at 0.72
    expect((900 - line.left - line.right) / 2).toBeCloseTo(342 * 0.72, 3);
  });
});

describe("CardTable — decorations", () => {
  it("shows confetti only for a non-empty winnerSeats and can be disabled", () => {
    const withWinner = render(<CardTable seatCount={4} winnerSeats={[0]} renderSeat={(i) => <div>{i}</div>} />);
    expect(withWinner.container.querySelectorAll(".animate-confetti").length).toBeGreaterThan(0);
    expect(render(<CardTable seatCount={4} winnerSeats={[0]} confetti={false} renderSeat={(i) => <div>{i}</div>} />)
      .container.querySelectorAll(".animate-confetti")).toHaveLength(0);
    expect(render(<CardTable seatCount={4} renderSeat={(i) => <div>{i}</div>} />).container.querySelectorAll(
      ".animate-confetti",
    )).toHaveLength(0);
  });

  it("themeable confetti colours (a prop, since inline styles are invisible to Tailwind)", () => {
    const { container } = render(
      <CardTable
        seatCount={4}
        winnerSeats={[0]}
        confettiColors={["#010203", "#040506"]}
        renderSeat={(i) => <div>{i}</div>}
      />,
    );
    const colors = new Set(
      [...container.querySelectorAll(".animate-confetti")].map((el) => (el as HTMLElement).style.backgroundColor),
    );
    expect(colors).toEqual(new Set(["rgb(1, 2, 3)", "rgb(4, 5, 6)"]));
  });

  it("renders the centre slot only when given, and toggles ambient / yourTurn", () => {
    expect(render(<CardTable renderSeat={(i) => <div>{i}</div>} center={<b>pot</b>} />).container.textContent).toContain("pot");
    expect(render(<CardTable renderSeat={(i) => <div>{i}</div>} />).container.textContent).not.toContain("pot");
    expect(
      render(<CardTable renderSeat={(i) => <div>{i}</div>} />).container.querySelectorAll(".animate-felt-shimmer"),
    ).toHaveLength(1);
    expect(
      render(<CardTable ambient={false} renderSeat={(i) => <div>{i}</div>} />).container.querySelectorAll(
        ".animate-felt-shimmer",
      ),
    ).toHaveLength(0);
    expect(
      render(<CardTable yourTurn renderSeat={(i) => <div>{i}</div>} />).container.querySelectorAll(".animate-turn-glow"),
    ).toHaveLength(1);
  });

  it("does not re-measure on unrelated re-renders beyond the resize observer", () => {
    const observe = vi.fn();
    const disconnect = vi.fn();
    class RO {
      observe = observe;
      disconnect = disconnect;
      unobserve = () => {};
    }
    vi.stubGlobal("ResizeObserver", RO);
    setElementSize(800, 600);
    const { unmount } = render(<CardTable renderSeat={(i) => <div>{i}</div>} />);
    expect(observe).toHaveBeenCalledTimes(1);
    unmount();
    expect(disconnect).toHaveBeenCalledTimes(1);
  });
});
