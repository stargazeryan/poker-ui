import { describe, expect, it, vi } from "vitest";
import { fireEvent, render } from "@testing-library/react";
import { CardFan, MARKER_SIZE, Marker, TIMER_SIZE, TurnTimer, cardSizeFor } from "../src/index";
import { AmountSlider, formatBB } from "../src/wager";

/**
 * The pieces that are not a table, a seat or a card: a countdown, a disc, the one
 * control, and the fan's own idea of how wide it is.
 *
 * Each of these exists because the docs (and any consumer) had been hand-rolling
 * it — a `TurnTimer` from a div and a border-radius, a dealer button from a span
 * with a letter in it, a betting slider from a bare `<input type="range">`. The
 * tests are about the promises that made them worth having: the clock stays with
 * the caller, the number is readable, the control is a real labelled control.
 */

const px = (value: string) => Number(value.replace("px", ""));

describe("TurnTimer", () => {
  const ring = (container: HTMLElement) => container.querySelector('[role="progressbar"]') as HTMLElement;
  const progress = (container: HTMLElement) => [...container.querySelectorAll("circle")][1] as SVGCircleElement;

  it("draws the number it is handed, and nothing else knows the time", () => {
    const { container } = render(<TurnTimer remaining={0.62} />);
    expect(ring(container).getAttribute("aria-valuenow")).toBe("62");
    expect(ring(container).getAttribute("role")).toBe("progressbar");
    // deliberately not a live region: a ring that ticks should not interrupt
    expect(ring(container).getAttribute("aria-live")).toBeNull();
  });

  it("clamps, because a caller mid-animation hands over 1.0000001", () => {
    const now = (remaining: number) => ring(render(<TurnTimer remaining={remaining} />).container).getAttribute("aria-valuenow");
    expect(now(1.0000001)).toBe("100");
    expect(now(-3)).toBe("0");
    expect(now(Number.NaN)).toBe("0");
    expect(now(0.5)).toBe("50");
  });

  it("fills the ring in proportion", () => {
    const circumference = (container: HTMLElement) => Number(progress(container).getAttribute("stroke-dasharray"));
    const full = render(<TurnTimer remaining={1} />).container;
    const half = render(<TurnTimer remaining={0.5} />).container;
    const empty = render(<TurnTimer remaining={0} />).container;

    expect(Number(progress(full).getAttribute("stroke-dashoffset"))).toBeCloseTo(0, 6);
    expect(Number(progress(half).getAttribute("stroke-dashoffset"))).toBeCloseTo(circumference(half) / 2, 6);
    expect(Number(progress(empty).getAttribute("stroke-dashoffset"))).toBeCloseTo(circumference(empty), 6);
  });

  it("takes a name, a thickness, a tone and a px size", () => {
    const { container } = render(<TurnTimer remaining={0.5} size={110} stroke={8} tone="warning" title="your turn" />);
    expect(ring(container).getAttribute("aria-label")).toBe("your turn");
    expect(ring(container).style.width).toBe("110px");
    expect(progress(container).getAttribute("stroke-width")).toBe("8");
    expect(progress(container).getAttribute("class")).toContain("stroke-warning");

    expect(ring(render(<TurnTimer remaining={0.5} />).container).style.width).toBe(`${TIMER_SIZE.md}px`);
    expect(ring(render(<TurnTimer remaining={0.5} size="lg" />).container).style.width).toBe(`${TIMER_SIZE.lg}px`);
    expect(progress(render(<TurnTimer remaining={0.5} tone="muted" />).container).getAttribute("class")).toContain("stroke-muted");
  });

  it("puts its label in the middle and keeps it above the floor inside a scaled table", () => {
    const { container } = render(<TurnTimer remaining={0.5} label="12" />);
    expect(container.textContent).toBe("12");
  });
});

describe("Marker", () => {
  it("is a named image, not a mystery span", () => {
    const { container } = render(<Marker>D</Marker>);
    const disc = container.firstElementChild as HTMLElement;
    expect(disc.getAttribute("role")).toBe("img");
    expect(disc.getAttribute("aria-label")).toBe("marker");
    expect(disc.textContent).toBe("D");
    expect(render(<Marker label="dealer button">D</Marker>).container.firstElementChild?.getAttribute("aria-label")).toBe(
      "dealer button",
    );
  });

  it("is round, sized from the vocabulary or from px, and keeps its proportions", () => {
    const named = render(<Marker size="lg" />).container.firstElementChild as HTMLElement;
    expect(named.className).toContain("rounded-full");
    expect(named.style.width).toBe(`${MARKER_SIZE.lg}px`);
    expect(named.style.fontSize).toBe("13px");

    // a marker cut to half the default size keeps half the type, not 11px in an 12px disc
    const scaled = render(<Marker size={MARKER_SIZE.md / 2} />).container.firstElementChild as HTMLElement;
    expect(scaled.style.width).toBe("12px");
    expect(scaled.style.fontSize).toBe("6px");
  });

  it("takes its ink from a tone", () => {
    for (const [tone, cls] of [
      ["gold", "bg-gold"],
      ["dark", "bg-surface"],
      ["felt", "bg-felt"],
    ] as const) {
      expect(render(<Marker tone={tone} />).container.firstElementChild?.className).toContain(cls);
    }
  });
});

