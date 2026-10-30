# Changelog

Newest first. Entries are grouped by what you have to do about them: **Changed**
lists behaviour that differs from the previous release, so it is the section to
read before upgrading.

## Unreleased

Three fixes to what the table actually draws, all of them visible rather than
theoretical.

### Changed

- **`DealerTable` draws a table.** It used to paint nothing at all — no rail, no
  felt, no rim — on the reasoning that a dealer table has no ellipse to draw.
  Not being a poker oval is not the same as having no surface, so it draws one
  now, from the same `layoutTable` call `CardTable` uses, which is what stops the
  two tables' felt from drifting apart. The default is a rounded rectangle;
  `shape="none"` gives you the old bare version back, and `deck={false}` paints
  nothing.

  What separates it from `CardTable` is the **arrangement**, and that is
  unchanged: its positions are a head and a row, never a ring.

- **A square table is drawn as a rectangle, not a circle.** The outer glow, the
  spotlight and the sheen mask were written as `rounded-[50%]` while the rail,
  the felt, the rim and the watermark followed the surface's own radius. On a
  round table that is invisible; on a square one it was a gold circle sitting
  behind a rounded rectangle, and a sheen clipped to an ellipse that cut the
  felt's corners off.

- **The felt's ambient light is one light, not two.** The sheen swept across the
  felt on a 22s linear loop while the spotlight breathed on a 7s one: two
  unrelated periods, so the felt spent most of its time in a combination nobody
  chose (their least common multiple is 154s) and a few of those read as a
  lighting glitch. The sheen is static now and only its opacity moves, on the
  same 7s `ease-in-out` cycle as the spotlight.

  `--animate-felt-shimmer` keeps its name and its keyframe name; only the value
  changed, from `felt-shimmer 22s linear infinite` to
  `felt-shimmer 7s ease-in-out infinite`. If you had overridden it, note that it
  no longer animates `background-position`.

### Added

- **`DealerTable` takes the surface props `CardTable` has** — `shape`,
  `cornerRadius`, `deck`, `ambient`, `watermark`, `railClassName`,
  `feltClassName`, `marginX`, `marginY`, `feltGap` — so a dealer table can be
  restyled to the same degree a round one can. All optional; the defaults are
  what most callers want.

## 0.8.0 — the split

The library no longer has a poker table in it. It has **table types** — shapes —
and a separate `/wager` entry point for anything about money. Nothing in the main
entry names a game any more.

The reason is the one a consumer hits first: a table called `PokerTable` or
`BlackjackTable` is no use to a game nobody has written yet. A round table, a
square table and a dealer table are.

### Changed (read this before upgrading)

- **There is no `PokerTable`, `BigTwoTable`, `BlackjackTable` or
  `DragonGateTable`.** `PokerTable` used to be an alias of `CardTable`; it is now
  gone rather than repointed, because the thing that made a table "poker" was a
  betting line — and a betting line is a `ring` the caller declares.

  ```tsx
  // 0.7.0 — the table knew
  <PokerTable seatCount={6} renderBet={(i) => <ChipStack amount={bets[i]} />} betRadiusScale={0.72} />

  // 0.8.0 — you know
  <RoundTable
    seatCount={6}
    rings={[{ id: "betting-line", radius: 0.72 }]}
    slots={[{ id: "bet", radius: 0.72, render: (i) => <ChipStack amount={bets[i]} /> }]}
  />
  ```

  The four game compositions this release used to ship as components now live in
  the docs' worked examples (`demo/src/examples/games.tsx`), where they are built
  out of the same two entry points a consumer has.

- **`CardTable` lost `bets`, `renderBet` and `betRadiusScale`, and no longer
  draws a betting line.** The line was drawn unconditionally — a game with no
  betting got a golden ring it never asked for — and it was computed inside the
  layout, so "is there betting" had leaked into the geometry. It is now two
  opt-in props: `rings` (outlines) and `slots` (content positioned between the
  centre and each seat). A slot at radius `r` lands exactly on the ring at radius
  `r` (`layout.ringBox(r)` / `layout.slotPoint(i, r)`), which is the drift this
  library spent 0.7.0 fixing.

- **The suit watermark is no longer painted for you.** `watermark` is a prop and
  defaults to nothing: `♠♥♦♣` on the felt is a card-room decoration, not part of
  a table.

- **`shape` replaced the single hard-coded ellipse.** `shape` is
  `"ellipse" | "rect" | "none"`, `cornerRadius` rounds a rectangle, and
  `seatPlacement` (`"ring" | "perimeter" | "row"`) says where the seats go. With
  `shape="none"` no rail, felt or rim is drawn at all — pass `deck={true}`
  explicitly if you want a full-bleed backdrop anyway.

