# @stargazeryan/poker-ui

Game-agnostic **React + Tailwind CSS v4** card-table UI: tables, seats and
playing cards.

- 🎯 `CardTable` — a responsive, scale-to-fit table: felt, rail, seat ring, betting line
- 💺 `Seat` — a neutral frame with named slots (`header`, `children`, `footer`, …) and turn/winner/dimmed states
- 🎴 `PlayingCard` / `CardBack` / `HoleCards` / `CommunityCards` — with deal-in and 3D flip animations
- 🪙 `Pot` — an optional pot pill that counts up
- 🎰 `ChipStack` / `Chip` — an amount broken into a real stack of chips
- 🔁 `nextSeatIndex()` — a pure helper for "next seat on the ring"

> Formerly `PokerTable`; kept as a back-compat alias for `CardTable`.

**The split this library is built on:** the components *position and draw*, you
decide *what is true*. Nothing here knows whose turn it is, who won, or whether
an amount is big blinds, dollars or points. You compute that and pass it in.

## Install

```bash
npm install @stargazeryan/poker-ui
```

| Requirement | Version |
| --- | --- |
| `react` | >= 18 |
| `react-dom` | >= 18 |
| `tailwindcss` | >= 4 (not optional — without it the components render unstyled) |

## Setup — the one step people miss

This is a **compiled package**: your app's Tailwind build cannot see the class
names inside it, so it has to be told about them.

```css
/* app.css */
@import "tailwindcss";
@import "@stargazeryan/poker-ui/styles.css";

@source "../node_modules/@stargazeryan/poker-ui";
```

Both extra lines are load-bearing:

- `@source` is what makes the utilities the components use exist in your CSS.
  Without it everything renders but unstyled. Fix the path if your
  `node_modules` lives elsewhere.
- the `styles.css` import brings the `@theme` block: the felt, rail, gold,
  card-back and chip tokens every component draws with.

> `npm run test:consumer` in this repo packs the package, installs it into a
> throwaway app that follows those three lines literally, and asserts the
> utilities, tokens and keyframes all reached the output CSS.

## The smallest useful table

```tsx
import { CardTable, CommunityCards, HoleCards, Pot, Seat } from "@stargazeryan/poker-ui";

export function Table({ hands, board, pot, activeSeat }) {
  return (
    <div style={{ height: 640 }}>
      <CardTable
        seatCount={6}
        renderSeat={(i, box) => (
          <Seat
            width={box.width}
            height={box.height}
            isActive={activeSeat === i}   /* your turn logic, your call */
            header={<b>{i === 0 ? "You" : `Seat ${i}`}</b>}
          >
            <HoleCards cards={hands[i]} size="sm" />
          </Seat>
        )}
        center={
          <>
            <CommunityCards cards={board} size="lg" slots={5} />
            <Pot label="Main" amount={pot} />
          </>
        }
      />
    </div>
  );
}
```

`CardTable` needs a sized container: it lays out in a fixed design box and scales
that box to fit, so `height` (or a flex parent with a real height) is what makes
it visible.

## Who owns what

This is the whole mental model, and it is why the package has no game logic in
it.

| Question | Owner |
| --- | --- |
| Where does seat 3 sit, how big is its frame, where does its bet go? | `CardTable` — one ellipse, computed once and handed to you as `box` |
| Is seat 3 active / winner / folded-out? | **You** — `Seat`'s `isActive` / `isWinner` / `isDimmed` |
| Whose turn is next, blinds, side pots, showdown order? | **You** — `nextSeatIndex()` walks the ring if you want the mechanical part |
| What unit is `240`? | **You** — pass `format` to `Pot`; `formatBB(amount, bb)` is the opt-in poker helper |
| What goes inside a seat? | **You** — slots: 0 cards, 2 cards, an avatar, buttons, anything |

`CardTable` has no game props at all: no `yourTurn`, no `winnerSeats`, no
`yourSeatIndex`. It takes an `overlay` — or `renderOverlay`, which is handed the
geometry — for anything you want drawn on top, and it exports the pieces that
used to be its own decorations. A seat glows because you passed `isWinner`, not
because the table worked something out from an index:

```tsx
<CardTable
  renderOverlay={({ layout }) => (
    <>
      {isMyTurn && <div style={layout.boxes.glow} className="absolute animate-turn-glow rounded-[50%]" />}
      {showdown && <Confetti colors={["#f39c12", "#e74c3c"]} />}
    </>
  )}
  renderSeat={(i, box) => <Seat isActive={activeSeat === i} width={box.width} height={box.height} />}
/>
```

`renderOverlay` receives the design box and everything `layoutSeats` computed,
so a decoration sits on the real ellipse instead of a guess: every ellipse box
(table, felt, rim, glow, betting line), every seat centre, and the frame size
after the auto-shrink.

## Components and their props

The [docs site](demo/) has one page per component with a live demo and the full
API table, and `tests/docs-api.test.ts` reads the real interfaces back so those
tables cannot drift. The short version:

| Component | Props |
| --- | --- |
| `CardTable` | `seatCount` (no upper limit), `seats` or `renderSeat(i, box)`, `bets` or `renderBet(i)` (placed on the betting line, facing the centre), `betRadiusScale` (default 0.72 — the drawn line follows it), `startAngle` (degrees of seat 0, default 90° = directly below the centre), `center`, `ambient` (default true), `overlay` or `renderOverlay(geometry)`, `seatWidth`, `seatHeight`, `seatGap` (default 24), `designWidth`, `designHeight`, `marginX`, `marginY`, `feltGap`, `fit`, `className` |
| `Seat` | states: `isActive`, `isWinner`, `isDimmed`, `animated` (default true); `winnerCrown`, `onClick`, `width`, `height`, `className`, `frameClassName`, `frameStyle`. Slots: `header`, `children`, `footer`, `badge`, `overlay`, `above`, `below`, `topLeft`, `topRight`, `topCenter` |
| `Pot` | `amount`, `label`, `format` (defaults to a plain, locale-grouped number), `animate` (count-up, default true) |
| `ChipStack` | `amount` (chip units), `size`, `denominations`, `maxChips` (default 12), `label`, `className` |
| `Chip` | `value`, `color`, `colorClassName`, `spotColor`, `size`, `label`, `className` |
| `Confetti` | `count` (default 44), `colors` (default a party palette), `className` — fills the box it is rendered into; unmount it to stop it |
| `PlayingCard` | `card` (`"As"`, `"10h"`, `null` = face down), `size`: `xs \| sm \| md \| lg`, `label` |
| `CardBack` | `size`, `label`, `className` |
| `HoleCards` | `cards`, `size`, `deal` (default true), `dealKey` (change it to replay the deal for an unchanged hand) |
| `CommunityCards` | `cards`, `size`, `animated` (default true), `slots` (reserve a fixed width) |

Everything the components do is also available as a pure function, one module
per concern:

| Module | Exports |
| --- | --- |
| `geometry` | `seatAngle`, `ellipsePoint`, `ringPoints` |
| `layout` | `layoutSeats`, `fitSeatScale`, `minSeatSeparation`, `seatPoint`, `tableRadii`, `seatRingRadii`, `ellipseBox`, `SEAT_SHRINK_FLOOR`, `RIM_GAP`, `GLOW_GAP`, `DESIGN_W`, `DESIGN_H`, `DEFAULT_MARGIN_X`, `DEFAULT_MARGIN_Y`, `DEFAULT_FELT_GAP`, `DEFAULT_BET_SCALE`, `DEFAULT_SEAT_GAP`, `DEFAULT_SEAT_W`, `DEFAULT_SEAT_H` |
| `cards` | `parseCard`, `describeCard`, `getRankName`, `getSuitName`, `getSuitSymbol`, `isRedSuit`, `isKnownSuit` |
| `chips` | `chipBreakdown`, `chipsTotal`, `chipCount`, `chipSpotColor`, `DEFAULT_DENOMINATIONS` |
| `color` | `parseColor`, `relativeLuminance`, `flatten`, `contrastRatio`, `mostVisible` |
| `sizes` | `SIZES` |
| `motion` | `COUNT_UP_MS`, `DEAL_STAGGER_MS`, `FLIP_STAGGER_MS` |
| misc | `cn`, `nextSeatIndex`, `formatBB`, `BB` |

