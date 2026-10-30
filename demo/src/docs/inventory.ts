import type { ApiRow } from "./registry";

/**
 * Every knob the package exposes, in one place.
 *
 * The API tables are hand-written, so they rot. `tests/docs-api.test.ts` reads
 * each of these lists back against the real source and fails when they drift:
 *
 * | list | compared against |
 * | --- | --- |
 * | `TOKENS` | the `@theme` block in `src/styles.css` (name *and* value) |
 * | `LAYOUT_OPTIONS` | `LayoutOptions` in `src/layout.ts` |
 * | `CARD_TABLE_CONTROLS` + `CONTENT_PROPS` | `CardTableProps` in `src/components/CardTable.tsx` |
 * | `TUNABLES` | the named exports of the entry point each row names |
 *
 * So "the docs do not list every tunable parameter" is a failing test, not a
 * thing someone has to notice.
 */

/* ------------------------------------------------------------------ tokens -- */

export interface TokenRow {
  name: string;
  kind: "colour" | "animation";
  /** The value `styles.css` ships, verbatim. */
  value: string;
  /** What stops being right if you override it. */
  controls: string;
}

export const TOKENS: TokenRow[] = [
  { name: "--color-felt", kind: "colour", value: "#0f4d2e", controls: "the felt, and the middle of its gradient" },
  { name: "--color-felt-light", kind: "colour", value: "#23804b", controls: "the light end of the felt gradient (top of the table)" },
  { name: "--color-felt-dark", kind: "colour", value: "#093b22", controls: "the dark end of the felt gradient (bottom of the table)" },
  { name: "--color-rail", kind: "colour", value: "#a5744a", controls: "the top of the wooden rail gradient" },
  { name: "--color-rail-dark", kind: "colour", value: "#6b3f22", controls: "the middle of the rail gradient" },
  { name: "--color-rail-deep", kind: "colour", value: "#38200f", controls: "the bottom of the rail gradient" },
  { name: "--color-gold", kind: "colour", value: "#f39c12", controls: "the turn and winner glow, the counter pill, focus rings" },
  { name: "--color-gold-light", kind: "colour", value: "#f0c04a", controls: "the ambient glow behind the table" },
  { name: "--color-gold-glow", kind: "colour", value: "#ffd678", controls: "the breathing spotlight on the felt" },
  { name: "--color-card-back", kind: "colour", value: "#5a0c18", controls: "the card back, at the base of its gradient" },
  { name: "--color-card-back-light", kind: "colour", value: "#7a1020", controls: "the card back highlight" },
  { name: "--color-card-back-dark", kind: "colour", value: "#3f0810", controls: "the card back shadow" },
  { name: "--color-card-back-ink", kind: "colour", value: "#c9a24b", controls: "the card back border" },
  { name: "--color-card-back-emblem", kind: "colour", value: "#f0c04a", controls: "the card back rosette" },
  { name: "--color-chip-red", kind: "colour", value: "#c0392b", controls: "the red chip face (5 in the default set)" },
  { name: "--color-chip-blue", kind: "colour", value: "#2980b9", controls: "the blue chip face (10 in the default set)" },
  { name: "--color-chip-green", kind: "colour", value: "#27ae60", controls: "the green chip face (25 in the default set)" },
  { name: "--color-chip-black", kind: "colour", value: "#1a1a2e", controls: "the black chip face (100 in the default set)" },
  { name: "--color-chip-white", kind: "colour", value: "#ecf0f1", controls: "the white chip face (1 in the default set)" },
  { name: "--animate-card-flip", kind: "animation", value: "card-flip 0.5s cubic-bezier(0.22, 1, 0.36, 1) both", controls: "`CardRow animation=\"flip\"`" },
  { name: "--animate-deal-in", kind: "animation", value: "deal-in 0.4s cubic-bezier(0.22, 1, 0.36, 1) both", controls: "`CardRow animation=\"deal\"`, staggered by STAGGER_MS" },
  { name: "--animate-turn-glow", kind: "animation", value: "turn-glow 1.3s ease-in-out infinite", controls: "`Seat isActive`, and any ring you draw in a table's overlay" },
  { name: "--animate-winner-glow", kind: "animation", value: "winner-glow 1.6s ease-in-out infinite", controls: "`Seat isWinner`" },
  { name: "--animate-felt-shimmer", kind: "animation", value: "felt-shimmer 7s ease-in-out infinite", controls: "the ambient sheen breathing on the felt, in phase with --animate-spotlight" },
  { name: "--animate-spotlight", kind: "animation", value: "spotlight-breathe 7s ease-in-out infinite", controls: "the spotlight breathing on the felt" },
  { name: "--animate-confetti", kind: "animation", value: "confetti 2s ease-in forwards", controls: "one piece of `<Confetti />`, falling" },
];

/** The tokens the live editor can set — animations are not colour pickers. */
export const COLOUR_TOKENS = TOKENS.filter((t) => t.kind === "colour");