- **`HoleCards` and `CommunityCards` are deprecated**: they are `CardRow` with an
  animation. Both still work and are not going away this release.
  **`Pot` is deprecated**: it is `Counter`, with the original as a live alias.

  ```tsx
  <CardRow cards={hand} size="lg" />                     {/* was HoleCards   */}
  <CardRow cards={board} size="md" animation="flip" />   {/* was CommunityCards */}
  <Counter label="Main" amount={240} />                  {/* was Pot         */}
  ```

  One behaviour change comes with it: inside `cards`, `null` now always means a
  **face-down card**. `CommunityCards` rendered it as an empty position, so the
  old behaviour is `placeholder="empty"` (which is what the wrapper passes for
  you). Past the end of the array is always an empty position, which is what
  `slots` already did.

- **`Seat` lost `winnerCrown`.** A crown is a decoration, not a state — pass it
  through `topLeft`.

- **One prop per slot: the array and node forms are gone.** A slot that has
  geometry to hand over is a render function and nothing else. `CardTable` lost
  `seats` and `overlay`; `DealerTable` lost `hands` and its plain-node `overlay`.

  ```tsx
  // 0.7.0 — two ways, and an array cannot see the geometry
  <CardTable seats={hands.map((h) => <Seat />)} overlay={<Confetti />} />

  // 0.8.0 — one way, and it gets the geometry
  <CardTable
    renderSeat={(i, box) => <Seat width={box.width} height={box.height} />}
    renderOverlay={() => <Confetti />}
  />
  ```

  Why the function survives: it hands you `box` (the laid-out centre and the
  frame size after the auto-shrink), which an array of nodes cannot reach, and
  `renderOverlay` hands you `layout`. The array form's only advantage was a
  shorter call site, and it cost a precedence rule (`seats` won when both were
  passed), two things to document and two paths to test. `DealerTable`'s
  `overlay` became `renderOverlay(geometry)` so both tables spell that slot the
  same way — a caller switching table types changes a prop's value, not its
  name. `tests/separation.test.ts` fails if any of the removed spellings grows
  back.

  `Pot`, `HoleCards` and `CommunityCards` are unaffected: they are deprecated
  aliases, not removed.

- **`layoutSeats` is now `layoutTable`** (the old name still works), and
  `minSeatSeparation` is `minFrameSeparation`. `Layout.boxes` is
  `{ table, felt, rim, glow }` — no `boxes.bettingLine`, no `betRx`, no `betRy`.
  `Layout` gained `ringBox(radius)`, `ringRadius(radius)` and
  `slotPoint(index, radius)`, and carries `shape`, `seatPlacement` and `radius`.

- **`LayoutOptions`**: `betRadiusScale` is gone; `shape`, `cornerRadius`,
  `seatPlacement`, `rimGap` and `glowGap` replaced it.

### Moved — the `/wager` entry point

Chips are about money, which is a property of the games that bet rather than of
cards or tables. They are still here, one subpath over:

```tsx
import { ChipStack, formatBB } from "@stargazeryan/poker-ui/wager";
```

`Chip`, `ChipStack`, `chipBreakdown`, `chipCount`, `chipsTotal`,
`chipSpotColor`, `DEFAULT_DENOMINATIONS`, `ChipProps`, `ChipStackProps`,
`Denomination`, `ChipStackEntry`, `BB` and `formatBB` all moved there and are no
longer exported from the main entry. A card game with no betting no longer pulls
a chip set into its bundle.

### Added

- **`RoundTable`, `SquareTable`, `DealerTable` and `TABLE_TYPES`** — the table
  types. Round and square are `CardTable` with the surface decided; `DealerTable`
  is one frame at the head and a row opposite it, built from `FitBox` and
  `rowFrames` and therefore with no surface in it to draw.
- **`FitBox` / `useFitBox`** — the design box and the scale-to-fit, on their own.
  `FitBox`'s `children` is **called** with `{ width, height, scale }`.
- **`frames.ts`** — `ringFrames`, `rowFrames`, `gridFrames`, `perimeterFrames`,
  `fitFrameScale`, `fitRowScale`, `minFrameSeparation`, `FRAME_SHRINK_FLOOR`.
  Positioning strategies that return the same `FrameBox`, so a seat, a hand and a
  meld are the same thing to them.
- **`CardRow`**, **`CardFan`** (overlapping cards, optionally arced — thirteen
  cards at any readable size are wider than a seat frame) and **`CardSlot`** (a
  reserved position with a dashed outline, so a game's final shape can be laid
  out before any card exists).
- **`Counter`** — the amount pill, renamed. No unit is attached.
- **`surface.ts`** — `tableSurface`, `scaledBox`, `scaledRadius`, `insetBox`,
  `Box`, `TableShape`, `SeatPlacement`, `DEFAULT_CORNER_FRACTION`.
