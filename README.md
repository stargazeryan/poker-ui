# @stargazeryan/poker-ui

Game-agnostic **React + Tailwind CSS v4** card-table UI. Three table shapes,
seats, cards, and — one subpath over — chips.

- 🃏 **Table types** — `RoundTable`, `SquareTable`, `DealerTable`: shapes and
  arrangements, not games
- 📐 **`CardTable`** — the engine all three are presets of: a surface, a seat
  placement, and slots for rings, per-seat content and an overlay
- 💺 **`Seat`** — a neutral frame with named slots (`header`, `children`, …) and
  turn/winner/dimmed states
- 🎴 **`PlayingCard`** / **`CardBack`** / **`CardRow`** / **`CardFan`** /
  **`CardSlot`**
- 🧮 **`Counter`** — a labelled amount that counts up
- 🪙 **`ChipStack`** / **`Chip`** — in `@stargazeryan/poker-ui/wager`
- 📦 **`FitBox`** + **`frames.ts`** — the scaling and the positioning, on their
  own, for a layout that is none of the three

**The split this library is built on:** the components *position and draw*, you
decide *what is true*. Nothing here knows whose turn it is, who won, whether an
amount is big blinds or points — **or which game you are playing**. There is no
`PokerTable` in this package, and there never will be again.

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
> utilities, tokens and keyframes all reached the output CSS — from both entry
> points.

## Table types, not game tables

Three ways card games arrange people. Pick the one your seating looks like:

| Type | Arrangement | Games it fits |
| --- | --- | --- |
| `RoundTable` | everybody around an ellipse, the middle shared | flop games, draw games, trick-taking |
| `SquareTable` | around a rounded rectangle's perimeter, spaced by arc length | four-player shedding games, anything square-ish |
| `DealerTable` | one frame at the head, the players in a row opposite it | twenty-one, banking games, baccarat, dragon-tiger |

```tsx
import { RoundTable, Seat, CardRow, TABLE_TYPES } from "@stargazeryan/poker-ui";

<RoundTable
  seatCount={6}
  renderSeat={(i, box) => (
    <Seat width={box.width} height={box.height} isActive={activeSeat === i}>
      <CardRow cards={hands[i]} size="sm" />
    </Seat>
  )}
/>
```

`TABLE_TYPES` maps `"round" | "square" | "dealer"` to the components, so a client
that lets the player choose a table can do it with a string.

`RoundTable` and `SquareTable` add no props of their own — they are `CardTable`
with the surface and the seat placement already decided, so you never have to
think about ellipses to draw a felt.

## Four games, out of those three types

The docs' **Worked examples** page builds a flop game, a shedding game, a banking
game and twenty-one out of the same two entry points you get. The source is
[`demo/src/examples/games.tsx`](demo/src/examples/games.tsx). Two of them matter:

- **The shedding game declares no `rings`, no `slots` and no `watermark`**, so
  nothing is drawn — no betting line on a game with no betting, no chip anywhere
  in the tree, and a `CardFan` for the thirteen-card hands.
- **The twenty-one and banking games use the same table type** (`DealerTable`)
  and draw no surface at all, because that type has none to draw.

That is the whole argument for table types: a shape serves many games, and a game
you have not written yet can use it today.

## Who owns what

| Question | Owner |
| --- | --- |
| Where does seat 3 sit, how big is its frame, where does the middle of the table sit? | `CardTable` — one surface, one placement, computed once and handed to you as `box` |
| Is seat 3 active / winner / out? | **You** — `Seat`'s `isActive` / `isWinner` / `isDimmed` |
| Whose turn is next, blinds, side pots, showdown order? | **You** — `nextSeatIndex()` walks a ring if you want the mechanical part |
| Is there a betting line? | **You** — `rings={[{ id: "line", radius: 0.72 }]}` |
| What goes on it? | **You** — `slots={[{ id: "bet", radius: 0.72, render }]}`, one piece of content per seat |
| What unit is `240`? | **You** — pass `format` to `Counter`; `formatBB(amount, bb)` is the opt-in poker helper in `/wager` |
| What goes inside a seat? | **You** — slots: 0 cards, 13 cards, an avatar, buttons, anything |

