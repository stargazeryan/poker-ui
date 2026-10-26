# @stargazeryan/poker-ui

Game-agnostic **React + Tailwind CSS v4** card-table UI: tables, seats, and
playing cards. Seats are neutral frames with **slots**, so you decide what goes
in them (0 cards, N cards, avatars, anything). The table supports **2–10 seats**,
an optional center slot, and a small set of built-in **game-feel animations**.

- 🎴 `PlayingCard` / `CardBack` / `HoleCards` / `CommunityCards` (with deal/flip animations)
- 🎯 `CardTable` — responsive, scale-to-fit table with ambient felt, a your-turn edge glow, and winner confetti
- 💺 `Seat` — a neutral seat frame with slots + animated turn/winner states
- 🪙 `Pot` — an optional pot pill with a count-up animation
- 🔁 `nextSeatIndex()` — pure helper for "next seat on the ring"

> Formerly `PokerTable`; kept as a back-compat alias for `CardTable`.

## Install

```bash
npm install @stargazeryan/poker-ui
```

Peer requirements: `react` >= 18, `react-dom` >= 18, Tailwind CSS v4.

## Setup (Tailwind v4) — important

This is a **compiled package**, so your app's Tailwind build cannot see the
class names used inside it. Add the package as a content source and import its
theme CSS:

```css
/* app.css */
@import "tailwindcss";
@import "@stargazeryan/poker-ui/styles.css";

@source "../node_modules/@stargazeryan/poker-ui";
```

> Without the `@source` line, the components render unstyled. Adjust the path to
> wherever your `node_modules` lives.
>
> `npm run test:consumer` in this repo packs the package and builds a throwaway
> app that follows these three lines literally, then asserts the utilities,
> tokens and keyframes all made it into the output CSS.

## Usage

```tsx
import { CardTable, Seat, HoleCards, CommunityCards, Pot } from "@stargazeryan/poker-ui";

const seats = [
  <Seat key={0} isActive header={<b>You</b>} footer={<span>100 BB</span>}>
    <HoleCards cards={["As", "Kh"]} size="sm" />
  </Seat>,
  <Seat key={1} header={<b>Bot</b>} footer={<span>49 BB</span>}>
    <HoleCards cards={[null, null]} size="sm" />
  </Seat>,
  null, null, null, null,
];

export function Table() {
  return (
    <div style={{ height: 640 }}>
      <CardTable
        seatCount={6}
        seats={seats}
        yourSeatIndex={0}
        yourTurn
        winnerSeats={[]}
        center={
          <>
            <CommunityCards cards={["Ah", "Kd", "7c", null, null]} size="lg" />
            <Pot label="Main" amount={240} />
          </>
        }
      />
    </div>
  );
}
```

## Components

| Component | Props |
| --- | --- |
| `CardTable` | `seatCount` (2–10), `seats` or `renderSeat(i, isYou, box)`, `bets` or `renderBet(i)` (placed on the betting line toward the center), `betRadiusScale` (default 0.72, and the drawn betting line follows it), `startAngle` (deg of seat 0, default 90° = directly below the center), `yourSeatIndex` (flags `isYou`; no offset), `center`, `ambient` (default true), `yourTurn`, `winnerSeats`, `confetti` (default true), `confettiColors`, `seatWidth`, `seatHeight`, `seatGap` (default 24), `designWidth`, `designHeight`, `marginX`, `marginY`, `feltGap`, `fit`, `className` |
| `Seat` | slots: `header`, `children`, `footer`, `badge`, `overlay`, `above`, `below`, `topLeft`, `topRight`, `topCenter`; states: `isActive`, `isWinner`, `isDimmed`; `animated` (default true), `winnerCrown`, `onClick`, `frameClassName`, `frameStyle` |
| `Pot` | `amount`, `label`, `format`, `animate` (count-up, default true) |
| `PlayingCard` | `card` (`"As"`, `"10h"`, `null` = back), `size`: `xs \| sm \| md \| lg` |
| `HoleCards` | `cards`, `size`, `deal` (staggered deal-in, default true), `dealKey` (change it to replay the deal for an unchanged hand) |
| `CardBack` | `size`, `className` |
| `CommunityCards` | `cards`, `size`, `animated` (3D flip, default true), `slots` (fixed slot count) |

