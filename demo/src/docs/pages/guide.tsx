import { useState, type CSSProperties } from "react";
import { CardTable, ChipStack, CommunityCards, HoleCards, Pot, Seat } from "@stargazeryan/poker-ui";
import { ApiTable, Btn, Callout, CodeBlock, Demo, Field, H2, P, Prop, Row } from "../ui";

/* --------------------------------------------------------- getting started -- */

const SETUP = `
@import "tailwindcss";
@import "@stargazeryan/poker-ui/styles.css";

@source "../node_modules/@stargazeryan/poker-ui";
`;

const MINIMAL = `
import { CardTable, CommunityCards, HoleCards, Pot, Seat } from "@stargazeryan/poker-ui";

export function Table({ hands, board }) {
  return (
    <div style={{ height: 640 }}>
      <CardTable
        seatCount={6}
        yourSeatIndex={0}
        yourTurn
        renderSeat={(i, isYou, box) => (
          <Seat width={box.width} height={box.height} isActive={isYou} header={<b>{i}</b>}>
            <HoleCards cards={hands[i]} size="sm" />
          </Seat>
        )}
        center={
          <>
            <CommunityCards cards={board} size="lg" slots={5} />
            <Pot label="Main" amount={240} />
          </>
        }
      />
    </div>
  );
}
`;

export function GettingStarted() {
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight text-neutral-50">Getting started</h1>
      <P>
        React + Tailwind CSS v4 card-table UI. Seats are neutral frames with <em>slots</em>, so you decide what goes in
        them — 0 cards, N cards, an avatar, anything. The table supports 2–10 seats, an optional centre slot, and a set
        of game-feel animations that are all on by default and all individually switchable.
      </P>

      <H2>Install</H2>
      <CodeBlock code="npm install @stargazeryan/poker-ui" />
      <P>
        Peer requirements: <Prop>react</Prop> and <Prop>react-dom</Prop> at 18 or newer, plus Tailwind CSS v4.
      </P>

      <H2>Wire up Tailwind</H2>
      <P>
        This is a <strong>compiled</strong> package, so your Tailwind build cannot see the class names used inside it.
        Three lines in your stylesheet fix that:
      </P>
      <CodeBlock code={SETUP} />
      <Callout tone="warn" title="Without the @source line the components render unstyled.">
        Adjust the path if your <Prop>node_modules</Prop> lives somewhere else. This repo's own CI packs the library,
        installs it into a throwaway app that follows the three lines above literally, and asserts the utilities, theme
        tokens and keyframes all reach the output CSS — so this instruction is tested, not just written down.
      </Callout>

      <H2>A table</H2>
      <P>
        Everything is presentational. Supply seat content through <Prop>renderSeat</Prop> or <Prop>seats</Prop>, and put
        whatever you like in <Prop>center</Prop>. Turn order, betting and legality are your engine's job.
      </P>
      <CodeBlock code={MINIMAL} />

      <H2>Try it</H2>
      <Demo
        title="Six seats, live"
        description="One of the seats is yours, one is mid-turn, and the board is half dealt."
        previewClassName="h-[420px] w-full p-0 overflow-hidden"
      >
        <CardTable
          seatCount={6}
          yourSeatIndex={0}
          yourTurn
          renderSeat={(i, isYou, box) => (
            <Seat
              width={box.width}
              height={box.height}
              isActive={i === 3}
              header={<span className="w-full truncate text-center font-semibold">{isYou ? "You" : `Seat ${i}`}</span>}
              footer={<span className="w-full text-center font-mono text-gold-light">100 BB</span>}
            >
              {i % 2 === 0 ? <HoleCards cards={["As", "Kh"]} size="sm" /> : <HoleCards cards={[null, null]} size="sm" />}
            </Seat>
          )}
          center={
            <div className="flex flex-col items-center gap-4">
              <CommunityCards cards={["Ah", "Kd", "7c", null, null]} size="lg" />
              <Pot label="Main" amount={240} />
            </div>
          }
        />
      </Demo>
    </>
  );
}

/* --------------------------------------------------------------- theming -- */