### One way to do each thing

A table has exactly **one** prop per slot, and where the table has geometry to
hand over, that prop is a function:

| Slot | The one prop | Not |
| --- | --- | --- |
| seat content | `renderSeat(index, box)` | ~~`seats={[…]}`~~ |
| overlay / decorations | `renderOverlay(geometry)` | ~~`overlay={<X/>}`~~ |
| dealer-table positions | `renderHand(index, box)` | ~~`hands={[…]}`~~ |
| rings, per-seat slot content | `rings`, `slots` | — |

The array-and-node forms were the function forms with less information, a
precedence rule nobody knew, and a second thing to document. `renderSeat` and
`renderHand` hand you `box`, which an array of nodes cannot reach;
`renderOverlay` hands you the layout. `tests/separation.test.ts` fails if any of
the removed spellings grows back.

### Rings and slots

A `ring` is an outline drawn at `radius` (a fraction of the surface). A `slot` is
content positioned between the centre and each seat, at `radius`. They are the
same `radius`, and they cannot drift apart: a slot on a ring lands on the point
`layout.slotPoint(index, radius)` returns, which is on the ellipse
`layout.ringBox(radius)` traces.

```tsx
<RoundTable
  seatCount={6}
  rings={[{ id: "betting-line", radius: 0.72 }]}
  slots={[
    { id: "bet", radius: 0.72, render: (i) => (bets[i] ? <ChipStack amount={bets[i]} size="sm" /> : null) },
  ]}
  glow={isMyTurn}
  renderOverlay={() => (showdown ? <Confetti colors={["#f39c12", "#e74c3c"]} /> : null)}
  renderSeat={(i, box) => <Seat isActive={activeSeat === i} width={box.width} height={box.height} />}
/>
```

`renderOverlay` receives the design box and everything `layoutTable` computed:
every surface box (table, felt, rim, glow), every seat centre, the frame size
after the auto-shrink, and `ringBox()` / `slotPoint()` for anything else you want
to place.

## Table shapes

`shape` is a prop of `CardTable` (and what the presets pin down):

- `"ellipse"` (default) — a round table.
- `"rect"` — a rectangle; `cornerRadius` says how round its corners are, and the
  seats walk its perimeter by arc length instead of an angle, so a wide table
  does not bunch four seats into its corners.
- `"none"` — no rail, no felt, no rim. The design box is the table, and the seats
  are laid out in it. Pass `deck={true}` explicitly for a full-bleed backdrop.

`seatPlacement` (`"ring" | "perimeter" | "row"`) can be set independently, e.g. a
rectangle with its seats on a ring.

A **dealer table** is not an ellipse in a costume: its positions are a head and a
row, laid out with `rowFrames`, never a ring. It draws the same surface
`CardTable` does — a rounded rectangle by default, `shape="none"` for the bare
version — because not being a poker oval is not the same as having no table.

## Components and their props

The [docs site](demo/) has one page per component with a live demo and the full
API table, and `tests/docs-api.test.ts` reads the real interfaces back so those
tables cannot drift. The short version:

| Component | Props |
| --- | --- |
| `CardTable` | `seatCount`, `renderSeat(i, box)`, `startAngle`, `shape`, `cornerRadius`, `seatPlacement`, `deck`, `watermark`, `railClassName`, `feltClassName`, `rings`, `slots`, `center`, `ambient`, `renderOverlay(geometry)`, `seatWidth`, `seatHeight`, `seatGap`, `designWidth`, `designHeight`, `marginX`, `marginY`, `feltGap`, `fit`, `className` |
| `RoundTable` / `SquareTable` | the same minus the shape knobs they already decided |
| `DealerTable` | `head`, `headWidth`, `headHeight`, `headY`, `renderHand(i, box)`, `handCount`, `handWidth`, `handHeight`, `handGap`, `handY`, `designWidth`, `designHeight`, `fit`, `renderOverlay(geometry)`, `className` |
| `FitBox` | `designWidth`, `designHeight`, `fit`, `children` (**called** with `{ width, height, scale }`), `className` |
| `Seat` | states `isActive`, `isWinner`, `isDimmed`, `animated`; `onClick`, `width`, `height`, `className`, `frameClassName`, `frameStyle`. Slots: `header`, `children`, `footer`, `badge`, `overlay`, `above`, `below`, `topLeft`, `topRight`, `topCenter` |
| `Counter` | `amount`, `label`, `format`, `animate` |
| `PlayingCard` | `card` (`"As"`, `"10h"`, `null` = face down), `size`, `label` |
| `CardBack` | `size`, `label`, `className` |
| `CardRow` | `cards`, `size`, `animation` (`"deal" \| "flip" \| false`), `stagger`, `animationKey`, `slots`, `placeholder`, `className` |
| `CardFan` | `cards`, `size`, `overlap`, `arc`, `className` |
| `CardSlot` | `size`, `label`, `children`, `className` |
| `Confetti` | `count`, `colors`, `className` |

In `@stargazeryan/poker-ui/wager`:

| Component | Props |
| --- | --- |
| `ChipStack` | `amount`, `size`, `denominations`, `maxChips` (default 12), `label`, `className` |
| `Chip` | `value`, `color`, `colorClassName`, `spotColor`, `size`, `label`, `className` |

Everything the components do is also available as a pure function, one module per
concern:

| Module | Exports |
| --- | --- |
| `frames` | `ringFrames`, `rowFrames`, `gridFrames`, `perimeterFrames`, `fitFrameScale`, `fitRowScale`, `minFrameSeparation`, `FRAME_SHRINK_FLOOR` |
| `surface` | `tableSurface`, `scaledBox`, `scaledRadius`, `insetBox`, `DEFAULT_CORNER_FRACTION` |
| `layout` | `layoutTable`, `fitSeatScale`, `defaultSeatPlacement`, `seatPoint`, `tableRadii`, `seatRingRadii`, `ellipseBox`, `ROW_FRACTION`, `SEAT_SHRINK_FLOOR`, `RIM_GAP`, `GLOW_GAP`, `DESIGN_W`, `DESIGN_H`, `DEFAULT_*` |
| `geometry` | `seatAngle`, `ellipsePoint`, `ringPoints` |
| `cards` | `parseCard`, `describeCard`, `getRankName`, `getSuitName`, `getSuitSymbol`, `isRedSuit`, `isKnownSuit` |
| `cardSize` | `CARD_WIDTH`, `CARD_HEIGHT` |
| `color` | `parseColor`, `relativeLuminance`, `flatten`, `contrastRatio`, `mostVisible` |
| `sizes` | `SIZES` |
| `motion` | `COUNT_UP_MS`, `STAGGER_MS`, `FLIP_MS` |
| misc | `cn`, `nextSeatIndex` |

## Two entry points

```tsx
import { RoundTable, Seat, CardRow } from "@stargazeryan/poker-ui";
import { ChipStack, formatBB } from "@stargazeryan/poker-ui/wager";
```

Chips are about money, which is a property of the games that bet rather than of
cards or tables. A game with no betting imports the core entry and never pulls a
chip set into its bundle. `tests/separation.test.ts` fails if the core ever
re-exports one.

## Amounts and units

Nothing attaches a unit for you. `Counter` renders a plain, locale-grouped number
and `ChipStack` breaks an amount into chips; neither decides that your numbers
are big blinds, dollars or points.

```tsx
<Counter amount={1234} />                                  {/* 1,234   */}
<Counter amount={1234} format={formatBB} />                {/* 61.7 BB */}
<Counter amount={1234} format={(n) => formatBB(n, 100)} /> {/* 12.3 BB */}
```