Also exported: `nextSeatIndex`, `seatAngle`, `ellipsePoint`, `ringPoints`,
`cn`, `formatBB`, `BB`, `parseCard`, `getSuitSymbol`, the layout helpers
`layoutSeats`, `fitSeatScale`, `minSeatSeparation`, `seatPoint`, `tableRadii`,
`seatRingRadii`, `SEAT_SHRINK_FLOOR`, the size constants `DESIGN_W`, `DESIGN_H`,
`DEFAULT_MARGIN_X`, `DEFAULT_MARGIN_Y`, `DEFAULT_FELT_GAP`, `DEFAULT_BET_SCALE`,
`DEFAULT_SEAT_GAP`, and the types
`SeatProps`, `CardTableProps`, `SeatBox`, `PotProps`, `CardSize`, `Point`,
`Layout`, `LayoutOptions`, `SeatLayout`.

### Ellipse layout

The table, the seat ring and the betting line are all one parametric ellipse:

```
x(θ) = cx + rx·cos θ      y(θ) = cy + ry·sin θ        θ = startAngle + i·(360/n)
```

Screen coordinates (y grows downward), so θ = 90° is **directly below** the
center. **Seat 0 sits at `startAngle` (default 90°)**, and seats divide 360°
evenly, so 2–10 players always spread out. The betting line uses the same
formula with a smaller radius (`betRadiusScale`). To keep "you" at the bottom,
reorder your seat array so the viewer is index 0 (the package adds no offset).

```tsx
import { seatAngle, ellipsePoint, ringPoints } from "@stargazeryan/poker-ui";

seatAngle(0, 6);                        // 90   (below the center)
seatAngle(3, 6);                        // 270  (above the center)
ellipsePoint(300, 200, 120, 80, 90);    // { x: 300, y: 280 }
ringPoints(4, 300, 200, 120, 80);       // 4 points, first directly below
```

### Layout, seat size and responsiveness

Everything is laid out in a fixed **design box** (1200×900 by default) which is
then scaled to fit the container.

| Prop | Default | Meaning |
| --- | --- | --- |
| `designWidth` / `designHeight` | `1200` / `900` | the design box |
| `marginX` / `marginY` | `164/1200`, `196/900` | rail inset, as a **fraction** of the design box |
| `feltGap` | `11` | felt inset from the rail, design-space px |
| `seatWidth` / `seatHeight` | `160` / `176` | **preferred** seat frame size |
| `seatGap` | `24` | minimum clearance between neighbouring frames |
| `fit` | `"design"` | `"container"` derives the width from the container |

Margins are proportional, so a custom design box stays in proportion, and the
seat ring is clamped so frames are never clipped by the design box.

Two things to know:

- **`fit="container"` removes letterboxing.** With the default fit, a
  phone-portrait container (e.g. 390×700) scales the 4:3 design box down and
  wastes ~58% of the box — the table ends up tiny. `fit="container"` derives the
  design width from the container's aspect ratio (clamped to 0.5–2.5) so the
  table fills the box and the seats render much larger.
- **Seats shrink to keep their distance.** At 160×176, a 6-seat ring leaves
  161px between neighbours but a 10-seat ring only 25.6px. `CardTable` measures
  the ring and shrinks the frames uniformly (never below 50%) until `seatGap` is
  honoured, so 9–10 seat tables never crowd. That needs `renderSeat`, because it
  is the only form that can size the frames — `renderSeat` receives the laid-out
  box as its third argument:

  ```tsx
  <CardTable
    seatCount={10}
    seatGap={48}   // roomier; 0 disables the auto-shrink
    renderSeat={(i, isYou, box) => (
      <Seat width={box.width} height={box.height} header={<b>{i}</b>}>
        <HoleCards cards={hands[i]} size="sm" />
      </Seat>
    )}
  />
  ```

  `seatGap={0}` disables it; the `seats` array form is not auto-shrunk (pass
  matching `width`/`height` to your `Seat`s).

