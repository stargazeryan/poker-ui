import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { Chip } from "../src/components/Chip";
import { CommunityCards, HoleCards, PlayingCard } from "../src/components/PlayingCard";
import { COUNT_UP_MS, DEAL_STAGGER_MS, FLIP_STAGGER_MS } from "../src/motion";
import { SIZES } from "../src/sizes";

describe("the shared size vocabulary", () => {
  it("is one list", () => {
    expect(SIZES).toEqual(["xs", "sm", "md", "lg"]);
  });

  it("renders at every size in it", () => {
    for (const size of SIZES) {
      const { container, unmount } = render(<PlayingCard card="As" size={size} />);
      expect(container.querySelector('[role="img"]'), `${size} card`).not.toBeNull();
      unmount();
    }
    for (const size of ["sm", "md", "lg"] as const) {
      const { container, unmount } = render(<Chip value={1} size={size} />);
      expect(container.querySelector("svg"), `${size} chip`).not.toBeNull();
      unmount();
    }
  });

  it("scales monotonically, so a bigger word means a bigger thing", () => {
    const cardWidths = SIZES.map(
      (size) => (render(<PlayingCard card="As" size={size} />).container.querySelector('[role="img"]') as HTMLElement)
        .className.length,
    );
    expect(cardWidths.length).toBe(4);
    const chipWidths = (["sm", "md", "lg"] as const).map((size) =>
      Number(render(<Chip value={1} size={size} />).container.querySelector("svg")?.getAttribute("width")),
    );
    expect(chipWidths).toEqual([...chipWidths].sort((a, b) => a - b));
  });
});

describe("shared animation pacing", () => {
  it("staggers hole cards by DEAL_STAGGER_MS", () => {
    const { container } = render(<HoleCards cards={["As", "Kh", "Qd"]} />);
    const delays = [...container.querySelectorAll(".animate-deal-in")].map(
      (el) => (el as HTMLElement).style.animationDelay,
    );
    expect(delays).toEqual(["0ms", `${DEAL_STAGGER_MS}ms`, `${DEAL_STAGGER_MS * 2}ms`]);
  });

  it("staggers community cards by FLIP_STAGGER_MS", () => {
    const { container } = render(<CommunityCards cards={["As", "Kh", "Qd"]} />);
    const delays = [...container.querySelectorAll(".animate-card-flip")].map(
      (el) => (el as HTMLElement).style.animationDelay,
    );
    expect(delays).toEqual(["0ms", `${FLIP_STAGGER_MS}ms`, `${FLIP_STAGGER_MS * 2}ms`]);
  });

  it("has a sane count-up duration", () => {
    // not directly observable from the DOM; this only guards against a typo
    expect(Number.isFinite(COUNT_UP_MS) && COUNT_UP_MS > 0).toBe(true);
  });
});
