import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { Seat } from "../src/components/Seat";
import { Pot } from "../src/components/Pot";
import { formatBB } from "../src/format";

describe("Seat", () => {
  it("renders every slot it is given and nothing it is not", () => {
    const { container, getByText } = render(
      <Seat
        header={<span>You</span>}
        footer={<span>100 BB</span>}
        badge={<span>badge</span>}
        overlay={<span>overlay</span>}
        above={<span>above</span>}
        below={<span>below</span>}
        topLeft={<span>tl</span>}
        topRight={<span>tr</span>}
        topCenter={<span>tc</span>}
      >
        <span>cards</span>
      </Seat>,
    );
    for (const t of ["You", "100 BB", "badge", "overlay", "above", "below", "tl", "tr", "tc", "cards"]) {
      expect(getByText(t), t).toBeTruthy();
    }
    const bare = render(<Seat />);
    expect(bare.container.textContent).toBe("");
    expect(container.firstElementChild?.className).toContain("relative");
  });

  it("applies the active / winner / dimmed states", () => {
    const active = render(<Seat isActive />);
    expect(active.container.innerHTML).toContain("animate-turn-glow");
    expect(active.container.innerHTML).toContain("border-gold");

    const winner = render(<Seat isWinner />);
    expect(winner.container.innerHTML).toContain("animate-winner-glow");

    const still = render(<Seat isActive animated={false} />);
    expect(still.container.innerHTML).not.toContain("animate-turn-glow");
    expect(still.container.innerHTML).toContain("border-gold");

    expect(render(<Seat isDimmed />).container.innerHTML).toContain("opacity-50");
  });

  it("uses the themed gold token rather than a hard-coded colour", () => {
    // The animated variant goes through the `border-gold` utility (themed in
    // styles.css); the static one needs the token inline.
    const animated = render(<Seat isActive />);
    expect(animated.container.innerHTML).toContain("border-gold");
    expect(animated.container.innerHTML).not.toContain("amber-400");

    const still = render(<Seat isActive animated={false} />);
    expect(still.container.innerHTML).toContain("var(--color-gold)");
    expect(still.container.innerHTML).not.toContain("243,156,18");
  });

  it("shows a default crown only when isWinner + winnerCrown", () => {
    expect(render(<Seat isWinner winnerCrown />).container.textContent).toContain("👑");
    expect(render(<Seat isWinner />).container.textContent).not.toContain("👑");
    // an explicit topLeft wins over the crown
    expect(render(<Seat isWinner winnerCrown topLeft={<span>tl</span>} />).container.textContent).not.toContain("👑");
  });

  it("is a keyboard-accessible button when onClick is given", () => {
    const onClick = vi.fn();
    const { container } = render(<Seat onClick={onClick} />);
    const frame = container.querySelector('[role="button"]') as HTMLElement;
    expect(frame.tabIndex).toBe(0);
    fireEvent.click(frame);
    expect(onClick).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(frame, { key: "Enter" });
    fireEvent.keyDown(frame, { key: " " });
    expect(onClick).toHaveBeenCalledTimes(3);
    fireEvent.keyDown(frame, { key: "a" });
    expect(onClick).toHaveBeenCalledTimes(3);
  });

  it("is not focusable without onClick", () => {
    const { container } = render(<Seat />);
    expect(container.querySelector('[role="button"]')).toBeNull();
  });

  it("sizes the frame from width/height", () => {
    const { container } = render(<Seat width={120} height={140} />);
    const root = container.firstElementChild as HTMLElement;
    const frame = root.firstElementChild as HTMLElement;
    expect(root.style.width).toBe("120px");
    expect(frame.style.width).toBe("120px");
    expect(frame.style.height).toBe("140px");
  });
});

describe("Pot", () => {
  it("formats with the default BB formatter", () => {
    const { container } = render(<Pot amount={240} animate={false} />);
    expect(container.textContent).toContain(formatBB(240));
    expect(container.textContent).toContain("12 BB");
  });

  it("renders the optional label", () => {
    expect(render(<Pot amount={10} label="Main" animate={false} />).container.textContent).toContain("Main");
    expect(render(<Pot amount={10} animate={false} />).container.textContent).not.toContain("Main");
  });

  it("accepts a custom formatter", () => {
    const { container } = render(<Pot amount={240} format={(n) => `$${n}`} animate={false} />);
    expect(container.textContent).toContain("$240");
  });

  it("counts up to a new amount when it changes", async () => {
    const { container, rerender } = render(<Pot amount={100} />);
    expect(container.textContent).toContain(formatBB(100));
    rerender(<Pot amount={240} />);
    await waitFor(() => expect(container.textContent).toContain(formatBB(240)), { timeout: 2000 });
  });

  it("uses the themed gold token", () => {
    expect(render(<Pot amount={10} />).container.innerHTML).toContain("text-gold");
  });
});
