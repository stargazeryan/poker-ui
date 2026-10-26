import { describe, expect, it } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { HoleCards } from "../src/components/PlayingCard";
import { Pot } from "../src/components/Pot";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe("Pot count-up", () => {
  // The counter used to hold its "from" value in a ref that was only updated
  // once an animation finished, so interrupting it restarted from the value the
  // previous animation began at: the number jumped backwards on screen.
  it("never counts backwards when the amount changes mid-animation", async () => {
    const seen: number[] = [];
    const fmt = (n: number) => {
      seen.push(n);
      return `${n}`;
    };
    const { rerender } = render(<Pot amount={0} format={fmt} />);
    rerender(<Pot amount={1000} format={fmt} />);
    await sleep(120); // interrupt mid-flight
    rerender(<Pot amount={2000} format={fmt} />);
    await waitFor(() => expect(seen[seen.length - 1]).toBe(2000), { timeout: 3000 });

    const drops = seen.filter((v, i) => i > 0 && v < seen[i - 1]);
    expect(drops, `the counter went backwards: ${seen.join(" -> ")}`).toEqual([]);
  });

  it("animates from where it actually is, not from the last target", async () => {
    const seen: number[] = [];
    const fmt = (n: number) => {
      seen.push(n);
      return `${n}`;
    };
    const { rerender } = render(<Pot amount={0} format={fmt} />);
    rerender(<Pot amount={800} format={fmt} />);
    await sleep(150);
    const midway = seen[seen.length - 1];
    expect(midway).toBeGreaterThan(0);
    rerender(<Pot amount={40} format={fmt} />); // now count DOWN
    await waitFor(() => expect(seen[seen.length - 1]).toBe(40), { timeout: 3000 });
    // it must pass through "midway" on the way down rather than snapping there
    expect(seen).toContain(midway);
  });
});

describe("HoleCards deal animation", () => {
  it("re-mounts a card that changed, so the deal animation replays", () => {
    const { container, rerender } = render(<HoleCards cards={["As", "Kh"]} size="sm" />);
    const before = [...container.querySelectorAll(".animate-deal-in")];
    rerender(<HoleCards cards={["Qd", "Kh"]} size="sm" />);
    const after = [...container.querySelectorAll(".animate-deal-in")];
    expect(after[0], "changed card should be re-dealt").not.toBe(before[0]);
    expect(after[1], "unchanged card should be left alone").toBe(before[1]);
  });

  it("leaves the DOM alone when nothing changed", () => {
    const { container, rerender } = render(<HoleCards cards={["As", "Kh"]} size="sm" />);
    const before = [...container.querySelectorAll(".animate-deal-in")];
    rerender(<HoleCards cards={["As", "Kh"]} size="sm" />);
    const after = [...container.querySelectorAll(".animate-deal-in")];
    expect(after[0]).toBe(before[0]);
    expect(after[1]).toBe(before[1]);
  });

  it("re-deals the whole hand when dealKey changes (same cards, new round)", () => {
    const { container, rerender } = render(<HoleCards cards={["As", "Kh"]} size="sm" dealKey={1} />);
    const before = [...container.querySelectorAll(".animate-deal-in")];
    rerender(<HoleCards cards={["As", "Kh"]} size="sm" dealKey={2} />);
    const after = [...container.querySelectorAll(".animate-deal-in")];
    expect(after[0]).not.toBe(before[0]);
    expect(after[1]).not.toBe(before[1]);
  });
});
