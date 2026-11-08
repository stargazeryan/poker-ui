import { useState, type CSSProperties } from "react";
import { CardRow, Counter, RoundTable } from "@stargazeryan/poker-ui";
import { ChipStack } from "@stargazeryan/poker-ui/wager";
import { ApiTable, Btn, Callout, CodeBlock, Demo, Field, H2, P, Prop, Row } from "../ui";
import { COLOUR_TOKENS, TOKENS } from "../inventory";
import { SAMPLE, BET_RADIUS, BET_RING, PlayerInfo, SeatRow, handHalf } from "../../examples/parts";

/* --------------------------------------------------------- getting started -- */

const SETUP = `
@import "tailwindcss";
@import "@stargazeryan/poker-ui/styles.css";

@source "../node_modules/@stargazeryan/poker-ui";
`;

/** The no-Tailwind route: the same CSS, already built. */
const COMPILED = `@import "@stargazeryan/poker-ui/compiled.css";`;

const MINIMAL = `
import { CardRow, Counter, RoundTable, Seat } from "@stargazeryan/poker-ui";

export function Table({ hands, board, activeSeat }) {
  return (
    <div style={{ height: 640 }}>
      <RoundTable
        seatCount={6}
        /* A betting line is a ring the caller declares. Declare none and none is drawn. */
        rings={[{ id: "betting-line", radius: 0.72 }]}
        renderSeat={(i, box) => (
          <Seat
            width={box.width}
            height={box.height}
            isActive={activeSeat === i}   /* your state, your call */
            header={<b>{i === 0 ? "You" : "Seat " + i}</b>}
          >
            <CardRow cards={hands[i]} size="sm" />
          </Seat>
        )}
        center={
          <>
            <CardRow cards={board} size="lg" slots={5} animation="flip" />
            <Counter label="Main" amount={240} />
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
        them — 0 cards, 13 cards, an avatar, anything. The library gives you three table <em>shapes</em>, cards, seats
        and a counter, and stays deliberately clear of anything game-specific: whose turn it is, who won and what is
        legal all live in your engine.
      </P>

      <H2>Install</H2>
      <CodeBlock code="npm install @stargazeryan/poker-ui" />
      <P>
        Peer requirements: <Prop>react</Prop> and <Prop>react-dom</Prop> at 18 or newer. Tailwind CSS v4 is needed
        only if you build the CSS yourself — the package also ships the stylesheet already compiled.
      </P>

      <H2>Or skip Tailwind entirely</H2>
      <P>
        The package ships the stylesheet already compiled — every utility, token and keyframe the components use, with{" "}
        <strong>no preflight</strong>, so importing it cannot reset your app&apos;s base styles. One line, no Tailwind
        in your build:
      </P>
      <CodeBlock code={COMPILED} />
      <Callout title="Pick one route, not both.">
        <Prop>styles.css</Prop> is Tailwind <em>source</em> — utilities as <Prop>@utility</Prop>, tokens as{" "}
        <Prop>@theme</Prop> — and expects your own Tailwind v4 build to scan the package. <Prop>compiled.css</Prop>{" "}
        is that same CSS already built, for apps that are not running Tailwind v4 at all. Importing both would emit
        the utilities twice.
      </Callout>

      <H2>Wire up Tailwind</H2>
      <P>
        This is a <strong>compiled</strong> package, so your Tailwind build cannot see the class names used inside it.
        Three lines in your stylesheet fix that:
      </P>
      <CodeBlock code={SETUP} />
      <Callout tone="warn" title="Without the @source line the components render unstyled.">
        Adjust the path if your <Prop>node_modules</Prop> lives somewhere else. This repo&apos;s own CI packs the
        library, installs it into a throwaway app that follows the three lines above literally, and asserts the
        utilities, theme tokens and keyframes all reach the output CSS — so this instruction is tested, not just
        written down.
      </Callout>

      <H2>Two entry points</H2>
      <P>
        <Prop>@stargazeryan/poker-ui</Prop> holds the game-agnostic half: tables, seats, cards, the counter and the
        decorations. The betting half — <Prop>Chip</Prop>, <Prop>ChipStack</Prop>, the breakdown helpers and{" "}
        <Prop>formatBB</Prop> — lives in <Prop>@stargazeryan/poker-ui/wager</Prop>, because a game with no betting
        should not have to carry a chip set. Import chips from the subpath.
      </P>

      <H2>A table</H2>
      <P>
        Everything is presentational. Supply seat content through <Prop>renderSeat</Prop>, and put
        whatever you like in <Prop>center</Prop>. Turn order, betting and legality are your engine&apos;s job.
      </P>
      <CodeBlock code={MINIMAL} />

      <H2>Try it</H2>
      <Demo
        title="Six seats, live"
        description="One of the seats is yours, one is mid-turn, and the board is half dealt. The betting line is a ring this page declared — and the amounts on it are plain pills, because the guide does not pull in the chip editor."
        previewClassName="aspect-[4/3] max-h-[560px] w-full p-0 overflow-hidden"
      >
        <RoundTable
          seatCount={6}
          seatWidth={240}
          seatHeight={112}
          rings={[BET_RING]}
          slots={[
            {
              id: "bet",
              radius: BET_RADIUS,
              render: (i) =>
                SAMPLE.bets[i] ? (
                  <span className="rounded-full border border-gold/50 bg-neutral-900/80 px-2 py-0.5 font-mono text-[10px] text-gold-light">
                    {SAMPLE.bets[i]}
                  </span>
                ) : null,
            },
          ]}
          renderSeat={(i, box) => (
            <SeatRow
              width={box.width}
              height={box.height}
              isActive={i === 3}
              info={<PlayerInfo index={i} />}
              hold={handHalf(i === 0 ? SAMPLE.hand : SAMPLE.faceDown)}
            />
          )}
          center={
            <div className="flex flex-col items-center gap-4">
              <CardRow cards={SAMPLE.board.slice(0, 3)} size="lg" slots={5} animation="flip" />
              <Counter label="Main" amount={240} />
            </div>
          }
        />
      </Demo>
    </>
  );
}

/* --------------------------------------------------------------- theming -- */

/**
 * One picker per colour token, and one row per token of any kind — both derived
 * from `inventory.ts`, so a token the package ships cannot be missing here.
 * tests/docs-api.test.ts compares that list against `src/styles.css`.
 */
const TOKEN_FIELDS = COLOUR_TOKENS.map((t) => ({
  name: t.name,
  label: t.name.replace(/^--color-/, ""),
  initial: t.value,
}));

const TOKEN_ROWS = TOKENS.map((t) => ({
  name: t.name,
  type: t.kind === "colour" ? "colour" : "animation",
  default: t.value,
  description: t.controls,
}));

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
      <P>
        On the <Prop>compiled.css</Prop> route there is no <Prop>@theme</Prop> block to edit, so set the same custom
        properties — <Prop>--color-felt</Prop> and the rest — yourself, exactly as the editor below does.
      </P>
      <Callout title="This only works because the components actually reference the tokens.">
        Tailwind v4 emits a theme variable only when something uses it. In 0.5.0 the felt, rail, gold and card-back
        colours were hard-coded hex values, so none of the documented tokens reached the output CSS and overriding them
        did nothing. Now they are wired through, and this repo&apos;s consumer smoke test asserts it.
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
        description={`Every colour below comes from the ${TOKEN_FIELDS.length} custom properties set on the wrapper — one picker per colour token the package ships.`}
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
          <div style={tokens as CSSProperties} className="aspect-[4/3] max-h-[560px] w-full">
            <RoundTable
              seatCount={6}
              seatWidth={240}
              seatHeight={112}
              rings={[BET_RING]}
              renderSeat={(i, box) => (
                <SeatRow
                  width={box.width}
                  height={box.height}
                  isActive={i === 3}
                  info={<PlayerInfo index={i} />}
                  hold={handHalf(i === 0 ? SAMPLE.hand : SAMPLE.faceDown)}
                />
              )}
              center={
                <div className="flex flex-col items-center gap-3">
                  <CardRow cards={SAMPLE.board.slice(0, 3)} size="lg" animation="flip" />
                  <div className="flex items-center gap-3">
                    <Counter label="Main" amount={240} />
                    <ChipStack amount={65} size="sm" />
                  </div>
                </div>
              }
            />
          </div>
        </div>
      </Demo>

      <H2>Tokens</H2>
      <P>
        Every token the package ships, with the value it ships. The colour ones are the pickers above; the animation ones
        are timings — override them in <Prop>@theme</Prop> the same way. (Compare with{" "}
        <Prop>inventory.ts</Prop>, which this table and the pickers are both generated from.)
      </P>
      <ApiTable rows={TOKEN_ROWS} caption="Every token" />
      <P>
        The furniture is a token now as well: <Prop>--color-surface</Prop>, <Prop>--color-surface-border</Prop>,{" "}
        <Prop>--color-surface-ink</Prop> and <Prop>--color-muted</Prop> are what a seat frame and a counter pill are
        drawn with, and <Prop>--color-line</Prop> is the outline a declared ring is drawn with. The first four used to be
        Tailwind&apos;s own neutrals, hard-coded into the two components — which is why a light or a branded table meant
        overriding a class on every component instead of setting a token once.
      </P>
      <P>
        Confetti colours are the one exception: they are inline styles, which Tailwind&apos;s tree-shaking cannot see, so
        they are a prop (<Prop>colors</Prop> on <Prop>Confetti</Prop>) rather than tokens.
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
    "The table types are only three shapes",
    "Round, square and dealer are the three ways the library arranges people. A seating that is none of them — a wheel of options, seats on two opposite arcs, anything irregular — means composing FitBox and the functions in frames.ts yourself, or setting CardTable's own shape and seatPlacement props. That is the same code the three types are built from, so nothing is hidden, but there is no named component to reach for.",
  ],
  [
    "CardFan's arc is decorative",
    "CardFan overlaps a large hand so it fits, and arc splays the tops by rotating each card about a pivot below the row. It is a visual fan, not a solved arc: the pivot and rotation are fixed, and the cards are not laid on a true circle. For fitting, pass fitWidth — usually a seat frame's — and the overlap is chosen from it, never looser than the overlap you asked for; arc is the one that only looks nice.",
  ],
  [
    "Reduced motion is per-component, not global",
    "Each animation checks for itself: the CSS ones through a media query scoped to this package's own animation classes, and the Counter count-up through matchMedia, because a rAF loop is out of reach of any media query. There is no central switch, so a new animation has to remember to opt in.",
  ],
  [
    "Confetti never stops on its own",
    "<Confetti /> runs on an infinite iteration count for as long as it is mounted: there is no built-in timeout, so stopping it means unmounting it (which is what a caller who knows when the celebration is over will do anyway). The upside of it being a component is that the caller decides exactly that.",
  ],
  [
    "Seats don't rotate",
    "Frames on the left and right of the table keep upright text. There is no option to orient a seat along the ellipse.",
  ],
  [
    "A seat frame is a fixed size with no overflow handling",
    "A seat frame does not clip or scroll its content. CardRow at size=\"lg\" is wider than the default 160px frame for two cards, and a 13-card hand laid out flat is wider still — CardFan overlaps the cards so a large hand fits, but nothing forces a seat to use it, and the fan's own width is cards × (1 − overlap) plus one card. Use a fan or a smaller size inside seats.",
  ],
  [
    "Accessibility is still incomplete",
    "Cards and chips name themselves (describeCard for the artwork, the chip breakdown), a Counter's settled amount is a live region, and a Seat can be given a name (label) and reports which seat is current. What is still yours: a Seat's slots are named by their content, and the confetti is a purely visual reward. A four-colour deck is available (PlayingCard fourColor) because a standard deck carries the suit by hue alone where there is no room for the suit letter — it is a prop rather than the default, because it is not what a physical deck looks like.",
  ],
  [
    "Units are yours, and nothing checks them",
    "Counter renders a plain number by default and formatBB(amount, bb) is an opt-in poker helper from the wager entry, because a big blind is a game rule and this is generic UI. The cost is that nothing stops you showing big-blind amounts in one place and chip amounts in another on the same table: the library has no unit concept, deliberately, so it cannot catch that for you.",
  ],
  [
    "The design box is measured after mount, so the server's markup is unscaled",
    "FitBox (and therefore every table type and CardTable) measures its container in a layout effect, so a server-rendered page ships the design box at 1:1 and it scales on the client — a layout shift rather than a crash, and one tests/ssr.test.tsx pins so that a change to the measuring has to say so. The built entry points carry a \"use client\" banner, which is what lets them be imported from a server-component tree. The React 18 warning this page used to list is gone: the effect is chosen per environment, which measurably took react-dom 18.3.1 from five warnings per page to none.",
  ],
  [
    "The overlay slot is pointer-events-none",
    "CardTable's overlay layer does not capture clicks, so it cannot swallow a tap meant for a seat under it. Want something interactive up there? Turn pointer events back on for your own element.",
  ],
  [
    "Releases are deliberate, but manual",
    "A tag alone publishes nothing: publishing a GitHub Release runs release.yml, which uses npm trusted publishing (so no token is stored anywhere) and attaches provenance. Version bumps are still a human running npm version, and the CHANGELOG is hand-written — there are no changesets.",
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
        <Field
          label="fixed in this branch:"
          value="glass-half-built tables · dead theme tokens · counter overshoot · deal replay · invisible chip spots · units and seat limits decided by components · reduced-motion scope · one source for the geometry and the seat frame size · CardTable owns no game state (overlay slot + standalone Confetti) · the package split into a game-agnostic core and a wager entry · five React 18 server-render warnings per page · a betting line at 1.2:1 · a nameplate drawn at 3px on a phone · a bubble clipped by the box it was drawn in · a winner and a current seat drawn the same · furniture that was not a token · a chip count at 10px of 40% ink · a suit carried by hue alone"
        />
      </Row>
    </>
  );
}
