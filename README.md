# @stargazeryan/poker-ui

Game-agnostic **React + Tailwind CSS v4** card-table UI: tables, seats, and
playing cards. Seats are neutral frames with **slots**, so you decide what goes
in them (0 cards, N cards, avatars, anything). The table supports **2–10 seats**
and an optional center slot.

- 🎴 `PlayingCard` / `CardBack` / `HoleCards` / `CommunityCards`
- 🎯 `CardTable` — responsive, scale-to-fit table with `seatCount` seats
- 💺 `Seat` — a neutral seat frame with slots + generic states
- 🪙 `Pot` — an optional pot pill (not required by the table)
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

### 4-seat game with no pot and no community cards (e.g. Big Two)

```tsx
<CardTable
  seatCount={4}
  yourSeatIndex={2}
  renderSeat={(i) => <Seat header={<b>P{i}</b>}>{/* 0..N cards */}</Seat>}
/>
```

## Components

| Component | Props |
| --- | --- |
| `CardTable` | `seatCount` (2–10), `seats` or `renderSeat(i, isYou)`, `yourSeatIndex`, `center`, `seatWidth`, `seatHeight` |
| `Seat` | slots: `header`, `children`, `footer`, `badge`, `overlay`; states: `isActive`, `isWinner`, `isDimmed`; `onClick` |
| `Pot` | `amount`, `label`, `format` |
| `PlayingCard` | `card` (`"As"`, `"10h"`, `null` = back), `size`: `xs \| sm \| md \| lg` |
| `CardBack` / `HoleCards` / `CommunityCards` | `size`, `cards` |

Also exported: `nextSeatIndex`, `cn`, `formatBB`, `BB`, `parseCard`,
`getSuitSymbol`, and the types `SeatProps`, `CardTableProps`, `PotProps`, `CardSize`.

## "Whose turn is next?"

Turn order is game logic, not UI. Compute it in your own engine and pass the
result into `Seat`'s `isActive`. A generic helper is provided:

```ts
import { nextSeatIndex } from "@stargazeryan/poker-ui";
const next = nextSeatIndex(current, seatCount, { skip: (i) => players[i].out });
```

## Theming

Override the tokens in your own `@theme` block, or pass `className`:

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