- **`layoutTable`**, `defaultSeatPlacement`, `ROW_FRACTION`.
- **`CARD_WIDTH` / `CARD_HEIGHT`** — the px table the artwork is drawn with, so a
  fan and a slot stop re-deriving it from class names.
- **`STAGGER_MS` / `FLIP_MS`**, with `DEAL_STAGGER_MS` / `FLIP_STAGGER_MS` kept as
  aliases.
- `CardRow`'s `animation` (`"deal" | "flip" | false`), `stagger`, `animationKey`,
  `slots` and `placeholder`.

### Fixed

- `CardTable` drew a betting line whether or not the caller had any betting.
- `CardTable` painted a hard-coded `♠♥♦♣` watermark on every table.
- A row of frames (`seatPlacement="row"`, or `DealerTable`) kept its preferred
  width however narrow the box was and ran off the edge. A ring is bounded by its
  clamped radii; a row was bounded by nothing. `fitRowScale` bounds it now.
- `FitBoxProps` inherited three of its five props, so the docs' prop table could
  have documented a prop with no code behind it. They are declared out in full.

### Verified in this release

`npm test` (unit, component, docs routes and docs-vs-types), `npm run typecheck`,
`npm run build`, `npm run docs:build` and `npm run test:consumer` — the last one
packs the tarball, installs it into a throwaway Vite + Tailwind app that follows
the README literally, and asserts both entry points arrive in the bundle.

Two test files exist purely to keep this release honest:
`tests/separation.test.ts` (the core has no chip, no big blind and no game name
in it; the table types are built on the core and never the reverse; every worked
example imports only the two published entries) and `tests/games.test.tsx` (four
games, three table types, and the negative assertions: the shedding game draws no
ring, no slot and no felt decoration, and the two dealer-table games draw no
surface at all).

## 0.7.0 — 2026-10-27

`CardTable` no longer holds game state. It lays out and it draws; the caller
decides what is true. Five props went away, which is why this is a minor under
0.x — if the CHANGELOG's Changed section is non-empty, the middle number moves.

### Changed (read this before upgrading)

- **`CardTable` no longer knows whose turn it is, who won, or which seat is
  yours.** `yourTurn`, `winnerSeats`, `confetti`, `confettiColors` and
  `yourSeatIndex` are gone. In their place: an `overlay` / `renderOverlay` slot,
  and a standalone `Confetti`.

  ```tsx
  // 0.6.0
  <CardTable yourTurn winnerSeats={[0]} confetti yourSeatIndex={0} />

  // 0.7.0 — your state, your decorations
  <CardTable
    renderOverlay={({ layout }) => (
      <>
        {isMyTurn && <div style={layout.boxes.glow} className="absolute animate-turn-glow rounded-[50%]" />}
        {winners.length > 0 && <Confetti colors={["#f39c12", "#e74c3c"]} />}
      </>
    )}
  />
  ```

  A seat glows because you passed `Seat isWinner`, not because the table worked
  something out from an index.
- **`renderSeat` no longer receives `isYou`**, and `SeatBox` no longer carries
  it. The table says *where* a seat is, never *who* is sitting in it — compute
  that in your own state and pass `isActive` / `isWinner` / `isDimmed` to the
  `Seat` you render. The signature is `renderSeat(index, box)`; the box moved
  from third argument to second.
- `Seat`'s states, `ambient`, and the felt/rail/token surface are unchanged.
  `.animate-turn-glow` still ships and is still used (`Seat isActive`), so a
  caller-drawn ring can use it as before.

### Added

- `CardTable`: `overlay?: ReactNode` and
  `renderOverlay?: (geometry: TableOverlayGeometry) => ReactNode` — a layer
  inside the scaled design box, above the seats and `pointer-events-none`, for
  whatever the caller wants up there. `renderOverlay` is handed the design box
  and everything `layoutSeats` computed: every ellipse box (table, felt, rim,
  glow, betting line), every seat centre, and the frame size after the
  auto-shrink.
- `Confetti` (`count`, `colors`, `className`) — the falling pieces as a component
  you decide when to render. `.animate-confetti` and `@keyframes confetti` keep
  reaching consumer CSS through it.
- `TableOverlayGeometry` type.

## 0.6.0 — 2026-10-26

Behaviour changes put this in the minor position: under 0.x, semver treats the
middle number as the breaking one. 0.5.0 was already on the registry, so this
release could not reuse it.

### Changed (read this before upgrading)

- **`Pot` no longer formats amounts as big blinds.** `amount={240}` used to render
  `"12 BB"` — the component divided by a hard-coded `BB = 20` and appended a poker
  unit. It now renders a plain, locale-grouped number, because a generic component
  does not know whether your amounts are chips, dollars or points.
  Migration: `<Pot amount={n} format={formatBB} />`, and `formatBB(amount, bb)`
  now takes the big blind because 20 is rarely the right one.