Types: `SeatProps`, `CardTableProps`, `SeatBox`, `TableOverlayGeometry`,
`ConfettiProps`, `PotProps`, `PlayingCardProps`,
`CardBackProps`, `HoleCardsProps`, `CommunityCardsProps`, `ChipProps`,
`ChipStackProps`, `CardSize`, `ChipSize`, `Size`, `Point`, `Layout`,
`LayoutOptions`, `SeatLayout`, `EllipseBox`, `Rgba`, `ParsedCard`,
`Denomination`, `ChipStackEntry`.

## Amounts and units

Nothing attaches a unit for you. `Pot` renders a plain, locale-grouped number
and `ChipStack` breaks an amount into chips; neither decides that your numbers
are big blinds, dollars or points, because that is a game rule and this is
generic UI.

```tsx
<Pot amount={1234} />                                  {/* 1,234   */}
<Pot amount={1234} format={formatBB} />                {/* 61.7 BB */}
<Pot amount={1234} format={(n) => formatBB(n, 100)} /> {/* 12.3 BB */}
```

`formatBB(amount, bb)` is an opt-in poker helper. Pass your big blind — the
exported `BB = 20` is that helper's own default, not something a component
applies behind your back.

## Chips

`ChipStack` breaks an amount down the way a dealer would — **white 1, red 5, blue
10, green 25, black 100** — and draws the result with the largest chip on top.
Blue is the one that varies between houses (plenty of rooms use 20), so pass
`denominations` to change the set and to give the faces your own labels.

Amounts are in **chip units** (the smallest chip is 1), not big blinds.
`chipBreakdown` is exported on its own if you want the split without the
artwork, and `chipsTotal` reports what is left below the smallest chip instead
of rounding it up. `maxChips` (default 12) keeps a large bet from becoming a
hundred black chips.

## Layout, seat size and responsiveness

Everything is laid out in a fixed **design box** (1200×900 by default) that is
then scaled to fit its container.

| Prop | Default | Meaning |
| --- | --- | --- |
| `designWidth` / `designHeight` | `1200` / `900` | the design box |
| `marginX` / `marginY` | `164/1200`, `196/900` | rail inset, as a **fraction** of the box |
| `feltGap` | `11` | felt inset from the rail, design-space px |
| `seatWidth` / `seatHeight` | `160` / `176` | **preferred** seat frame size |
| `seatGap` | `24` | minimum clearance between neighbouring frames |
| `fit` | `"design"` | `"container"` derives the width from the container |

Because the insets are fractions, a custom design box stays in proportion.

- **`fit="container"` removes letterboxing.** With the default fit, a
  phone-portrait container (390×700) scales the 4:3 box down and wastes ~58% of
  it, so the table ends up tiny. `fit="container"` derives the design width from
  the container's aspect ratio (clamped to 0.5–2.5) instead.
- **Frames shrink to keep their distance.** At 160×176 a 6-seat ring leaves
  161px between neighbours, but a 10-seat ring leaves only 25.6px. The table
  measures the ring and shrinks the frames uniformly (never below 50%) until
  `seatGap` is honoured, so crowded tables never collide. Every `Seat` inside
  the table is told the size that was settled on, so a bare `<Seat />` matches
  the ring whether you pass `renderSeat` or a `seats` array; an explicit
  `width`/`height` still wins.
- **`seatCount` is not clamped.** 11–16 seats lay out fine (measured: 11 →
  126×139 frames, 16 → 80×88); past roughly 16 the frames sit on the 50% floor
  and genuinely overlap. `seatGap={0}` disables the shrink.

```tsx
<CardTable
  seatCount={10}
  seatGap={48}
  renderSeat={(i, isYou, box) => <Seat width={box.width} height={box.height} />}
/>
```

To keep "you" at the bottom, reorder your seat array so the viewer is index 0 —
the package adds no offset. Seat 0 sits at `startAngle` (default 90°, directly
below the centre) and the rest divide 360° evenly.

