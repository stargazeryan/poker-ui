import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { FitBox } from "../src/index";
import { setElementSize } from "./setup";

/**
 * The design box is a **maximum**: it is the largest the table is ever drawn, so
 * a larger container adds empty space instead of enlarging the table, and a
 * smaller one scales everything down by a single factor.
 *
 * `FitBox` renders three nested divs: the measuring container, a box sized to
 * `design * scale`, and the design box itself (drawn at `design` and transformed).
 * These read the last two directly, because those are where `width`, `height` and
 * `scale` end up.
 */
const sizedTo = (container: HTMLElement) => container.firstElementChild!.firstElementChild as HTMLElement;
const designBox = (container: HTMLElement) => sizedTo(container).firstElementChild as HTMLElement;
/** The factor out of `transform: scale(x)`, for caps that are not round numbers. */
const scaleOf = (container: HTMLElement) => parseFloat(designBox(container).style.transform.replace(/[^\d.]/g, ""));

describe("FitBox", () => {
  it("never scales up: a container bigger than the design box is just more empty space", () => {
    setElementSize(1600, 1000); // bigger than the 1200x900 default
    const { container } = render(<FitBox>{() => <div />}</FitBox>);

    expect(designBox(container).style.transform).toBe("scale(1)");
    expect(sizedTo(container).style.width).toBe("1200px");
    expect(sizedTo(container).style.height).toBe("900px");
  });

  it("scales down by one factor when the container is smaller", () => {
    setElementSize(600, 450); // exactly half of 1200x900
    const { container } = render(<FitBox>{() => <div />}</FitBox>);

    expect(designBox(container).style.transform).toBe("scale(0.5)");
    expect(sizedTo(container).style.width).toBe("600px");
    expect(sizedTo(container).style.height).toBe("450px");
  });

  it("lets the tighter axis decide the factor, so the ratio holds", () => {
    setElementSize(1200, 450); // the height is the constraint: 450 / 900
    const { container } = render(<FitBox>{() => <div />}</FitBox>);

    expect(designBox(container).style.transform).toBe("scale(0.5)");
    // half the box is unused width — empty space, not a stretched table
    expect(sizedTo(container).style.width).toBe("600px");
  });

  it("hands the children the design box and the factor", () => {
    const seen: { width: number; height: number; scale: number }[] = [];
    setElementSize(600, 450);
    render(
      <FitBox>
        {({ width, height, scale }) => {
          seen.push({ width, height, scale });
          return <div />;
        }}
      </FitBox>,
    );

    // the box is still the design box (1200x900); only the factor moved
    expect(seen[seen.length - 1]).toEqual({ width: 1200, height: 900, scale: 0.5 });
  });

  it("container mode derives the width from the container's ratio, and is capped too", () => {
    setElementSize(2400, 900); // ratio 2.67 -> clamped to 2.5
    const { container } = render(<FitBox fit="container">{() => <div />}</FitBox>);

    expect(designBox(container).style.width).toBe("2250px"); // 900 * 2.5
    expect(designBox(container).style.transform).toBe("scale(1)"); // still no scaling up
  });

  it("honours a custom design box", () => {
    setElementSize(800, 1200);
    const { container } = render(
      <FitBox designWidth={800} designHeight={1200}>
        {() => <div />}
      </FitBox>,
    );

    expect(designBox(container).style.transform).toBe("scale(1)"); // exactly the design size
    setElementSize(400, 600);
    const smaller = render(
      <FitBox designWidth={800} designHeight={1200}>
        {() => <div />}
      </FitBox>,
    );
    expect(designBox(smaller.container).style.transform).toBe("scale(0.5)");
  });

  it("can be allowed to enlarge, up to the cap it is given", () => {
    setElementSize(2400, 1800); // twice the 1200x900 default
    const { container } = render(<FitBox maxScale={2}>{() => <div />}</FitBox>);

    expect(designBox(container).style.transform).toBe("scale(2)");
    expect(sizedTo(container).style.width).toBe("2400px");
  });

  it("fills the container when the cap is Infinity — what 0.8.x always did", () => {
    setElementSize(2400, 1200); // the height is the constraint here: 1200 / 900
    const { container } = render(<FitBox maxScale={Infinity}>{() => <div />}</FitBox>);

    expect(scaleOf(container)).toBeCloseTo(4 / 3, 6);
    expect(parseFloat(sizedTo(container).style.width)).toBeCloseTo(1600, 3);
  });

  it("treats a nonsense cap as the default one, rather than NaN in a style", () => {
    setElementSize(2400, 1800);
    const { container } = render(<FitBox maxScale={Number.NaN}>{() => <div />}</FitBox>);

    expect(designBox(container).style.transform).toBe("scale(1)");
    expect(sizedTo(container).style.width).toBe("1200px");
  });
});
