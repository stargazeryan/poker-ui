// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import {
  CardBack,
  CardRow,
  CardSlot,
  CardTable,
  Confetti,
  Counter,
  DealerTable,
  FitBox,
  PlayingCard,
  RoundTable,
  Seat,
  SquareTable,
  type SeatBox,
} from "../src/index";
import { Chip, ChipStack } from "../src/wager";

/*
 * What a server render actually does: no DOM, no effects, a string out the other
 * side. Nothing in the suite used to cover it, and the docs' "known gaps" page
 * made a claim about it — that the measuring effect "warns on the server" — which
 * is worth a test rather than a claim either way, because the answer decides
 * whether a Next.js consumer sees console noise on every page.
 *
 * The claim turned out to be version-specific, and measuring beat guessing: on
 * react-dom 18.3.1 the built package produced five "useLayoutEffect does nothing
 * on the server" warnings per render, and on React 19 none. The effect is chosen
 * per environment — `typeof window === "undefined" ? useEffect : useLayoutEffect`
 * — and that is a decision made once per **process**, at module load.
 *
 * Which is why this file runs in the `node` environment and not in the default
 * one: under jsdom `window` exists, so the module picks the layout effect, and a
 * React 18 server render inside that same process warns — a file whose job is to
 * prove the render is silent, failing for running in the wrong environment. With
 * no DOM at all, both React versions are silent and this pins both halves rather
 * than the one the repo happens to run.
 */
const seat = (index: number, box: SeatBox) => (
  <Seat key={index} width={box.width} height={box.height} header={`p${index}`} />
);

describe("server rendering — no DOM, no effects", () => {
  it("renders every component without throwing and without a React warning", () => {
    // React logs through console.error, so that is what "the warning" would be.
    const complaints = vi.spyOn(console, "error").mockImplementation(() => {});

    const cases: Array<[string, string]> = [
      ["RoundTable", renderToString(<RoundTable seatCount={6} renderSeat={seat} />)],
      ["SquareTable", renderToString(<SquareTable seatCount={4} renderSeat={seat} />)],
      ["DealerTable", renderToString(<DealerTable handCount={3} />)],
      ["CardTable", renderToString(<CardTable seatCount={4} renderSeat={seat} />)],
      ["Seat", renderToString(<Seat header="x" />)],
      ["Counter", renderToString(<Counter label="Main" amount={240} />)],
      ["PlayingCard", renderToString(<PlayingCard card="As" />)],
      ["CardBack", renderToString(<CardBack />)],
      ["CardRow", renderToString(<CardRow>{["As", "Kh"].map((code, i) => <PlayingCard key={i} card={code} />)}</CardRow>)],
      ["PlayingCard (turning)", renderToString(<PlayingCard card="As" flipKey={1} />)],
      ["PlayingCard (hidden)", renderToString(<PlayingCard card="As" revealed={false} />)],
      [
        "CardRow (arced, overlapped)",
        renderToString(
          <CardRow arc={30} overlap={20}>
            {["As", "Kh"].map((code, i) => (
              <PlayingCard key={i} card={code} />
            ))}
          </CardRow>,
        ),
      ],
      ["CardSlot (empty)", renderToString(<CardSlot />)],
      ["CardSlot (filled)", renderToString(<CardSlot>{<PlayingCard card="As" />}</CardSlot>)],
      ["Confetti", renderToString(<Confetti count={8} />)],
      ["ChipStack", renderToString(<ChipStack amount={487} />)],
      ["Chip", renderToString(<Chip value={25} />)],
      ["FitBox", renderToString(<FitBox>{() => <div>content</div>}</FitBox>)],
    ];

    for (const [name, html] of cases) {
      // A component that renders nothing on the server is not a pass.
      expect(html.length, `${name} rendered something`).toBeGreaterThan(20);
    }
    // ...and the content reached the markup, not just the wrapper elements.
    const table = cases.find(([name]) => name === "RoundTable")![1];
    expect(table).toContain("p0");

    expect(complaints.mock.calls, `React complained on the server: ${String(complaints.mock.calls[0]?.[0] ?? "")}`).toHaveLength(0);
  });

  it("draws the design box at 1:1 on the server, because there is nothing to measure yet", () => {
    // The documented consequence of measuring in a layout effect: the server's
    // markup is the design box unscaled, and it settles after mount. Pinning it
    // here means a future change to the measuring has to say so.
    // one text node, or React breaks it up with a `<!-- -->` marker
    const html = renderToString(<FitBox>{({ scale }) => <div>{`scale ${scale}`}</div>}</FitBox>);
    expect(html).toContain("scale 1");
    expect(html).not.toContain("scale 0");
  });
});