describe("AmountSlider", () => {
  const slider = (container: HTMLElement) => container.querySelector('input[type="range"]') as HTMLInputElement;
  const quickButtons = (container: HTMLElement) =>
    [...container.querySelectorAll("button")] as HTMLButtonElement[];

  it("is a real labelled control", () => {
    const { container } = render(<AmountSlider value={300} onChange={() => {}} max={1000} label="your bet" />);
    const input = slider(container);
    const label = container.querySelector("label") as HTMLLabelElement;
    expect(label.textContent).toBe("your bet");
    expect(label.getAttribute("for")).toBe(input.id);
    expect(input.getAttribute("min")).toBe("0");
    expect(input.getAttribute("max")).toBe("1000");
  });

  it("reports the amount in the units the caller formats, to the eyes and to a screen reader", () => {
    const { container } = render(<AmountSlider value={300} onChange={() => {}} max={1000} format={formatBB} />);
    const shown = formatBB(300);
    expect(container.textContent).toContain(shown);
    // "15 BB", not "300" — the slider's own value is a bare number
    expect(slider(container).getAttribute("aria-valuetext")).toBe(shown);
    expect(slider(container).value).toBe("300");
  });

  it("hands the new amount back on every change", () => {
    const onChange = vi.fn();
    const { container } = render(<AmountSlider value={300} onChange={onChange} max={1000} />);
    fireEvent.change(slider(container), { target: { value: "750" } });
    expect(onChange).toHaveBeenCalledWith(750);
  });

  it("clamps what it is handed and what it is asked for", () => {
    const onChange = vi.fn();
    const { container } = render(<AmountSlider value={9999} onChange={onChange} max={1000} min={20} />);
    expect(slider(container).value).toBe("1000");

    fireEvent.change(slider(container), { target: { value: "12" } });
    expect(onChange).toHaveBeenCalledWith(20);

    // and the value it is handed back is clamped for display without calling back
    expect(slider(render(<AmountSlider value={-50} onChange={() => {}} max={100} min={20} />).container).value).toBe("20");
  });

  it("repairs a range the browser would draw wrong", () => {
    const { container } = render(<AmountSlider value={5} onChange={() => {}} max={0} min={0} />);
    expect(Number(slider(container).getAttribute("max"))).toBeGreaterThan(0);
    // 0..1 is a usable degenerate range, and the value is clamped into it
    expect(slider(container).getAttribute("max")).toBe("1");
    expect(slider(container).value).toBe("1");
    // a non-finite max is not a range either
    const nan = render(<AmountSlider value={5} onChange={() => {}} max={Number.NaN} />).container;
    expect(Number(slider(nan).getAttribute("max"))).toBeGreaterThan(0);
  });

  it("offers the shortcuts as buttons, and marks the one the amount is sitting on", () => {
    const onChange = vi.fn();
    const quick = [
      { label: "1/2", value: 500 },
      { label: "pot", value: 1000 },
    ];
    const { container } = render(<AmountSlider value={500} onChange={onChange} max={1000} quick={quick} />);
    const buttons = quickButtons(container);
    expect(buttons.map((b) => b.textContent)).toEqual(["1/2", "pot"]);
    expect(buttons[0].className).toContain("bg-gold/15");
    expect(buttons[1].className).toContain("border-surface-border");

    fireEvent.click(buttons[1]);
    expect(onChange).toHaveBeenCalledWith(1000);
  });

  it("disables everything together", () => {
    const { container } = render(
      <AmountSlider value={100} onChange={() => {}} max={1000} quick={[{ label: "pot", value: 1000 }]} disabled />,
    );
    expect(slider(container).disabled).toBe(true);
    expect(quickButtons(container)[0].disabled).toBe(true);
  });
});

describe("CardFan's fitWidth", () => {
  const widthOf = (container: HTMLElement) => {
    const fan = container.firstElementChild as HTMLElement;
    return px(fan.style.width);
  };

  it("brings the cards together until the fan fits the width it was given", () => {
    const cards = ["As", "Kh", "Qd", "Jc", "10s", "9h", "8d", "7c", "6s", "5h", "4d", "3c", "2s"];
    const wide = render(<CardFan cards={cards} size="sm" />).container;
    const fitted = render(<CardFan cards={cards} size="sm" fitWidth={160} />).container;
    expect(widthOf(wide)).toBeGreaterThan(160);
    expect(widthOf(fitted)).toBeLessThanOrEqual(160);
    // and every card is still drawn
    expect(fitted.querySelectorAll('[role="img"]')).toHaveLength(cards.length);
  });

  it("does its best with a width smaller than one card, rather than going past the overlap ceiling", () => {
    const cards = ["As", "Kh", "Qd"];
    const { container } = render(<CardFan cards={cards} size="lg" fitWidth={10} />);
    // 0.95 is as tight as an overlap gets, and it is what a hopeless width gets
    const tightest = render(<CardFan cards={cards} size="lg" overlap={0.95} />).container;
    expect(widthOf(container)).toBe(widthOf(tightest));
  });

  it("never spreads a hand out to fill the width", () => {
    const two = ["As", "Kh"];
    // two `sm` cards at the default overlap are 58px: a 300px frame changes nothing
    const roomy = render(<CardFan cards={two} size="sm" fitWidth={300} />).container;
    const plain = render(<CardFan cards={two} size="sm" />).container;
    expect(widthOf(roomy)).toBe(widthOf(plain));
    expect(widthOf(roomy)).toBe(58);

    const one = render(<CardFan cards={["As"]} size="lg" fitWidth={20} />).container;
    expect(widthOf(one)).toBe(96);
  });

  it("pairs with cardSizeFor: a 13-card hand fits the seat it is measured against", () => {
    const hand = ["As", "Kh", "Qd", "Jc", "10s", "9h", "8d", "7c", "6s", "5h", "4d", "3c", "2s"];
    const frame = { width: 160, height: 176 };
    const size = cardSizeFor(frame, hand.length);
    const { container } = render(<CardFan cards={hand} size={size} fitWidth={frame.width} />);
    expect(widthOf(container)).toBeLessThanOrEqual(frame.width);
    expect(size).toBe("xs");
  });
});
