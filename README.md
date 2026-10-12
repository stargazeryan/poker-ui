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
| `CardTable` | `seatCount` (2–10), `seats` or `renderSeat(i, isYou)`, `yourSeatIndex`, `center`, `ambient` (default true), `yourTurn`, `winnerSeats`, `confetti` (default true), `seatWidth`, `seatHeight` |
| `Seat` | slots: `header`, `children`, `footer`, `badge`, `overlay`, `above`, `below`, `topLeft`, `topRight`, `topCenter`; states: `isActive`, `isWinner`, `isDimmed`; `animated` (default true), `winnerCrown`, `onClick`, `frameClassName` |
| `Pot` | `amount`, `label`, `format`, `animate` (count-up, default true) |
| `PlayingCard` | `card` (`"As"`, `"10h"`, `null` = back), `size`: `xs \| sm \| md \| lg` |
| `HoleCards` | `cards`, `size`, `deal` (staggered deal-in, default true) |
| `CommunityCards` | `cards`, `size`, `animated` (3D flip, default true), `slots` (fixed slot count) |

Also exported: `nextSeatIndex`, `cn`, `formatBB`, `BB`, `parseCard`,
`getSuitSymbol`, and the types `SeatProps`, `CardTableProps`, `PotProps`, `CardSize`.

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