const TOKEN_FIELDS = [
  { name: "--color-felt", label: "felt", initial: "#0f4d2e" },
  { name: "--color-felt-light", label: "felt-light", initial: "#23804b" },
  { name: "--color-felt-dark", label: "felt-dark", initial: "#093b22" },
  { name: "--color-rail", label: "rail", initial: "#a5744a" },
  { name: "--color-gold", label: "gold", initial: "#f39c12" },
  { name: "--color-card-back", label: "card-back", initial: "#5a0c18" },
  { name: "--color-chip-red", label: "chip-red", initial: "#c0392b" },
  { name: "--color-chip-blue", label: "chip-blue", initial: "#2980b9" },
];

const TOKEN_DOCS = [
  { token: "--color-felt / -light / -dark", controls: "the felt gradient" },
  { token: "--color-rail / -dark / -deep", controls: "the wooden rail gradient" },
  { token: "--color-gold", controls: "turn + winner glow, pot pill, focus ring" },
  { token: "--color-gold-light", controls: "the ambient glow behind the table" },
  { token: "--color-gold-glow", controls: "the breathing spotlight on the felt" },
  { token: "--color-card-back / -light / -dark", controls: "the card back gradient" },
  { token: "--color-card-back-ink", controls: "the card back border" },
  { token: "--color-card-back-emblem", controls: "the card back rosette" },
  { token: "--color-chip-red|blue|green|black|white", controls: "the chip denominations used by Chip and ChipStack" },
];

export function Theming() {
  const [tokens, setTokens] = useState<Record<string, string>>(
    Object.fromEntries(TOKEN_FIELDS.map((f) => [f.name, f.initial])),
  );

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight text-neutral-50">Theming</h1>
      <P>
        Every colour the components draw with comes from a Tailwind theme token. Override the token in your own{" "}
        <Prop>@theme</Prop> block and the table restyles — no <Prop>!important</Prop>, no CSS-in-JS, no per-component
        overrides.
      </P>
      <Callout title="This only works because the components actually reference the tokens.">
        Tailwind v4 emits a theme variable only when something uses it. In 0.5.0 the felt, rail, gold and card-back
        colours were hard-coded hex values, so none of the documented tokens reached the output CSS and overriding them
        did nothing. Now they are wired through, and this repo's consumer smoke test asserts it.
      </Callout>

      <H2>Try it</H2>
      <P>
        These pickers set the custom properties on a wrapper element, which is exactly what an override in your{" "}
        <Prop>@theme</Prop> block does for the whole document.
      </P>
      <Demo
        title="Live token editor"
        previewClassName="p-0 overflow-hidden"
        align="start"
        description="Every colour below comes from the six custom properties on the left of the wrapper."
      >
        <div className="w-full">
          <div className="grid grid-cols-2 gap-3 border-b border-white/10 p-4 sm:grid-cols-3">
            {TOKEN_FIELDS.map((f) => (
              <label key={f.name} className="flex items-center gap-2 text-xs text-neutral-400">
                <input
                  type="color"
                  value={tokens[f.name]}
                  onChange={(e) => setTokens((t) => ({ ...t, [f.name]: e.target.value }))}
                  className="h-7 w-9 cursor-pointer rounded border border-white/15 bg-transparent"
                />
                <span className="font-mono">{f.label}</span>
              </label>
            ))}
          </div>
          <div className="flex justify-end border-b border-white/10 px-4 py-2">
            <Btn onClick={() => setTokens(Object.fromEntries(TOKEN_FIELDS.map((f) => [f.name, f.initial])))}>
              reset
            </Btn>
          </div>
          <div style={tokens as CSSProperties} className="h-[420px] w-full">
            <CardTable
              seatCount={6}
              yourSeatIndex={0}
              yourTurn
              winnerSeats={[]}
              renderSeat={(i, isYou, box) => (
                <Seat
                  width={box.width}
                  height={box.height}
                  isActive={i === 3}
                  header={<span className="w-full text-center font-semibold">{isYou ? "You" : i}</span>}
                >
                  <HoleCards cards={["As", "Kh"]} size="sm" />
                </Seat>
              )}
              center={
                <div className="flex flex-col items-center gap-3">
                  <CommunityCards cards={["Ah", "Kd", "7c"]} size="lg" />
                  <div className="flex items-center gap-3">
                    <Pot label="Main" amount={240} />
                    <ChipStack amount={65} size="sm" />
                  </div>
                </div>
              }
            />
          </div>
        </div>
      </Demo>

      <H2>Tokens</H2>
      <ApiTable
        rows={TOKEN_DOCS.map((t) => ({ name: t.token, type: "colour", description: t.controls }))}
      />
      <P>
        Confetti colours are the one exception: they are inline styles, which Tailwind's tree-shaking cannot see, so they
        are a prop (<Prop>confettiColors</Prop>) rather than tokens.
      </P>
      <P>
        Individual components also take <Prop>className</Prop>; <Prop>Seat</Prop> additionally takes{" "}
        <Prop>frameClassName</Prop> and <Prop>frameStyle</Prop> for its inner frame.
      </P>
    </>
  );
}