## Animations

All on by default, each toggleable:

| Effect | Where | Disable with |
| --- | --- | --- |
| Deal-in (hand cards) | `HoleCards` | `deal={false}` |
| 3D flip (community cards) | `CommunityCards` | `animated={false}` |
| Turn glow | `Seat isActive` | `animated={false}` |
| Winner glow | `Seat isWinner` | `animated={false}` |
| Pot count-up | `Pot` | `animate={false}` |
| Ambient felt + spotlight | `CardTable` | `ambient={false}` |
| Your-turn edge glow | your own ring in `CardTable`'s `overlay` | render it conditionally |
| Confetti | `<Confetti />` | render it conditionally |

The CSS animations are disabled automatically under
`prefers-reduced-motion`. The `Pot` count-up is a `requestAnimationFrame` loop,
so it is not covered by that media query — it checks for itself instead.

Animation timings are theme tokens, so Tailwind only ships the keyframes your
app actually uses.

## "Whose turn is next?"

Turn order is game logic, not UI. Compute it in your engine, pass the result into
`Seat`'s `isActive`, and draw whatever the table edge should show through
`CardTable`'s `overlay`. One generic helper walks the ring:

```ts
import { nextSeatIndex } from "@stargazeryan/poker-ui";

const next = nextSeatIndex(current, seatCount, {
  dir: 1,                        // +1 clockwise, -1 counter-clockwise
  skip: (i) => players[i].out,   // folded, sitting out, empty
});
```

It wraps, returns `current` when every other seat is skipped, and tolerates a
`NaN` or negative seat count. Heads-up preflop order, blinds, side pots and
run-it-twice are not here, and should not be.

## Theming

Every colour a component draws with comes from a Tailwind theme token, and every
token in `styles.css` is referenced by a component — so overriding one actually
restyles the table, with no `!important` and no per-component overrides:

```css
@theme {
  --color-felt: #0b3d2e;
  --color-felt-light: #14563a;
  --color-felt-dark: #062418;

  --color-rail: #7a5230;
  --color-rail-dark: #4d3119;
  --color-rail-deep: #28190c;

  --color-gold: #ffcc33;       /* turn + winner glow, pot pill, focus ring */
  --color-gold-light: #ffe08a; /* ambient glow behind the table */
  --color-gold-glow: #fff0c2;  /* spotlight on the felt */

  --color-card-back: #14315a;
  --color-card-back-light: #1e4577;
  --color-card-back-dark: #0b1d36;
  --color-card-back-ink: #9fc0e8;
  --color-card-back-emblem: #ffd98a;

  --color-chip-blue: #1d4ed8;  /* chip faces */
}
```

The [docs site](demo/) lists every token with the value it ships and has a live
editor that sets these properties on a wrapper — which is exactly what an
override in your `@theme` does document-wide.

Confetti colours are the one exception: `Confetti`'s `colors` is a prop, because
those colours land in inline styles that Tailwind's tree-shaking cannot see.
`className` / `frameClassName` / `frameStyle` are there for the rest.

## Docs site and development

```bash
npm run docs          # docs dev server (imports ../../src, HMR)
npm run docs:build    # builds the package, then the site against dist/
```

`docs:build` compiles the package first and then builds the site against
`dist/index.js` rather than `src`, so the deployed site runs the artefact
consumers actually get.

```bash
npm install --include=dev

npm run typecheck     # tsc --noEmit
npm test              # vitest: unit, component, docs routes, docs-vs-types
npm run build         # tsup -> dist (ESM + CJS + d.ts)
npm run test:consumer # pack + install + build a real consumer app, assert the CSS
npm run check:release vX.Y.Z
```

Tests cover the docs, not just the code: `tests/docs.test.tsx` renders every
route and fails if a page throws, and `tests/docs-api.test.ts` reads the real
interfaces, the `@theme` tokens and the exported constants back and fails when
any documented list drifts from the source.

Releases, versioning and the npm trusted-publisher setup are in
[RELEASING.md](RELEASING.md); behaviour changes per version are in
[CHANGELOG.md](CHANGELOG.md).

## License

MIT © 2026 Ryan
