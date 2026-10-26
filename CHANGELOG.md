# Changelog

Newest first. Entries are grouped by what you have to do about them: **Changed**
lists behaviour that differs from 0.5.0, so it is the section to read before
upgrading.

## Unreleased — 0.6.0 when you run `npm version minor`

Behaviour changes put this in the minor position: under 0.x, semver treats the
middle number as the breaking one. 0.5.0 is already on the registry, so this
cannot be published without a bump.

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