Amounts in `ChipStack` are in **chip units** (the smallest chip is 1). The
default set is white 1, red 5, blue 10, green 25, black 100; blue is the one that
varies between houses, so it is the one to change first.

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
  it. `fit="container"` derives the design width from the container's aspect
  ratio (clamped to 0.5–2.5) instead.
- **Frames shrink to keep their distance.** At 160×176 a 6-seat ring leaves
  161px between neighbours, but a 10-seat ring leaves only 25.6px. Frames shrink
  uniformly (never below 50%) until `seatGap` is honoured. Every `Seat` a table
  renders is told the size that was settled on, so a bare `<Seat />` matches the
  ring on its own; an explicit `width`/`height` still wins.
- **A row shrinks to fit the box.** A ring is kept inside the design box by its
  clamped radii; a row of frames is bounded by the width of the box itself
  (`fitRowScale`), which is why a dealer table with six hands does not run off
  the edge.
- **`seatCount` is not clamped.** 11–16 seats lay out fine (measured: 11 →
  126×139 frames, 16 → 80×88); past roughly 16 the frames sit on the 50% floor
  and genuinely overlap. `seatGap={0}` disables the shrink.

To keep "you" at the bottom, reorder your seat array so the viewer is index 0 —
the package adds no offset. Seat 0 sits at `startAngle` (default 90°, directly
below the centre).

## Animations

All on by default, each toggleable:

| Effect | Where | Disable with |
| --- | --- | --- |
| Deal-in | `CardRow` | `animation={false}` |
| 3D flip | `CardRow animation="flip"` | `animation={false}` |
| Turn glow | `Seat isActive` | `animated={false}` |
| Winner glow | `Seat isWinner` | `animated={false}` |
| Counter count-up | `Counter` | `animate={false}` |
| Ambient felt + spotlight | `CardTable` | `ambient={false}` |
| Your-turn edge glow | your own ring in the table's `renderOverlay` | render it conditionally |
| Confetti | `<Confetti />` | render it conditionally |

The CSS animations are disabled automatically under `prefers-reduced-motion`. The
`Counter` count-up is a `requestAnimationFrame` loop, so it is not covered by
that media query — it checks for itself instead.

## "Whose turn is next?"

Turn order is game logic, not UI. Compute it in your engine, pass the result into
`Seat`'s `isActive`, and draw whatever the table edge should show through
`renderOverlay`. One generic helper walks the ring:

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
token in `styles.css` is referenced by a component — so overriding one restyles
the table, with no `!important` and no per-component overrides:

```css
@theme {
  --color-felt: #0b3d2e;
  --color-gold: #ffcc33;
  --color-chip-blue: #1d4ed8;
}
```

The docs site lists every token with the value it ships and has a live editor
that sets these properties on a wrapper.

Confetti colours are the one exception: `Confetti`'s `colors` is a prop, because
those colours land in inline styles that Tailwind's tree-shaking cannot see.
`className` / `frameClassName` / `className` on the table's rail and felt are
there for the rest.

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
npm test              # vitest: unit, component, docs routes, docs-vs-types, separation
npm run build         # tsup -> dist (ESM + CJS + d.ts), two entries
npm run test:consumer # pack + install + build a real consumer app, assert the CSS
npm run check:release vX.Y.Z
```

Tests cover the docs, not just the code: `tests/docs.test.tsx` renders every
route and fails if a page throws, `tests/docs-api.test.ts` reads the real
interfaces, the `@theme` tokens and the exported constants back and fails when
any documented list drifts from the source, `tests/separation.test.ts` enforces
the entry-point split and the game-free API, and `tests/games.test.tsx` renders
the four worked examples and asserts what they *do not* draw.

Releases, versioning and the npm trusted-publisher setup are in
[RELEASING.md](RELEASING.md); behaviour changes per version are in
[CHANGELOG.md](CHANGELOG.md).

## License

MIT © 2026 Ryan
