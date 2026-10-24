/**
 * The docs' table of contents and API surface.
 *
 * `scripts/check-docs-api.mjs` reads this and compares every prop list against
 * the real interfaces in `../../src` using the TypeScript compiler API, so a
 * prop that is renamed or added without updating the docs fails CI.
 */

export interface ApiRow {
  name: string;
  type: string;
  default?: string;
  description: string;
}

export interface ComponentDoc {
  slug: string;
  title: string;
  /** The exported interface in src this page documents. */
  interfaceName: string;
  /**
   * Nav page that documents this component. Defaults to `slug`, so only the
   * components that share a page with another need it.
   */
  page?: string;
  summary: string;
  props: ApiRow[];
  /** For interfaces that are mostly slot content. */
  slots?: ApiRow[];
}

export const NAV = [
  {
    section: "Guide",
    items: [
      { slug: "getting-started", title: "Getting started" },
      { slug: "theming", title: "Theming" },
      { slug: "known-gaps", title: "Known gaps" },
    ],
  },
  {
    section: "Components",
    items: [
      { slug: "card-table", title: "CardTable" },
      { slug: "seat", title: "Seat" },
      { slug: "pot", title: "Pot" },
      { slug: "chips", title: "Chips" },
      { slug: "playing-card", title: "PlayingCard" },
      { slug: "card-back", title: "CardBack" },
      { slug: "hole-cards", title: "HoleCards" },
      { slug: "community-cards", title: "CommunityCards" },
    ],
  },
  {
    section: "Reference",
    items: [
      { slug: "layout", title: "Layout & geometry" },
      { slug: "turn-order", title: "Turn order" },
    ],
  },
] as const;

export const FIRST_SLUG = "getting-started";

