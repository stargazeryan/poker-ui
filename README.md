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
| `CardTable` | `seatCount` (2–10), `seats` or `renderSeat(i, isYou)`, `bets` or `renderBet(i)` (placed on the betting line toward the center), `betRadiusScale` (default 0.72), `startAngle` (deg of seat 0, default 90° = directly below the center), `yourSeatIndex` (flags `isYou`; no offset), `center`, `ambient` (default true), `yourTurn`, `winnerSeats`, `confetti` (default true), `seatWidth`, `seatHeight` |
| `Seat` | slots: `header`, `children`, `footer`, `badge`, `overlay`, `above`, `below`, `topLeft`, `topRight`, `topCenter`; states: `isActive`, `isWinner`, `isDimmed`; `animated` (default true), `winnerCrown`, `onClick`, `frameClassName` |
| `Pot` | `amount`, `label`, `format`, `animate` (count-up, default true) |
| `PlayingCard` | `card` (`"As"`, `"10h"`, `null` = back), `size`: `xs \| sm \| md \| lg` |
| `HoleCards` | `cards`, `size`, `deal` (staggered deal-in, default true) |
| `CommunityCards` | `cards`, `size`, `animated` (3D flip, default true), `slots` (fixed slot count) |

Also exported: `nextSeatIndex`, `seatAngle`, `ellipsePoint`, `ringPoints`,
`cn`, `formatBB`, `BB`, `parseCard`, `getSuitSymbol`, and the types
`SeatProps`, `CardTableProps`, `PotProps`, `CardSize`, `Point`.

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

All animations are disabled automatically when the user prefers reduced motion.

## "Whose turn is next?"

Turn order is game logic, not UI. Compute it in your own engine and pass the
result into `Seat`'s `isActive` (and `CardTable`'s `yourTurn`). A generic helper
is provided:

```ts
import { nextSeatIndex } from "@stargazeryan/poker-ui";
const next = nextSeatIndex(current, seatCount, { skip: (i) => players[i].out });
```

## Theming

Override the tokens in your own `@theme` block, or pass `className` / `frameClassName`:

```css
@theme {
  --color-felt: #0b3d2e;
  --color-gold: #ffcc33;
}
```

## Demo

```bash
npm install --include=dev
npm run demo        # Vite dev server
npm run demo:build  # static build
```

## License

MIT © 2026 Ryan
