# @stargazeryan/poker-ui

Themable **React + Tailwind CSS v4** components for poker tables and playing cards.

- 🃏 `PlayingCard` / `CardBack` / `HoleCards` / `CommunityCards`
- 🎴 `PokerTable` — a responsive, scale-to-fit oval table with six seats
- 💺 `Seat` — presentational, fully controlled by a view-model
- 🎨 Theme tokens via Tailwind v4 `@theme`

## Install

```bash
npm install @stargazeryan/poker-ui
```

Peer requirements: `react` >= 18, `react-dom` >= 18, and Tailwind CSS v4.

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
import { PokerTable, PlayingCard, CardBack, type SeatView } from "@stargazeryan/poker-ui";

const seats: (SeatView | null)[] = [
  { nickname: "You", stack: 2000, holeCards: ["As", "Kh"], isYou: true, isDealer: true },
  { nickname: "Bot", stack: 1500, holeCards: [null, null] },
  null, null, null, null,
];

export function Table() {
  return (
    <div style={{ height: 640 }}>
      <PokerTable
        seats={seats}
        yourSeatIndex={0}
        communityCards={["Ah", "Kd", "7c", null, null]}
        pot={240}
      />
    </div>
  );
}
```

Cards use a compact code: rank + suit, suit as `s | h | d | c` — e.g. `"As"`,
`"10h"`, `"kd"`. Pass `null` for a face-down card back.

## Components

| Component | Purpose |
| --- | --- |
| `PlayingCard` | One card (`card`, `size`: `xs \| sm \| md \| lg`) |
| `CardBack` | Face-down card |
| `HoleCards` | A row of hole cards |
| `CommunityCards` | Five community cards with a staggered deal animation |
| `Seat` | Presentational seat (`seat: SeatView \| null`) |
| `PokerTable` | Full table; `seats`, `yourSeatIndex`, `communityCards`, `pot`/`pots`, `seatSize`, `renderSeat` |

Also exported: `cn`, `formatBB`, `BB`, `parseCard`, `getSuitSymbol`,
and the types `SeatView`, `PokerTableProps`, `PotRow`, `CardSize`.

## Theming

Override the tokens in your own `@theme` block, or pass `className` props:

```css
@theme {
  --color-felt: #0b3d2e;
  --color-gold: #ffcc33;
}
```

## Demo

```bash
npm install
npm run demo        # Vite dev server
npm run demo:build  # static build
```

## License

MIT © 2026 Ryan
