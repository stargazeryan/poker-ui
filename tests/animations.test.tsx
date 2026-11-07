import { describe, expect, it, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { CardRow } from "../src/components/PlayingCard";
import { Counter } from "../src/components/Counter";
import { Confetti } from "../src/components/Confetti";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Every value the counter *draws*, in the order it draws them.
 *
 * Read off the animated node, not off the formatter: `Counter` also writes the
 * settled amount once for assistive tech, and that one is a plain value rather
 * than a frame of the animation — recording formatter calls records both, and
 * then the settled value looks like the number jumping backwards.
 */
function watchCounter(container: HTMLElement): number[] {
  const seen: number[] = [];
  const record = () => {
    const value = Number(container.querySelector("[data-counter-value]")?.textContent);
    if (Number.isFinite(value)) seen.push(value);
  };
  record();
  new MutationObserver(record).observe(container.querySelector("[data-counter-value]") ?? container, {
    subtree: true,
    childList: true,
    characterData: true,
  });
  return seen;
}

/** A formatter with no grouping, so the drawn text parses back to a number. */
const plain = (n: number) => `${n}`;

describe("Counter count-up", () => {
  // The counter used to hold its "from" value in a ref that was only updated
  // once an animation finished, so interrupting it restarted from the value the
  // previous animation began at: the number jumped backwards on screen.
  it("never counts backwards when the amount changes mid-animation", async () => {
    const { container, rerender } = render(<Counter amount={0} format={plain} />);
    const seen = watchCounter(container);
    rerender(<Counter amount={1000} format={plain} />);
    await sleep(120); // interrupt mid-flight
    rerender(<Counter amount={2000} format={plain} />);
    await waitFor(() => expect(seen[seen.length - 1]).toBe(2000), { timeout: 3000 });

    const drops = seen.filter((v, i) => i > 0 && v < seen[i - 1]);
    expect(drops, `the counter went backwards: ${seen.join(" -> ")}`).toEqual([]);
  });

  it("animates from where it actually is, not from the last target", async () => {
    const { container, rerender } = render(<Counter amount={0} format={plain} />);
    const seen = watchCounter(container);
    rerender(<Counter amount={800} format={plain} />);
    await sleep(150);
    const midway = seen[seen.length - 1];
    expect(midway).toBeGreaterThan(0);
    rerender(<Counter amount={40} format={plain} />); // now count DOWN
    await waitFor(() => expect(seen[seen.length - 1]).toBe(40), { timeout: 3000 });
    // it must pass through "midway" on the way down rather than snapping there
    expect(seen).toContain(midway);
  });

  it("drives every counter on the page from one animation loop", () => {
    // Each counter used to own a rAF loop, so a settlement animating nine seat
    // stacks ran nine loops and nine render passes per frame. Frames are driven
    // by hand here: one pending callback per frame is the whole claim, whatever
    // the number of counters.
    let queue: FrameRequestCallback[] = [];
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => queue.push(cb));
    vi.stubGlobal("cancelAnimationFrame", () => {});
    try {
      const counters = (amount: number) => (
        <>
          <Counter amount={amount} format={plain} />
          <Counter amount={amount} format={plain} />
        </>
      );
      const { rerender } = render(counters(0));
      rerender(counters(1000));

      const runFrame = (now: number) => {
        const due = queue;
        queue = [];
        due.forEach((cb) => cb(now));
      };

      expect(queue, "two counters, one loop").toHaveLength(1);
      runFrame(16);
      expect(queue, "and it stays one").toHaveLength(1);
      runFrame(32);
      expect(queue).toHaveLength(1);
      // past the end of the count-up the loop stops on its own
      runFrame(1000);
      expect(queue).toHaveLength(0);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

describe("Confetti — a decoration that cannot be talked into nonsense", () => {
  it("draws nothing for a count that is not a positive number", () => {
    // `count={NaN}` or a negative is a caller's arithmetic going wrong, and the
    // answer is no pieces, never `NaN` many.
    for (const count of [0, -3, Number.NaN]) {
      const { container } = render(<Confetti count={count} />);
      expect(container.querySelectorAll("span"), `count ${count}`).toHaveLength(0);
    }
    expect(render(<Confetti count={2.7} />).container.querySelectorAll("span")).toHaveLength(2);
  });

  it("falls back to the default palette instead of rendering invisible pieces", () => {
    const { container } = render(<Confetti count={3} colors={[]} />);
    const pieces = [...container.querySelectorAll("span")];
    expect(pieces).toHaveLength(3);
    for (const piece of pieces) expect((piece as HTMLElement).style.backgroundColor).not.toBe("");
  });
});

describe("CardRow animation=deal", () => {
  const dealt = (cards: (string | null)[], animationKey?: number) => (
    <CardRow cards={cards} size="sm" animation="deal" animationKey={animationKey} />
  );

  it("re-mounts a card that changed, so the deal animation replays", () => {
    const { container, rerender } = render(dealt(["As", "Kh"]));
    const before = [...container.querySelectorAll(".animate-deal-in")];
    rerender(dealt(["Qd", "Kh"]));
    const after = [...container.querySelectorAll(".animate-deal-in")];
    expect(after[0], "changed card should be re-dealt").not.toBe(before[0]);
    expect(after[1], "unchanged card should be left alone").toBe(before[1]);
  });

  it("leaves the DOM alone when nothing changed", () => {
    const { container, rerender } = render(dealt(["As", "Kh"]));
    const before = [...container.querySelectorAll(".animate-deal-in")];
    rerender(dealt(["As", "Kh"]));
    const after = [...container.querySelectorAll(".animate-deal-in")];
    expect(after[0]).toBe(before[0]);
    expect(after[1]).toBe(before[1]);
  });

  it("re-deals the whole hand when animationKey changes (same cards, new round)", () => {
    const { container, rerender } = render(dealt(["As", "Kh"], 1));
    const before = [...container.querySelectorAll(".animate-deal-in")];
    rerender(dealt(["As", "Kh"], 2));
    const after = [...container.querySelectorAll(".animate-deal-in")];
    expect(after[0]).not.toBe(before[0]);
    expect(after[1]).not.toBe(before[1]);
  });
});