/* ---------------------------------------------------------- LayoutOptions -- */

/**
 * `layoutTable()` is the pure form of every table's geometry, so its options are
 * the layout parameters all three table types share. `CardTable` passes its own
 * props straight into them — the component computes no geometry of its own.
 */
export const LAYOUT_OPTIONS: ApiRow[] = [
  { name: "count", type: "number", description: "Number of seats. The same number as `CardTable`'s `seatCount`." },
  { name: "designWidth", type: "number", default: "1200", description: "Width of the design box." },
  { name: "designHeight", type: "number", default: "900", description: "Height of the design box." },
  { name: "marginX", type: "number", default: "164 / 1200", description: "Rail inset as a fraction of `designWidth` (0–0.5)." },
  { name: "marginY", type: "number", default: "196 / 900", description: "Rail inset as a fraction of `designHeight`." },
  { name: "feltGap", type: "number", default: "11", description: "Felt inset from the rail, in design-space px." },
  { name: "seatWidth", type: "number", default: "160", description: "Preferred (maximum) frame width." },
  { name: "seatHeight", type: "number", default: "176", description: "Preferred (maximum) frame height." },
  { name: "seatGap", type: "number", default: "24", description: "Minimum clearance to keep between neighbouring frames; shrink until honoured, never below 50%. `0` disables it." },
  { name: "startAngle", type: "number", default: "90", description: "Angle of seat 0, in degrees. 90° is directly below the centre." },
  { name: "shape", type: '"ellipse" | "rect" | "none"', default: '"ellipse"', description: "The boundary to draw. `none` means the design box itself, with nothing painted in it." },
  { name: "cornerRadius", type: "number", default: "45% of the short half-extent", description: "Corner radius of a `rect` surface." },
  { name: "seatPlacement", type: '"ring" | "perimeter" | "row"', description: "The positioning strategy. Defaults to the shape's own." },
  { name: "rimGap", type: "number", default: "6", description: "How far inside the rail the rim highlight sits." },
  { name: "glowGap", type: "number", default: "2", description: "How far inside the rail a your-turn-style glow ring sits." },
];

/* ----------------------------------------------------- CardTable controls -- */

export interface ControlSpec {
  /** A prop of `CardTableProps`. */
  prop: string;
  kind: "number" | "boolean" | "enum" | "palette";
  min?: number;
  max?: number;
  step?: number;
  /** For `enum` / `palette` controls. */
  options?: readonly string[];
  /** Shown next to the control. */
  hint?: string;
}

/**
 * Props that are content or styling rather than tuning parameters, and so have
 * no control in the playground. The coverage test requires every other
 * `CardTableProps` member to appear in `CARD_TABLE_CONTROLS`.
 */
export const CONTENT_PROPS = [
  "renderSeat",
  "rings",
  "slots",
  "center",
  "renderOverlay",
  "watermark",
  "railClassName",
  "feltClassName",
] as const;

export const CONFETTI_PALETTES = [
  { label: "party", colors: ["#f39c12", "#e74c3c", "#2ecc71", "#3498db", "#f1c40f", "#9b59b6"] },
  { label: "gold", colors: ["#f39c12", "#f0c04a", "#ffd678", "#a5744a"] },
  { label: "felt", colors: ["#23804b", "#0f4d2e", "#ecf0f1", "#f39c12"] },
] as const;

export const CARD_TABLE_CONTROLS: ControlSpec[] = [
  { prop: "seatCount", kind: "number", min: 1, max: 16, step: 1, hint: "no upper limit; past ~16 the frames overlap" },
  { prop: "startAngle", kind: "number", min: 0, max: 360, step: 15, hint: "angle of seat 0" },
  { prop: "seatWidth", kind: "number", min: 80, max: 240, step: 8, hint: "preferred frame width" },
  { prop: "seatHeight", kind: "number", min: 80, max: 260, step: 8, hint: "preferred frame height" },
  { prop: "seatGap", kind: "number", min: 0, max: 90, step: 2, hint: "0 disables the auto-shrink" },
  { prop: "designWidth", kind: "number", min: 600, max: 2000, step: 20, hint: "design box width" },
  { prop: "designHeight", kind: "number", min: 450, max: 1500, step: 20, hint: "design box height" },
  { prop: "marginX", kind: "number", min: 0, max: 0.3, step: 0.005, hint: "rail inset, as a fraction" },
  { prop: "marginY", kind: "number", min: 0, max: 0.35, step: 0.005, hint: "rail inset, as a fraction" },
  { prop: "feltGap", kind: "number", min: 0, max: 60, step: 1, hint: "felt inset from the rail" },
  { prop: "cornerRadius", kind: "number", min: 0, max: 260, step: 4, hint: "only drawn on a rect table" },
  { prop: "shape", kind: "enum", options: ["ellipse", "rect", "none"] },
  { prop: "seatPlacement", kind: "enum", options: ["ring", "perimeter", "row"] },
  { prop: "deck", kind: "boolean", hint: "rail + felt + rim; off by default with shape=none" },
  { prop: "ambient", kind: "boolean", hint: "spotlight + felt shimmer" },
  { prop: "fit", kind: "enum", options: ["design", "container"] },
  { prop: "className", kind: "boolean", hint: "hangs a debug outline on the outer element" },
];