export const COMPONENTS: ComponentDoc[] = [
  {
    slug: "card-table",
    title: "CardTable",
    interfaceName: "CardTableProps",
    summary:
      "A responsive, game-agnostic table. It lays seats, bets and the felt out on one ellipse inside a fixed design box, then scales that box to fit the container.",
    props: [
      { name: "seatCount", type: "number", default: "6", description: "Number of seats, clamped to 2–10." },
      {
        name: "seats",
        type: "(ReactNode | null)[]",
        description:
          "Per-seat content by index; `null` leaves that slot empty. Pass either this or `renderSeat`.",
      },
      {
        name: "renderSeat",
        type: "(index: number, isYou: boolean, box: SeatBox) => ReactNode",
        description:
          "Render a seat by index. `box` carries the laid-out frame size and centre, so an auto-shrunk seat can match the ring.",
      },
      {
        name: "bets",
        type: "(ReactNode | null)[]",
        description: "Per-seat bet content, placed on the betting line facing the middle of the table.",
      },
      { name: "renderBet", type: "(index: number) => ReactNode", description: "Render a bet by index. Return `null` to skip." },
      {
        name: "betRadiusScale",
        type: "number",
        default: "0.72",
        description:
          "Bet ring radius as a fraction of the table radius. The drawn betting line follows it. Clamped to 0.2–1.",
      },
      {
        name: "startAngle",
        type: "number",
        default: "90",
        description: "Angle of seat 0, in degrees. 90° is directly below the centre.",
      },
      {
        name: "yourSeatIndex",
        type: "number | null",
        default: "null",
        description:
          "Flags `isYou` for one seat. Adds no offset — reorder your seat array to put the viewer at the bottom.",
      },
      { name: "center", type: "ReactNode", description: "Content in the middle of the table (cards, pot, anything)." },
      { name: "ambient", type: "boolean", default: "true", description: "Breathing spotlight and felt shimmer." },
      { name: "yourTurn", type: "boolean", default: "false", description: "Highlights the table edge." },
      {
        name: "winnerSeats",
        type: "number[]",
        default: "[]",
        description: "Seat indices that won. A non-empty array also starts the confetti.",
      },
      { name: "confetti", type: "boolean", default: "true", description: "Show confetti for winners." },
      {
        name: "confettiColors",
        type: "string[]",
        default: "party palette",
        description:
          "Confetti colours. A prop rather than a theme token, because these land in inline styles that Tailwind's tree-shaking cannot see.",
      },
      {
        name: "seatWidth",
        type: "number",
        default: "160",
        description: "Preferred seat frame width, in design-space px.",
      },
      { name: "seatHeight", type: "number", default: "176", description: "Preferred seat frame height." },
      {
        name: "seatGap",
        type: "number",
        default: "24",
        description:
          "Minimum clearance between neighbouring frames. Seats shrink uniformly (never below 50%) until it is honoured; `0` disables it. Only applies when `renderSeat` is used.",
      },
      { name: "designWidth", type: "number", default: "1200", description: "Width of the design box." },
      { name: "designHeight", type: "number", default: "900", description: "Height of the design box." },
      {
        name: "marginX",
        type: "number",
        default: "164 / 1200",
        description: "Rail inset as a fraction of the design box width.",
      },
      { name: "marginY", type: "number", default: "196 / 900", description: "Rail inset as a fraction of the design box height." },
      { name: "feltGap", type: "number", default: "11", description: "Felt inset from the rail, in design-space px." },
      {
        name: "fit",
        type: '"design" | "container"',
        default: '"design"',
        description:
          '`"container"` derives the design width from the container aspect ratio (clamped 0.5–2.5) so the table fills the box instead of letterboxing.',
      },
      { name: "className", type: "string", description: "Extra classes on the outer element." },
    ],
  },
  {
    slug: "seat",
    title: "Seat",
    interfaceName: "SeatProps",
    summary:
      "A neutral seat frame with named slots. It knows nothing about any particular game: put 0 cards, 2 cards, an avatar or nothing at all in `children`.",
    props: [
      { name: "isActive", type: "boolean", default: "false", description: "Turn highlight (animated by default)." },
      { name: "isWinner", type: "boolean", default: "false", description: "Winner highlight (animated by default)." },
      { name: "isDimmed", type: "boolean", default: "false", description: "Dimmed — e.g. folded or out." },
      { name: "animated", type: "boolean", default: "true", description: "Enable the turn/winner glow animations." },
      {
        name: "winnerCrown",
        type: "boolean",
        default: "false",
        description: "Render a default 👑 in the top-left corner when `isWinner` (an explicit `topLeft` wins).",
      },
      { name: "onClick", type: "() => void", description: "Makes the frame a keyboard-accessible button." },
      { name: "width", type: "number", default: "160", description: "Frame width. CardTable hands you the laid-out size in `box`." },
      { name: "height", type: "number", default: "176", description: "Frame height." },
      { name: "className", type: "string", description: "Extra classes on the outer element." },
      { name: "frameClassName", type: "string", description: "Extra classes on the inner frame, to override visuals." },
      { name: "frameStyle", type: "CSSProperties", description: "Inline styles for the inner frame." },
    ],
    slots: [
      { name: "header", type: "ReactNode", description: "Top row inside the frame — name, badges." },
      { name: "children", type: "ReactNode", description: "Centre content — 0..N cards, an avatar, anything." },
      { name: "footer", type: "ReactNode", description: "Bottom row inside the frame — stack, status." },
      { name: "badge", type: "ReactNode", description: "Floating element at the top-right of the frame." },
      { name: "overlay", type: "ReactNode", description: "Overlay centred over the frame." },
      { name: "above", type: "ReactNode", description: "Floating content above the frame, centred — e.g. an action bubble." },
      { name: "below", type: "ReactNode", description: "Content below the frame, centred — e.g. a countdown or bet pill." },
      { name: "topLeft", type: "ReactNode", description: "Floating content at the top-left corner." },
      { name: "topRight", type: "ReactNode", description: "Floating content at the top-right corner." },
      { name: "topCenter", type: "ReactNode", description: "Floating content centred above the top edge — e.g. D / SB / BB badges." },
    ],
  },
  {
    slug: "pot",
    title: "Pot",
    interfaceName: "PotProps",
    summary: "A small standalone pot pill with an optional count-up animation. Entirely optional — the table does not need it.",
    props: [
      { name: "amount", type: "number", description: "The amount to display." },
      { name: "label", type: "string", description: 'Optional label, e.g. "Main" or "Side 1".' },
      {
        name: "format",
        type: "(amount: number) => string",
        default: "formatBB",
        description: "Formatter for the amount. Defaults to Big-Blind formatting against `BB = 20`.",
      },
      { name: "animate", type: "boolean", default: "true", description: "Count up smoothly when the amount changes." },
      { name: "className", type: "string", description: "Extra classes." },
    ],
  },
  {
    slug: "chip-stack",
    title: "ChipStack",
    interfaceName: "ChipStackProps",
    page: "chips",
    summary:
      "The chips for an amount, as a real stack with the largest denomination on top. Break the amount down with the greedy set a dealer would use (white 1, red 5, blue 10, green 25, black 100) and draw the result.",
    props: [
      { name: "amount", type: "number", description: "Amount in chip units — the smallest chip is 1. See `chipBreakdown`." },
      { name: "size", type: '"sm" | "md" | "lg"', default: '"md"', description: "Chip width: 22 / 30 / 42px." },
      {
        name: "denominations",
        type: "Denomination[]",
        default: "DEFAULT_DENOMINATIONS",
        description: "Which chips exist and what they are worth. Blue defaults to 10; swap in 20 if your room does that.",
      },
      {
        name: "maxChips",
        type: "number",
        default: "12",
        description: "Most chips to draw, biggest first — a 10,000 bet would otherwise be 100 black chips. The number left off is shown underneath.",
      },
      { name: "label", type: "ReactNode", description: "Content under the stack, usually the formatted amount." },
      { name: "className", type: "string", description: "Extra classes." },
    ],
  },
  {
    slug: "chip",
    title: "Chip",
    interfaceName: "ChipProps",
    page: "chips",
    summary:
      "A single chip, drawn as SVG: a coloured disc with a darker edge for thickness, eight white edge spots, a rim highlight and a white centre carrying the value.",
    props: [
      { name: "value", type: "number | string", description: "Printed on the centre of the face. Omit it for a blank chip." },
      { name: "color", type: "string", description: "CSS colour for the body. Any CSS colour works, including `var(--color-chip-red)`." },
      {
        name: "colorClassName",
        type: "string",
        description:
          "A `fill-*` utility applied over `color`. The default denominations use these so the `--color-chip-*` tokens get emitted and stay themeable; a class wins over the `fill` attribute, so `color` is the fallback.",
      },
      {
        name: "spotColor",
        type: "string",
        description:
          "Colour of the eight edge spots. Defaults to `chipSpotColor(color)`, which is white except on a light body — white spots on the white chip sit at 1.1:1 and vanish.",
      },
      { name: "size", type: '"sm" | "md" | "lg"', default: '"md"', description: "Chip width: 22 / 30 / 42px." },
      { name: "label", type: "string", description: 'Accessible name. Defaults to "<value> chip".' },
      { name: "className", type: "string", description: "Extra classes." },
    ],
  },
  {
    slug: "playing-card",
    title: "PlayingCard",
    interfaceName: "PlayingCardProps",
    summary:
      "A single card, driven by a compact code like \"As\" or \"10h\", or a card back. Size comes from the `size` prop, never from viewport breakpoints, so cards scale predictably inside any container.",
    props: [
      { name: "card", type: "string | null", description: 'Compact card code ("As", "10h", "Kd") or `null` for a face-down card back.' },
      {
        name: "size",
        type: '"xs" | "sm" | "md" | "lg"',
        default: '"md"',
        description: "`xs`/`sm` show a single larger centred index; `md`/`lg` add the rotated corner index and centre suit.",
      },
      { name: "className", type: "string", description: "Extra classes." },
    ],
  },
  {
    slug: "card-back",
    title: "CardBack",
    interfaceName: "CardBackProps",
    summary:
      "The face-down card: a dark red gradient, a gold rosette drawn as inline SVG, and a themed border. This is what PlayingCard renders for a null card.",
    props: [
      { name: "size", type: '"xs" | "sm" | "md" | "lg"', default: '"md"', description: "Card size." },
      { name: "className", type: "string", description: "Extra classes." },
    ],
  },
  {
    slug: "hole-cards",
    title: "HoleCards",
    interfaceName: "HoleCardsProps",
    summary: "A row of a player's private cards, dealt in one after another.",
    props: [
      { name: "cards", type: "(string | null)[]", description: "The cards; `null` entries render as card backs." },
      { name: "size", type: '"xs" | "sm" | "md" | "lg"', default: '"lg"', description: "Card size." },
      { name: "className", type: "string", description: "Extra classes." },
      { name: "deal", type: "boolean", default: "true", description: "Animate the cards dealing in, staggered by 100ms." },
      {
        name: "dealKey",
        type: "string | number",
        description:
          "Change this to replay the deal for an unchanged hand (e.g. a hand id or round number). Without it, a card whose value changed re-deals on its own.",
      },
    ],
  },
  {
    slug: "community-cards",
    title: "CommunityCards",
    interfaceName: "CommunityCardsProps",
    summary: "A row of shared cards, each flipping in with a 3D flip and a staggered delay.",
    props: [
      { name: "cards", type: "(string | null)[]", description: "The cards; `null` entries leave an empty slot." },
      { name: "size", type: '"xs" | "sm" | "md" | "lg"', default: '"md"', description: "Card size." },
      { name: "className", type: "string", description: "Extra classes." },
      { name: "animated", type: "boolean", default: "true", description: "Animate each card with a 3D flip." },
      {
        name: "slots",
        type: "number",
        description: "Reserve a fixed number of slots so the row width never changes as cards arrive.",
      },
    ],
  },
];

export const DOC_BY_SLUG: Record<string, ComponentDoc> = Object.fromEntries(
  COMPONENTS.map((c) => [c.slug, c]),
);
