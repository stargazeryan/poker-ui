import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { Chip, ChipStack } from "../src/components/Chip";
import {
  DEFAULT_DENOMINATIONS,
  chipBreakdown,
  chipCount,
  chipsTotal,
  type Denomination,
} from "../src/chips";

const pairs = (amount: number, denominations?: Denomination[]) =>
  chipBreakdown(amount, denominations).map((e) => [e.value, e.count]);

describe("chipBreakdown", () => {
  it("uses the greedy set a dealer would use, biggest denomination first", () => {
    expect(pairs(285)).toEqual([
      [100, 2],
      [25, 3],
      [10, 1],
    ]);
    expect(pairs(1234)).toEqual([
      [100, 12],
      [25, 1],
      [5, 1],
      [1, 4],
    ]);
  });

  it("handles the edges", () => {
    expect(pairs(0)).toEqual([]);
    expect(pairs(1)).toEqual([[1, 1]]);
    expect(pairs(4)).toEqual([[1, 4]]);
    expect(pairs(100)).toEqual([[100, 1]]);
    expect(pairs(101)).toEqual([
      [100, 1],
      [1, 1],
    ]);
  });

  it("leaves blue at 10 by default — the blue-is-20 rooms override it", () => {
    // 20 is two blue chips here, not one blue-20 chip. That is the documented default.
    expect(pairs(20)).toEqual([[10, 2]]);
    const blueIs20: Denomination[] = [
      { value: 100, color: "#1a1a2e" },
      { value: 20, color: "#2980b9" },
      { value: 1, color: "#ecf0f1" },
    ];
    expect(pairs(20, blueIs20)).toEqual([[20, 1]]);
    expect(pairs(140, blueIs20)).toEqual([
      [100, 1],
      [20, 2],
    ]);
  });

  it("sorts whatever order the denominations arrive in", () => {
    const shuffled: Denomination[] = [
      { value: 1, color: "#ecf0f1" },
      { value: 100, color: "#1a1a2e" },
      { value: 10, color: "#2980b9" },
    ];
    expect(pairs(123, shuffled)).toEqual([
      [100, 1],
      [10, 2],
      [1, 3],
    ]);
  });

  it("ignores junk denominations and junk amounts instead of producing NaN", () => {
    const junk = [
      { value: 0, color: "#000" },
      { value: -5, color: "#000" },
      { value: NaN, color: "#000" },
      { value: 5, color: "#c0392b" },
    ] as Denomination[];
    expect(pairs(12, junk)).toEqual([[5, 2]]);
    expect(pairs(NaN)).toEqual([]);
    expect(pairs(-50)).toEqual([]);
    expect(pairs(Infinity)).toEqual([]);
  });

  it("floors a fractional amount rather than rounding up", () => {
    expect(pairs(12.9)).toEqual([
      [10, 1],
      [1, 2],
    ]);
    // and chipsTotal shows the shortfall, it does not hide it
    expect(chipsTotal(chipBreakdown(12.9))).toBe(12);
  });

  it("counts and totals", () => {
    const entries = chipBreakdown(285);
    expect(chipCount(entries)).toBe(6);
    expect(chipsTotal(entries)).toBe(285);
  });
});