/* -------------------------------------------------------------- constants -- */

export interface TunableRow {
  name: string;
  /** Displayed value. */
  value: string;
  /** What the test compares `String(imported)` against. */
  expect: string;
  description: string;
  /** Which entry point exports it. Default `"core"`. */
  entry?: "core" | "wager";
}

export const TUNABLES: TunableRow[] = [
  { name: "DESIGN_W", value: "1200", expect: "1200", description: "Default design-box width." },
  { name: "DESIGN_H", value: "900", expect: "900", description: "Default design-box height." },
  { name: "DEFAULT_MARGIN_X", value: "164 / 1200", expect: String(164 / 1200), description: "Default rail inset across the width." },
  { name: "DEFAULT_MARGIN_Y", value: "196 / 900", expect: String(196 / 900), description: "Default rail inset down the height." },
  { name: "DEFAULT_FELT_GAP", value: "11", expect: "11", description: "Default felt inset from the rail." },
  { name: "DEFAULT_SEAT_W", value: "160", expect: "160", description: "Default preferred frame width." },
  { name: "DEFAULT_SEAT_H", value: "176", expect: "176", description: "Default preferred frame height." },
  { name: "DEFAULT_SEAT_GAP", value: "24", expect: "24", description: "Default minimum clearance between frames." },
  { name: "SEAT_SHRINK_FLOOR", value: "0.5", expect: "0.5", description: "How far the seat auto-shrink will go before it gives up." },
  { name: "FRAME_SHRINK_FLOOR", value: "0.5", expect: "0.5", description: "The same floor, for any arrangement that is not a seat ring." },
  { name: "DEFAULT_CORNER_FRACTION", value: "0.45", expect: "0.45", description: "How round a rect table's corners are, as a fraction of its short half-extent." },
  { name: "RIM_GAP", value: "6", expect: "6", description: "How far inside the rail the rim highlight sits." },
  { name: "GLOW_GAP", value: "2", expect: "2", description: "How far inside the rail a your-turn glow ring sits." },
  { name: "DEFAULT_HEAD_W", value: "240", expect: "240", description: "Preferred head-frame width on a dealer table." },
  { name: "DEFAULT_HEAD_H", value: "230", expect: "230", description: "Preferred head-frame height." },
  { name: "DEFAULT_HEAD_Y", value: "0.16", expect: "0.16", description: "Where the head frame sits, as a fraction of the design height." },
  { name: "DEFAULT_HAND_W", value: "220", expect: "220", description: "Preferred hand-frame width on a dealer table." },
  { name: "DEFAULT_HAND_H", value: "280", expect: "280", description: "Preferred hand-frame height." },
  { name: "DEFAULT_HAND_GAP", value: "24", expect: "24", description: "Minimum clearance between hand frames." },
  { name: "DEFAULT_HAND_Y", value: "0.74", expect: "0.74", description: "Where the row of hands sits, as a fraction of the design height." },
  { name: "CARD_WIDTH", value: "xs 32 · sm 40 · md 64 · lg 96", expect: JSON.stringify({ xs: 32, sm: 40, md: 64, lg: 96 }), description: "The px width of each card size — what a fan overlaps and a slot reserves." },
  { name: "CARD_HEIGHT", value: "xs 44 · sm 56 · md 88 · lg 128", expect: JSON.stringify({ xs: 44, sm: 56, md: 88, lg: 128 }), description: "The px height of each card size." },
  { name: "SIZES", value: 'xs | sm | md | lg', expect: '["xs","sm","md","lg"]', description: "The size vocabulary every `size` prop draws from." },
  { name: "COUNT_UP_MS", value: "500", expect: "500", description: "How long `Counter` counts up for." },
  { name: "STAGGER_MS", value: "100", expect: "100", description: "Delay between the cards of a dealt row arriving." },
  { name: "FLIP_MS", value: "70", expect: "70", description: "Delay between the cards of a flipping row." },
  { name: "BB", value: "20", expect: "20", entry: "wager", description: "`formatBB`'s default big blind. A helper default, not something a component applies." },
  {
    name: "DEFAULT_DENOMINATIONS",
    entry: "wager",
    value: "black 100 · green 25 · blue 10 · red 5 · white 1",
    expect: JSON.stringify([
      { value: 100, color: "#1a1a2e", className: "fill-chip-black" },
      { value: 25, color: "#27ae60", className: "fill-chip-green" },
      { value: 10, color: "#2980b9", className: "fill-chip-blue" },
      { value: 5, color: "#c0392b", className: "fill-chip-red" },
      { value: 1, color: "#ecf0f1", className: "fill-chip-white" },
    ]),
    description: "The greedy breakdown a dealer would use, largest first.",
  },
];