- **`CardTable` no longer clamps `seatCount` to 2–10.** A 12-seat table silently
  rendered 10 seats; it now renders 12. The seat ring shrinks frames until
  `seatGap` is honoured, which carries 11–16 seats (measured: 11 → 126×139,
  16 → 80×88). Past roughly 16 the frames sit on the 50% shrink floor and overlap.
  The floor is 1.
- **`Seat`'s `width`/`height` default to the size the surrounding table laid out**
  (through a context), so `seatGap` now applies to the `seats` array form too, and
  a bare `<Seat />` inside a table matches the ring. An explicit width still wins.
- **`PlayingCard` and `CardBack` gained `role="img"` with accessible names**
  ("Ace of spades" instead of the fragments "A" and "♠"). Override with `label`.
- **The theming tokens work now.** They were documented but unreferenced, so
  Tailwind emitted none of them and overriding them did nothing. Every token in
  `styles.css` is drawn with by a component.
- **The reduced-motion rule is scoped to this package's animation classes**
  instead of `*, *::before, *::after`, which used to disable the host app's own
  animations. `Pot`'s count-up also honours it now (a rAF loop that no media
  query could reach).
- `CardTable`'s seat frames are auto-shrunk with the context in place, so
  `renderSeat`'s box argument is no longer the only way to get the size.

### Added

- `ChipStack` / `Chip` — an amount broken into a real chip stack (greedy
  breakdown: white 1, red 5, blue 10, green 25, black 100), drawn as SVG with a
  measured-contrast edge-spot colour. `maxChips` caps a large bet.
- Pure helpers, one module per concern: `chipBreakdown`, `chipsTotal`,
  `chipCount`, `chipSpotColor`, `DEFAULT_DENOMINATIONS` (`chips`);
  `describeCard`, `getRankName`, `getSuitName`, `getSuitSymbol`, `isRedSuit`,
  `isKnownSuit` (`cards`); `parseColor`, `relativeLuminance`, `flatten`,
  `contrastRatio`, `mostVisible` (`color`); `SIZES` (`sizes`);
  `COUNT_UP_MS`, `DEAL_STAGGER_MS`, `FLIP_STAGGER_MS` (`motion`).
- `layoutSeats` now returns every ellipse it draws as `boxes`
  (table / felt / rim / glow / bettingLine) plus `betRx`/`betRy`, so nothing
  recomputes the geometry. `ellipseBox`, `RIM_GAP`, `GLOW_GAP`,
  `DEFAULT_SEAT_W`, `DEFAULT_SEAT_H` exported alongside.
- `CardTable`: `designWidth`, `designHeight`, `marginX`, `marginY`, `feltGap`,
  `seatGap`, `fit="container"` (fills the container instead of letterboxing),
  `confettiColors`. `renderSeat` receives a third argument (`SeatBox`).
- `HoleCards.dealKey` to replay the deal for an unchanged hand.
- A documentation site (per-component pages, live demos, live token editor, an
  honest "Known gaps" page) that builds against the packed `dist`.
- Test suite: 186 tests over 13 files, a packed-package consumer smoke test, and
  a guard that keeps the docs' API tables honest against the real interfaces.

### Fixed

- The betting line was drawn from a module constant while the chips were
  positioned from `betRadiusScale`: any non-default scale put the chips off the
  line (56.7px at 0.85, 100.3px at 0.95).
- `Pot`'s count-up could run **backwards**: it mixed rAF timestamps with
  `performance.now()`, two clocks with different origins, making the eased value
  leave [0, 1]. Interrupting it also restarted from a stale origin.
- `HoleCards` dealt once and never again — the wrappers were keyed by index, so
  React reused the elements and a reused element does not restart a CSS animation.
- The white chip's edge spots were white on white: a 1.13:1 contrast ratio.
- `nextSeatIndex` returned `NaN` for a `NaN`/`Infinity` seat count.
- The package could not be type-checked on a clean checkout: the docs' import of
  its own name resolved through `dist/`, which does not exist before `npm run
  build`. Fixed with a `paths` mapping to `src`.

### Removed

- Referenced by nothing, verified by search: `--color-wood`/`--color-wood-dark`,
  `--animate-card-deal` with its `card-deal` keyframes, `--animate-bubble-pop`
  with `bubble-pop`, the `Box` type, and `declaration` in `tsconfig.json` (a no-op
  beside `noEmit`).

### Packaging

- `tailwindcss` is now a declared peer dependency. The README always required it,
  but npm could not warn about it, and it is not optional: without it the
  components render unstyled.
- `engines: { node: ">=18" }`, an explicit `default` condition and a
  `./package.json` export, and `prepublishOnly` running the type check, tests and
  build so an unbuilt or broken tarball cannot be published.