describe("the default denominations reference the theme tokens", () => {
  // Tailwind only emits a theme variable that something references. These
  // fill-* utilities are the only thing referencing --color-chip-*, so dropping
  // one silently unthemes that chip instead of failing loudly.
  it("carries a fill-chip-* utility for every default chip", () => {
    expect(DEFAULT_DENOMINATIONS.map((d) => [d.value, d.className])).toEqual([
      [100, "fill-chip-black"],
      [25, "fill-chip-green"],
      [10, "fill-chip-blue"],
      [5, "fill-chip-red"],
      [1, "fill-chip-white"],
    ]);
    for (const d of DEFAULT_DENOMINATIONS) expect(d.color, `fallback colour for ${d.value}`).toMatch(/^#[0-9a-f]{6}$/);
  });
});

describe("Chip", () => {
  it("names itself for screen readers", () => {
    const { container } = render(<Chip value={100} />);
    expect(container.querySelector("svg")?.getAttribute("aria-label")).toBe("100 chip");
    const explicit = render(<Chip value={25} label="twenty five" />);
    expect(explicit.container.querySelector("svg")?.getAttribute("aria-label")).toBe("twenty five");
  });

  it("uses an explicit label when given, and a blank face otherwise", () => {
    const labelled = render(<Chip value="$5" />);
    expect(labelled.container.querySelector("svg")?.getAttribute("aria-label")).toBe("$5 chip");
    const blank = render(<Chip />);
    expect(blank.container.querySelector("svg")?.getAttribute("aria-label")).toBe("chip");
    expect(blank.container.querySelector("text")).toBeNull();
  });

  it("draws eight edge spots and clips them to the body", () => {
    const { container } = render(<Chip value={5} />);
    expect(container.querySelectorAll("rect")).toHaveLength(8);
    const clipId = container.querySelector("clipPath")?.getAttribute("id");
    expect(clipId).toBeTruthy();
    expect(container.querySelector("g")?.getAttribute("clip-path")).toBe(`url(#${clipId})`);
    // ids must be unique per instance, or clips leak between chips
    const two = render(
      <>
        <Chip value={5} />
        <Chip value={10} />
      </>,
    );
    const ids = [...two.container.querySelectorAll("clipPath")].map((c) => c.getAttribute("id"));
    expect(new Set(ids).size).toBe(2);
  });

  it("scales with size", () => {
    const widths = (["sm", "md", "lg"] as const).map(
      (size) => render(<Chip value={1} size={size} />).container.querySelector("svg")?.getAttribute("width"),
    );
    expect(widths).toEqual(["22", "30", "42"]);
  });
});

describe("ChipStack", () => {
  it("draws one chip per count and sums the accessible name", () => {
    const { container } = render(<ChipStack amount={285} />);
    // 2x100 + 3x25 + 1x10 = 6 chips
    expect(container.querySelectorAll("svg")).toHaveLength(6);
    const name = container.querySelector('[role="img"]')?.getAttribute("aria-label");
    expect(name).toBe("285 in 6 chips: 2x100, 3x25, 1x10");
  });

  it("keeps the individual chips out of the accessibility tree", () => {
    const { container } = render(<ChipStack amount={30} />);
    const hidden = container.querySelector('[aria-hidden="true"]');
    expect(hidden).not.toBeNull();
    expect(hidden?.querySelectorAll("svg").length).toBeGreaterThan(0);
  });

  it("caps the drawn chips and says how many are missing", () => {
    const { container } = render(<ChipStack amount={10000} maxChips={6} />);
    expect(container.querySelectorAll("svg")).toHaveLength(6); // 6 x 100
    expect(container.textContent).toContain("+94");
    // raising the cap draws more and drops the badge
    const { container: more } = render(<ChipStack amount={10000} maxChips={200} />);
    expect(more.querySelectorAll("svg")).toHaveLength(100);
    expect(more.textContent).not.toContain("+");
  });

  it("prefers the biggest denominations when it has to truncate", () => {
    const { container } = render(<ChipStack amount={487} maxChips={4} />);
    const values = [...container.querySelectorAll("text")].map((t) => t.textContent);
    expect(values).toEqual(["100", "100", "100", "100"]);
  });

  it("renders nothing but the label for zero, and stays singular for one", () => {
    const { container } = render(<ChipStack amount={0} label={<span>empty</span>} />);
    expect(container.querySelectorAll("svg")).toHaveLength(0);
    expect(container.textContent).toContain("empty");
    expect(container.querySelector('[role="img"]')?.getAttribute("aria-label")).toBe("0 in 0 chips");
    expect(render(<ChipStack amount={1} />).container.querySelector('[role="img"]')?.getAttribute("aria-label")).toBe(
      "1 in 1 chip: 1x1",
    );
  });

  it("honours custom denominations, labels and colours", () => {
    const denominations: Denomination[] = [
      { value: 100, label: "$100", color: "#111111" },
      { value: 20, label: "$20", color: "#222222" },
      { value: 1, label: "$1", color: "#333333" },
    ];
    const { container } = render(<ChipStack amount={141} denominations={denominations} />);
    expect([...container.querySelectorAll("text")].map((t) => t.textContent)).toEqual(["$100", "$20", "$20", "$1"]);
    expect(container.querySelector('[role="img"]')?.getAttribute("aria-label")).toBe(
      "141 in 4 chips: 1x$100, 2x$20, 1x$1",
    );
    // the fallback colour reaches the artwork
    const fills = [...container.querySelectorAll("ellipse")].map((e) => e.getAttribute("fill"));
    expect(fills).toContain("#111111");
    expect(fills).toContain("#222222");
  });

  it("passes the theme utility through so the tokens stay overridable", () => {
    const { container } = render(<ChipStack amount={100} />);
    expect([...container.querySelectorAll("ellipse")].some((e) => e.getAttribute("class") === "fill-chip-black")).toBe(
      true,
    );
  });
});