### Sizes

`xs` and `sm` cards keep only the **upright** corner index; `md` and `lg` also
show the rotated corner index and the large center suit.

## Animations

Built-in game-feel (all **on by default**, each toggleable):

| Effect | Where | Disable with |
| --- | --- | --- |
| Deal-in (hand cards) | `HoleCards` | `deal={false}` |
| 3D flip (community cards) | `CommunityCards` | `animated={false}` |
| Turn glow | `Seat isActive` | `animated={false}` |
| Winner glow | `Seat isWinner` | `animated={false}` |
| Pot count-up | `Pot` | `animate={false}` |
| Ambient felt + spotlight | `CardTable` | `ambient={false}` |
| Your-turn edge glow | `CardTable` | omit `yourTurn` |
| Winner confetti | `CardTable` | `confetti={false}` |

All CSS animations are disabled automatically when the user prefers reduced
motion. (The `Pot` count-up is a `requestAnimationFrame` loop, so it is *not*
covered by that media query.)

Animation tokens live in `@theme`, so Tailwind only ships the keyframes your app
actually uses.

## "Whose turn is next?"

Turn order is game logic, not UI. Compute it in your own engine and pass the
result into `Seat`'s `isActive` (and `CardTable`'s `yourTurn`). A generic helper
is provided:

```ts
import { nextSeatIndex } from "@stargazeryan/poker-ui";
const next = nextSeatIndex(current, seatCount, { skip: (i) => players[i].out });
```

## Theming

Override any token in your own `@theme` block. Every token below is referenced
by the components, so an override actually restyles them:

```css
@theme {
  --color-felt: #0b3d2e;
  --color-felt-light: #14563a;
  --color-felt-dark: #062418;

  --color-rail: #7a5230;
  --color-rail-dark: #4d3119;
  --color-rail-deep: #28190c;

  --color-gold: #ffcc33;       /* turn/winner glow, pot, focus ring */
  --color-gold-light: #ffe08a; /* ambient glow, backdrop */
  --color-gold-glow: #fff0c2;  /* spotlight */

  --color-card-back: #14315a;
  --color-card-back-light: #1e4577;
  --color-card-back-dark: #0b1d36;
  --color-card-back-ink: #9fc0e8;
  --color-card-back-emblem: #ffd98a;
}
```

Confetti has its own `confettiColors` prop rather than a token, because the
colours go into inline styles that Tailwind's tree-shaking cannot see.

There is also a `--color-chip-red|blue|green|black|white` palette for you to
build your own chips on. Tokens nothing references — e.g. the chip palette and
any animation you don't use — are not emitted, because Tailwind v4 only outputs
theme variables that are used. Use a matching utility (say `bg-chip-red`) and it
appears.

Individual components also take `className` / `frameClassName`.

The [docs site](demo/) has a live token editor that sets these custom properties
on a wrapper, which is exactly what an override does document-wide.

## Docs site

The docs in `demo/` are the library's main documentation: a per-component site
with live demos, expandable source, API tables and a live token editor, plus a
[Known gaps](demo/src/docs/pages/guide.tsx) page listing what this library does
*not* do yet.

```bash
npm run docs          # dev server (imports ../../src, HMR)
npm run docs:build    # builds the package, then the docs against dist/
```

`docs:build` compiles the package first and then builds the site against
`dist/index.js` rather than `src`, so the deployed site is running the artefact
consumers actually get. It imports the package by its published name in both
modes — never a relative path into `src`.

Tests cover the docs too: `tests/docs.test.tsx` renders every route and fails if
a page throws, and `tests/docs-api.test.ts` reads the real interfaces with the
TypeScript compiler and fails if an API table drifts from the code.

## Development

```bash
npm install --include=dev

npm run typecheck     # tsc --noEmit
npm test              # vitest: unit, component, docs routes, docs-vs-types
npm run build         # tsup -> dist (ESM + CJS + d.ts)

npm run test:consumer # pack + install + build a real consumer app, assert the CSS
```

`npm run demo` and `npm run demo:build` remain as aliases for `docs` and
`docs:build`.

## License

MIT © 2026 Ryan