/* ------------------------------------------------------------ known gaps -- */

const GAPS: Array<[string, string]> = [
  [
    "parseCard doesn't validate",
    'It splits the last character off as the suit, so "xyz" parses as rank "xy" / suit "z" and renders a literal "z". No rank or suit validation, and no case normalisation, so "as" stays lowercase. Card codes are trusted input today.',
  ],
  [
    "Reduced motion is uneven",
    "All CSS animations stop under prefers-reduced-motion, but the rule shipped in styles.css uses a global `*` selector with !important, which also disables your own app's animations and transitions. And the Pot count-up is a rAF loop, so the media query cannot reach it at all.",
  ],
  [
    "Confetti never stops",
    "The 44 confetti spans run on an infinite iteration count for as long as winnerSeats is non-empty. There is no timeout and no cleanup, so a long-lived winner keeps animating.",
  ],
  [
    "Seats don't rotate",
    "Frames on the left and right of the table keep upright text. There is no option to orient a seat along the ellipse.",
  ],
  [
    "Seat content can overflow the frame",
    "A seat frame is a fixed size with no overflow handling. HoleCards at size=\"lg\" is 200px wide, wider than the default 160px frame, so it spills out.",
  ],
  [
    "Accessibility is incomplete",
    "PlayingCard has no accessible name (a screen reader reads the fragments \"A\" and \"♠\"), CardBack has none either, and Pot has no aria-live, so the count-up is silent. Suit colour is also the main cue at small sizes.",
  ],
  [
    "Units are yours, and nothing checks them",
    "Pot renders a plain number by default and formatBB(amount, bb) is an opt-in poker helper, because a big blind is a game rule and this is generic UI. The cost is that nothing stops you showing big-blind amounts in one place and chip amounts in another on the same table: the library has no unit concept, deliberately, so it cannot catch that for you.",
  ],
  [
    "The seats array isn't auto-shrunk",
    "seatGap needs renderSeat, because that is the only form where the table can size the frames. If you build a seats array by hand, match Seat's width/height to CardTable's seatWidth/seatHeight yourself.",
  ],
  [
    "CardTable uses useLayoutEffect unconditionally",
    "That warns on the server. It is guarded by a \"use client\" banner, so it works in a client component, but SSR of a client component still logs the warning.",
  ],
  [
    "tailwindcss is a documented peer but not a declared one",
    "peerDependencies lists only react and react-dom, so npm will not warn about an incompatible Tailwind.",
  ],
  [
    "No release pipeline",
    "Version bumps are manual and there is no npm publish workflow, no changesets and no provenance. CI does verify typecheck, tests, the package build and the consumer path.",
  ],
  [
    "nextSeatIndex is a helper, not turn order",
    "It walks the ring and skips whatever you tell it to skip. Betting rules, side pots, heads-up preflop order and the like belong in your engine.",
  ],
];

export function KnownGaps() {
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight text-neutral-50">Known gaps</h1>
      <P>
        The things this library does not do yet, written down rather than discovered by you. Everything else the docs
        show is exercised by the test suite or the consumer smoke test.
      </P>
      <div className="mt-6 divide-y divide-white/[0.07] overflow-hidden rounded-xl border border-white/10">
        {GAPS.map(([title, body]) => (
          <div key={title} className="px-4 py-3">
            <div className="text-sm font-semibold text-neutral-100">{title}</div>
            <div className="mt-1 text-sm leading-relaxed text-neutral-400">{body}</div>
          </div>
        ))}
      </div>
      <Row className="mt-4">
        <Field label="fixed in this branch:" value="betting-line desync, dead theme tokens, +/- counter overshoot, deal replay" />
      </Row>
    </>
  );
}
