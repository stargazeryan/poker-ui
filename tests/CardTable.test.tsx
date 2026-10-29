import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import {
  CardTable,
  DEFAULT_FELT_GAP,
  DEFAULT_MARGIN_X,
  DEFAULT_MARGIN_Y,
  DEFAULT_SEAT_GAP,
  DESIGN_H,
  DESIGN_W,
  type TableOverlayGeometry,
} from "../src/components/CardTable";
import { Confetti } from "../src/components/Confetti";
import { Seat } from "../src/components/Seat";
import { GLOW_GAP, layoutSeats } from "../src/layout";
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

  it("hands renderSeat the laid-out box, and nothing about the game", () => {
    const seen = new Map<number, { keys: string[]; width: number; height: number }>();
    render(
      <CardTable
        seatCount={4}
        renderSeat={(i, box) => {
          seen.set(i, { keys: Object.keys(box), width: box.width, height: box.height });
          return <div>{i}</div>;
        }}
      />,
    );
    expect([...seen.keys()]).toEqual([0, 1, 2, 3]);
    expect([...seen.values()].every((s) => s.width === 160 && s.height === 176)).toBe(true);
    // the table says where a seat is, never who is sitting in it
    expect([...seen.values()].some((s) => s.keys.includes("isYou"))).toBe(false);
  });

  it("hands renderSeat the shrunk frame size when the ring is too tight", () => {
    const sizes: number[] = [];
    render(
      <CardTable
        seatCount={10}
        seatWidth={200}
        seatHeight={220}
        renderSeat={(i, box) => {
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

describe("the seat frame size has one source", () => {
  it("tells a bare Seat the size it laid out, with no props threaded through", () => {
    const { container } = render(
      <CardTable seatCount={10} seatWidth={200} seatHeight={220} renderSeat={() => <Seat />} />,
    );
    // what the ring actually computed
    const expected = layoutSeats({
      count: 10,
      designWidth: DESIGN_W,
      designHeight: DESIGN_H,
      marginX: DEFAULT_MARGIN_X,
      marginY: DEFAULT_MARGIN_Y,
      feltGap: DEFAULT_FELT_GAP,
      seatWidth: 200,
      seatHeight: 220,
      seatGap: DEFAULT_SEAT_GAP,
      startAngle: 90,
    });

    // Seat's root carries the width; the inner frame carries the height.
    const wrapper = container.querySelector('[data-seat="0"]') as HTMLElement;
    const root = wrapper.firstElementChild as HTMLElement;
    const frame = [...wrapper.querySelectorAll("div")].find(
      (el) => (el as HTMLElement).style.height !== "",
    ) as HTMLElement;

    expect(parseFloat(root.style.width)).toBe(expected.seatW);
    expect(parseFloat(frame.style.height)).toBe(expected.seatH);
    expect(expected.seatW).toBeLessThan(200);
  });

  it("shrinks the ring for a seats array too, now that the size is shared", () => {
    const { container } = render(
      <CardTable
        seatCount={10}
        seatWidth={200}
        seatHeight={220}
        seats={Array.from({ length: 10 }, (_, i) => <div key={i}>{i}</div>)}
      />,
    );
    // seat 0 sits directly below the centre, so left = cx - seatW / 2
    const left = parseFloat((container.querySelector('[data-seat="0"]') as HTMLElement).style.left);
    expect(2 * (DESIGN_W / 2 - left)).toBeLessThan(200);
  });

  it("still lets an explicit width win", () => {
    const { container } = render(
      <CardTable seatCount={10} renderSeat={() => <Seat width={123} height={45} />} />,
    );
    const wrapper = container.querySelector('[data-seat="0"]') as HTMLElement;
    const root = wrapper.firstElementChild as HTMLElement;
    const frame = [...wrapper.querySelectorAll("div")].find(
      (el) => (el as HTMLElement).style.height !== "",
    ) as HTMLElement;

    expect(root.style.width).toBe("123px");
    expect(frame.style.height).toBe("45px");
  });
});

describe("CardTable — declared rings and slots", () => {
  // Regression this now guards: the betting line used to be drawn from a module
  // constant while the chips were positioned from a prop, so any non-default
  // scale put the chips off the line (56.7px off at 0.85, 100.3px at 0.95).
  // Both now come from `layout.slotPoint` / `layout.ringBox`.
  it.each([0.5, 0.72, 0.85, 0.95, 1])("puts a slot exactly on the ring at radius %s", (radius) => {
    setElementSize(1200, 900);
    const { container } = render(
      <CardTable
        seatCount={6}
        rings={[{ id: "line", radius }]}
        renderSeat={(i) => <div>{i}</div>}
        slots={[{ id: "bet", radius, render: (i) => <span>{i}</span> }]}
      />,
    );
    const line = ringInsets(container);
    const slot = (i: number) => container.querySelector(`[data-slot-index="${i}"]`) as HTMLElement;

    // Seat 0 sits at the bottom of the ellipse: on the ring's lower edge.
    expect(px(slot(0).style.left)).toBeCloseTo(600, 3);
    expect(px(slot(0).style.top)).toBeCloseTo(900 - line.top, 3);
    // Seat 3 sits at the top: on the ring's upper edge.
    expect(px(slot(3).style.top)).toBeCloseTo(line.top, 3);
    // and the ring itself is at `radius` of the surface
    expect((1200 - line.left - line.right) / 2).toBeCloseTo((1200 / 2 - 164) * radius, 3);
    expect((900 - line.top - line.bottom) / 2).toBeCloseTo((900 / 2 - 196) * radius, 3);
  });

  it("clamps a nonsense ring radius instead of drawing off-table", () => {
    const { container } = render(
      <CardTable seatCount={4} rings={[{ id: "line", radius: 9 }]} renderSeat={(i) => <div>{i}</div>} />,
    );
    expect(ringInsets(container).left).toBeGreaterThanOrEqual(0);
    expect(ringInsets(container).top).toBeGreaterThanOrEqual(0);
  });

  it("draws no ring and places no slot when the caller declares none", () => {
    const { container } = render(<CardTable seatCount={4} renderSeat={(i) => <div>{i}</div>} />);
    expect(container.querySelector('[data-part="ring"]')).toBeNull();
    expect(container.querySelector('[data-part="slot"]')).toBeNull();
    // the shape of the old bug: a betting line nobody asked for
    expect(container.querySelector('[data-part="betting-line"]')).toBeNull();
  });

  it("skips null slot content, per seat", () => {
    const { container } = render(
      <CardTable
        seatCount={4}
        renderSeat={(i) => <div>{i}</div>}
        slots={[{ id: "bet", radius: 0.7, render: (i) => (i % 2 ? null : <span>{i}</span>) }]}
      />,
    );
    expect(container.querySelectorAll("[data-slot-index]")).toHaveLength(2);
  });
});

function ringInsets(container: HTMLElement) {
  return insetPx(container.querySelector('[data-ring="line"]') as HTMLElement);
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
      <CardTable
        designWidth={900}
        designHeight={1100}
        marginX={0.12}
        marginY={0.15}
        rings={[{ id: "line", radius: 0.72 }]}
        renderSeat={(i) => <div>{i}</div>}
      />,
    );
    const line = ringInsets(container);
    // tableRx = 450 - 0.12*900 = 342 -> the ring at 0.72
    expect((900 - line.left - line.right) / 2).toBeCloseTo(342 * 0.72, 3);
  });
});

describe("CardTable — table shapes and the deck", () => {
  const deckParts = (container: HTMLElement) => ({
    ring: container.querySelectorAll('[data-part="ring"]').length,
    felt: container.querySelectorAll(".animate-felt-shimmer").length,
  });

  it("draws an ellipse by default, and a rectangle on request", () => {
    setElementSize(1200, 900);
    const ellipse = render(<CardTable seatCount={4} renderSeat={(i) => <div>{i}</div>} />);
    const round = ellipse.container.querySelector(".bg-gradient-to-b.from-rail") as HTMLElement;
    expect(round.style.borderRadius).toBe("50%");

    const rect = render(<CardTable seatCount={4} shape="rect" renderSeat={(i) => <div>{i}</div>} />);
    const boxy = rect.container.querySelector(".bg-gradient-to-b.from-rail") as HTMLElement;
    expect(boxy.style.borderRadius).toMatch(/px$/);
  });

  it("draws nothing behind the seats when deck={false}", () => {
    const { container } = render(<CardTable seatCount={4} deck={false} renderSeat={(i) => <div>{i}</div>} />);
    expect(container.querySelector(".bg-gradient-to-b.from-rail")).toBeNull();
    expect(deckParts(container).felt).toBe(0);
    // the seats are still there, and still positioned
    expect(container.querySelectorAll('[data-part="seat"]')).toHaveLength(4);
  });

  it("draws no watermark at all unless the caller asks for one", () => {
    // 0.7.0 painted ♠♥♦♣ on every table, whatever game it was for
    expect(render(<CardTable seatCount={4} renderSeat={(i) => <div>{i}</div>} />).container.textContent).not.toContain("♠");
    expect(
      render(
        <CardTable seatCount={4} watermark={<span>♠♥♦♣</span>} renderSeat={(i) => <div>{i}</div>} />,
      ).container.textContent,
    ).toContain("♠♥♦♣");
  });

  it("puts the seats in a row when there is no surface to ring", () => {
    setElementSize(1200, 900);
    const { container } = render(<CardTable seatCount={3} shape="none" renderSeat={(i) => <div>{i}</div>} />);
    const tops = [...container.querySelectorAll('[data-part="seat"]')].map((el) => (el as HTMLElement).style.top);
    expect(new Set(tops).size).toBe(1);
  });
});

describe("CardTable — overlay and decorations", () => {
  it("draws nothing above the seats until the caller puts something there", () => {
    const { container } = render(<CardTable seatCount={4} renderSeat={(i) => <div>{i}</div>} />);
    expect(container.querySelectorAll('[data-part="overlay"]')).toHaveLength(0);
    expect(container.querySelectorAll(".animate-confetti")).toHaveLength(0);
    expect(container.querySelectorAll(".animate-turn-glow")).toHaveLength(0);
  });

  it("renders an overlay element above the seats, non-interactive by default", () => {
    const { container } = render(
      <CardTable seatCount={4} renderSeat={(i) => <div>{i}</div>} overlay={<span data-testid="glow" />} />,
    );
    const layer = container.querySelector('[data-part="overlay"]') as HTMLElement;
    expect(layer).toBeTruthy();
    expect(layer.className).toContain("pointer-events-none");
    expect(layer.querySelector('[data-testid="glow"]')).toBeTruthy();
  });

  it("hands renderOverlay the design box and the layout, so a ring lands on the real ellipse", () => {
    let seen: TableOverlayGeometry | null = null;
    const { container } = render(
      <CardTable
        seatCount={6}
        designWidth={900}
        designHeight={1100}
        marginX={0.12}
        renderSeat={(i) => <div>{i}</div>}
        renderOverlay={(geometry) => {
          seen = geometry;
          return <div data-testid="ring" style={geometry.layout.boxes.glow} className="animate-turn-glow" />;
        }}
      />,
    );
    expect(seen).toBeTruthy();
    const geometry = seen as unknown as TableOverlayGeometry;
    expect(geometry.designWidth).toBe(900);
    expect(geometry.designHeight).toBe(1100);
    expect(geometry.layout.seats).toHaveLength(6);
    // tableRx = 450 - 0.12*900 = 342, and the glow ring sits GLOW_GAP inside it
    const glowRx = (900 - geometry.layout.boxes.glow.left - geometry.layout.boxes.glow.right) / 2;
    expect(glowRx).toBeCloseTo(450 - 0.12 * 900 - GLOW_GAP, 3);
    expect(container.querySelectorAll(".animate-turn-glow")).toHaveLength(1);
  });

  it("renders the centre slot only when given, and toggles ambient", () => {
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
  });

  it("Confetti fills its box, cycles the palette, and survives a nonsense count", () => {
    const { container } = render(<Confetti count={3} colors={["#010203", "#040506"]} />);
    const pieces = [...container.querySelectorAll(".animate-confetti")] as HTMLElement[];
    expect(pieces).toHaveLength(3);
    expect(pieces.map((p) => p.style.backgroundColor)).toEqual(["rgb(1, 2, 3)", "rgb(4, 5, 6)", "rgb(1, 2, 3)"]);

    const box = container.firstElementChild as HTMLElement;
    expect(box.getAttribute("aria-hidden")).toBe("true");
    expect(box.className).toContain("absolute");
    expect(box.className).toContain("inset-0");

    expect(render(<Confetti count={-5} />).container.querySelectorAll(".animate-confetti")).toHaveLength(0);
    expect(render(<Confetti count={2} />).container.querySelectorAll(".animate-confetti")).toHaveLength(2);
    // an empty palette falls back rather than emitting `undefined`
    const empty = render(<Confetti count={1} colors={[]} />).container.querySelector(".animate-confetti") as HTMLElement;
    expect(empty.style.backgroundColor).not.toBe("");
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
